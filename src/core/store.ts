// src/core/PulseStore.ts

import { reactive } from './reactive';

type Listener<K extends keyof T, T extends Record<string, any>> = (
  changedKeys: Set<K>,
) => void;

/**
 * PulseStore manages a collection of pulses within the Nova system.
 */
export class PulseStore<T extends Record<string, any>> {
  private pulses: T;
  private listeners: Map<keyof T, Set<(changedKeys: Set<keyof T>) => void>> =
    new Map();

  /**
   * Initializes the PulseStore with the provided initial pulses.
   * @param initialPulses - The initial state of pulses.
   */
  constructor(initialPulses: T) {
    // Make pulses reactive
    this.pulses = reactive(initialPulses);
    Object.keys(initialPulses).forEach((key) => {
      this.listeners.set(key as keyof T, new Set());
    });
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
  subscribe<K extends keyof T>(
    key: K,
    listener: (changedKeys: Set<K>) => void,
  ): () => void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.add(listener as (changedKeys: Set<keyof T>) => void);
    }
    return () => {
      if (listeners) {
        listeners.delete(listener as (changedKeys: Set<keyof T>) => void);
      }
    };
  }

  /**
   * Notifies all subscribed listeners about pulse changes.
   * @param changedKeys - The set of keys that have changed.
   */
  private notify(changedKeys: Set<keyof T>) {
    // Batch notifications
    queueMicrotask(() => {
      const notifiedListeners = new Set();
      changedKeys.forEach((key) => {
        const listeners = this.listeners.get(key);
        if (listeners) {
          listeners.forEach((listener) => {
            if (!notifiedListeners.has(listener)) {
              listener(changedKeys);
              notifiedListeners.add(listener);
            }
          });
        }
      });
    });
  }
}
