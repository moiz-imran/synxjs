import {
  componentInstanceCache,
  createFunctionalComponentInstance,
} from '@synxjs/instance';
import {
  VNode,
  FunctionalComponentInstance,
  FunctionalComponent,
  FragmentType,
  DOMNode,
} from '@synxjs/types';
import { updateAttributes } from './attributes';
import { Fragment } from './create-element';

/**
 * Renders a Virtual DOM node into an actual DOM node.
 */
export function renderVNode(
  node: VNode | string | number | null,
  parentInstance?: FunctionalComponentInstance,
): DOMNode | null {
  if (node === null || node === undefined) return null;

  // Handle text nodes
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }

  // Handle Fragment
  if (node.type === Fragment) {
    return renderFragmentVNode(node as VNode<FragmentType>, parentInstance);
  }

  // Handle functional components
  if (typeof node.type === 'function') {
    return renderFunctionalVNode(
      node as VNode<FunctionalComponent>,
      parentInstance,
    );
  }

  // Handle regular DOM elements
  return renderElementVNode(node, parentInstance);
}

function renderFragmentVNode(
  node: VNode<FragmentType>,
  parentInstance?: FunctionalComponentInstance,
): DOMNode | null {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'contents'; // Makes the wrapper invisible in the DOM structure

  if (node.children) {
    const children = Array.isArray(node.children)
      ? node.children
      : [node.children];
    children
      .filter((child) => child != null && typeof child !== 'boolean')
      .forEach((child) => {
        const childDom = renderVNode(child as VNode);
        if (childDom) wrapper.appendChild(childDom);
      });
  }

  if (parentInstance && !parentInstance.dom) {
    parentInstance.dom = wrapper;
  }

  return wrapper;
}

/**
 * Renders a functional component VNode
 */
function renderFunctionalVNode(
  node: VNode<FunctionalComponent>,
  parentInstance?: FunctionalComponentInstance,
): DOMNode | null {
  const instance =
    componentInstanceCache.get(node) ||
    createFunctionalComponentInstance(node as VNode<FunctionalComponent>);

  const renderedNode = instance.render();
  const dom = renderVNode(renderedNode, instance);

  if (dom) {
    instance.dom = dom;
    if (parentInstance) {
      parentInstance.dom = dom;
    }
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
