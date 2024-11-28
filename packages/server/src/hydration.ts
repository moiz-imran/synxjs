import type { VNode } from '@synxjs/types';

// Add hydration markers to server-rendered HTML
export function addHydrationMarkers(html: string, id: string): string {
  return `<div data-hydrate="${id}">${html}</div>`;
}

// Client-side hydration
export function hydrate(vnode: VNode, container: Element): void {
  // Match server and client nodes
  const serverNode = container.querySelector(`[data-hydrate]`);
  if (!serverNode) {
    throw new Error('No hydration marker found');
  }

  // Attach event listeners without re-rendering
  attachEventListeners(vnode, serverNode as HTMLElement);
}

function attachEventListeners(vnode: VNode, element: HTMLElement): void {
  if (!vnode || typeof vnode === 'string' || typeof vnode === 'number') {
    return;
  }

  const props = vnode.props || {};

  // Attach event listeners from vnode props
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.toLowerCase().slice(2);
      element.addEventListener(eventName, value as EventListener);
    }
  });

  // Recursively handle children
  if (vnode.children) {
    const children = Array.isArray(vnode.children)
      ? vnode.children
      : [vnode.children];
    children.forEach((child, index) => {
      if (element.children[index]) {
        attachEventListeners(
          child as VNode,
          element.children[index] as HTMLElement,
        );
      }
    });
  }
}

const escapeScriptContent = (str: string): string => {
  return str
    .replace(/<\/script>/ig, '<\\u002fscript>')
    .replace(/<!--/g, '<\\u0021--')
    .replace(/<script/ig, '<\\u0073cript');
};

const escapeHtmlInString = (str: string): string => {
  return str
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
};

export const serializeHydrationData = (data: any): string => {
  // Handle circular references and escape HTML in strings
  const seen = new WeakSet();

  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Escape HTML in string values
    if (typeof value === 'string') {
      return escapeHtmlInString(value);
    }
    return value;
  });
};

export const generateHydrationScript = (data: any): string => {
  const serialized = escapeScriptContent(serializeHydrationData(data));

  return `<script>window.__INITIAL_DATA__ = ${serialized};</script>`;
};
