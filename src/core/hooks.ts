// src/core/hooks.ts

import { effect } from './reactive';
import { PulseStore } from './store';

/**
 * Represents a setter function for state updates.
 */
type SetStateAction<S> = S | ((prevState: S) => S);
type SetState<S> = (action: SetStateAction<S>) => void;
type Setter<T> = (newValue: T | ((prev: T) => T)) => void;

/**
 * Internal storage for hooks to maintain state across renders.
 */
const hooks: Array<any> = [];
let currentHook = 0;

/**
 * Resets the hook index before each render.
 */
export function resetHooks() {
  currentHook = 0;
}

/**
 * Processes all hooks after rendering.
 */
export function runHooks() {
  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    if (hook && typeof hook.cleanup === 'function') {
      hook.cleanup();
    }
  }
}

/**
 * useState Hook
 *
 * @template T - The type of the state.
 * @param initialValue - The initial state value.
 * @returns A tuple containing the current state and a setter function.
 */
export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  const hookIndex = currentHook++;

  // Initialize state if it doesn't exist
  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = initialValue;
  }

  /**
   * Setter function to update the state.
   * Triggers a re-render of the root component.
   *
   * @param newValue - The new state value.
   */
  const setState = (newValue: T) => {
    hooks[hookIndex] = newValue;
    // Trigger a re-render
    const root = document.getElementById('root');
    if (root && typeof (root as any).__appRender === 'function') {
      (root as any).__appRender();
    }
  };

  return [hooks[hookIndex], setState];
}

/**
 * useEffect Hook
 *
 * @param effect - The effect callback to execute.
 * @param deps - An array of dependencies for the effect.
 */
export function useEffect(
  effect: () => void | (() => void),
  deps?: any[],
): void {
  const hookIndex = currentHook++;

  const oldDeps = hooks[hookIndex]?.deps;
  const hasChanged =
    !oldDeps || !deps || deps.some((dep, i) => dep !== oldDeps[i]);

  if (hasChanged) {
    // If there's a previous cleanup, call it
    if (hooks[hookIndex]?.cleanup) {
      hooks[hookIndex].cleanup();
    }

    // Execute the effect and store the cleanup if provided
    const cleanup = effect();
    hooks[hookIndex] = { deps, cleanup };
  }
}

/**
 * usePulse Hook
 *
 * @template K - The key of the pulse to select.
 * @template T - The type of the PulseStore's state.
 * @param selector - The key of the pulse property to subscribe to.
 * @param store - The PulseStore instance to interact with.
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
    const handleChange = (changedKeys: Set<string | symbol>) => {
      if (changedKeys.has(selector.toString())) {
        setValue(store.getPulses()[selector]);
      }
    };

    // Subscribe to PulseStore changes
    const unsubscribe = store.subscribe(handleChange);

    // Cleanup on unmount
    return () => {
      // unsubscribe();
    };
  }, [selector, store]);

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

/**
 * Optional: Custom hook to memoize expensive computations.
 * @template T - The type of the memoized value.
 * @param factory - The function that computes the value.
 * @param deps - The dependency array.
 * @returns The memoized value.
 */
export function useMemo<T>(factory: () => T, deps: any[] | undefined): T {
  const hookIndex = currentHook++;
  if (!hooks[hookIndex]) {
    hooks[hookIndex] = {
      deps: deps ? [...deps] : undefined,
      value: factory(),
    };
  } else {
    const hasChanged = !deps
      ? true
      : deps.some((dep, i) => !Object.is(dep, hooks[hookIndex].deps[i]));
    if (hasChanged) {
      hooks[hookIndex].value = factory();
      if (deps) {
        hooks[hookIndex].deps = [...deps];
      }
    }
  }
  return hooks[hookIndex].value;
}

/**
 * Optional: Custom hook to memoize callback functions.
 * @template F - The type of the callback function.
 * @param callback - The callback function to memoize.
 * @param deps - The dependency array.
 * @returns The memoized callback function.
 */
export function useCallback<F extends (...args: any[]) => any>(
  callback: F,
  deps: any[] | undefined,
): F {
  const hookIndex = currentHook++;
  if (!hooks[hookIndex]) {
    hooks[hookIndex] = {
      deps: deps ? [...deps] : undefined,
      callback,
    };
  } else {
    const hasChanged = !deps
      ? true
      : deps.some((dep, i) => !Object.is(dep, hooks[hookIndex].deps[i]));
    if (hasChanged) {
      hooks[hookIndex].callback = callback;
      if (deps) {
        hooks[hookIndex].deps = [...deps];
      }
    }
  }
  return hooks[hookIndex].callback;
}
