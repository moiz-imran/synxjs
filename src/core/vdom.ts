// src/core/vdom.ts

import type {
  FunctionalComponent,
  VNode,
  VNodeChildren,
  VNodeProps,
} from './types';

/**
 * **Virtual DOM (VNode) Definition and Factory Function**
 *
 * This module defines the structure of Virtual DOM nodes (VNodes) and provides a
 * factory function `createElement` to create these nodes. It supports both intrinsic
 * DOM elements (like 'div', 'button') and functional components.
 */

/**
 * **Fragment Type**
 *
 * Represents a Fragment, allowing for grouping of children without adding extra nodes to the DOM.
 *
 * Usage in JSX:
 * ```jsx
 * <>
 *   <Child1 />
 *   <Child2 />
 * </>
 * ```
 *
 * The above JSX is transpiled to use the `Fragment` type.
 */
export const Fragment = Symbol('Fragment');

/**
 * **createElement Function**
 *
 * Factory function to create Virtual DOM nodes (VNodes).
 *
 * **Parameters:**
 *
 * - `type`: The type of the element. Can be:
 *   - A string representing an intrinsic DOM element (e.g., 'div', 'button').
 *   - A `FunctionalComponent` (i.e., a function representing a component).
 *   - The `Fragment` symbol for grouping children without adding extra nodes.
 * - `props`: An object containing properties/attributes of the element. Defaults to an empty object.
 * - `children`: The children of the element. Can be multiple arguments representing nested elements or text.
 *
 * **Returns:**
 *
 * - A `VNode` object representing the Virtual DOM node.
 *
 * **Usage:**
 *
 * ```javascript
 * const vnode = createElement('div', { id: 'container' },
 *   createElement('h1', {}, 'Hello, World!'),
 *   createElement(Button, { label: 'Click Me', onClick: handleClick })
 * );
 * ```
 */
export function createElement<P>(
  type: string | FunctionalComponent | typeof Fragment,
  props: P = {} as P,
  ...children: VNodeChildren
): VNode {
  // Handle Fragment type by directly returning its children
  if (type === Fragment) {
    return {
      type: typeof Fragment,
      props: {},
      children: children.length === 1 ? [children[0]] : children,
    };
  }

  return {
    type,
    props: props as VNodeProps,
    children: children.length === 1 ? [children[0]] : children,
  };
}

/**
 * **isVNode Function**
 *
 * Type guard to determine if a value is a `VNode`.
 *
 * **Parameters:**
 *
 * - `node`: The value to check.
 *
 * **Returns:**
 *
 * - `true` if `node` is a `VNode`, `false` otherwise.
 */
export function isVNode(node: unknown): node is VNode {
  return typeof node === 'object' && node !== null && 'type' in node;
}

/**
 * **isFunctionalComponent Function**
 *
 * Type guard to determine if a type is a `FunctionalComponent`.
 *
 * **Parameters:**
 *
 * - `type`: The type to check.
 *
 * **Returns:**
 *
 * - `true` if `type` is a `FunctionalComponent`, `false` otherwise.
 */
export function isFunctionalComponent(
  type: unknown,
): type is FunctionalComponent<unknown> {
  return typeof type === 'function';
}

/**
 * **isFragment Function**
 *
 * Type guard to determine if a VNode is a Fragment.
 *
 * **Parameters:**
 *
 * - `node`: The `VNode` to check.
 *
 * **Returns:**
 *
 * - `true` if `node` is a Fragment, `false` otherwise.
 */
export function isFragment(node: VNode): boolean {
  return node.type === typeof Fragment;
}
