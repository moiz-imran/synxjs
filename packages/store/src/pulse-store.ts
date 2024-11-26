import { reactive, effect } from '@synxjs/reactivity';
import type { Store, Effect, CleanupFn, DeepPartial } from '@synxjs/types';

export class PulseStore<T extends object> implements Store<T> {
  private pulses: T;
  private initialState: T;

  constructor(initialPulses: T) {
    this.initialState = { ...initialPulses };
    this.pulses = reactive(initialPulses);
  }

  getPulse<K extends keyof T>(key: K): T[K] {
    return this.pulses[key];
  }

  setPulse<K extends keyof T>(key: K, value: T[K]): void {
    if (typeof value === 'object' && value !== null) {
      value = reactive(value as object) as T[K];
    }
    if (!Object.is(this.pulses[key], value)) {
      this.pulses[key] = value;
    }
  }

  getPulses(): T {
    return this.pulses;
  }

  setPulses(newPulses: DeepPartial<T>): void {
    Object.assign(this.pulses, newPulses);
  }

  reset(): void {
    this.setPulses(this.initialState);
  }

  subscribe(key: keyof T, callback: Effect): CleanupFn {
    return effect(() => {
      this.getPulse(key);
      callback();
    });
  }

  subscribeScoped<K extends keyof T>(
    keys: K[],
    callback: (partialState: Pick<T, K>) => void,
  ): CleanupFn {
    if (keys.length === 0) {
      return () => {}; // Return no-op cleanup for empty keys
    }

    // Create a single subscription that watches all keys
    return this.subscribe(keys[0], () => {
      const partialState: Pick<T, K> = {} as Pick<T, K>;
      for (const key of keys) {
        partialState[key] = this.getPulse(key);
      }
      callback(partialState);
    });
  }
}
