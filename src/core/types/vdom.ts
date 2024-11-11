import { FunctionalComponent } from './component';

export interface VNodeProps extends Record<string, unknown> {
  key?: string | number;
  ref?: (element: HTMLElement | null) => void;
  children?: VNodeChildren;
}

export type VNodeChild = VNode | string | number | boolean | null | undefined;

export type VNodeChildren = Array<VNodeChild>;

export interface VNode {
  type: string | FunctionalComponent;
  props: VNodeProps;
  children: VNodeChildren;
  key?: string | number;
}
