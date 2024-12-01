import { Readable } from 'stream';
import { VNode } from '@synxjs/types';
import { renderToString } from './render';
import { addHydrationMarkers, serializeHydrationData } from './hydration';
import { generateHTML } from './utils/html';
import { escapeHtml } from './utils/escape';
import { resetServerState } from '@synxjs/reactivity';

export interface StreamingOptions {
  onShellReady?: () => void;
  onError?: (error: Error) => void;
  data?: any;
  head?: {
    title?: string;
    meta?: Array<{ [key: string]: string }>;
    links?: Array<{ [key: string]: string }>;
    scripts?: string[];
  };
}

export function renderToStream(
  vnode: VNode,
  options: StreamingOptions = {},
): Readable {
  // Reset server state at the start of each render
  resetServerState();

  const stream = new Readable({
    /* v8 ignore next */
    read() {}, // Implementation handled by push()
  });

  const { head = {}, data = {} } = options;

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
    console.log('serializedData', serializedData);
    const shell = generateHTML({
      body: '',
      head,
      data: serializedData,
      partial: true,
    });
    stream.push(shell);
    options.onShellReady?.();

    // Render content
    Promise.resolve().then(async () => {
      try {
        const content = await renderToString(vnode);
        const hydratedContent = addHydrationMarkers(content, 'root');
        stream.push(hydratedContent);
        stream.push('</body></html>');
        stream.push(null);
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
