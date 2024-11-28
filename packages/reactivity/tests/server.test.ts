import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSignal,
  getServerState,
  resetServerState,
  enableServerMode,
} from '../src';

describe('Server-side Reactivity', () => {
  beforeEach(() => {
    enableServerMode(true);
    resetServerState();
  });

  describe('Signal State Management', () => {
    it('should track initial signal values', () => {
      const [count, _setCount] = createSignal(0);
      const [name, _setName] = createSignal('test');

      const state = getServerState();
      expect(state.signals.size).toBe(2);
      expect(state.signals.get(count)).toBe(0);
      expect(state.signals.get(name)).toBe('test');
    });

    it('should track signal updates', () => {
      const [count, setCount] = createSignal(0);
      const [count2, setCount2] = createSignal(0);

      setCount(1);
      setCount2((prev) => prev + 2);

      expect(getServerState().signals.get(count)).toBe(1);
      expect(getServerState().signals.get(count2)).toBe(2);
    });

    it('should handle multiple signal updates', () => {
      const [count, setCount] = createSignal(0);

      setCount(1);
      setCount(2);
      setCount((prev) => prev + 1);

      expect(getServerState().signals.get(count)).toBe(3);
    });

    it('should reset state between renders', () => {
      const [count, setCount] = createSignal(0);
      setCount(1);

      resetServerState();
      const [newCount] = createSignal(0);

      const state = getServerState();
      expect(state.signals.size).toBe(1);
      expect(state.signals.get(count)).toBeUndefined();
      expect(state.signals.get(newCount)).toBe(0);
    });
  });

  describe('Complex State Scenarios', () => {
    it('should handle nested signal updates', () => {
      const [parent, setParent] = createSignal({ count: 0 });
      const [child, setChild] = createSignal({ value: 'test' });

      setParent({ count: 1 });
      setChild((prev) => ({ value: prev.value + '!' }));

      const state = getServerState();
      expect(state.signals.get(parent)).toEqual({ count: 1 });
      expect(state.signals.get(child)).toEqual({ value: 'test!' });
    });

    it('should handle array signals', () => {
      const [list, setList] = createSignal<number[]>([]);

      setList([1, 2, 3]);
      setList((prev) => [...prev, 4]);

      expect(getServerState().signals.get(list)).toEqual([1, 2, 3, 4]);
    });

    it('should handle undefined and null values', () => {
      const [nullable, setNullable] = createSignal<string | null>('test');
      const [undefinable, setUndefinable] = createSignal<number | undefined>(
        123,
      );

      setNullable(null);
      setUndefinable(undefined);

      const state = getServerState();
      expect(state.signals.get(nullable)).toBeNull();
      expect(state.signals.get(undefinable)).toBeUndefined();
    });

    it('should maintain separate signal identities', () => {
      const [count1, setCount1] = createSignal(0);
      const [count2, setCount2] = createSignal(0);

      setCount1(1);
      setCount2(2);

      const state = getServerState();
      expect(state.signals.get(count1)).toBe(1);
      expect(state.signals.get(count2)).toBe(2);
      expect(state.signals.size).toBe(2);
    });
  });
});
