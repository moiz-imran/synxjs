import type {
  FunctionalComponent,
  VNode,
  VNodeChildren,
  VNodeProps,
  VNodeType,
} from '@synxjs/types';

export const Fragment = Symbol('Fragment');

export function createElement<P extends VNodeProps>(
  type: string | FunctionalComponent<P> | typeof Fragment,
  props: P | null,
  ...children: VNodeChildren
): VNode<VNodeType> {
  const finalProps = props || ({} as P);

  const vnode: VNode = {
    type: type === Fragment ? typeof Fragment : type,
    props: finalProps,
    children: children.flat(),
    renderedChildren: []
  };

  return vnode as VNode;
}

export function isVNode(node: unknown): node is VNode {
  return typeof node === 'object' && node !== null && 'type' in node;
}

export function isFunctionalComponent(
  type: unknown,
): type is FunctionalComponent<unknown> {
  return typeof type === 'function';
}

export function isFragment(node: VNode): boolean {
  return node.type === typeof Fragment;
}
