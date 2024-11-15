import type { FunctionalComponent, VNode, VNodeChildren } from '@synxjs/types';
import {
  componentInstanceCache,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import { updateAttributes } from './attributes';
import { renderVNode } from './vnode-renderer';
import { cleanupEffects, setCurrentComponent } from '@synxjs/runtime';

export function diff(
  newVNode: VNode | null,
  oldVNode: VNode | null,
  parent: HTMLElement,
  index: number = 0,
): void {
  const existingElement = parent.childNodes[index] as HTMLElement;

  // Handle removal
  if (newVNode === null || newVNode === undefined) {
    if (oldVNode) {
      if (typeof oldVNode.type === 'function') {
        const instance = componentInstanceCache.get(
          oldVNode as VNode<FunctionalComponent>,
        );
        if (instance) {
          cleanupEffects(instance);
        }
      }
    }
    if (existingElement) parent.removeChild(existingElement);
    return;
  }

  if (typeof newVNode === 'object' && typeof newVNode.type === 'function') {
    diffFunctionalComponent(
      newVNode as VNode<FunctionalComponent>,
      oldVNode as VNode<FunctionalComponent> | null,
      parent,
      index,
    );
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
  newVNode: VNode<FunctionalComponent>,
  oldVNode: VNode<FunctionalComponent> | null,
  parent: HTMLElement,
  index: number,
): void {
  const instance =
    componentInstanceCache.get(oldVNode!) ||
    createFunctionalComponentInstance(newVNode);

  instance.vnode = newVNode;
  componentInstanceCache.set(newVNode, instance);

  setCurrentComponent(instance);
  const renderedNode = instance.render();

  if (
    typeof renderedNode === 'object' &&
    typeof renderedNode?.type === 'function'
  ) {
    const childInstance = createFunctionalComponentInstance(
      renderedNode as VNode<FunctionalComponent>,
    );
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
    diff(renderedNode as VNode, instance.vnode, parent, index);
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

  if (existingElement.nodeName.toLowerCase() !== newVNode.type) {
    const newDom = renderVNode(newVNode);
    if (newDom) parent.replaceChild(newDom, existingElement);
    return;
  }

  updateAttributes(
    existingElement,
    newVNode.props || {},
    oldVNode?.props || {},
  );
  diffChildren(newVNode, oldVNode, existingElement);
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
    diff(child as VNode, oldChildren[i] as VNode | null, parent, i);
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
