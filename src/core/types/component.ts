import { VNode } from './vdom';
import { Hook } from './hooks';

export type DOMNode = HTMLElement | Text;
export type RenderResult = VNode | string | number | null;

export interface FunctionalComponentInstance {
  hooks: Hook[];
  currentHook: number;
  vnode: VNode | null;
  render: () => RenderResult;
  dom: DOMNode | null;
}

export type FunctionalComponent<P = {}> = (props: P) => RenderResult;
