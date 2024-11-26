import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PulseStore } from '../src';
import { Middleware, MiddlewareContext } from '../src/types';

interface TestState {
  count: number;
  nested: {
    value: string;
  };
}

describe('PulseStore', () => {
  describe('basic operations', () => {
    it('should initialize with initial state', () => {
      const initialState = { count: 0, nested: { value: 'test' } };
      const store = new PulseStore<TestState>(initialState);

      expect(store.getPulses()).toEqual(initialState);
    });

    it('should get individual pulse values', () => {
      const store = new PulseStore<TestState>({
        count: 1,
        nested: { value: 'test' },
      });

      expect(store.getPulse('count')).toBe(1);
      expect(store.getPulse('nested')).toEqual({ value: 'test' });
    });

    it('should set individual pulse values', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      await store.setPulse('count', 1);
      expect(store.getPulse('count')).toBe(1);
    });

    it('should set multiple pulses', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'old' },
      });

      await store.setPulses({
        count: 1,
        nested: { value: 'new' },
      });

      expect(store.getPulses()).toEqual({
        count: 1,
        nested: { value: 'new' },
      });
    });
  });

  describe('reactivity', () => {
    it('should trigger subscribers when pulse changes', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      store.subscribe('count', callback);

      await store.setPulse('count', 1);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle nested pulse changes', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'old' },
      });

      const callback = vi.fn();
      store.subscribe('nested', callback);

      await store.setPulse('nested', { value: 'new' });
      expect(callback).toHaveBeenCalled();
    });

    it('should cleanup subscribers', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      const cleanup = store.subscribe('count', callback);

      callback.mockClear();

      cleanup();
      store.setPulse('count', 1);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscriptions to same pulse', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const cleanup1 = store.subscribe('count', callback1);
      const cleanup2 = store.subscribe('count', callback2);

      // Clear initial subscription calls
      callback1.mockClear();
      callback2.mockClear();

      // First update - both callbacks should fire
      await store.setPulse('count', 1);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Clear calls again before testing cleanup
      callback1.mockClear();
      callback2.mockClear();

      // After cleanup1, only callback2 should fire
      cleanup1();
      await store.setPulse('count', 2);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup of nested pulse subscribers', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      const cleanup = store.subscribe('nested', callback);

      callback.mockClear();

      cleanup();
      store.setPulse('nested', { value: 'new' });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      const initialState = {
        count: 0,
        nested: { value: 'initial' },
      };

      const store = new PulseStore<TestState>(initialState);
      store.setPulse('count', 1);
      store.setPulse('nested', { value: 'changed' });

      store.reset();
      expect(store.getPulses()).toEqual(initialState);
    });

    it('should notify subscribers on reset', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      store.subscribe('count', callback);

      store.reset();
      expect(callback).toHaveBeenCalled();
    });

    it('should handle reset with active subscribers', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      store.subscribe('count', callback);
      callback.mockClear();

      await store.setPulse('count', 1);
      await store.reset();

      expect(callback).toHaveBeenCalledTimes(2); // Once for setPulse, once for reset
      expect(store.getPulses()).toEqual({
        count: 0,
        nested: { value: 'test' },
      });
    });
  });

  describe('nested objects', () => {
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

      const callback = vi.fn();
      store.subscribe('user', callback);
      callback.mockClear();

      await store.setPulse('user', {
        profile: {
          settings: {
            theme: 'light',
          },
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
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

      const callback = vi.fn();
      store.subscribe('config', callback);
      callback.mockClear();

      await store.setPulse('config', {
        ...store.getPulse('config'),
        features: {
          ...store.getPulse('config').features,
          b: true,
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
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

      const callback = vi.fn();
      store.subscribe('lists', callback);
      callback.mockClear();

      await store.setPulse('lists', {
        todos: [
          { id: 1, text: 'Test', done: true },
          { id: 2, text: 'New', done: false },
        ],
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(store.getPulse('lists').todos).toHaveLength(2);
      expect(store.getPulse('lists').todos[0].done).toBe(true);
    });

    it('should handle null values in nested objects', async () => {
      const store = new PulseStore({
        data: {
          optional: null as { value: string } | null,
        },
      });

      const callback = vi.fn();
      store.subscribe('data', callback);
      callback.mockClear();

      await store.setPulse('data', {
        optional: { value: 'test' },
      });
      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      await store.setPulse('data', {
        optional: null,
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle nested object cleanup', async () => {
      const store = new PulseStore({
        settings: {
          theme: {
            mode: 'dark',
            custom: {
              primary: '#000',
            },
          },
        },
      });

      const callback = vi.fn();
      const cleanup = store.subscribe('settings', callback);
      callback.mockClear();

      await store.setPulse('settings', {
        theme: {
          mode: 'light',
          custom: {
            primary: '#fff',
          },
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);

      cleanup();

      await store.setPulse('settings', {
        theme: {
          mode: 'system',
          custom: {
            primary: '#gray',
          },
        },
      });
      expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should handle multiple subscribers to different nesting levels', async () => {
      const store = new PulseStore({
        app: {
          ui: {
            sidebar: {
              width: 240,
              collapsed: false,
            },
          },
        },
      });

      const rootCallback = vi.fn();
      const nestedCallback = vi.fn();

      store.subscribe('app', rootCallback);
      store.subscribe('app', nestedCallback);
      rootCallback.mockClear();
      nestedCallback.mockClear();

      await store.setPulse('app', {
        ui: {
          sidebar: {
            width: 200,
            collapsed: true,
          },
        },
      });

      expect(rootCallback).toHaveBeenCalledTimes(1);
      expect(nestedCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle replacing entire nested structures', async () => {
      const store = new PulseStore({
        state: {
          nested: {
            deep: {
              value: 1,
            },
            other: true,
          },
        },
      });

      const callback = vi.fn();
      store.subscribe('state', callback);
      callback.mockClear();

      await store.setPulse('state', {
        nested: {
          deep: {
            value: 2,
          },
          other: false,
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(store.getPulse('state')).toEqual({
        nested: {
          deep: {
            value: 2,
          },
          other: false,
        },
      });
    });
  });

  describe('subscribeScoped', () => {
    it('should handle multiple key subscriptions', async () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
        active: false,
      });

      const callback = vi.fn();
      store.subscribeScoped(['count', 'name'], callback);

      // Update one of the subscribed keys
      await store.setPulse('count', 1);
      expect(callback).toHaveBeenCalledWith({
        count: 1,
        name: 'test',
      });

      // Update another subscribed key
      callback.mockClear();
      await store.setPulse('name', 'updated');
      expect(callback).toHaveBeenCalledWith({
        count: 1,
        name: 'updated',
      });

      // Update non-subscribed key should not trigger callback
      callback.mockClear();
      await store.setPulse('active', true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle cleanup of scoped subscriptions', async () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
      });

      const callback = vi.fn();
      const cleanup = store.subscribeScoped(['count', 'name'], callback);

      callback.mockClear();
      cleanup();

      // Updates after cleanup should not trigger callback
      await store.setPulse('count', 1);
      await store.setPulse('name', 'updated');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle nested object updates in scoped subscriptions', async () => {
      const store = new PulseStore({
        user: {
          profile: {
            name: 'John',
            age: 25,
          },
        },
        settings: {
          theme: 'dark',
        },
      });

      const callback = vi.fn();
      store.subscribeScoped(['user', 'settings'], callback);

      // Update nested property
      await store.setPulse('user', {
        profile: {
          name: 'Jane',
          age: 26,
        },
      });

      expect(callback).toHaveBeenCalledWith({
        user: {
          profile: {
            name: 'Jane',
            age: 26,
          },
        },
        settings: {
          theme: 'dark',
        },
      });

      // Update another subscribed key
      callback.mockClear();
      await store.setPulse('settings', { theme: 'light' });
      expect(callback).toHaveBeenCalledWith({
        user: {
          profile: {
            name: 'Jane',
            age: 26,
          },
        },
        settings: {
          theme: 'light',
        },
      });
    });

    it('should handle multiple scoped subscriptions to the same keys', async () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const cleanup1 = store.subscribeScoped(['count', 'name'], callback1);
      const cleanup2 = store.subscribeScoped(['count', 'name'], callback2);

      // Update should trigger both callbacks
      await store.setPulse('count', 1);
      expect(callback1).toHaveBeenCalledWith({
        count: 1,
        name: 'test',
      });
      expect(callback2).toHaveBeenCalledWith({
        count: 1,
        name: 'test',
      });

      // Cleanup first subscription
      callback1.mockClear();
      callback2.mockClear();
      cleanup1();

      // Update should only trigger second callback
      await store.setPulse('name', 'updated');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith({
        count: 1,
        name: 'updated',
      });
    });

    it('should handle empty key array', async () => {
      const store = new PulseStore({
        count: 0,
      });

      const callback = vi.fn();
      const cleanup = store.subscribeScoped([], callback);

      await store.setPulse('count', 1);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscription to non-existent keys', async () => {
      const store = new PulseStore({
        count: 0,
      });

      const callback = vi.fn();
      const cleanup = store.subscribeScoped(
        ['invalidKey' as keyof (typeof store)['pulses']],
        callback,
      );

      // Clear initial subscription call
      callback.mockClear();

      await store.setPulse('count', 1);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should maintain correct state after multiple updates', async () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
        active: false,
      });

      const states: Array<Partial<(typeof store)['pulses']>> = [];
      store.subscribeScoped(['count', 'name'], (state) => {
        states.push({ ...state });
      });

      // Clear initial subscription call
      states.length = 0;

      await store.setPulse('count', 1);
      await store.setPulse('name', 'updated');
      await store.setPulse('count', 2);

      expect(states).toEqual([
        { count: 1, name: 'test' },
        { count: 1, name: 'updated' },
        { count: 2, name: 'updated' },
      ]);
    });

    it('should handle rapid consecutive updates', async () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
      });

      const callback = vi.fn();
      store.subscribeScoped(['count', 'name'], callback);

      // Clear initial subscription call
      callback.mockClear();

      // Perform multiple rapid updates
      store.setPulse('count', 1);
      await store.setPulse('count', 2);
      await store.setPulse('name', 'updated');
      await store.setPulse('count', 3);

      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenLastCalledWith({
        count: 3,
        name: 'updated',
      });
    });

    it('should return no-op cleanup for empty keys', () => {
      const store = new PulseStore({
        count: 0,
        name: 'test',
      });

      const callback = vi.fn();
      const cleanup = store.subscribeScoped([], callback);

      // Verify cleanup is a function
      expect(typeof cleanup).toBe('function');

      // Verify cleanup can be called without errors
      expect(() => cleanup()).not.toThrow();

      // Verify it's truly a no-op by checking the function body
      const fnString = cleanup.toString();
      expect(
        fnString === '() => {}' ||
          fnString === 'function() {}' ||
          fnString === '() => {\n      }' ||
          fnString === 'function () {\n      }',
      ).toBe(true);
    });
  });

  // packages/store/tests/pulse-store.test.ts

  describe('middleware', () => {
    it('should handle middleware in correct order', async () => {
      const order: string[] = [];
      const middleware1: Middleware<TestState> = {
        onBeforeUpdate: async () => {
          order.push('before1');
        },
        onAfterUpdate: async () => {
          order.push('after1');
        },
      };
      const middleware2: Middleware<TestState> = {
        onBeforeUpdate: async () => {
          order.push('before2');
        },
        onAfterUpdate: async () => {
          order.push('after2');
        },
      };

      const store = new PulseStore<TestState>(
        { count: 0, nested: { value: 'test' } },
        [middleware1, middleware2],
      );

      await store.setPulse('count', 1);

      expect(order).toEqual(['before1', 'before2', 'after1', 'after2']);
    });

    it('should allow adding and removing middleware', async () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const calls: string[] = [];
      const middleware: Middleware<TestState> = {
        onBeforeUpdate: async () => {
          calls.push('before');
        },
      };

      store.addMiddleware(middleware);
      await store.setPulse('count', 1);
      expect(calls).toEqual(['before']);

      calls.length = 0;
      store.removeMiddleware(middleware);
      await store.setPulse('count', 2);
      expect(calls).toEqual([]);
    });

    it('should provide correct context to middleware', async () => {
      let capturedContext: MiddlewareContext<TestState> | null = null;
      const middleware: Middleware<TestState> = {
        onBeforeUpdate: async (context) => {
          capturedContext = context;
        },
      };

      const store = new PulseStore<TestState>(
        { count: 0, nested: { value: 'test' } },
        [middleware],
      );

      await store.setPulse('count', 1);

      expect(capturedContext).toBeTruthy();
      expect(capturedContext!.key).toBe('count');
      expect(capturedContext!.previousValue).toBe(0);
      expect(capturedContext!.value).toBe(1);
      expect(capturedContext!.store).toBe(store);
      expect(typeof capturedContext!.timestamp).toBe('number');
    });

    it('should handle middleware during reset', async () => {
      const calls: string[] = [];
      const middleware: Middleware<TestState> = {
        onReset: async () => {
          calls.push('reset');
        },
      };

      const store = new PulseStore<TestState>(
        { count: 0, nested: { value: 'test' } },
        [middleware],
      );

      await store.reset();
      expect(calls).toEqual(['reset']);
    });
  });
});
