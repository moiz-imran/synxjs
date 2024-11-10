// src/core/hooks.ts

import { VNode } from './vdom';
import { scheduleUpdate } from './scheduler';
import { PulseStore } from './store';

type Setter<T> = (newValue: T | ((prev: T) => T)) => void;
type Effect = () => void | (() => void);

/**
 * Represents a functional component instance.
 */
export interface FunctionalComponentInstance {
  hooks: any[];
  currentHook: number;
  vnode: VNode | null;
  render: () => VNode | number | string | null;
  dom: HTMLElement | Text | null; // Reference to the actual DOM node
}

/**
 * Hook Stack to manage the rendering context.
 */
let hookStack: FunctionalComponentInstance[] = [];

/**
 * Pulse Subscriptions Map to track subscriptions per component instance
 */
const pulseSubscriptions = new WeakMap<
  FunctionalComponentInstance,
  Map<string, () => void>
>();

/**
 * Effects Array to store effects per functional component instance
 */
const effects: Effect[] = [];

/**
 * Sets the current functional component by pushing it onto the stack.
 * @param component - The functional component instance being rendered.
 */
export function setCurrentComponent(component: FunctionalComponentInstance) {
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
export function resetCurrentComponent() {
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
export function resetHooks() {
  const current = getCurrentComponent();
  if (current) {
    current.currentHook = 0;
  }
}

export function resetHookStack() {
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
    hooks[hookIndex] = initialValue;
  }

  const setState: Setter<T> = (newValue) => {
    const valueToSet =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(hooks[hookIndex])
        : newValue;

    hooks[hookIndex] = valueToSet;
    scheduleUpdate(component);
  };

  return [hooks[hookIndex], setState];
}

interface EffectHook {
  cleanup: (() => void) | void;
  effect: Effect;
  deps?: any[];
}

/**
 * useEffect Hook
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect.
 */
export function useEffect(effect: Effect, deps?: any[]): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  const prevHook = hooks[hookIndex] as EffectHook | undefined;
  const hasChanged = !prevHook?.deps ||
    !deps ||
    deps.some((dep, i) => !Object.is(dep, prevHook.deps?.[i]));

  if (hasChanged) {
    // Run cleanup from previous effect if it exists
    if (prevHook?.cleanup) {
      prevHook.cleanup();
    }

    const hook: EffectHook = {
      effect,
      deps,
      cleanup: undefined
    };

    hooks[hookIndex] = hook;
    effects.push(() => {
      // Run effect and store its cleanup
      hook.cleanup = effect();
    });
  }
}

/**
 * Runs all pending effects.
 */
export function runEffects(): void {
  effects.forEach(effect => effect());
  effects.length = 0;
}

interface PulseHook<T> {
  value: T;
  unsubscribe?: () => void;
}

/**
 * usePulse Hook
 * @param selector - The key of the pulse property to subscribe to.
 * @param context - The PulseStore context.
 * @returns A tuple containing the current value and a setter function.
 */
export function usePulse<K extends keyof T, T extends Record<string, any>>(
  selector: K,
  store: PulseStore<T>,
): [T[K], Setter<T[K]>] {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  // Initialize the hook if it doesn't exist
  if (hooks[hookIndex] === undefined) {
    const initialValue = store.getPulse(selector);
    const hook: PulseHook<T[K]> = {
      value: initialValue,
    };

    // Set up subscription only once during initialization
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

  const setter: Setter<T[K]> = useCallback((newValue) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T[K]) => T[K];
      store.setPulse(selector, updater(store.getPulse(selector)));
    } else {
      store.setPulse(selector, newValue);
    }
  }, [selector]);

  return [hook.value, setter];
}

/**
 * useCallback Hook
 * @param callback - The callback function to memoize.
 * @param deps - An array of dependencies for the callback.
 * @returns The memoized callback function.
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps?: any[]
): T {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined || !deps) {
    hooks[hookIndex] = {
      callback,
      deps
    };
  } else {
    const prevHook = hooks[hookIndex];
    const hasChanged = !deps || deps.some((dep, i) => !Object.is(dep, prevHook.deps[i]));
    if (hasChanged) {
      hooks[hookIndex] = {
        callback,
        deps
      };
    }
  }

  return hooks[hookIndex].callback;
}
