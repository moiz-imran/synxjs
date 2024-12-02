import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { renderToString, renderToStream, escapeHtml } from '@synxjs/server';
import {
  addHydrationMarkers,
  serializeHydrationData,
} from '@synxjs/server/hydration';
import type { PageContextServer, RenderResult } from './types';
import { generateLinkTags, generateMetaTags } from './utils';

export { render };
export { passToClient };

const passToClient = ['pageProps', 'serializedData', 'mode'];

async function render(pageContext: PageContextServer): Promise<RenderResult> {
  const {
    Page,
    pageProps,
    streaming,
    boundaries,
    selective,
    onShellReady,
    onError,
    mode = 'ssr',
  } = pageContext;

  try {
    if (streaming) {
      // Streaming mode
      const stream = renderToStream(Page(pageProps), {
        data: pageProps,
        boundaries,
        selective,
        onShellReady,
        onError: (error) => {
          console.trace('error');
          console.error('Streaming error:', error);
          onError?.(error);
          stream.emit('error', error);
        },
      });

      return {
        documentHtml: stream,
        pageContext: {
          serializedData: serializeHydrationData(pageProps),
        },
      };
    } else {
      console.log('regular SSR mode');
      // Regular SSR mode
      const pageHtml = await renderToString(Page(pageProps));
      const hydratedHtml = addHydrationMarkers(pageHtml, 'root');
      const serializedData = serializeHydrationData(pageProps);

      console.log('serializedData', serializedData);
      // Escape head content
      const title = pageContext.head?.title
        ? escapeHtml(pageContext.head.title)
        : 'Synx.js App';

      const documentHtml = escapeInject`<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${title}</title>
            ${generateMetaTags(pageContext.head?.meta)}
            ${generateLinkTags(pageContext.head?.links)}
          </head>
          <body>
            <div id="root">${dangerouslySkipEscape(hydratedHtml)}</div>
            <script>
              window.__INITIAL_DATA__ = ${dangerouslySkipEscape(
                JSON.stringify({
                  props: pageProps,
                  mode,
                }),
              )}
            </script>
            ${mode === 'ssg' ? '' : '<script type="module" src="/client.js"></script>'}
          </body>
        </html>`.toString();

      return {
        documentHtml,
        pageContext: {
          serializedData,
        },
      };
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('error instance of Error 3');
      console.error('Render error:', error);
      onError?.(error);
      throw error;
    }
    console.log('unknown error');
    // Re-throw unknown errors
    throw error;
  }
}
