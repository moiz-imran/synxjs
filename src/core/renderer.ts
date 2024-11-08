// src/core/renderer.ts

import { VNode, FunctionalComponent } from './vdom';
import {
  setCurrentComponent,
  resetCurrentComponent,
  FunctionalComponentInstance,
} from './hooks';
import { App } from '../components/App';
import { diff } from './diff'; // Import diff functions

/**
 * Hook Map to store functional component instances associated with their VNodes.
 */
const functionalComponentInstanceMap = new WeakMap<
  VNode & object,
  FunctionalComponentInstance
>();

export const componentInstanceCache = new WeakMap<
  VNode & object,
  FunctionalComponentInstance
>();

let rootElement: HTMLElement | null = null;
let currentVNode: VNode | string | null = null;

// Add a regular Map to track DOM to instance relationships
export const domToInstanceMap = new Map<
  HTMLElement | Text,
  FunctionalComponentInstance
>();

/**
 * Renders the entire application into the specified container.
 * @param container - The DOM element to render the app into.
 * @param appVNode - The root Virtual DOM node.
 */
export function renderApp(container: HTMLElement, appVNode: VNode): void {
  rootElement = container;
  currentVNode = appVNode;

  // Create the root functional component instance
  const rootFunctionalComponentInstance = createFunctionalComponentInstance(
    appVNode,
    App,
  );
  functionalComponentInstanceMap.set(
    appVNode as VNode & object,
    rootFunctionalComponentInstance,
  );

  // Initial render via root functional component
  const newDom = render(rootFunctionalComponentInstance.render());
  if (newDom) {
    container.innerHTML = '';
    container.appendChild(newDom);
    rootFunctionalComponentInstance.dom = newDom; // Assign the DOM node to the instance
  }
  currentVNode = rootFunctionalComponentInstance.vnode;
}

/**
 * Recursively renders a Virtual DOM node into an actual DOM node.
 * @param node - The Virtual DOM node or string.
 * @returns The actual DOM node.
 */
export function render(
  node: VNode | string | number | null,
): HTMLElement | Text | null {
  if (node === null) {
    console.warn('render: Attempted to render a null vnode.');
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    console.log('render: Rendering text node:', node);
    return document.createTextNode(node.toString());
  }

  // Check if the node is already associated with a functional component instance
  if (functionalComponentInstanceMap.has(node)) {
    const functionalComponentInstance =
      functionalComponentInstanceMap.get(node)!;
    const newChildVNode = functionalComponentInstance.render();
    if (functionalComponentInstance.dom && newChildVNode) {
      // Perform diff between new VNode and old VNode
      const parent = functionalComponentInstance.dom.parentNode as HTMLElement;
      if (parent) {
        const index = Array.from(parent.childNodes).indexOf(
          functionalComponentInstance.dom,
        );
        if (index !== -1) {
          console.log(
            `render: Performing diff for component at index ${index}`,
          );
          diff(newChildVNode, functionalComponentInstance.vnode, parent, index);
          functionalComponentInstance.vnode = newChildVNode as VNode; // Update the vnode reference
          functionalComponentInstance.dom = parent.childNodes[index] as
            | HTMLElement
            | Text; // Update dom reference
        } else {
          console.error('render: DOM node not found in parent.');
        }
      }
    }
    return functionalComponentInstance.dom;
  }

  // If node.type is a functional component
  if (typeof node.type === 'function') {
    const FunctionalComp = node.type as FunctionalComponent<any>;

    // Create a new FunctionalComponentInstance and cache it
    const functionalComponentInstance = createFunctionalComponentInstance(
      node,
      FunctionalComp,
    );
    functionalComponentInstanceMap.set(node, functionalComponentInstance);

    try {
      // Set the current component before rendering
      setCurrentComponent(functionalComponentInstance);

      // Reset hooks for this component
      functionalComponentInstance.currentHook = 0;

      // Render the functional component
      const childVNode = functionalComponentInstance.render();
      const childDom = render(childVNode);

      if (childDom) {
        functionalComponentInstance.dom = childDom;
      }
      return childDom;
    } finally {
      // Always reset the current component after rendering
      resetCurrentComponent();
    }
  }

  // node.type is an intrinsic element
  const element = document.createElement(node.type as string);

  // Set props
  const props = node.props || {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === 'className') {
      element.setAttribute('class', value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  // Render and append children
  if (typeof node.children === 'string' || typeof node.children === 'number') {
    const textNode = document.createTextNode(node.children.toString());
    element.appendChild(textNode);
  } else if (Array.isArray(node.children)) {
    node.children.forEach((child, idx) => {
      if (child === undefined || child === null) return; // Skip null/undefined
      const childDom =
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : render(child);
      if (childDom) {
        element.appendChild(childDom);
      }
    });
  } else if (node.children) {
    const childDom =
      typeof node.children === 'string' || typeof node.children === 'number'
        ? document.createTextNode(String(node.children))
        : render(node.children);
    if (childDom) {
      element.appendChild(childDom);
    }
  }

  console.log('render: Created element', element);
  return element;
}

/**
 * Factory function to create a FunctionalComponentInstance.
 * @param vnode - The Virtual DOM node.
 * @param FunctionalComp - The functional component to render.
 * @returns A fully constructed FunctionalComponentInstance.
 */
export function createFunctionalComponentInstance(
  vnode: VNode,
  FunctionalComp: FunctionalComponent<any>,
): FunctionalComponentInstance {
  const instance: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode,
    render: () => {
      instance.currentHook = 0;
      try {
        setCurrentComponent(instance);
        return FunctionalComp(vnode.props || {});
      } finally {
        resetCurrentComponent();
      }
    },
    dom: null,
  };

  // Store instance in cache immediately
  componentInstanceCache.set(vnode as VNode & object, instance);
  return instance;
}

// Add new function to handle DOM assignment
export function assignDomToInstance(
  instance: FunctionalComponentInstance,
  dom: HTMLElement | Text,
) {
  instance.dom = dom;
  domToInstanceMap.set(dom, instance);
}
