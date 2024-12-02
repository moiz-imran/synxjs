// Export renderer components
export { render as clientRender } from './renderer/_default.page.client';
export { render as serverRender } from './renderer/_default.page.server';

// Export types
export type {
  PageProps,
  PageContext,
  PageContextServer,
  PageContextClient,
  RenderResult,
} from './renderer/types';

// Export utilities
export { generateMetaTags, generateLinkTags } from './renderer/utils';
