import type { VNode, VNodeChildren } from '@synxjs/types';
import {
  componentInstanceCache,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import { updateAttributes } from './attributes';
import { renderVNode } from './vnode-renderer';

export function diff(
  newVNode: VNode | string | number | null,
  oldVNode: VNode | string | number | null,
  parent: HTMLElement,
  index: number = 0,
): void {
  const existingElement = parent.childNodes[index];

  if (newVNode === null || newVNode === undefined) {
    if (existingElement) parent.removeChild(existingElement);
    return;
  }

  if (typeof newVNode === 'object' && typeof newVNode.type === 'function') {
    diffFunctionalComponent(newVNode, oldVNode as VNode, parent, index);
    return;
  }

  if (typeof newVNode === 'object' && typeof newVNode.type === 'string') {
    diffElement(newVNode, oldVNode as VNode, parent, index);
    return;
  }

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

  if (typeof renderedNode === 'object' && typeof renderedNode?.type === 'function') {
    const childInstance = createFunctionalComponentInstance(renderedNode);
    const childDom = renderVNode(childInstance.render());

    if (childDom) {
      if (instance.dom) {
        parent.replaceChild(childDom, instance.dom);
      } else {
        const existingElement = parent.childNodes[index];
        if (existingElement) {
          parent.replaceChild(childDom, existingElement);
        } else {
          parent.appendChild(childDom);
        }
      }
      instance.dom = childDom;
      childInstance.dom = childDom;
    }
    return;
  }

  if (instance.dom) {
    diff(renderedNode, instance.vnode, parent, index);
  } else {
    const newDom = renderVNode(renderedNode);
    if (newDom) {
      const existingElement = parent.childNodes[index];
      if (existingElement) {
        parent.replaceChild(newDom, existingElement);
      } else {
        parent.appendChild(newDom);
      }
      instance.dom = newDom;
    }
  }
}

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

function normalizeChildren(
  children: VNodeChildren,
): Array<VNode | string | number> {
  if (!children) return [];
  return Array.isArray(children)
    ? children.filter((child) => child != null && typeof child !== 'boolean')
    : [children];
}
