// src/core/reactive.ts

type Effect = () => void;

let activeEffect: Effect | null = null;

// Maps to track dependencies between pulse properties and effects
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>();

/**
 * Creates a reactive proxy of the given target object.
 * @param target - The object to make reactive.
 * @returns A reactive proxy of the target object.
 */
export function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj: T, key: string | symbol) {
      track(obj, key);
      return obj[key as keyof T];
    },
    set(obj: T, key: string | symbol, value: any) {
      const result = Reflect.set(obj, key, value);
      trigger(obj, key);
      return result;
    },
  });
}

/**
 * Tracks dependencies between pulse properties and effects.
 * @param target - The reactive object.
 * @param key - The property key being accessed.
 */
function track(target: object, key: string | symbol) {
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
  }
}

/**
 * Triggers effects associated with a particular pulse property.
 * @param target - The reactive object.
 * @param key - The property key being modified.
 */
function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach((effect) => effect());
  }
}

/**
 * Registers an effect (side-effect function) that depends on reactive pulses.
 * @param eff - The effect function to register.
 * @returns A cleanup function to remove the effect.
 */
export function effect(eff: Effect): () => void {
  activeEffect = eff;
  eff(); // Execute the effect initially to establish dependencies
  activeEffect = null;

  return () => {
    // Optional: Implement effect cleanup if needed
    // This can be expanded to remove the effect from all dependencies
  };
}
