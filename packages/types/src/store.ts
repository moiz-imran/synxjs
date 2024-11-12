import { Effect, CleanupFn } from './hooks';
import { DeepPartial } from './base';

export interface Subscribable<T> {
  subscribe(key: keyof T, callback: Effect): CleanupFn;
}

export interface Store<T extends object> extends Subscribable<T> {
  getPulse<K extends keyof T>(key: K): T[K];
  setPulse<K extends keyof T>(key: K, value: T[K]): void;
  getPulses(): T;
  setPulses(newPulses: DeepPartial<T>): void;
  reset(): void;
}
