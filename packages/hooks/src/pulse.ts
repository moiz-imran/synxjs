import type { Effect, PulseHook, Setter, EffectHook } from '@synxjs/types';
import { PulseStore } from '@synxjs/store';
import { getCurrentComponent } from '@synxjs/runtime';
import { effect as reactiveEffect } from '@synxjs/reactivity';
import { scheduleUpdate } from '@synxjs/vdom';
import { useCallback } from './callback';

/**
 * usePulseState Hook
 * @param selector - The key of the pulse property to subscribe to.
 * @param context - The PulseStore context.
 * @returns A tuple containing the current value and a setter function.
 */
export function usePulseState<
  K extends keyof T,
  T extends Record<string, unknown>,
>(selector: K, store: PulseStore<T>): [T[K], Setter<T[K]>] {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const initialValue = store.getPulse(selector);
    const hook: PulseHook<T[K]> = {
      type: 'pulse',
      value: initialValue,
    };

    hook.unsubscribe = store.subscribe(selector, () => {
      const newValue = store.getPulse(selector);
      if (!Object.is(hook.value, newValue)) {
        hook.value = newValue;
        scheduleUpdate(component);
      }
    });

    hooks[hookIndex] = hook;
  }

  const hook = hooks[hookIndex] as PulseHook<T[K]>;

  const setter: Setter<T[K]> = useCallback(
    (newValue: T[K] | ((prev: T[K]) => T[K])) => {
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: T[K]) => T[K];
        store.setPulse(selector, updater(store.getPulse(selector)));
      } else {
        store.setPulse(selector, newValue);
      }
    },
    [selector],
  );

  return [hook.value, setter];
}

/**
 * usePulseEffect Hook - Runs effect whenever any pulse accessed within it changes
 * @param effect - The effect callback to execute
 */
export function usePulseEffect(effect: Effect): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const hook: EffectHook = {
      type: 'effect',
      effect,
      deps: undefined,
      cleanup: undefined,
    };
    hooks[hookIndex] = hook;
  }

  const hook = hooks[hookIndex] as EffectHook;

  // Clean up previous effect if it exists
  if (hook.cleanup) {
    hook.cleanup();
    hook.cleanup = undefined;
  }

  // Register new effect and store its cleanup function
  hook.cleanup = reactiveEffect(() => {
    const result = effect();
    if (result) {
      return result;
    }
  });
}
