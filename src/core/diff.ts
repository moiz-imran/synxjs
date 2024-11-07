// src/core/diff.ts

import { VNode } from './vdom';

/**
 * Renders a Virtual DOM node into an actual DOM node.
 * @param node - The Virtual DOM node or string.
 * @returns The actual DOM node.
 */
export function renderVNode(
  node: VNode | string | number | null,
): HTMLElement | Text | null {
  if (node === null) {
    console.warn('renderVNode: Attempted to render a null vnode.');
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    console.log('renderVNode: Rendering text node:', node);
    return document.createTextNode(node.toString());
  }

  // Handle functional components
  if (typeof node.type === 'function') {
    const FunctionalComp = node.type;
    const childVNode = FunctionalComp(node.props || {});
    return renderVNode(childVNode);
  }

  // node.type is an intrinsic element
  const element = document.createElement(node.type as string);

  // Set props
  const props = node.props || {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value as EventListenerOrEventListenerObject);
    } else if (key === 'className') {
      element.setAttribute('class', value as string);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value as string);
    }
  }

  // Render and append children
  if (typeof node.children === 'string' || typeof node.children === 'number') {
    const textNode = document.createTextNode(node.children.toString());
    element.appendChild(textNode);
  } else if (Array.isArray(node.children)) {
    node.children.forEach((child, idx) => {
      if (child === undefined || child === null) return; // Skip null/undefined
      const childDom =
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : renderVNode(child);
      if (childDom) {
        element.appendChild(childDom);
      }
    });
  } else if (node.children) {
    const childDom =
      typeof node.children === 'string' || typeof node.children === 'number'
        ? document.createTextNode(String(node.children))
        : renderVNode(node.children);
    if (childDom) {
      element.appendChild(childDom);
    }
  }

  console.log('renderVNode: Created element', element);
  return element;
}

/**
 * Compares two VNodes and updates the actual DOM accordingly.
 * @param newVNode - The new Virtual DOM node.
 * @param oldVNode - The old Virtual DOM node.
 * @param parent - The parent DOM element.
 * @param index - The index of the child in the parent.
 */
export function diff(
  newVNode: VNode | string | number | null,
  oldVNode: VNode | string | number | null,
  parent: HTMLElement,
  index: number = 0,
) {
  const existingElement = parent.childNodes[index];

  // If oldVNode doesn't exist, create and append the new element
  if (!oldVNode) {
    const newDom = renderVNode(newVNode);
    if (newDom) {
      parent.appendChild(newDom);
      console.log(`diff: Appended new DOM node at index ${index}`);
    }
    return;
  }

  // If newVNode doesn't exist, remove the existing element
  if (!newVNode) {
    if (existingElement) {
      parent.removeChild(existingElement);
      console.log(`diff: Removed DOM node at index ${index}`);
    }
    return;
  }

  // If both are strings and different, replace the text node
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (newVNode !== oldVNode) {
      const newTextNode = document.createTextNode(newVNode.toString());
      if (existingElement) {
        parent.replaceChild(newTextNode, existingElement);
        console.log(
          `diff: Replaced text node at index ${index} with '${newVNode}'`,
        );
      }
    }
    return;
  }

  // If types are different, replace the element
  if (newVNode.type !== (oldVNode as VNode)?.type) {
    const newDom = renderVNode(newVNode);
    if (existingElement && newDom) {
      parent.replaceChild(newDom, existingElement);
      console.log(
        `diff: Replaced element at index ${index} with new type '${newVNode.type}'`,
      );
    }
    return;
  }

  // Update attributes
  updateAttributes(
    existingElement as HTMLElement,
    newVNode.props || {},
    (oldVNode as VNode)?.props || {},
  );

  // Reconcile children
  const newChildren = Array.isArray(newVNode.children)
    ? newVNode.children
    : newVNode.children
      ? [newVNode.children]
      : [];
  const oldChildren =
    typeof oldVNode === 'object' && oldVNode !== null
      ? Array.isArray(oldVNode.children)
        ? oldVNode.children
        : oldVNode.children
          ? [oldVNode.children]
          : []
      : [];

  const max = Math.max(newChildren.length, oldChildren.length);
  for (let i = 0; i < max; i++) {
    diff(newChildren[i], oldChildren[i], existingElement as HTMLElement, i);
  }

  console.log(
    `diff: Reconciled children for element '${newVNode.type}' at index ${index}`,
  );
}

/**
 * Updates the attributes of a DOM element based on new and old props.
 * @param element - The DOM element to update.
 * @param newProps - The new props.
 * @param oldProps - The old props.
 */
function updateAttributes(
  element: HTMLElement,
  newProps: Record<string, any>,
  oldProps: Record<string, any>,
) {
  // Set new or changed attributes
  for (const key in newProps) {
    if (key === 'children') continue;
    if (newProps[key] !== oldProps[key]) {
      if (key.startsWith('on') && typeof newProps[key] === 'function') {
        const event = key.slice(2).toLowerCase();
        if (oldProps[key]) {
          element.removeEventListener(event, oldProps[key]);
        }
        element.addEventListener(event, newProps[key]);
        console.log(
          `updateAttributes: Updated event listener '${event}' on element`,
        );
      } else if (key === 'className') {
        element.setAttribute('class', newProps[key]);
        console.log(
          `updateAttributes: Updated 'class' attribute to '${newProps[key]}'`,
        );
      } else if (key === 'style' && typeof newProps[key] === 'object') {
        Object.assign(element.style, newProps[key]);
        console.log(`updateAttributes: Updated 'style' attribute`);
      } else {
        element.setAttribute(key, newProps[key]);
        console.log(
          `updateAttributes: Set attribute '${key}' to '${newProps[key]}'`,
        );
      }
    }
  }

  // Remove old attributes not present in newProps
  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key.startsWith('on') && typeof oldProps[key] === 'function') {
        const event = key.slice(2).toLowerCase();
        element.removeEventListener(event, oldProps[key]);
        console.log(
          `updateAttributes: Removed event listener '${event}' from element`,
        );
      } else if (key === 'className') {
        element.removeAttribute('class');
        console.log(`updateAttributes: Removed 'class' attribute`);
      } else if (key === 'style' && typeof oldProps[key] === 'object') {
        Object.keys(oldProps[key]).forEach((styleKey) => {
          element.style.removeProperty(styleKey);
          console.log(`updateAttributes: Removed style property '${styleKey}'`);
        });
      } else {
        element.removeAttribute(key);
        console.log(`updateAttributes: Removed attribute '${key}'`);
      }
    }
  }
}
