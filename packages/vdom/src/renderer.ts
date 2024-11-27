import type { FunctionalComponent, VNode, VNodeChild } from '@synxjs/types';
import {
  componentInstanceCache,
  domToInstanceMap,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import { updateAttributes } from './attributes';
import {
  setCurrentComponent,
  resetCurrentComponent,
  runEffects,
  cleanupEffects,
} from '@synxjs/runtime';
import { createElement, Fragment } from './create-element';

export function renderApp(container: HTMLElement, appVNode: VNode): void {
  // Clean up previous render
  const currentInstance = container._instance;
  if (currentInstance) {
    cleanupEffects(currentInstance);
  }

  const rootInstance = createFunctionalComponentInstance(
    appVNode as VNode<FunctionalComponent>,
  );

  try {
    const renderedChildren = rootInstance.render();
    const newDom = render(renderedChildren);

    if (newDom) {
      // Store new instance before DOM changes
      container._instance = rootInstance;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(newDom);
      rootInstance.dom = newDom;

      // Run effects after rendering
      runEffects();
    }
  } catch (error) {
    const errorDom = renderError(error);
    if (errorDom) {
      container.appendChild(errorDom);
    }
  }
}

export function render(
  node: VNode | string | number | null,
): HTMLElement | SVGElement | Text | null {
  if (!node || typeof node === 'boolean') return null;

  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node.toString());
  }

  // Handle Fragment
  if (node.type === Fragment) {
    const wrapper = document.createElement('div');
    node.children.forEach(child => {
      const childDom = render(child as VNode);
      if (childDom) {
        wrapper.appendChild(childDom);
      }
    });
    return wrapper;
  }

  if (typeof node.type === 'function') {
    return renderFunctionalComponent(node);
  }

  return renderIntrinsicElement(node);
}

function renderFunctionalComponent(node: VNode): HTMLElement | SVGElement | Text | null {
  const instance =
    componentInstanceCache.get(node as VNode<FunctionalComponent>) ||
    createFunctionalComponentInstance(node as VNode<FunctionalComponent>);

  try {
    setCurrentComponent(instance);
    instance.currentHook = 0;
    const childVNode = instance.render();
    const childDom = render(childVNode);

    if (childDom) {
      instance.dom = childDom;
      domToInstanceMap.set(childDom, instance);
    }

    return childDom;
  } catch (error) {
    return renderError(error);
  } finally {
    resetCurrentComponent();
  }
}

function renderIntrinsicElement(node: VNode): HTMLElement | SVGElement {
  let element: HTMLElement | SVGElement;
  if (node.type === 'svg' || node.type === 'path') {
    element = document.createElementNS(
      'http://www.w3.org/2000/svg',
      node.type as string,
    );
  } else {
    element = document.createElementNS(
      'http://www.w3.org/1999/xhtml',
      node.type as string,
    );
  }
  updateAttributes(element, node.props || {}, {});
  renderChildren(element, node.children);
  return element;
}

function renderChildren(
  element: HTMLElement | SVGElement,
  children: VNodeChild[],
): void {
  if (!children) return;

  const appendChild = (child: VNodeChild): void => {
    if (child === undefined || child === null || typeof child === 'boolean')
      return;

    const childDom =
      typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : render(child);

    if (childDom) element.appendChild(childDom);
  };

  if (Array.isArray(children)) {
    children.forEach(appendChild);
  } else {
    appendChild(children);
  }
}

export function renderError(error: unknown): HTMLElement {
  console.error(error);
  const errorContent = createElement(
    'div',
    null,
    'Error caught\n',
    createElement('span', null, String(error)),
  );
  return render(errorContent) as HTMLElement;
}
