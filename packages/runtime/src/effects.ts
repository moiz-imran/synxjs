import type {
  Effect,
  EffectHook,
  FunctionalComponentInstance,
} from '@synxjs/types';
import { getCurrentComponent } from './context';

interface QueuedEffect {
  effect: Effect;
  instance: FunctionalComponentInstance;
}

const effects: QueuedEffect[] = [];

export function queueEffect(effect: Effect): void {
  const instance = getCurrentComponent();
  if (!instance) {
    throw new Error('Cannot queue effect outside of component');
  }
  effects.push({ effect, instance });
}

export function runEffects(): void {
  const currentEffects = [...effects];
  effects.length = 0;

  for (const { effect, instance } of currentEffects) {
    try {
      const cleanup = effect();
      // Store cleanup if returned
      if (typeof cleanup === 'function') {
        const hook = instance.hooks.find(
          (h) => h.type === 'effect' && h.effect === effect,
        ) as EffectHook;
        if (hook) {
          hook.cleanup = cleanup;
        }
      }
    } catch (error) {
      console.error('Effect execution failed:', error);
      // Render error state for this component
      if (instance.dom?.parentNode) {
        instance.dom.parentNode.replaceChild(
          document.createTextNode('Error caught'),
          instance.dom,
        );
      }
      if (process.env.NODE_ENV === 'test') {
        throw error;
      }
    }
  }
}

export function cleanupEffects(instance: FunctionalComponentInstance): void {
  if (!instance.hooks) return;

  for (const hook of instance.hooks) {
    if (hook.type === 'effect' && hook.cleanup) {
      try {
        hook.cleanup();
      } catch (error) {
        console.error('Effect cleanup failed:', error);
      }
    } else if (hook.type === 'pulse' && hook.unsubscribe) {
      try {
        hook.unsubscribe();
      } catch (error) {
        console.error('Store subscription cleanup failed:', error);
      }
    }
  }
}
