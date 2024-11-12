// src/core/PulseStore.ts

import { reactive, effect } from './reactive';
import type { Store, Effect, CleanupFn, DeepPartial } from './types';

/**
 * PulseStore manages a collection of pulses within the SynxJS system.
 */
export class PulseStore<T extends object> implements Store<T> {
  private pulses: T;
  private initialState: T;

  /**
   * Initializes the PulseStore with the provided initial pulses.
   * @param initialPulses - The initial state of pulses.
   */
  constructor(initialPulses: T) {
    this.initialState = { ...initialPulses };
    this.pulses = reactive(initialPulses);
  }

  /**
   * Retrieves a single pulse.
   * @param key - The key of the pulse to retrieve.
   * @returns The value of the pulse.
   */
  getPulse<K extends keyof T>(key: K): T[K] {
    return this.pulses[key];
  }

  /**
   * Updates a single pulse.
   * @param key - The key of the pulse to update.
   * @param value - The new value of the pulse.
   */
  setPulse<K extends keyof T>(key: K, value: T[K]): void {
    this.pulses[key] = value;
  }

  /**
   * Retrieves the current pulses.
   * @returns The current state of pulses.
   */
  getPulses(): T {
    return this.pulses;
  }

  /**
   * Updates the pulses.
   * @param newPulses - Partial pulses to merge with the existing state.
   */
  setPulses(newPulses: DeepPartial<T>): void {
    Object.assign(this.pulses, newPulses);
  }

  /**
   * Resets the pulses to the initial state.
   */
  reset(): void {
    this.setPulses(this.initialState);
  }

  /**
   * Subscribes a listener to pulse changes.
   * @param listener - The callback to invoke when pulses change.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(key: keyof T, callback: Effect): CleanupFn {
    return effect(() => {
      this.getPulse(key);
      callback();
    });
  }
}
