import type { VNode } from '@synxjs/types';
import { getServerState } from '@synxjs/reactivity';

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

export interface HydrationData {
  props: any;
  state: Record<string, any>;
  timestamp: number;
}

export const serializeHydrationData = (data: any): string => {
  const hydrationData: HydrationData = {
    props: data,
    state: getServerState(),
    timestamp: Date.now(),
  };

  return JSON.stringify(hydrationData, (_, value) => {
    if (value instanceof Error) {
      return {
        message: value.message,
        stack: value.stack
      };
    }
    return value;
  });
};

export const generateHydrationScript = (data: any): string => {
  const hydrationData = {
    props: data,
    state: getServerState(),
    timestamp: Date.now(),
  };

  // First JSON stringify to handle the data structure
  const serialized = JSON.stringify(hydrationData)
    // Escape all potentially dangerous characters
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  // Return just the serialized data, let HTML generation handle the script tag
  return serialized;
};
