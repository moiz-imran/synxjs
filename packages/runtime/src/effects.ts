import type { Effect } from '@synxjs/types';

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
