import { PassThrough } from 'stream';
import { StreamingOptions, VNode } from '@synxjs/types';
import { renderToString } from './render';
import { addHydrationMarkers, serializeHydrationData } from './hydration';
import { generateHTML } from './utils/html';
import { escapeHtml } from './utils/escape';
import { resetServerState } from '@synxjs/reactivity';

export function renderToStream(
  vnode: VNode,
  options: StreamingOptions = {},
): PassThrough {
  // Reset server state at the start of each render
  resetServerState();

  const stream = new PassThrough();

  const { head = {}, data = {}, selective } = options;

  // Handle selective streaming
  if (selective?.defer) {
    stream.cork();
    setTimeout(() => {
      stream.uncork();
    }, selective.timeout || 0);
  }

  // Escape head content for security
  if (head.title) {
    head.title = escapeHtml(head.title);
  }
  head.meta?.forEach((meta) => {
    Object.keys(meta).forEach((key) => {
      meta[key] = escapeHtml(meta[key]);
    });
  });

  // Start with shell (DOCTYPE, head, opening body)
  try {
    const serializedData = serializeHydrationData(data);
    const shell = generateHTML({
      body: '',
      head,
      data: serializedData,
      partial: true,
    });
    stream.push(shell);
    options.onShellReady?.();

    // Render content with priority handling
    Promise.resolve().then(async () => {
      try {
        const content = await renderToString(vnode);
        const hydratedContent = addHydrationMarkers(content, 'root');

        if (selective?.priority === 'low') {
          // Defer low priority content
          setTimeout(() => {
            stream.push(hydratedContent);
            stream.push('</body></html>');
            stream.push(null);
          }, 0);
        } else {
          stream.push(hydratedContent);
          stream.push('</body></html>');
          stream.push(null);
        }
      } catch (error) {
        options.onError?.(error as Error);
        stream.destroy(error as Error);
        stream.emit('error', error);
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('circular')) {
      throw new Error('Failed to serialize data');
    }
    options.onError?.(error as Error);
    stream.destroy(error as Error);
    stream.emit('error', error);
  }

  return stream;
}
