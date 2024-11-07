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
const hookStack: FunctionalComponentInstance[] = [];

/**
 * Hook Map to store hooks per functional component instance.
 */
const hookMap: WeakMap<FunctionalComponentInstance, any[]> = new WeakMap();

/**
 * Sets the current functional component by pushing it onto the stack.
 * @param component - The functional component instance being rendered.
 */
export function setCurrentComponent(component: FunctionalComponentInstance) {
  hookStack.push(component);
  if (!hookMap.has(component)) {
    hookMap.set(component, []);
  }
  console.log(
    `setCurrentComponent: Pushed component ${
      typeof component.vnode?.type === 'string'
        ? component.vnode
        : component.vnode?.type.name || 'Anonymous Functional Component'
    } to hook stack.`,
  );
}

/**
 * Resets the current functional component by popping it off the stack.
 */
export function resetCurrentComponent() {
  const popped = hookStack.pop();
  console.log(
    `resetCurrentComponent: Popped component ${
      typeof popped?.vnode?.type === 'string'
        ? popped?.vnode
        : popped?.vnode?.type.name || 'Anonymous Functional Component'
    } from hook stack.`,
  );
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
        ? current.vnode
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
  current.currentHook = 0;
  console.log(
    `resetHooks: Resetting hooks for component ${
      typeof current.vnode?.type === 'string'
        ? current.vnode
        : current.vnode?.type.name || 'Anonymous Functional Component'
    }`,
  );
}

/**
 * useState Hook
 * @param initialValue - The initial state value.
 * @returns A tuple containing the current state and a setter function.
 */
export function useState<T>(initialValue: T): [T, Setter<T>] {
  const component = getCurrentComponent();
  const hooks = hookMap.get(component)!;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = initialValue;
    console.log(
      `useState: Initialized hook at index ${hookIndex} with value`,
      initialValue,
    );
  }

  const setState: Setter<T> = (newValue) => {
    const valueToSet =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(hooks[hookIndex])
        : newValue;
    hooks[hookIndex] = valueToSet;
    console.log(
      `useState: Updating hook at index ${hookIndex} to value`,
      valueToSet,
    );
    const newVNode = component.render(); // Trigger re-render and get new VNode
    scheduleUpdate(component, newVNode); // Update the DOM
  };

  return [hooks[hookIndex], setState];
}

/**
 * useEffect Hook
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect.
 */
export function useEffect(
  effect: () => void | (() => void),
  deps?: any[],
): void {
  const component = getCurrentComponent();
  const hooks = hookMap.get(component)!;
  const hookIndex = component.currentHook++;

  const oldHook = hooks[hookIndex];
  const hasChanged =
    !oldHook || !deps || deps.some((dep, i) => dep !== oldHook.deps[i]);

  if (hasChanged) {
    if (oldHook && oldHook.cleanup) {
      console.log(`useEffect: Cleaning up hook at index ${hookIndex}`);
      oldHook.cleanup();
    }

    console.log(`useEffect: Executing effect for hook at index ${hookIndex}`);
    const cleanup = effect();
    hooks[hookIndex] = { deps, cleanup };
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
  // Initialize local state with the current pulse value
  const [value, setValue] = useState<T[K]>(store.getPulses()[selector]);

  useEffect(() => {
    // Define a listener that updates the local state if the relevant pulse changes
    const handleChange = (changedKeys: Set<K>) => {
      if (changedKeys.has(selector)) {
        console.log(
          `usePulse: Detected change in '${String(selector)}', updating state.`,
        );
        setValue(store.getPulses()[selector]);
      }
    };

    // Subscribe to PulseStore changes
    const unsubscribe = store.subscribe(selector, handleChange);
    console.log(`usePulse: Subscribed to changes in '${String(selector)}'`);

    // Cleanup on unmount
    return () => {
      console.log(
        `usePulse: Unsubscribing from changes in '${String(selector)}'`,
      );
      unsubscribe();
    };
  }, [selector]);

  // Setter function to update the pulse
  const setter: Setter<T[K]> = (newValue) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T[K]) => T[K];
      store.setPulses({
        [selector]: updater(store.getPulses()[selector]),
      } as Pick<T, K>);
    } else {
      store.setPulses({ [selector]: newValue } as Pick<T, K>);
    }
  };

  return [value, setter];
}
