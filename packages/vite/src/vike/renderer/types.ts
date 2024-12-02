import type { VNode, Head, StreamingOptions, Boundary } from '@synxjs/types';
import type { PassThrough } from 'stream';

export interface PageProps {
  [key: string]: unknown;
}

export interface PageContext {
  Page: (props: PageProps) => VNode;
  pageProps: PageProps;
  head?: Head;
  serializedData?: unknown;
  streaming?: boolean;
  boundaries?: Boundary[];
  selective?: StreamingOptions['selective'];
  onShellReady?: StreamingOptions['onShellReady'];
  onError?: StreamingOptions['onError'];
  mode?: 'ssr' | 'ssg';
}

export interface PageContextServer extends PageContext {
  isClient: false;
}

export interface PageContextClient extends PageContext {
  isClient: true;
}

export interface RenderResult {
  documentHtml: string | PassThrough;
  pageContext: {
    serializedData: unknown;
  };
}
