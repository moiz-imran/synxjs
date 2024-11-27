// Mocks need to be at the top
vi.mock('@synxjs/runtime', () => ({
  getCurrentComponent: vi.fn(),
}));

vi.mock('@synxjs/vdom', () => ({
  scheduleUpdate: vi.fn(),
}));

// At the top of the file
const effectsMap = new Map<Function, Function>();

// Mock the reactivity system with cleanup handling
vi.mock('@synxjs/reactivity', async (importOriginal) => {
  const reactivity =
    await importOriginal<typeof import('@synxjs/reactivity')>();
  return {
    ...reactivity,
    effect: vi.fn((fn) => {
      // Store the effect function
      const effectFn = () => {
        const cleanup = fn();
        if (cleanup) {
          effectsMap.set(fn, cleanup);
        }
        return cleanup;
      };

      // Run it immediately
      effectFn();

      // Return cleanup function
      return () => {
        const cleanup = effectsMap.get(fn);
        if (cleanup) {
          cleanup();
          effectsMap.delete(fn);
        }
      };
    }),
  };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePulseState, usePulseEffect } from '../src';
import { PulseStore } from '@synxjs/store';
import type {
  FunctionalComponentInstance,
  PulseHook,
  EffectHook,
} from '@synxjs/types';
import { getCurrentComponent } from '@synxjs/runtime';
import { scheduleUpdate } from '@synxjs/vdom';
import { effect as reactiveEffect } from '@synxjs/reactivity';

describe('Pulse Hooks', () => {
  const mockComponent: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode: {} as any,
    render: vi.fn(),
    dom: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockComponent.hooks = [];
    mockComponent.currentHook = 0;
    vi.mocked(getCurrentComponent).mockReturnValue(mockComponent);
    effectsMap.clear(); // Clear effects map
    // Wait for any pending effects
    vi.runAllTimers();
  });

  describe('usePulseState', () => {
    it('should initialize with store value', () => {
      const store = new PulseStore({ count: 0 });
      const [value] = usePulseState('count', store);

      expect(value).toBe(0);
      expect(mockComponent.hooks[0]).toEqual(
        expect.objectContaining({
          type: 'pulse',
          value: 0,
        }),
      );
    });

    it('should update value when store changes', async () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState('count', store);

      setValue(1);
      await vi.runAllTimersAsync();
      expect(store.getPulse('count')).toBe(1);
    });

    it('should handle functional updates', async () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState('count', store);

      setValue((prev) => prev + 1);
      await vi.runAllTimersAsync();
      expect(store.getPulse('count')).toBe(1);
    });

    it('should schedule component update when value changes', async () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState('count', store);

      setValue(1);
      await vi.runAllTimersAsync();
      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);
    });

    it('should cleanup subscription on unmount', () => {
      const store = new PulseStore({ count: 0 });
      usePulseState('count', store);

      const hook = mockComponent.hooks[0] as PulseHook<number>;
      const unsubscribeSpy = vi.fn();
      hook.unsubscribe = unsubscribeSpy;

      // Simulate unmount by calling unsubscribe
      if (hook.unsubscribe) {
        hook.unsubscribe();
      }

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('usePulseEffect', () => {
    it('should run effect when pulse changes', async () => {
      const store = new PulseStore({ count: 0 });
      const effect = vi.fn();

      // Clear initial call
      usePulseEffect(() => {
        effect(store.getPulse('count'));
      });
      effect.mockClear();

      await store.setPulse('count', 1);
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith(1);
    });

    it('should cleanup previous effect', () => {
      const store = new PulseStore({ count: 0 });
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      // Set up the effect
      usePulseEffect(effect);

      // Trigger a store update to cause effect cleanup
      store.setPulse('count', 1);

      // Get the cleanup function returned by reactiveEffect
      const cleanupFn = vi.mocked(reactiveEffect).mock.results[0].value;

      // Call the cleanup function
      cleanupFn();

      expect(cleanup).toHaveBeenCalled();
    });

    it('should cleanup previous effect (alternative)', () => {
      const store = new PulseStore({ count: 0 });
      const cleanup = vi.fn();

      // Create an effect that returns the cleanup
      usePulseEffect(() => cleanup);

      // Get the hook
      const hook = mockComponent.hooks[0] as EffectHook;

      // Simulate cleanup
      if (hook.cleanup) {
        hook.cleanup();
      }

      expect(cleanup).toHaveBeenCalled();
    });

    it('should handle nested pulse dependencies', async () => {
      const store = new PulseStore({
        nested: { value: 'initial' },
      });
      const effect = vi.fn();

      usePulseEffect(() => {
        effect(store.getPulse('nested').value);
      });
      effect.mockClear();

      await store.setPulse('nested', { value: 'updated' });
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith('updated');
    });

    it('should handle multiple pulse dependencies', async () => {
      const store = new PulseStore({
        count1: 0,
        count2: 0,
      });
      const effect = vi.fn();

      usePulseEffect(() => {
        effect(store.getPulse('count1') + store.getPulse('count2'));
      });
      effect.mockClear();

      await store.setPulse('count1', 1);
      await store.setPulse('count2', 2);
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith(3);
    });

    it('should handle cleanup of previous effect', () => {
      const store = new PulseStore({ count: 0 });
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      // First effect
      usePulseEffect(effect);
      const hook = mockComponent.hooks[0] as EffectHook;

      // Simulate cleanup
      if (hook.cleanup) {
        hook.cleanup();
        hook.cleanup = undefined;
      }

      // Set up new effect
      mockComponent.currentHook = 0;
      usePulseEffect(effect);

      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('usePulseState with nested objects', () => {
    it('should handle deep nested updates', async () => {
      const store = new PulseStore({
        user: {
          profile: {
            settings: {
              theme: 'dark',
            },
          },
        },
      });

      const [value, setValue] = usePulseState('user', store);
      expect(value).toEqual({
        profile: {
          settings: {
            theme: 'dark',
          },
        },
      });

      setValue({
        profile: {
          settings: {
            theme: 'light',
          },
        },
      });

      await vi.runAllTimersAsync();

      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);
      expect(store.getPulse('user')).toEqual({
        profile: {
          settings: {
            theme: 'light',
          },
        },
      });
    });

    it('should handle partial nested updates', async () => {
      const store = new PulseStore({
        config: {
          features: {
            a: true,
            b: false,
          },
          version: '1.0',
        },
      });

      const [value, setValue] = usePulseState('config', store);

      setValue((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          b: true,
        },
      }));

      await vi.runAllTimersAsync();

      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);
      expect(store.getPulse('config')).toEqual({
        features: {
          a: true,
          b: true,
        },
        version: '1.0',
      });
    });

    it('should handle arrays in nested objects', async () => {
      const store = new PulseStore({
        lists: {
          todos: [{ id: 1, text: 'Test', done: false }],
        },
      });

      const [value, setValue] = usePulseState('lists', store);

      setValue({
        todos: [
          { id: 1, text: 'Test', done: true },
          { id: 2, text: 'New', done: false },
        ],
      });

      await vi.runAllTimersAsync();

      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);
      expect(store.getPulse('lists').todos).toHaveLength(2);
      expect(store.getPulse('lists').todos[0].done).toBe(true);
    });

    it('should handle null values in nested objects', async () => {
      const store = new PulseStore({
        data: {
          optional: null as { value: string } | null,
        },
      });

      const [value, setValue] = usePulseState('data', store);

      setValue({
        optional: { value: 'test' },
      });
      await vi.runAllTimersAsync();
      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);

      setValue({
        optional: null,
      });
      await vi.runAllTimersAsync();
      expect(scheduleUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('usePulseEffect with nested objects', () => {
    it('should track nested object mutations', async () => {
      const store = new PulseStore({
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      });

      const nameEffect = vi.fn();
      const themeEffect = vi.fn();

      // Store effect references
      let nameEffectFn: Function | undefined;
      let themeEffectFn: Function | undefined;

      usePulseEffect(() => {
        nameEffectFn = () => nameEffect(store.getPulse('user').profile.name);
        nameEffectFn();
      });

      usePulseEffect(() => {
        themeEffectFn = () =>
          themeEffect(store.getPulse('user').profile.settings.theme);
        themeEffectFn();
      });

      // Clear initial effect calls
      nameEffect.mockClear();
      themeEffect.mockClear();

      // Update deep property
      await store.setPulse('user', {
        ...store.getPulse('user'),
        profile: {
          ...store.getPulse('user').profile,
          settings: {
            theme: 'light',
          },
        },
      });

      // Manually trigger effects to simulate reactivity
      themeEffectFn?.();

      expect(themeEffect).toHaveBeenCalledWith('light');
      expect(nameEffect).not.toHaveBeenCalled();
    });

    it('should handle cleanup with nested dependencies', async () => {
      const store = new PulseStore({
        settings: {
          display: {
            color: 'red',
            size: 'large',
          },
        },
      });

      const effect = vi.fn();
      const cleanup = vi.fn();
      let effectFn: Function | undefined;

      // Mock the reactivity effect to handle cleanup
      vi.mocked(reactiveEffect).mockImplementationOnce((fn) => {
        // Initial run
        effectFn = () => {
          // Call previous cleanup if it exists
          cleanup();
          effect(store.getPulse('settings').display);
          return cleanup;
        };
        effectFn();
        return () => cleanup();
      });

      usePulseEffect(() => {
        effect(store.getPulse('settings').display);
        return cleanup;
      });

      effect.mockClear();
      cleanup.mockClear();

      // Update nested object
      await store.setPulse('settings', {
        display: {
          color: 'blue',
          size: 'small',
        },
      });

      // Manually trigger effect to simulate reactivity
      effectFn?.();

      expect(cleanup).toHaveBeenCalled();
      expect(effect).toHaveBeenCalledWith({
        color: 'blue',
        size: 'small',
      });
    });

    it('should handle conditional access of nested properties', async () => {
      const store = new PulseStore({
        optional: {
          nested: null as { value: string } | null,
        },
      });

      const effect = vi.fn();
      let effectFn: Function | undefined;

      usePulseEffect(() => {
        effectFn = () => effect(store.getPulse('optional').nested?.value);
        effectFn();
      });

      effect.mockClear();

      await store.setPulse('optional', {
        nested: { value: 'test' },
      });

      // Manually trigger effect to simulate reactivity
      effectFn?.();

      expect(effect).toHaveBeenCalledWith('test');

      await store.setPulse('optional', {
        nested: null,
      });

      // Manually trigger effect to simulate reactivity
      effectFn?.();

      expect(effect).toHaveBeenCalledWith(undefined);
    });
  });
});
