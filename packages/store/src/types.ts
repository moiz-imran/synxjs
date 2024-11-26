import type { PulseStore } from './pulse-store';

export interface MiddlewareContext<T extends object> {
  store: PulseStore<T>;
  key: keyof T;
  value: T[keyof T];
  previousValue: T[keyof T];
  timestamp: number;
}

export interface Middleware<T extends object> {
  onBeforeUpdate?: (context: MiddlewareContext<T>) => void | Promise<void>;
  onAfterUpdate?: (context: MiddlewareContext<T>) => void | Promise<void>;
  onReset?: (store: PulseStore<T>) => void | Promise<void>;
}
