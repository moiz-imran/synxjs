import { VNode } from './vdom';
import { Hook } from './hooks';

export type DOMNode = HTMLElement | Text;
export type RenderResult = VNode | string | number | null;

export interface FunctionalComponentInstance {
  hooks: Hook[];
  currentHook: number;
  vnode: VNode<FunctionalComponent>;
  render: () => RenderResult;
  dom: DOMNode | null;
  lastRendered?: VNode | null;
}

export interface FunctionalComponent<P = object> {
  (props: P): VNode;
}
