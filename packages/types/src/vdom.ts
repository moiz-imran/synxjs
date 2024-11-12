import { FunctionalComponent } from './component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VNodeType = string | FunctionalComponent<any>;

export interface VNodeProps extends Record<string, unknown> {
  key?: string | number;
  ref?: (element: HTMLElement | null) => void;
  children?: VNodeChildren;
}

export type VNodeChild = VNode | string | number | boolean | null | undefined;

export type VNodeChildren = VNodeChild[];

export interface VNode {
  type: VNodeType;
  props: VNodeProps;
  children: VNodeChildren;
  key?: string | number;
}
