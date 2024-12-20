import { AnyFunction, VoidFunction } from './base';

export type Effect = () => void | CleanupFn;
export type CleanupFn = VoidFunction;
export type Setter<T> = (newValue: T | ((prev: T) => T)) => void;

export interface BaseHook {
  type: HookType;
  id?: symbol;
}

export type HookType =
  | 'state'
  | 'effect'
  | 'pulse'
  | 'callback'
  | 'memo'
  | 'mount'
  | 'ref';

export interface StateHook<T = unknown> extends BaseHook {
  type: 'state';
  value: T;
  setValue: Setter<T>;
}

export interface EffectHook extends BaseHook {
  type: 'effect';
  cleanup: CleanupFn | void;
  effect: Effect;
  deps?: unknown[];
}

export interface PulseHook<T> extends BaseHook {
  type: 'pulse';
  value: T;
  unsubscribe?: CleanupFn;
}

export interface CallbackHook<T extends AnyFunction> extends BaseHook {
  type: 'callback';
  callback: T;
  deps: unknown[];
}

export interface MemoHook<T> extends BaseHook {
  type: 'memo';
  value: T;
  deps: unknown[];
}

export interface MountHook extends BaseHook {
  type: 'mount';
  hasRun: boolean;
}

export interface RefObject<T> extends BaseHook {
  type: 'ref';
  current: T;
}

export type Hook =
  | StateHook
  | EffectHook
  | PulseHook<unknown>
  | CallbackHook<AnyFunction>
  | MemoHook<unknown>
  | RefObject<unknown>
  | MountHook;
