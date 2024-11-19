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

/**
 * Creates a reactive proxy of the given target object.
 * @param target - The object to make reactive.
 * @returns A reactive proxy of the target object.
 */
export function reactive<T extends object>(target: T): T {
  // Return cached version if it exists
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy as T;
  }

  const handler: ProxyHandler<T> = {
    get(target: T, key: string | symbol): unknown {
      const value = target[key as keyof T];

      // Only track if there's an active effect
      if (activeEffect) {
        track(target, key);
      }

      // Transform to reactive if needed
      return typeof value === 'object' && value !== null
        ? reactive(value as object)
        : value;
    },
    set(target: T, key: string | symbol, value: unknown): boolean {
      const oldValue = target[key as keyof T];

      // Make new value reactive if needed
      if (typeof value === 'object' && value !== null) {
        value = reactive(value as object);
      }

      const result = Reflect.set(target, key, value);

      if (oldValue !== value) {
        trigger(target, key);
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
  console.log('[reactivity] track', target, key);
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

  deps.forEach(([target, key]) => {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    dep.delete(effect);

    if (dep.size === 0) {
      depsMap.delete(key);
    }
    if (depsMap.size === 0) {
      targetMap.delete(target);
    }
  });

  effectDependencies.delete(effect);
}

/**
 * Registers an effect (side-effect function) that depends on reactive pulses.
 * @param eff - The effect function to register.
 * @returns A cleanup function to remove the effect.
 */
export function effect(eff: Effect): () => void {
  cleanupEffect(eff);

  activeEffect = eff;
  eff();
  activeEffect = null;

  return () => {
    cleanupEffect(eff);
  };
}

export const _testing = {
  effectDependencies,
  targetMap,
};
