import type { VNodeProps } from '@synxjs/types';

export function updateAttributes(
  element: HTMLElement,
  newProps: VNodeProps,
  oldProps: VNodeProps,
): void {
  // Remove old properties
  Object.keys(oldProps).forEach((key) => {
    if (key === 'children') return;
    if (!(key in newProps)) {
      if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        element.removeEventListener(eventName, oldProps[key] as EventListener);
      } else {
        element.removeAttribute(key);
      }
    }
  });

  // Set new properties
  Object.entries(newProps).forEach(([key, value]) => {
    if (key === 'children') return;
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      if (oldProps[key]) {
        element.removeEventListener(eventName, oldProps[key] as EventListener);
      }
      element.addEventListener(eventName, value as EventListener);
    } else if (key === 'className') {
      element.setAttribute('class', String(value));
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, String(value));
    }
  });
}
