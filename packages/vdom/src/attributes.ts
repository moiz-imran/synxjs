import type { VNodeProps } from '@synxjs/types';

export function updateAttributes(
  element: HTMLElement,
  newProps: VNodeProps,
  oldProps: VNodeProps,
): void {
  // Remove old properties
  for (const name in oldProps) {
    if (name !== 'children' && !(name in newProps)) {
      element.removeAttribute(name);
    }
  }

  // Set new properties
  for (const name in newProps) {
    if (name === 'children' || name === 'key' || name === 'ref') continue;

    const value = newProps[name];
    if (value === undefined || value === null) {
      element.removeAttribute(name);
    } else if (name.startsWith('on')) {
      const eventName = name.slice(2).toLowerCase();
      if (oldProps[name]) {
        element.removeEventListener(eventName, oldProps[name] as EventListener);
      }
      element.addEventListener(eventName, value as EventListener);
    } else if (name === 'className') {
      element.setAttribute('class', String(value));
    } else if (name === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(name, String(value));
    }
  }
}
