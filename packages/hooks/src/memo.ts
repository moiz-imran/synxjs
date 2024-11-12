import type { MemoHook } from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';

export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  const component = getCurrentComponent();
  if (!component) {
    throw new Error('useMemo must be used within a functional component');
  }

  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined || !deps) {
    const hook: MemoHook<T> = {
      type: 'memo',
      value: factory(),
      deps: deps || [],
    };
    hooks[hookIndex] = hook;
    return hook.value;
  }

  const prevHook = hooks[hookIndex] as MemoHook<T>;
  const hasChanged = deps.some((dep, i) => !Object.is(dep, prevHook.deps[i]));

  if (hasChanged) {
    const hook: MemoHook<T> = {
      type: 'memo',
      value: factory(),
      deps,
    };
    hooks[hookIndex] = hook;
    return hook.value;
  }

  return prevHook.value;
}
