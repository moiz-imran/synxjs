import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '../../src/integrations/vike/renderer/_default.page.client';
import { hydrate } from '@synxjs/server/hydration';
import { renderApp } from '@synxjs/vdom';
import type { PageContextClient } from '../../src/integrations/vike/renderer/types';

// Mock @synxjs/server
vi.mock('@synxjs/server/hydration', () => ({
  hydrate: vi.fn(),
}));

vi.mock('@synxjs/vdom', async (originalModule) => {
  const { createElement } =
    await originalModule<typeof import('@synxjs/vdom')>();
  return {
    renderApp: vi.fn(),
    createElement,
  };
});

describe('Client-side Renderer', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (document.body.contains(root)) {
      document.body.removeChild(root);
    }
  });

  it('should use hydration when data-hydrate marker exists', async () => {
    root.innerHTML = '<div data-hydrate="root"></div>';
    const vnode = { type: 'div', props: {}, children: ['Test'] };

    const pageContext: PageContextClient = {
      Page: () => vnode,
      pageProps: {},
      isClient: true,
    };

    await render(pageContext);

    expect(hydrate).toHaveBeenCalledWith(vnode, root);
    expect(renderApp).not.toHaveBeenCalled();
  });

  it('should use regular rendering when no hydration marker', async () => {
    const vnode = { type: 'div', props: {}, children: ['Test'] };

    const pageContext: PageContextClient = {
      Page: () => vnode,
      pageProps: {},
      isClient: true,
    };

    await render(pageContext);

    expect(renderApp).toHaveBeenCalledWith(root, vnode);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it('should handle rendering errors', async () => {
    const error = new Error('Render error');
    const onError = vi.fn();

    const pageContext: PageContextClient = {
      Page: () => {
        throw error;
      },
      pageProps: {},
      onError,
      isClient: true,
    };

    await expect(render(pageContext)).rejects.toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should throw if root element not found', async () => {
    root.remove();

    const pageContext: PageContextClient = {
      Page: () => ({ type: 'div', props: {}, children: [] }),
      pageProps: {},
      isClient: true,
    };

    await expect(render(pageContext)).rejects.toThrow('Root element not found');
  });

  it('should make createElement available globally', async () => {
    const vnode = {
      type: 'div',
      props: {},
      children: ['Test'],
      renderedChildren: [],
    };

    const pageContext: PageContextClient = {
      Page: () => vnode,
      pageProps: {},
      isClient: true,
    };

    await render(pageContext);

    expect(window.createElement).toBeDefined();
    const element = window.createElement('div', {}, 'Test');
    expect(element).toEqual(vnode);
  });
});
