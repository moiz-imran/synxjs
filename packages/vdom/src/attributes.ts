import type { VNodeProps } from '@synxjs/types';

export function updateAttributes(
  element: HTMLElement,
  newProps: VNodeProps,
  oldProps: VNodeProps,
): void {
  // Initialize listeners map if needed
  if (!element._listeners) {
    element._listeners = {};
  }

  // Remove old event listeners
  for (const eventName in element._listeners) {
    element.removeEventListener(eventName, element._listeners[eventName]);
    delete element._listeners[eventName];
  }

  // Set new properties
  for (const name in newProps) {
    if (name === 'children' || name === 'key' || name === 'ref') continue;

    const value = newProps[name];
    if (value === undefined || value === null) {
      element.removeAttribute(name);
    } else if (name.startsWith('on')) {
      const eventName = name.slice(2).toLowerCase();
      // Store and add new listener
      element._listeners[eventName] = value as EventListener;
      element.addEventListener(eventName, element._listeners[eventName]);
    } else if (name === 'className') {
      element.setAttribute('class', String(value));
    } else if (name === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(name, String(value));
    }
  }
}
