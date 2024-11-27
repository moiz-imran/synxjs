import type { RefObject } from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';

export function useRef<T>(initialValue: T): RefObject<T> {
  const component = getCurrentComponent();
  if (!component) {
    throw new Error('useRef must be used within a functional component');
  }

  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  // Initialize ref if it doesn't exist
  if (hookIndex >= hooks.length) {
    hooks[hookIndex] = {
      type: 'ref',
      current: initialValue
    };
  }

  return hooks[hookIndex] as RefObject<T>;
}