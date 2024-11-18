import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PulseStore } from '../src';

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

    it('should set individual pulse values', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      store.setPulse('count', 1);
      expect(store.getPulse('count')).toBe(1);
    });

    it('should set multiple pulses', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'old' },
      });

      store.setPulses({
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
    it('should trigger subscribers when pulse changes', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      store.subscribe('count', callback);

      store.setPulse('count', 1);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle nested pulse changes', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'old' },
      });

      const callback = vi.fn();
      store.subscribe('nested', callback);

      store.setPulse('nested', { value: 'new' });
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

    it('should handle multiple subscriptions to same pulse', () => {
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
      store.setPulse('count', 1);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Clear calls again before testing cleanup
      callback1.mockClear();
      callback2.mockClear();

      // After cleanup1, only callback2 should fire
      cleanup1();
      store.setPulse('count', 2);
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

    it('should handle reset with active subscribers', () => {
      const store = new PulseStore<TestState>({
        count: 0,
        nested: { value: 'test' },
      });

      const callback = vi.fn();
      store.subscribe('count', callback);
      callback.mockClear();

      store.setPulse('count', 1);
      store.reset();

      expect(callback).toHaveBeenCalledTimes(2); // Once for setPulse, once for reset
      expect(store.getPulses()).toEqual({
        count: 0,
        nested: { value: 'test' },
      });
    });
  });
});
