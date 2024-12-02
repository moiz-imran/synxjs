import { createElement, renderApp } from '@synxjs/core';
import { hydrate } from '@synxjs/server/hydration';
import type { PageContextClient } from './types';

// Make createElement available globally for JSX
window.createElement = createElement;

export async function render(pageContext: PageContextClient) {
  const { Page, pageProps, onError } = pageContext;
  const root = document.getElementById('root');

  if (!root) {
    throw new Error('Root element not found');
  }

  try {
    // Create vnode
    const vnode = Page(pageProps);

    // Use hydration if SSR
    if (document.querySelector('[data-hydrate]')) {
      hydrate(vnode, root);
    } else {
      renderApp(root, vnode);
    }
  } catch (error) {
    console.error('Client render error:', error);
    onError?.(error as Error);
    throw error;
  }
}

export const passToClient = ['pageProps', 'serializedData', 'onError'];
