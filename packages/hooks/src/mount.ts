import type { MountHook } from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';

/**
 * useMount Hook - Runs callback exactly once when component mounts
 * @param callback - The callback to execute on mount
 */
export function useMount(callback: () => void): void {
  const component = getCurrentComponent();
  const hooks = component.hooks;
  const hookIndex = component.currentHook++;

  if (hooks[hookIndex] === undefined) {
    const hook: MountHook = {
      type: 'mount',
      hasRun: false,
    };
    hooks[hookIndex] = hook;

    // Run immediately on mount
    callback();
    hook.hasRun = true;
  }
}
