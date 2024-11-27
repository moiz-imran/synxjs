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

  constructor(initialPulses: T, middleware?: Middleware<T>[]) {
    this.initialState = { ...initialPulses };
    this.pulses = reactive(initialPulses);
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
    if (!Object.is(this.pulses[key], value)) {
      this.pulses[key] = value;
    }

    // Run after middleware
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
    await this.runResetMiddleware();
    await this.setPulses(this.initialState);
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
