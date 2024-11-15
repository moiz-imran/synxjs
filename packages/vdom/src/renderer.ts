import type { FunctionalComponent, VNode, VNodeChild } from '@synxjs/types';
import {
  componentInstanceCache,
  domToInstanceMap,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import { updateAttributes } from './attributes';
import { setCurrentComponent, resetCurrentComponent, getCurrentComponent } from '@synxjs/runtime';

export function renderApp(container: HTMLElement, appVNode: VNode): void {
  const rootInstance = createFunctionalComponentInstance(
    appVNode as VNode<FunctionalComponent>,
  );
  const newDom = render(rootInstance.render());

  if (newDom) {
    container.innerHTML = '';
    container.appendChild(newDom);
    rootInstance.dom = newDom;
  }
}

export function render(
  node: VNode | string | number | null,
): HTMLElement | Text | null {
  if (!node || typeof node === 'boolean') return null;

  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node.toString());
  }

  if (typeof node.type === 'function') {
    return renderFunctionalComponent(node);
  }

  return renderIntrinsicElement(node);
}

function renderFunctionalComponent(node: VNode): HTMLElement | Text | null {
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
  } finally {
    resetCurrentComponent();
  }
}

function renderIntrinsicElement(node: VNode): HTMLElement {
  const element = document.createElement(node.type as string);
  updateAttributes(element, node.props || {}, {});
  renderChildren(element, node.children);
  return element;
}

function renderChildren(element: HTMLElement, children: VNodeChild[]): void {
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
