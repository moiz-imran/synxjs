// src/core/PulseStore.ts

import { reactive, effect } from './reactive';

type Listener = (changedKeys: Set<string | symbol>) => void;

/**
 * PulseStore manages a collection of pulses within the Nova system.
 */
export class PulseStore<T extends Record<string, any>> {
  private pulses: T;
  private listeners: Listener[] = [];

  /**
   * Initializes the PulseStore with the provided initial pulses.
   * @param initialPulses - The initial state of pulses.
   */
  constructor(initialPulses: T) {
    // Make pulses reactive
    this.pulses = reactive(initialPulses);
  }

  /**
   * Retrieves the current pulses.
   * @returns The current state of pulses.
   */
  getPulses(): T {
    return this.pulses;
  }

  /**
   * Updates the pulses and notifies all listeners of the change.
   * @param newPulses - Partial pulses to merge with the existing state.
   */
  setPulses<K extends keyof T>(newPulses: Pick<T, K>): void {
    Object.assign(this.pulses, newPulses);
    const changedKeys = new Set(Object.keys(newPulses));

    if (changedKeys.size > 0) {
      this.notify(changedKeys);
    }
  }

  /**
   * Subscribes a listener to pulse changes.
   * @param listener - The callback to invoke when pulses change.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notifies all subscribed listeners about pulse changes.
   * @param changedKeys - The set of keys that have changed.
   */
  private notify(changedKeys: Set<string | symbol>): void {
    this.listeners.forEach((listener) => listener(changedKeys));
  }
}
