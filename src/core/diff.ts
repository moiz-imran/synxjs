// src/core/diff.ts

import { FunctionalComponentInstance } from './hooks';
import { FunctionalComponent, VNode } from './vdom';
import {
  componentInstanceCache,
  createFunctionalComponentInstance,
  assignDomToInstance,
} from './renderer';

/**
 * Renders a Virtual DOM node into an actual DOM node.
 * @param node - The Virtual DOM node or string.
 * @returns The actual DOM node.
 */
export function renderVNode(
  node: VNode | string | number | null,
  parentInstance?: FunctionalComponentInstance,
): HTMLElement | Text | null {
  if (!node) return null;

  // Handle text nodes
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }

  // Handle functional components
  if (typeof node.type === 'function') {
    const instance =
      componentInstanceCache.get(node as VNode & object) ||
      createFunctionalComponentInstance(node, node.type);

    const renderedNode = instance.render();
    const dom = renderVNode(renderedNode, instance);

    if (dom && !instance.dom) {
      assignDomToInstance(instance, dom);
    }

    return dom;
  }

  // Create element
  const element = document.createElement(node.type as string);

  // Set attributes
  if (node.props) {
    updateAttributes(element, node.props, {});
  }

  // Handle children
  if (node.children) {
    const children = Array.isArray(node.children)
      ? node.children
      : [node.children];
    children.forEach((child) => {
      const childDom = renderVNode(child);
      if (childDom) element.appendChild(childDom);
    });
  }

  // If this element is the direct child of a component, assign it
  if (parentInstance && !parentInstance.dom) {
    assignDomToInstance(parentInstance, element);
  }

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

  // Handle functional components
  if (
    typeof newVNode === 'object' &&
    newVNode !== null &&
    typeof newVNode.type === 'function'
  ) {
    const FunctionalComp = newVNode.type as FunctionalComponent<any>;

    // Try to reuse existing instance
    let instance = componentInstanceCache.get(oldVNode as VNode & object);

    if (!instance) {
      instance = createFunctionalComponentInstance(newVNode, FunctionalComp);
    } else {
      // Update instance props
      instance.vnode = newVNode;
      componentInstanceCache.set(newVNode as VNode & object, instance);
    }

    const renderedNode = instance.render();

    if (instance.dom) {
      // Update existing DOM in place
      diff(renderedNode, instance.vnode, parent, index);
    } else {
      // First render
      const newDom = renderVNode(renderedNode, instance);
      if (newDom) {
        if (existingElement) {
          parent.replaceChild(newDom, existingElement);
        } else {
          parent.appendChild(newDom);
        }
      }
    }

    return;
  }

  // Handle regular DOM elements
  if (
    typeof newVNode === 'object' &&
    newVNode !== null &&
    typeof newVNode.type === 'string'
  ) {
    if (!existingElement) {
      const newDom = renderVNode(newVNode);
      if (newDom) {
        parent.appendChild(newDom);
      }
      return;
    }

    // Update existing element
    if (existingElement.nodeName.toLowerCase() === newVNode.type) {
      // Update props
      updateAttributes(
        existingElement as HTMLElement,
        newVNode.props || {},
        (oldVNode as VNode)?.props || {},
      );

      // Update children
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
    }
    return;
  }

  // Handle text nodes
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (existingElement && existingElement.nodeType === Node.TEXT_NODE) {
      if (existingElement.textContent !== String(newVNode)) {
        existingElement.textContent = String(newVNode);
      }
    } else {
      const textNode = document.createTextNode(String(newVNode));
      if (existingElement) {
        parent.replaceChild(textNode, existingElement);
      } else {
        parent.appendChild(textNode);
      }
    }
  }
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
