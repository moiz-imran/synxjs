import { reactive, effect } from '@synxjs/reactivity';
import type {
  Store,
  Effect,
  CleanupFn,
  DeepPartial,
  Middleware,
  MiddlewareContext,
} from '@synxjs/types';

export class PulseStore<T extends object> implements Store<T> {
  private pulses: T;
  private initialState: T;
  private middleware: Middleware<T>[] = [];
  private subscribers = new Map<keyof T, Set<Effect>>();

  constructor(initialPulses: T, middleware?: Middleware<T>[]) {
    this.initialState = { ...initialPulses };
    this.pulses = reactive({ ...initialPulses });
    if (middleware) {
      this.middleware = middleware;
    }
  }

  addMiddleware(middleware: Middleware<T>): void {
    this.middleware.push(middleware);
  }

  removeMiddleware(middleware: Middleware<T>): void {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
  }

  private async runMiddleware(
    type: 'onBeforeUpdate' | 'onAfterUpdate',
    context: MiddlewareContext<T>,
  ): Promise<void> {
    for (const m of this.middleware) {
      if (m[type]) {
        await m[type]!(context);
      }
    }
  }

  private async runResetMiddleware(): Promise<void> {
    for (const m of this.middleware) {
      if (m.onReset) {
        await m.onReset(this);
      }
    }
  }

  getPulse<K extends keyof T>(key: K): T[K] {
    return this.pulses[key];
  }

  async setPulse<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    const previousValue = this.pulses[key];
    if (Object.is(previousValue, value)) {
      return; // Skip if value hasn't changed
    }

    const context: MiddlewareContext<T> = {
      store: this,
      key,
      value,
      previousValue,
      timestamp: Date.now(),
    };

    // Run before middleware
    await this.runMiddleware('onBeforeUpdate', context);

    // Update the value
    if (typeof value === 'object' && value !== null) {
      value = reactive(value as object) as T[K];
    }

    this.pulses[key] = value;

    // Notify subscribers
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach((callback) => callback());
    }

    await this.runMiddleware('onAfterUpdate', context);
  }

  getPulses(): T {
    return this.pulses;
  }

  async setPulses(newPulses: DeepPartial<T>): Promise<void> {
    for (const key in newPulses) {
      if (Object.prototype.hasOwnProperty.call(newPulses, key)) {
        await this.setPulse(key as keyof T, newPulses[key] as T[keyof T]);
      }
    }
  }

  async reset(): Promise<void> {
    // Run before middleware
    await this.runResetMiddleware();

    // Create new reactive state from initial state
    const newState = reactive({ ...this.initialState });

    // Notify all subscribers regardless of changes
    for (const [key, subscribers] of this.subscribers) {
      subscribers.forEach(callback => {
        callback();
      });
    }

    // Update the pulses last
    this.pulses = newState;
  }

  subscribe(key: keyof T, callback: Effect): CleanupFn {
    let subscribers = this.subscribers.get(key);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(key, subscribers);
    }

    // Add the callback if it's not already present
    if (!subscribers.has(callback)) {
      subscribers.add(callback);
    }

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  subscribeScoped(
    keys: (keyof T)[],
    callback: (partialState: Partial<T>) => void,
  ): CleanupFn {
    if (keys.length === 0) {
      return () => {};
    }

    // Create a wrapper callback that gets the latest state for all keys
    const wrappedCallback = () => {
      const partialState: Partial<T> = {};
      keys.forEach((key) => {
        partialState[key] = this.getPulse(key);
      });
      callback(partialState);
    };

    // Subscribe to each key with the same wrapped callback
    const cleanupFns = keys.map((key) => this.subscribe(key, wrappedCallback));

    // Run the callback once immediately to get initial state
    wrappedCallback();

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }
}
