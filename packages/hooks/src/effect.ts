import type { Effect, EffectHook } from '@synxjs/types';
import { getCurrentComponent, queueEffect } from '@synxjs/runtime';

export function useEffect(effect: Effect, deps?: unknown[]): void {
  const component = getCurrentComponent();
  if (!component) {
    throw new Error('useEffect must be used within a functional component');
  }
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  const prevHook = hooks[hookIndex] as EffectHook | undefined;

  const hasChanged =
    !prevHook ||
    !prevHook.deps ||
    !deps ||
    deps.some((dep, i) => !Object.is(dep, prevHook.deps?.[i]));

  if (hasChanged) {
    if (prevHook?.cleanup) {
      prevHook.cleanup();
    }

    const hook: EffectHook = {
      type: 'effect',
      effect,
      deps,
      cleanup: undefined,
    };

    hooks[hookIndex] = hook;

    queueEffect(() => {
      const result = effect();
      hook.cleanup = result;
    });
  }
}
