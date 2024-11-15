import { describe, it, expect, vi } from 'vitest';
import { reactive, effect } from '../src';

interface CountObject {
  count: number;
}

interface NestedObject {
  nested: {
    count: number;
  };
}

describe('Reactivity', () => {
  describe('reactive', () => {
    it('should make object properties reactive', () => {
      const obj = reactive<CountObject>({ count: 0 });
      let dummy: number | undefined;

      effect(() => {
        dummy = obj.count;
      });

      expect(dummy).toBe(0);
      obj.count = 1;
      expect(dummy).toBe(1);
    });

    it('should handle nested properties', () => {
      const obj = reactive<NestedObject>({
        nested: { count: 0 },
      });
      let dummy: number | undefined;

      effect(() => {
        dummy = obj.nested.count;
      });

      expect(dummy).toBe(0);
      obj.nested.count = 1;
      expect(dummy).toBe(1);
    });
  });

  describe('effect', () => {
    it('should run effect immediately', () => {
      const obj = reactive<CountObject>({ count: 0 });
      const fn = vi.fn(() => {
        const value = obj.count;
      });

      effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple effects', () => {
      const obj = reactive<CountObject>({ count: 0 });
      const fn1 = vi.fn(() => {
        const value = obj.count;
        return;
      });
      const fn2 = vi.fn(() => {
        const value = obj.count;
        return;
      });

      effect(() => {
        fn1();
      });
      effect(() => {
        fn2();
      });

      obj.count++;
      expect(fn1).toHaveBeenCalledTimes(2);
      expect(fn2).toHaveBeenCalledTimes(2);
    });

    it('should cleanup effects', () => {
      const obj = reactive<CountObject>({ count: 0 });
      const fn = vi.fn(() => {
        const value = obj.count;
        return;
      });

      const cleanup = effect(fn);
      cleanup();

      obj.count++;
      expect(fn).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe("edge cases", () => {
    it("should handle multiple levels of nesting", () => {
      const obj = reactive({
        deep: {
          nested: {
            count: 0
          }
        }
      });
      let dummy: number | undefined;

      effect(() => {
        dummy = obj.deep.nested.count;
      });

      expect(dummy).toBe(0);
      obj.deep.nested.count = 1;
      expect(dummy).toBe(1);
    });

    it("should handle arrays", () => {
      const arr = reactive<number[]>([0, 1, 2]);
      let dummy: number | undefined;

      effect(() => {
        dummy = arr[0];
      });

      expect(dummy).toBe(0);
      arr[0] = 3;
      expect(dummy).toBe(3);
    });

    it("should not trigger effect if value hasn't changed", () => {
      const obj = reactive({ count: 0 });
      const fn = vi.fn(() => {
        obj.count;
        return;
      });

      effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.count = 0; // Same value
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should handle effect cleanup with multiple dependencies", () => {
      const obj = reactive({
        count1: 0,
        count2: 0
      });
      const fn = vi.fn(() => {
        const value = obj.count1 + obj.count2;
        return;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.count1++;
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      obj.count1++;
      obj.count2++;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should handle replacing nested objects", () => {
      const obj = reactive<{ nested: { count: number } }>({
        nested: { count: 0 },
      });
      let dummy: number | undefined;

      effect(() => {
        dummy = obj.nested.count;
      });

      expect(dummy).toBe(0);
      obj.nested = { count: 1 };
      expect(dummy).toBe(1);
    });
  });
});
