// src/core/renderer.ts

import { VNode, FunctionalComponent } from './vdom';
import { Component, ComponentProps } from './component';
import { App } from '../components/App';
import { resetHooks, runHooks } from './hooks';

/**
 * Type representing a component class with props P and state S.
 */
type ComponentClass<P extends ComponentProps, S> = new (
  props: P,
) => Component<P, S>;
// Cache to store component instances associated with their VNodes
const componentInstanceMap = new WeakMap<VNode & object, Component<any, any>>();

let rootElement: HTMLElement | null = null;
let currentVNode: VNode | string | null = null;

/**
 * Renders the entire application into the specified container.
 * @param container - The DOM element to render the app into.
 * @param appVNode - The root Virtual DOM node.
 */
export function renderApp(container: HTMLElement, appVNode: VNode): void {
  rootElement = container;
  currentVNode = appVNode;
  const dom = render(appVNode);
  if (dom) {
    container.innerHTML = '';
    container.appendChild(dom);
  }

  // Attach a render function to the root for re-rendering
  (container as any).__appRender = () => {
    resetHooks(); // Reset hooks before each render
    const newVNode = App({});
    const newDom = render(newVNode);
    if (newDom) {
      container.innerHTML = '';
      container.appendChild(newDom);
    }
    runHooks(); // Process any hook cleanup or side-effects
    currentVNode = newVNode;
  };
}

/**
 * Recursively renders a Virtual DOM node into an actual DOM node.
 * @param node - The Virtual DOM node or string.
 * @returns The actual DOM node.
 */
export function render(node: VNode | string | null): HTMLElement | Text | null {
  if (node === null) {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node.toString());
  }

  // Check if the node is already associated with a component instance
  if (componentInstanceMap.has(node)) {
    const componentInstance = componentInstanceMap.get(node)!;
    const childVNode = componentInstance.render();
    const dom = render(childVNode);
    return dom;
  }

  // If node.type is a class-based component
  if (
    typeof node.type === 'function' &&
    node.type.prototype instanceof Component
  ) {
    const ComponentClass = node.type as ComponentClass<any, any>;

    // Create a new component instance and cache it
    const componentInstance = new ComponentClass(node.props);
    componentInstanceMap.set(node, componentInstance);

    const childVNode = componentInstance.render();
    const dom = render(childVNode);
    return dom;
  }

  // If node.type is a functional component
  if (typeof node.type === 'function') {
    const FunctionalComp = node.type as FunctionalComponent<any>;
    const childVNode = FunctionalComp(node.props);
    const dom = render(childVNode);
    return dom;
  }

  // node.type is an intrinsic element
  const element = document.createElement(node.type as string);

  // Ensure props is an object
  const props = node.props || {};

  // Set props
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else {
      // Handle special cases like 'className' -> 'class'
      if (key === 'className') {
        element.setAttribute('class', value);
      } else if (key === 'style' && typeof value === 'object') {
        // Handle inline styles
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  // Render and append children
  if (typeof node.children === 'string') {
    const textNode = document.createTextNode(node.children);
    element.appendChild(textNode);
  } else if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      if (child === undefined || child === null) return; // Skip null/undefined
      const childDom =
        typeof child === 'string'
          ? document.createTextNode(child)
          : render(child);
      if (childDom) {
        element.appendChild(childDom);
      }
    });
  } else if (node.children) {
    const childDom =
      typeof node.children === 'string'
        ? document.createTextNode(node.children)
        : render(node.children);
    if (childDom) {
      element.appendChild(childDom);
    }
  }

  return element;
}
