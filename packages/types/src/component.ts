import { VNode } from './vdom';
import { Hook } from './hooks';

export type DOMNode = HTMLElement | Text;
export type RenderResult = VNode | string | number | null;

export interface FunctionalComponentInstance {
  hooks: Hook[];
  currentHook: number;
  vnode: VNode;
  render: () => RenderResult;
  dom: DOMNode | null;
}

export interface FunctionalComponent<P = object> {
  (props: P): VNode;
}
