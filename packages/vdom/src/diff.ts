import type {
  FunctionalComponent,
  VNode,
  VNodeChildren,
} from '@synxjs/types';
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
import { renderError } from './renderer';

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
        // Clean up rendered children recursively
        if (oldVNode.renderedChildren) {
          oldVNode.renderedChildren.forEach((child, i) => {
            diff(null, child, parent, index + i);
          });
        }
        // Clean up the instance
        const instance = componentInstanceCache.get(
          oldVNode as VNode<FunctionalComponent>,
        );
        if (instance) {
          cleanupEffects(instance);
          componentInstanceCache.delete(oldVNode as VNode<FunctionalComponent>);
        }
      }

      // Clean up element listeners if it exists
      if (existingElement?._listeners) {
        updateAttributes(existingElement, {}, {});
      }

      // Remove the element
      if (existingElement) {
        parent.removeChild(existingElement);
      }
    }
    return;
  }

  if (typeof newVNode.type === 'function') {
    diffFunctionalComponent(
      newVNode as VNode<FunctionalComponent>,
      oldVNode as VNode<FunctionalComponent> | null,
      parent,
      index,
    );
    return;
  }

  if (typeof newVNode.type === 'string') {
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
      // Before updating instance, clean up old listeners if they exist
      if ((instance.dom as HTMLElement)?._listeners) {
        updateAttributes(instance.dom as HTMLElement, {}, {});
      }

      instance = {
        ...instance,
        vnode: newVNode,
      };
      updateComponentInStack(componentInstanceCache.get(oldVNode!)!, instance);
    }

    componentInstanceCache.set(newVNode, instance);
    setCurrentComponent(instance);

    const renderedNode = instance.render();

    // Store rendered children in both instance and vnode
    const renderedChildren = Array.isArray(renderedNode)
      ? (renderedNode as VNode[])
      : [renderedNode as VNode];

    instance.lastRendered = renderedNode as VNode;
    newVNode.renderedChildren = renderedChildren;

    if (instance.dom) {
      // Use the stored children for diffing
      const oldChildren = oldVNode?.renderedChildren || [];
      renderedChildren.forEach((child, i) => {
        diff(child, oldChildren[i] || null, parent, index + i);
      });
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
    const errorDom = renderError(error);
    if (errorDom) parent.appendChild(errorDom);
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
    // Clean up old listeners before replacing
    if (existingElement._listeners) {
      updateAttributes(existingElement, {}, {});
    }
    const newDom = renderVNode(newVNode);
    if (newDom) parent.replaceChild(newDom, existingElement);
    return;
  }

  // Always update attributes to ensure proper listener cleanup and addition
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
