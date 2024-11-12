import type { StateHook, Setter, Hook } from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';
import { scheduleUpdate } from '@synxjs/vdom';

/**
 * useState Hook
 * @param initialValue - The initial state value.
 * @returns A tuple containing the current state and a setter function.
 */
export function useState<T>(initialValue: T): [T, Setter<T>] {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const hook: StateHook<T> = {
      type: 'state',
      value: initialValue,
      setValue: null!, // Will be set below
    };
    hooks[hookIndex] = hook as Hook;
  }

  const hook = hooks[hookIndex] as StateHook<T>;

  if (!hook.setValue) {
    hook.setValue = (newValue: T | ((prev: T) => T)): void => {
      const valueToSet =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(hook.value)
          : newValue;

      hook.value = valueToSet;
      scheduleUpdate(component);
    };
  }

  return [hook.value, hook.setValue];
}
