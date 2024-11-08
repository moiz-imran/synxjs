// src/core/hooks.ts

import { VNode } from './vdom';
import { scheduleUpdate } from './scheduler';
import { PulseStore } from './store';

type Setter<T> = (newValue: T | ((prev: T) => T)) => void;

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
 * Hook Map to store hooks per functional component instance.
 */
const hookMap: WeakMap<FunctionalComponentInstance, any[]> = new WeakMap();

/**
 * Pulse Subscriptions Map to track subscriptions per component instance
 */
const pulseSubscriptions = new WeakMap<
  FunctionalComponentInstance,
  Map<string, () => void>
>();

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
  if (!hookMap.has(component)) {
    hookMap.set(component, []);
  }
  console.log(
    `setCurrentComponent: Pushed component ${
      typeof component.vnode?.type === 'string'
        ? component.vnode.type
        : component.vnode?.type.name || 'Anonymous Functional Component'
    } to hook stack.`,
  );
}

/**
 * Resets the current functional component by popping it off the stack.
 */
export function resetCurrentComponent() {
  if (hookStack.length > 0) {
    const popped = hookStack.pop();
    console.log(
      `resetCurrentComponent: Popped component ${
        typeof popped?.vnode?.type === 'string'
          ? popped?.vnode.type
          : popped?.vnode?.type.name || 'Anonymous Functional Component'
      } from hook stack.`,
    );
  }
}

/**
 * Retrieves the current functional component from the top of the stack.
 * @returns The current functional component instance.
 */
function getCurrentComponent(): FunctionalComponentInstance {
  if (hookStack.length === 0) {
    console.error(
      'Hook stack is empty. No functional component is currently being rendered.',
    );
    throw new Error('No component is currently being rendered.');
  }
  const current = hookStack[hookStack.length - 1];
  console.log(
    `getCurrentComponent: Current component is ${
      typeof current.vnode?.type === 'string'
        ? current.vnode.type
        : current.vnode?.type.name || 'Anonymous Functional Component'
    }`,
  );
  return current;
}

/**
 * Resets the hooks index for the current functional component before each render.
 */
export function resetHooks() {
  const current = getCurrentComponent();
  if (current) {
    current.currentHook = 0;
    console.log(
      `resetHooks: Resetting hooks for component ${
        typeof current.vnode?.type === 'string'
          ? current.vnode.type
          : current.vnode?.type.name || 'Anonymous Functional Component'
      }`,
    );
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
    console.log(
      `[useState] Initialized hook at index ${hookIndex} with value:`,
      initialValue,
    );
  }

  const setState: Setter<T> = (newValue) => {
    const valueToSet =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(hooks[hookIndex])
        : newValue;

    console.log(
      `[useState] Updating hook at index ${hookIndex} to value:`,
      valueToSet,
    );
    hooks[hookIndex] = valueToSet;
    const newVNode = component.render(); // Trigger re-render and get new VNode
    scheduleUpdate(component, newVNode); // Update the DOM
  };

  return [hooks[hookIndex], setState];
}

type Effect = () => void | (() => void);
const effects: Effect[] = [];

/**
 * useEffect Hook
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect.
 */
export function useEffect(effect: Effect, deps?: any[]) {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  const prevDeps = hooks[hookIndex];
  let hasChanged = true;

  if (prevDeps) {
    hasChanged = deps?.some((dep, i) => !Object.is(dep, prevDeps[i])) ?? true;
  }

  if (hasChanged) {
    hooks[hookIndex] = deps;
    effects.push(effect);
  }
}

/**
 * Runs all pending effects.
 */
export function runEffects() {
  while (effects.length > 0) {
    const effect = effects.shift();
    if (effect) effect();
  }
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
  console.log(
    '[usePulse] Component:',
    typeof component.vnode?.type === 'string'
      ? component.vnode.type
      : (component.vnode?.type as any)?.name || 'Anonymous Component',
    'Current value:',
    store.getPulse(selector),
  );

  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  // Initialize subscriptions map for this component if it doesn't exist
  if (!pulseSubscriptions.has(component)) {
    pulseSubscriptions.set(component, new Map());
  }
  const subscriptions = pulseSubscriptions.get(component)!;

  // Initialize hook value if not already set
  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = store.getPulse(selector);

    // Clean up old subscription if it exists
    const oldSubscription = subscriptions.get(String(selector));
    if (oldSubscription) {
      store.unsubscribe(selector, oldSubscription);
    }

    // Create new subscription with immediate update check
    const subscription = () => {
      const newValue = store.getPulse(selector);
      console.log('[usePulse:subscription] Value changed:', {
        component:
          typeof component.vnode?.type === 'string'
            ? component.vnode.type
            : (component.vnode?.type as any)?.name || 'Anonymous Component',
        selector,
        oldValue: hooks[hookIndex],
        newValue,
      });

      if (!Object.is(hooks[hookIndex], newValue)) {
        hooks[hookIndex] = newValue;
        console.log(
          '[usePulse:subscription] Scheduling update for',
          typeof component.vnode?.type === 'string'
            ? component.vnode.type
            : (component.vnode?.type as any)?.name || 'Anonymous Component',
        );
        scheduleUpdate(component, component.vnode);
      }
    };

    store.subscribe(selector, subscription);
    subscriptions.set(String(selector), subscription);

    console.log(
      `[usePulse] Set up subscription for "${String(selector)}" in ${
        typeof component.vnode?.type === 'string'
          ? component.vnode.type
          : component.vnode?.type.name || 'Anonymous Component'
      }`,
    );
  }

  const setter: Setter<T[K]> = (newValue) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T[K]) => T[K];
      store.setPulse(selector, updater(store.getPulse(selector) as T[K]));
    } else {
      store.setPulse(selector, newValue);
    }
  };

  return [hooks[hookIndex], setter];
}
