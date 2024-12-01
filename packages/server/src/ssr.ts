import { VNode } from '@synxjs/types';
import { renderToString } from './render';
import { addHydrationMarkers, serializeHydrationData } from './hydration';
import { generateHTML } from './utils/html';

export interface RenderOptions {
  mode: 'ssr' | 'ssg';
  data?: any;
  head?: {
    title?: string;
    meta?: Array<{ [key: string]: string }>;
    links?: Array<{ [key: string]: string }>;
    scripts?: string[];
  };
}

export async function renderPage(
  App: (props: any) => VNode,
  options: RenderOptions,
): Promise<string> {
  const { data = {}, head = {} } = options;
  const appHtml = await renderToString(App(data));
  const hydratedHtml = addHydrationMarkers(appHtml, 'root');
  const serializedData = serializeHydrationData(data);

  return generateHTML({
    body: hydratedHtml,
    data: serializedData,
    head,
  });
}

// Move HTML generation to a shared utility
export { generateHTML } from './utils/html';
