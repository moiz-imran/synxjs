import type {
  VNode,
  VNodeProps,
  VNodeChildren,
  FunctionalComponent,
} from '@synxjs/types';

export function jsx(
  type: string | FunctionalComponent,
  props: VNodeProps,
  key?: string | number | null,
): VNode {
  const { children, ...rest } = props;
  return {
    type,
    props: rest,
    children: children as VNodeChildren,
    key: key ?? undefined,
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = Symbol('Fragment');
