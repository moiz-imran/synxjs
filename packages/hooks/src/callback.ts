import type { CallbackHook } from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';

/**
 * useCallback Hook
 * @param callback - The callback function to memoize.
 * @param deps - An array of dependencies for the callback.
 * @returns The memoized callback function.
 */
export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps?: unknown[],
): T {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined || !deps) {
    const hook: CallbackHook<T> = {
      type: 'callback',
      callback,
      deps: deps || [],
    };
    hooks[hookIndex] = hook;
  } else {
    const prevHook = hooks[hookIndex] as CallbackHook<T>;
    const hasChanged =
      !deps || deps.some((dep, i) => !Object.is(dep, prevHook.deps[i]));
    if (hasChanged) {
      hooks[hookIndex] = {
        type: 'callback',
        callback,
        deps,
      } as CallbackHook<T>;
    }
  }

  return (hooks[hookIndex] as CallbackHook<T>).callback;
}
