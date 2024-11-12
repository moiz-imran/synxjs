import type {
  VNode,
  FunctionalComponentInstance,
  FunctionalComponent,
} from '@synxjs/types';

export const componentInstanceCache = new WeakMap<
  VNode,
  FunctionalComponentInstance
>();

export const domToInstanceMap = new Map<
  HTMLElement | Text,
  FunctionalComponentInstance
>();

export function createFunctionalComponentInstance(
  vnode: VNode,
): FunctionalComponentInstance {
  const instance: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode,
    render: () => {
      instance.currentHook = 0;
      return (vnode.type as FunctionalComponent<unknown>)(
        vnode.props || {},
      ) as VNode;
    },
    dom: null,
  };

  componentInstanceCache.set(vnode, instance);
  return instance;
}
