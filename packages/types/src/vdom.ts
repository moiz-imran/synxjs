import { FunctionalComponent, FunctionalComponentInstance } from './component';

// Define Fragment as a component type
export interface FragmentType {
  (props: { children?: any }): any;
}

export const Fragment: FragmentType = Symbol('Fragment') as unknown as FragmentType;

// Update VNodeType to use FragmentType
export type VNodeType = string | FunctionalComponent<any> | FragmentType;

export interface VNodeProps<T extends VNodeType = VNodeType>
  extends Record<string, unknown> {
  key?: string | number;
  ref?: (element: HTMLElement | null) => void;
  children?: VNodeChildren<T>;
}

export type VNodeChild<T extends VNodeType = VNodeType> =
  | VNode<T>
  | string
  | number
  | boolean
  | null
  | undefined;

export type VNodeChildren<T extends VNodeType = VNodeType> = VNodeChild<T>[];

export interface VNode<T extends VNodeType = VNodeType> {
  type: T;
  props: VNodeProps<T>;
  children: VNodeChildren<T>;
  key?: string | number;
  renderedChildren?: VNode[];
}

interface EventListenerMap {
  [eventName: string]: EventListener;
}

declare global {
  interface HTMLElement {
    _instance?: FunctionalComponentInstance | null;
    _listeners?: EventListenerMap;
  }

  interface SVGElement {
    _instance?: FunctionalComponentInstance | null;
    _listeners?: EventListenerMap;
  }
}
