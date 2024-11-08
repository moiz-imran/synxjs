// src/core/PulseStore.ts

import { reactive } from './reactive';

/**
 * PulseStore manages a collection of pulses within the Nova system.
 */
export class PulseStore<T extends Record<string, any>> {
  private pulses: T;
  private subscribers: Map<keyof T, Set<() => void>>;

  /**
   * Initializes the PulseStore with the provided initial pulses.
   * @param initialPulses - The initial state of pulses.
   */
  constructor(initialPulses: T) {
    // Make pulses reactive
    this.pulses = reactive(initialPulses);
    this.subscribers = new Map();
  }

  /**
   * Retrieves a single pulse.
   * @param key - The key of the pulse to retrieve.
   * @returns The value of the pulse.
   */
  getPulse(key: keyof T): T[keyof T] {
    return this.pulses[key];
  }

  /**
   * Updates a single pulse.
   * @param key - The key of the pulse to update.
   * @param value - The new value of the pulse.
   */
  setPulse(key: keyof T, value: T[keyof T]): void {
    this.pulses[key] = value;
    this.notify(new Set([key]));
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
    const changedKeys = new Set<K>();

    // Identify changed keys.
    Object.keys(newPulses).forEach((key) => {
      const typedKey = key as K;
      if (this.pulses[typedKey] !== newPulses[typedKey]) {
        changedKeys.add(typedKey);
      }
    });

    // Update pulses.
    Object.assign(this.pulses, newPulses);

    // Notify listeners if there are changes.
    if (changedKeys.size > 0) {
      this.notify(changedKeys);
    }
  }

  /**
   * Subscribes a listener to pulse changes.
   * @param listener - The callback to invoke when pulses change.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(key: keyof T, callback: () => void): void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
  }

  /**
   * Unsubscribes a listener from pulse changes.
   * @param listener - The callback to remove from the listeners.
   */
  unsubscribe(key: keyof T, callback: () => void): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.delete(callback);
    }
  }

  /**
   * Notifies all subscribed listeners about pulse changes.
   * @param changedKeys - The set of keys that have changed.
   */
  private notify(changedKeys: Set<keyof T>) {
    changedKeys.forEach((key) => {
      const listenersForKey = this.subscribers.get(key);
      if (listenersForKey) {
        listenersForKey.forEach((listener) => {
          listener();
        });
      }
    });
  }
}
