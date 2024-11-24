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

  // First, remove all existing listeners
  for (const eventName in element._listeners) {
    element.removeEventListener(eventName, element._listeners[eventName]);
    delete element._listeners[eventName];
  }

  // Remove old props that aren't in newProps
  for (const name in oldProps) {
    if (name === 'children' || name === 'key' || name === 'ref') continue;

    if (!(name in newProps)) {
      if (name.startsWith('on')) {
        const eventName = name.slice(2).toLowerCase();
        if (element._listeners[eventName]) {
          element.removeEventListener(eventName, element._listeners[eventName]);
          delete element._listeners[eventName];
        }
      } else if (name === 'style') {
        element.style.cssText = '';
      } else {
        element.removeAttribute(name);
      }
    }
  }

  // Then add new props
  for (const name in newProps) {
    if (name === 'children' || name === 'key' || name === 'ref') continue;

    const value = newProps[name];
    if (value === undefined || value === null) {
      element.removeAttribute(name);
    } else if (name.startsWith('on')) {
      const eventName = name.slice(2).toLowerCase();
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
