import type { FunctionalComponent, VNode, VNodeChildren } from '@synxjs/types';
import {
  componentInstanceCache,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import { updateAttributes } from './attributes';
import { renderVNode } from './vnode-renderer';
import {
  cleanupEffects,
  resetCurrentComponent,
  setCurrentComponent,
  updateComponentInStack,
} from '@synxjs/runtime';
import { createElement } from './create-element';

export function diff(
  newVNode: VNode | null,
  oldVNode: VNode | null,
  parent: HTMLElement,
  index: number = 0,
): void {
  const existingElement = parent.childNodes[index] as HTMLElement;

  // Handle removal/unmounting
  if (newVNode === null || newVNode === undefined) {
    if (oldVNode) {
      if (typeof oldVNode.type === 'function') {
        const instance = componentInstanceCache.get(
          oldVNode as VNode<FunctionalComponent>,
        );
        if (instance) {
          cleanupEffects(instance);
          componentInstanceCache.delete(oldVNode as VNode<FunctionalComponent>);
        }
      }
      if (existingElement) parent.removeChild(existingElement);
    }
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
  try {
    let instance = componentInstanceCache.get(oldVNode!);

    if (!instance) {
      instance = createFunctionalComponentInstance(newVNode);
    } else {
      // Update instance with new vnode
      instance = {
        ...instance,
        vnode: newVNode,
      };
      updateComponentInStack(componentInstanceCache.get(oldVNode!)!, instance);
    }

    componentInstanceCache.set(newVNode, instance);
    setCurrentComponent(instance);
    const renderedNode = instance.render();

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
  } catch (error) {
    // Handle error by rendering error boundary content
    const errorContent = createElement('div', null, 'Error caught');
    const errorDom = renderVNode(errorContent);
    if (errorDom) {
      const existingElement = parent.childNodes[index];
      if (existingElement) {
        parent.replaceChild(errorDom, existingElement);
      } else {
        parent.appendChild(errorDom);
      }
    }
    throw error; // Re-throw for test environment
  } finally {
    resetCurrentComponent();
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
    const lastChild = parent.lastChild;
    if (lastChild) {
      parent.removeChild(lastChild);
    }
  }

  // Update remaining children
  newChildren.forEach((child, i) => {
    if (child === null || child === undefined) {
      // Remove the old child if it exists
      if (parent.childNodes[i]) {
        parent.removeChild(parent.childNodes[i]);
      }
      return;
    }
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
): Array<VNode | string | number | null> {
  if (!children) return [];
  return Array.isArray(children)
    ? children.map((child) =>
        child === false || child === true || child === undefined ? null : child,
      )
    : [children];
}
