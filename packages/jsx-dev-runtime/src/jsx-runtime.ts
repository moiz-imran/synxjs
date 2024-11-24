import type {
  VNode,
  VNodeProps,
  VNodeChildren,
  FunctionalComponent,
  FragmentType,
} from '@synxjs/types';

export const Fragment: FragmentType = Symbol(
  'Fragment',
) as unknown as FragmentType;

export function jsx(
  type: string | FunctionalComponent | FragmentType,
  props: VNodeProps,
  key: string | number | null,
): VNode {
  const { children, ...rest } = props;
  return {
    type,
    props: rest,
    children: (children as VNodeChildren) || [],
    key: key ?? props.key,
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;
