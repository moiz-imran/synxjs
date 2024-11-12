// src/core/diff.ts

import type {
  FunctionalComponentInstance,
  VNode,
  VNodeChildren,
  VNodeProps,
} from './types';
import {
  componentInstanceCache,
  createFunctionalComponentInstance,
} from './renderer';

type DOMNode = HTMLElement | Text;

/**
 * Renders a Virtual DOM node into an actual DOM node.
 */
export function renderVNode(
  node: VNode | string | number | null,
  parentInstance?: FunctionalComponentInstance,
): DOMNode | null {
  if (!node) return null;

  // Handle text nodes
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }

  // Handle functional components
  if (typeof node.type === 'function') {
    return renderFunctionalVNode(node);
  }

  // Handle regular DOM elements
  return renderElementVNode(node, parentInstance);
}

/**
 * Renders a functional component VNode
 */
function renderFunctionalVNode(node: VNode): DOMNode | null {
  const instance =
    componentInstanceCache.get(node) || createFunctionalComponentInstance(node);

  const renderedNode = instance.render();
  const dom = renderVNode(renderedNode, instance);

  if (dom) {
    instance.dom = dom;
  }

  return dom;
}

/**
 * Renders a regular DOM element VNode
 */
function renderElementVNode(
  node: VNode,
  parentInstance?: FunctionalComponentInstance,
): HTMLElement {
  const element = document.createElement(node.type as string);

  if (node.props) {
    updateAttributes(element, node.props, {});
  }

  if (node.children) {
    const children = Array.isArray(node.children)
      ? node.children
      : [node.children];
    children
      .filter((child) => child != null && typeof child !== 'boolean')
      .forEach((child) => {
        const childDom = renderVNode(child);
        if (childDom) element.appendChild(childDom);
      });
  }

  if (parentInstance && !parentInstance.dom) {
    parentInstance.dom = element;
  }

  return element;
}

/**
 * Compares and updates DOM nodes based on VNode differences
 */
export function diff(
  newVNode: VNode | string | number | null,
  oldVNode: VNode | string | number | null,
  parent: HTMLElement,
  index: number = 0,
): void {
  const existingElement = parent.childNodes[index];

  // Handle node removal
  if (newVNode === null || newVNode === undefined) {
    if (existingElement) parent.removeChild(existingElement);
    return;
  }

  // Handle functional components
  if (typeof newVNode === 'object' && typeof newVNode.type === 'function') {
    diffFunctionalComponent(newVNode, oldVNode as VNode, parent, index);
    return;
  }

  // Handle DOM elements
  if (typeof newVNode === 'object' && typeof newVNode.type === 'string') {
    diffElement(newVNode, oldVNode as VNode, parent, index);
    return;
  }

  // Handle text nodes
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    diffTextNode(newVNode, existingElement, parent);
  }
}

/**
 * Handles diffing of functional components
 */
function diffFunctionalComponent(
  newVNode: VNode,
  oldVNode: VNode | null,
  parent: HTMLElement,
  index: number,
): void {
  const instance =
    componentInstanceCache.get(oldVNode as VNode & object) ||
    createFunctionalComponentInstance(newVNode);

  instance.vnode = newVNode;
  componentInstanceCache.set(newVNode as VNode & object, instance);

  const renderedNode = instance.render();

  if (instance.dom) {
    diff(renderedNode, instance.vnode, parent, index);
  } else {
    const newDom = renderVNode(renderedNode, instance);
    if (newDom) {
      const existingElement = parent.childNodes[index];
      if (existingElement) {
        parent.replaceChild(newDom, existingElement);
      } else {
        parent.appendChild(newDom);
      }
    }
  }
}

/**
 * Handles diffing of regular DOM elements
 */
function diffElement(
  newVNode: VNode,
  oldVNode: VNode | null,
  parent: HTMLElement,
  index: number,
): void {
  const existingElement = parent.childNodes[index] as HTMLElement;

  if (!existingElement) {
    const newDom = renderVNode(newVNode);
    if (newDom) parent.appendChild(newDom);
    return;
  }

  if (existingElement.nodeName.toLowerCase() === newVNode.type) {
    updateAttributes(
      existingElement,
      newVNode.props || {},
      oldVNode?.props || {},
    );

    diffChildren(newVNode, oldVNode, existingElement);
  }
}

/**
 * Handles diffing of children nodes
 */
function diffChildren(
  newVNode: VNode,
  oldVNode: VNode | null,
  parent: HTMLElement,
): void {
  const newChildren = normalizeChildren(newVNode.children);
  const oldChildren = oldVNode ? normalizeChildren(oldVNode.children) : [];

  // Remove extra children
  while (parent.childNodes.length > newChildren.length) {
    parent.removeChild(parent.lastChild!);
  }

  // Update remaining children
  newChildren.forEach((child, i) => {
    diff(child, oldChildren[i], parent, i);
  });
}

/**
 * Handles diffing of text nodes
 */
function diffTextNode(
  newNode: string | number,
  existingElement: ChildNode | null,
  parent: HTMLElement,
): void {
  const newContent = String(newNode);

  if (existingElement?.nodeType === Node.TEXT_NODE) {
    if (existingElement.textContent !== newContent) {
      existingElement.textContent = newContent;
    }
  } else {
    const textNode = document.createTextNode(newContent);
    if (existingElement) {
      parent.replaceChild(textNode, existingElement);
    } else {
      parent.appendChild(textNode);
    }
  }
}

/**
 * Updates element attributes
 */
function updateAttributes(
  element: HTMLElement,
  newProps: VNodeProps,
  oldProps: VNodeProps,
): void {
  // Handle event listeners
  const handleEvent = (
    key: string,
    value: EventListenerOrEventListenerObject,
    isRemoval = false,
  ): void => {
    const event = key.slice(2).toLowerCase();
    if (isRemoval) {
      element.removeEventListener(event, value);
    } else {
      if (oldProps[key]) {
        element.removeEventListener(
          event,
          oldProps[key] as EventListenerOrEventListenerObject,
        );
      }
      element.addEventListener(event, value);
    }
  };

  // Update or set new attributes
  Object.entries(newProps).forEach(([key, value]) => {
    if (key === 'children') return;
    if (value !== oldProps[key]) {
      if (key.startsWith('on') && typeof value === 'function') {
        handleEvent(key, value as EventListenerOrEventListenerObject);
      } else {
        const attrKey = key === 'className' ? 'class' : key;
        if (key === 'style' && value !== null && typeof value === 'object') {
          Object.assign(element.style, value as Partial<CSSStyleDeclaration>);
        } else {
          element.setAttribute(attrKey, String(value));
        }
      }
    }
  });

  // Remove old attributes
  Object.entries(oldProps).forEach(([key, value]) => {
    if (!(key in newProps)) {
      if (key.startsWith('on') && typeof value === 'function') {
        handleEvent(key, value as EventListenerOrEventListenerObject, true);
      } else {
        const attrKey = key === 'className' ? 'class' : key;
        element.removeAttribute(attrKey);
      }
    }
  });
}

/**
 * Normalizes children to an array
 */
function normalizeChildren(
  children: VNodeChildren,
): Array<VNode | string | number> {
  if (!children) return [];
  return Array.isArray(children)
    ? children.filter((child) => child != null && typeof child !== 'boolean')
    : [children];
}
