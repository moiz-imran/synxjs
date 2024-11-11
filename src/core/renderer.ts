import { setCurrentComponent, resetCurrentComponent } from './hooks';
import type {
  VNode,
  FunctionalComponent,
  FunctionalComponentInstance,
  VNodeProps,
  VNodeChildren,
  VNodeChild,
} from './types';

// Core state management
export const componentInstanceCache = new WeakMap<
  VNode & object,
  FunctionalComponentInstance
>();
export const domToInstanceMap = new Map<
  HTMLElement | Text,
  FunctionalComponentInstance
>();

/**
 * Renders the entire application into the specified container.
 */
export function renderApp(container: HTMLElement, appVNode: VNode): void {
  const rootInstance = createFunctionalComponentInstance(appVNode);
  const newDom = render(rootInstance.render());

  if (newDom) {
    container.innerHTML = '';
    container.appendChild(newDom);
    rootInstance.dom = newDom;
  }
}

/**
 * Renders a Virtual DOM node into an actual DOM node.
 */
export function render(
  node: VNode | string | number | null,
): HTMLElement | Text | null {
  if (!node || typeof node === 'boolean') return null;

  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node.toString());
  }

  // Handle functional components
  if (typeof node.type === 'function') {
    return renderFunctionalComponent(node);
  }

  // Handle intrinsic elements
  return renderIntrinsicElement(node);
}

/**
 * Renders a functional component.
 */
function renderFunctionalComponent(node: VNode): HTMLElement | Text | null {
  const instance =
    componentInstanceCache.get(node as VNode & object) ||
    createFunctionalComponentInstance(node);

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

/**
 * Renders an intrinsic element (regular DOM element).
 */
function renderIntrinsicElement(node: VNode): HTMLElement {
  const element = document.createElement(node.type as string);
  applyProps(element, node.props || {});
  renderChildren(element, node.children);
  return element;
}

/**
 * Applies props to a DOM element.
 */
function applyProps(element: HTMLElement, props: VNodeProps): void {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') return;
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(
        key.slice(2).toLowerCase(),
        value as EventListener,
      );
    } else if (key === 'className') {
      element.setAttribute('class', String(value));
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, String(value));
    }
  });
}

/**
 * Renders children of an element.
 */
function renderChildren(element: HTMLElement, children: VNodeChildren): void {
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

/**
 * Creates a new functional component instance.
 */
export function createFunctionalComponentInstance(
  vnode: VNode,
): FunctionalComponentInstance {
  const instance: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode,
    render: () => {
      instance.currentHook = 0;
      try {
        setCurrentComponent(instance);
        return (vnode.type as FunctionalComponent<unknown>)(
          vnode.props || {},
        ) as VNode;
      } finally {
        resetCurrentComponent();
      }
    },
    dom: null,
  };

  componentInstanceCache.set(vnode as VNode & object, instance);
  return instance;
}

export function unmountComponent(instance: FunctionalComponentInstance): void {
  // Clean up hooks
  instance.hooks.forEach((hook) => {
    if ('cleanup' in hook && typeof hook.cleanup === 'function') {
      hook.cleanup();
    }
    if ('unsubscribe' in hook && typeof hook.unsubscribe === 'function') {
      hook.unsubscribe();
    }
  });

  // Clear references
  instance.hooks = [];
  instance.vnode = null as unknown as VNode;
  instance.dom = null;
}
