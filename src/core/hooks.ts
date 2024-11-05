// src/core/hooks.ts

import { effect } from './reactive';
import { store } from '../store';
import { renderApp } from './renderer';

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
 * Custom hook to manage local component state.
 * @template S - The type of the state.
 * @param initialState - The initial state value or a function returning the initial state.
 * @returns A tuple containing the current state and a setter function.
 */
export function useState<S>(initialState: S | (() => S)): [S, SetState<S>] {
  const hookIndex = currentHook++;
  if (!hooks[hookIndex]) {
    hooks[hookIndex] = {
      state:
        typeof initialState === 'function'
          ? (initialState as () => S)()
          : initialState,
    };
  }

  const setState: SetState<S> = (action) => {
    const currentState = hooks[hookIndex].state;
    hooks[hookIndex].state =
      typeof action === 'function'
        ? (action as (prev: S) => S)(currentState)
        : action;
    // Trigger a re-render
    const root = document.getElementById('root');
    if (root && typeof (root as any).__appRender === 'function') {
      (root as any).__appRender();
    }
  };

  return [hooks[hookIndex].state, setState];
}

/**
 * Custom hook to handle side effects.
 * @param callback - The effect function to execute.
 * @param deps - The dependency array to control when the effect runs.
 */
export function useEffect(
  callback: () => (() => void) | void,
  deps: any[] | undefined,
): void {
  const hookIndex = currentHook++;
  if (!hooks[hookIndex]) {
    hooks[hookIndex] = {
      deps: deps ? [...deps] : undefined,
      cleanup: undefined,
    };
    // Register the effect
    hooks[hookIndex].cleanup = effect(() => {
      const hasChanged = !deps
        ? true
        : deps.some((dep, i) => !Object.is(dep, hooks[hookIndex].deps[i]));
      if (hasChanged) {
        if (hooks[hookIndex].cleanup) {
          hooks[hookIndex].cleanup();
        }
        const cleanup = callback();
        if (typeof cleanup === 'function') {
          hooks[hookIndex].cleanup = cleanup;
        }
        if (deps) {
          hooks[hookIndex].deps = [...deps];
        }
      }
    });
  }
}

/**
 * useStore Hook
 *
 * @template K - The key of the store to select.
 * @param selector - The key of the store property to subscribe to.
 * @returns A tuple containing the current value and a setter function.
 */
export function useStore<K extends keyof typeof store>(
  selector: K,
): [(typeof store)[K], Setter<(typeof store)[K]>] {
  const hookIndex = currentHook++;

  if (!hooks[hookIndex]) {
    // Initialize hook state with the current store value
    hooks[hookIndex] = {
      value: store[selector],
      cleanup: undefined,
    };

    // Set up reactive effect
    hooks[hookIndex].cleanup = effect(() => {
      const newValue = store[selector];
      if (!Object.is(newValue, hooks[hookIndex].value)) {
        hooks[hookIndex].value = newValue;
        // Trigger a re-render
        const root = document.getElementById('root');
        if (root && typeof (root as any).__appRender === 'function') {
          (root as any).__appRender();
        }
      }
    });
  }

  // Define the setter function
  const setValue: Setter<(typeof store)[K]> = (newValue) => {
    if (typeof newValue === 'function') {
      // If newValue is a function, call it with the current value
      const updater = newValue as (prev: (typeof store)[K]) => (typeof store)[K];
      store[selector] = updater(store[selector]);
    } else {
      // If newValue is a direct value, assign it to the store
      store[selector] = newValue;
    }
  };

  return [hooks[hookIndex].value, setValue];
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
