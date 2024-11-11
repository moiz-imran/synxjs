// src/core/hooks.ts

import type {
  CallbackHook,
  Effect,
  EffectHook,
  FunctionalComponentInstance,
  Hook,
  PulseHook,
  Setter,
  StateHook,
  MountHook,
} from './types';
import { scheduleUpdate } from './scheduler';
import { PulseStore } from './store';

/**
 * Hook Stack to manage the rendering context.
 */
let hookStack: FunctionalComponentInstance[] = [];

/**
 * Effects Array to store effects per functional component instance
 */
const effects: Effect[] = [];

/**
 * Sets the current functional component by pushing it onto the stack.
 * @param component - The functional component instance being rendered.
 */
export function setCurrentComponent(component: FunctionalComponentInstance): void {
  // Check if the instance is already in the stack
  const existingIndex = hookStack.findIndex((comp) => comp === component);
  if (existingIndex !== -1) {
    // If it exists, remove it and everything after it
    hookStack = hookStack.slice(0, existingIndex);
  }
  hookStack.push(component);
}

/**
 * Resets the current functional component by popping it off the stack.
 */
export function resetCurrentComponent(): void {
  if (hookStack.length > 0) {
    hookStack.pop();
  }
}

/**
 * Retrieves the current functional component from the top of the stack.
 * @returns The current functional component instance.
 */
function getCurrentComponent(): FunctionalComponentInstance {
  if (hookStack.length === 0) {
    throw new Error('No component is currently being rendered.');
  }
  return hookStack[hookStack.length - 1];
}

/**
 * Resets the hooks index for the current functional component before each render.
 */
export function resetHooks(): void {
  const current = getCurrentComponent();
  if (current) {
    current.currentHook = 0;
  }
}

export function resetHookStack(): void {
  hookStack = [];
}

/**
 * useState Hook
 * @param initialValue - The initial state value.
 * @returns A tuple containing the current state and a setter function.
 */
export function useState<T>(initialValue: T): [T, Setter<T>] {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const hook: StateHook<T> = {
      type: 'state',
      value: initialValue,
      setValue: null!, // Will be set below
    };
    hooks[hookIndex] = hook as Hook;
  }

  const hook = hooks[hookIndex] as StateHook<T>;

  if (!hook.setValue) {
    hook.setValue = (newValue: T | ((prev: T) => T)) => {
      const valueToSet = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(hook.value)
        : newValue;

      hook.value = valueToSet;
      scheduleUpdate(component);
    };
  }

  return [hook.value, hook.setValue];
}

/**
 * useEffect Hook
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect. Pass [] for mount-only effect.
 */
export function useEffect(effect: Effect, deps?: unknown[]): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  const prevHook = hooks[hookIndex] as EffectHook | undefined;

  // On mount or when deps change
  const hasChanged = !prevHook ||
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
    effects.push(() => {
      hook.cleanup = effect();
    });
  }
}

/**
 * useMount Hook - Runs callback exactly once when component mounts
 * @param callback - The callback to execute on mount
 */
export function useMount(callback: () => void): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const hook: MountHook = {
      type: 'mount',
      hasRun: false,
    };
    hooks[hookIndex] = hook;

    // Run immediately on mount
    callback();
    hook.hasRun = true;
  }
}

/**
 * Runs all pending effects.
 */
export function runEffects(): void {
  effects.forEach((effect) => effect());
  effects.length = 0;
}

/**
 * usePulse Hook
 * @param selector - The key of the pulse property to subscribe to.
 * @param context - The PulseStore context.
 * @returns A tuple containing the current value and a setter function.
 */
export function usePulse<K extends keyof T, T extends Record<string, unknown>>(
  selector: K,
  store: PulseStore<T>,
): [T[K], Setter<T[K]>] {
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
    const hasChanged = !deps || deps.some((dep, i) => !Object.is(dep, prevHook.deps[i]));
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
