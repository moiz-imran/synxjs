import type { VNode } from '@synxjs/types';
import { renderToString } from './render';
import { addHydrationMarkers, serializeHydrationData } from './hydration';

type RenderMode = 'ssr' | 'ssg';

interface RenderOptions {
  mode: RenderMode;
  data?: any;
  head?: {
    title?: string;
    meta?: Array<{ [key: string]: string }>;
    links?: Array<{ [key: string]: string }>;
  };
}

// Helper to escape HTML content
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to create HTML attributes safely
function createAttributes(attrs: { [key: string]: string }): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
}

export async function renderPage(
  App: (props: any) => VNode,
  options: RenderOptions,
): Promise<string> {
  const { mode, data = {}, head = {} } = options;

  // Render the app to HTML
  const appHtml = await renderToString(App(data));
  const hydratedHtml = addHydrationMarkers(appHtml, 'root');

  // Generate meta tags safely
  const metaTags = [
    '<meta charset="utf-8">',
    ...(head.meta || []).map(attrs => `<meta ${createAttributes(attrs)}>`)
  ].join('\n    ');

  // Generate link tags safely
  const linkTags = (head.links || [])
    .map(attrs => `<link ${createAttributes(attrs)}>`)
    .join('\n    ');

  // Generate title safely
  const titleTag = head.title
    ? `<title>${escapeHtml(head.title)}</title>`
    : '';

  // Serialize data safely
  const serializedData = serializeHydrationData(data);

  // Generate full HTML document
  return `
<!DOCTYPE html>
<html>
  <head>
    ${metaTags}
    ${titleTag}
    ${linkTags}
    <script>window.__INITIAL_DATA__ = ${serializedData};</script>
  </head>
  <body>
    ${hydratedHtml}
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
