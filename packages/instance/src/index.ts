import { resetCurrentComponent, setCurrentComponent } from '@synxjs/runtime';
import type {
  VNode,
  FunctionalComponentInstance,
  FunctionalComponent,
} from '@synxjs/types';

export const componentInstanceCache = new WeakMap<
  VNode<FunctionalComponent>,
  FunctionalComponentInstance
>();

export const domToInstanceMap = new Map<
  HTMLElement | Text,
  FunctionalComponentInstance
>();

export function createFunctionalComponentInstance(
  vnode: VNode<FunctionalComponent>,
): FunctionalComponentInstance {
  const cached = componentInstanceCache.get(vnode);
  if (cached) {
    return cached;
  }

  if (typeof vnode.type !== 'function') {
    throw new Error(
      `Expected vnode.type to be a function, but got ${typeof vnode.type}`,
    );
  }

  const instance: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode,
    render: function () {
      this.currentHook = 0;
      setCurrentComponent(this);
      try {
        return (this.vnode.type as FunctionalComponent)(this.vnode.props);
      } finally {
        resetCurrentComponent();
      }
    },
    dom: null,
  };

  componentInstanceCache.set(vnode, instance);
  return instance;
}
