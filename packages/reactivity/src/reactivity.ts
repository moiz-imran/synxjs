import type { Effect } from '@synxjs/types';

let activeEffect: Effect | null = null;

// Maps to track dependencies between pulse properties and effects
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();

// Track which dependencies an effect is subscribed to for cleanup
const effectDependencies = new WeakMap<
  Effect,
  Set<[object, string | symbol]>
>();

// Cache for already-created reactive objects
const reactiveMap = new WeakMap<object, object>();

// Track parent-child relationships
const parentMap = new WeakMap<object, object>();

/**
 * Creates a reactive proxy of the given target object.
 * @param target - The object to make reactive.
 * @returns A reactive proxy of the target object.
 */
export function reactive<T extends object>(target: T): T {
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy as T;
  }

  const handler: ProxyHandler<T> = {
    get(target: T, key: string | symbol, receiver: any): unknown {
      const result = Reflect.get(target, key, receiver);

      // Track access
      if (activeEffect) {
        track(target, key);

        // For arrays, track length when accessing array methods
        if (Array.isArray(target) && typeof result === 'function') {
          const method = key as string;
          if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(method)) {
            // Return a wrapped method that triggers length updates
            return function (...args: any[]) {
              const result = Reflect.apply(
                target[method as keyof T],
                target,
                args,
              );
              trigger(target, 'length');
              return result;
            };
          }
        }
      }

      // Handle nested objects
      if (typeof result === 'object' && result !== null) {
        return reactive(result as object);
      }

      return result;
    },
    set(
      target: T,
      key: string | symbol,
      value: unknown,
      receiver: any,
    ): boolean {
      const oldValue = target[key as keyof T];
      const result = Reflect.set(target, key, value, receiver);

      if (oldValue !== value) {
        trigger(target, key);

        // For arrays, trigger length changes and the array itself
        if (Array.isArray(target)) {
          if (key === 'length') {
            trigger(target, 'length');
          } else {
            // When setting an index, also trigger the array itself
            trigger(target, 'length');
          }
        }
      }
      return result;
    },
  };

  const proxy = new Proxy(target, handler);
  reactiveMap.set(target, proxy);
  return proxy;
}

/**
 * Tracks dependencies between pulse properties and effects.
 * @param target - The reactive object.
 * @param key - The property key being accessed.
 */
function track(target: object, key: string | symbol): void {
  // Skip tracking if no active effect
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map<string | symbol, Set<Effect>>();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set<Effect>();
    depsMap.set(key, dep);
  }

  // Only add if not already tracked
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);

    let effectDeps = effectDependencies.get(activeEffect);
    if (!effectDeps) {
      effectDeps = new Set();
      effectDependencies.set(activeEffect, effectDeps);
    }
    effectDeps.add([target, key]);
  }
}

/**
 * Triggers effects associated with a particular pulse property.
 * @param target - The reactive object.
 * @param key - The property key being modified.
 */
function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    // Create a new set to avoid infinite loops
    const effects = new Set(dep);
    effects.forEach((effect) => {
      // Don't trigger if it's the current active effect
      if (effect !== activeEffect) {
        effect();
      }
    });
  }
}

/**
 * Removes an effect from all its tracked dependencies.
 */
function cleanupEffect(effect: Effect): void {
  const deps = effectDependencies.get(effect);
  if (!deps) return;

  // Remove effect from all dependencies
  deps.forEach(([target, key]) => {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    dep.delete(effect);

    // Cleanup empty sets
    if (dep.size === 0) {
      depsMap.delete(key);
    }
    if (depsMap.size === 0) {
      targetMap.delete(target);
    }
  });

  // Clear effect dependencies
  effectDependencies.delete(effect);
}

/**
 * Registers an effect (side-effect function) that depends on reactive pulses.
 * @param eff - The effect function to register.
 * @returns A cleanup function to remove the effect.
 */
export function effect(eff: Effect): () => void {
  const wrappedEffect = () => {
    cleanupEffect(wrappedEffect);
    activeEffect = wrappedEffect;
    eff();
    activeEffect = null;
  };

  wrappedEffect(); // Run immediately to set up initial dependencies

  return () => {
    cleanupEffect(wrappedEffect);
  };
}

export const _testing = {
  effectDependencies,
  targetMap,
};
