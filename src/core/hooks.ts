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

/**
 * useEffect Hook
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect.
 */
export function useEffect(effect: Effect, deps?: any[]): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  const prevDeps = hooks[hookIndex];
  const hasChanged = !prevDeps ||
    !deps ||
    deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

  if (hasChanged) {
    hooks[hookIndex] = deps;
    effects.push(effect);
  }
}

/**
 * Runs all pending effects.
 */
export function runEffects(): void {
  effects.forEach(effect => {
    const cleanup = effect();
    if (typeof cleanup === 'function') {
      // Store cleanup function for future use
      // This could be enhanced to actually handle cleanup
    }
  });
  effects.length = 0;
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

  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = store.getPulse(selector);

    store.subscribe(selector, () => {
      const newValue = store.getPulse(selector);
      if (!Object.is(hooks[hookIndex], newValue)) {
        hooks[hookIndex] = newValue;
        scheduleUpdate(component);
      }
    });
  }

  const setter: Setter<T[K]> = (newValue) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T[K]) => T[K];
      store.setPulse(selector, updater(store.getPulse(selector)));
    } else {
      store.setPulse(selector, newValue);
    }
  };

  return [hooks[hookIndex], setter];
}
