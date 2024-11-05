// src/core/vdom.ts

import { Component, ComponentProps } from './component';

/**
 * Type representing a functional component.
 * @template P - The type of props.
 */
export type FunctionalComponent<P extends ComponentProps = ComponentProps> = (props: P) => VNode | null;

/**
 * Interface representing a Virtual DOM node for intrinsic elements.
 * @template K - The intrinsic element tag name.
 */
interface IntrinsicVNode<K extends keyof JSX.IntrinsicElements> {
  type: K;
  props: JSX.IntrinsicElements[K];
  children: string | VNode[];
  key?: string;
}

/**
 * Interface representing a Virtual DOM node for class-based components.
 * @template P - The type of props.
 */
interface ClassComponentVNode<P extends ComponentProps = ComponentProps> {
  type: new (props: P) => Component<P, any>;
  props: P;
  children: string | VNode[];
  key?: string;
}

/**
 * Interface representing a Virtual DOM node for functional components.
 * @template P - The type of props.
 */
interface FunctionalComponentVNode<P extends ComponentProps = ComponentProps> {
  type: FunctionalComponent<P>;
  props: P;
  children: string | VNode[];
  key?: string;
}

/**
 * Union type for all possible Virtual DOM nodes.
 */
export type VNode = IntrinsicVNode<keyof JSX.IntrinsicElements> | ClassComponentVNode<any> | FunctionalComponentVNode<any> | null;

/**
 * Creates a Virtual DOM node for intrinsic elements.
 * @template K - The intrinsic element tag name.
 * @param type - The tag name of the intrinsic element.
 * @param props - The props specific to the intrinsic element.
 * @param children - The children of the element.
 * @returns A Virtual DOM node.
 */
export function createElement<K extends keyof JSX.IntrinsicElements>(
  type: K,
  props: JSX.IntrinsicElements[K],
  ...children: Array<string | VNode>
): IntrinsicVNode<K>;

/**
 * Creates a Virtual DOM node for class-based components.
 * @template P - The type of props.
 * @param type - The class-based component.
 * @param props - The props for the component.
 * @param children - The children of the component.
 * @returns A Virtual DOM node.
 */
export function createElement<P extends ComponentProps>(
  type: new (props: P) => Component<P, any>,
  props: P,
  ...children: Array<string | VNode>
): ClassComponentVNode<P>;

/**
 * Creates a Virtual DOM node for functional components.
 * @template P - The type of props.
 * @param type - The functional component.
 * @param props - The props for the component.
 * @param children - The children of the component.
 * @returns A Virtual DOM node.
 */
export function createElement<P extends ComponentProps>(
  type: FunctionalComponent<P>,
  props: P,
  ...children: Array<string | VNode>
): FunctionalComponentVNode<P>;

/**
 * Implementation of the createElement function.
 * @param type - The type of the element or component.
 * @param props - The props for the element or component.
 * @param children - The children elements or text.
 * @returns A Virtual DOM node.
 */
export function createElement(
  type: keyof JSX.IntrinsicElements | FunctionalComponent<any> | (new (props: any) => Component<any, any>),
  props: { [key: string]: any } | null,
  ...children: Array<string | VNode>
): VNode {
  // Ensure props is an object
  props = props || {};

  // Extract 'key' from props
  const { key, ...restProps } = props;

  // Flatten the children array to prevent nested arrays
  const flatChildren: Array<string | VNode> = [];

  const flatten = (
    items: Array<string | VNode | Array<string | VNode>>,
  ): void => {
    items.forEach((item) => {
      if (Array.isArray(item)) {
        flatten(item); // Recursively flatten nested arrays
      } else {
        flatChildren.push(item);
      }
    });
  };

  flatten(children);

  // Determine if children should be a single string or an array
  const finalChildren: string | VNode[] =
    flatChildren.length === 1 && typeof flatChildren[0] === 'string'
      ? flatChildren[0]
      : flatChildren as VNode[];

  return {
    type,
    props: restProps, // Pass the rest of the props, excluding 'key'
    children: finalChildren,
    key, // Include 'key' separately in the VNode
  };
}
