import { VNode } from './vdom';

export interface Head {
  title?: string;
  meta?: Array<{ [key: string]: string }>;
  links?: Array<{ [key: string]: string }>;
  scripts?: string[];
}

export interface StreamingOptions {
  data?: any;
  head?: Head;
  onError?: (error: Error) => void;
  onShellReady?: () => void;
  boundaries?: Boundary[];
  selective?: {
    defer?: boolean;
    priority?: 'high' | 'low';
    timeout?: number;
  };
}

export interface Boundary {
  fallback: VNode;
  onError: (error: Error) => void;
}

export interface RenderOptions {
  mode: 'ssr' | 'ssg';
  data?: any;
  head?: Head;
}
