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
    this.pulses[key] = value;
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
}
