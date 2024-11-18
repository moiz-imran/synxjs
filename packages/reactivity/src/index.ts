import type { Effect } from '@synxjs/types';

let activeEffect: Effect | null = null;

// Maps to track dependencies between pulse properties and effects
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();

// Track which dependencies an effect is subscribed to for cleanup
const effectDependencies = new WeakMap<
  Effect,
  Set<[object, string | symbol]>
>();

/**
 * Creates a reactive proxy of the given target object.
 * @param target - The object to make reactive.
 * @returns A reactive proxy of the target object.
 */
export function reactive<T extends object>(target: T): T {
  // Need to recursively make nested objects reactive
  const handler: ProxyHandler<T> = {
    get(target: T, key: string | symbol): unknown {
      const value = target[key as keyof T];

      // Make nested objects reactive
      if (typeof value === 'object' && value !== null) {
        return reactive(value as object);
      }

      track(target, key);
      return value;
    },
    set(target: T, key: string | symbol, value: unknown): boolean {
      const oldValue = target[key as keyof T];

      // If setting a new object, make it reactive first
      if (typeof value === "object" && value !== null) {
        value = reactive(value as object);
      }

      const result = Reflect.set(target, key, value);

      // Only trigger if value actually changed
      if (oldValue !== value) {
        trigger(target, key);

        // If we're replacing an object, we need to re-run effects
        // that depend on any of its properties
        if (typeof oldValue === "object" && oldValue !== null) {
          const depsMap = targetMap.get(oldValue);
          if (depsMap) {
            depsMap.forEach((effects) => {
              effects.forEach((effect) => effect());
            });
          }
        }
      }
      return result;
    },
  };

  return new Proxy(target, handler);
}

/**
 * Tracks dependencies between pulse properties and effects.
 * @param target - The reactive object.
 * @param key - The property key being accessed.
 */
function track(target: object, key: string | symbol): void {
  if (activeEffect) {
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
    const effects = new Set(dep);
    effects.forEach((effect) => effect());
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
  targetMap
};
