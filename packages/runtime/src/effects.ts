import type { Effect, FunctionalComponentInstance } from '@synxjs/types';

const effects: Effect[] = [];

export function queueEffect(effect: Effect): void {
  effects.push(effect);
}

export function runEffects(): void {
  effects.forEach((effect: Effect) => {
    try {
      effect();
    } catch (error) {
      console.error('Effect execution failed:', error);
    }
  });
  effects.length = 0;
}

export function cleanupEffects(instance: FunctionalComponentInstance): void {
  if (!instance.hooks) return;

  for (const hook of instance.hooks) {
    if (hook.type === 'effect' && hook.cleanup) {
      hook.cleanup();
      hook.cleanup = undefined;
    }
  }
}
