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

  describe('edge cases', () => {
    it('should handle multiple levels of nesting', () => {
      const obj = reactive({
        deep: {
          nested: {
            count: 0,
          },
        },
      });
      let dummy: number | undefined;

      effect(() => {
        dummy = obj.deep.nested.count;
      });

      expect(dummy).toBe(0);
      obj.deep.nested.count = 1;
      expect(dummy).toBe(1);
    });

    it('should handle arrays', () => {
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

    it('should handle effect cleanup with multiple dependencies', () => {
      const obj = reactive({
        count1: 0,
        count2: 0,
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

    it('should handle replacing nested objects', () => {
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

  describe('effect cleanup', () => {
    it('should properly cleanup single dependency', () => {
      const obj = reactive({ count: 0 });
      const fn = vi.fn(() => {
        obj.count;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      cleanup();
      obj.count++;
      expect(fn).toHaveBeenCalledTimes(1); // Effect not called after cleanup
    });

    it('should properly cleanup with multiple dependencies', () => {
      const obj = reactive({ a: 0, b: 0 });
      const fn = vi.fn(() => {
        obj.a + obj.b;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.a++; // Effect should trigger
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      obj.a++; // Effect should not trigger after cleanup
      obj.b++;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should properly cleanup nested dependencies', () => {
      const obj = reactive({ nested: { count: 0 } });
      const fn = vi.fn(() => {
        obj.nested.count;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.nested.count++; // Effect should trigger
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      obj.nested.count++; // Effect should not trigger after cleanup
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup when replacing nested objects', () => {
      const obj = reactive({ nested: { count: 0 } });
      const fn = vi.fn(() => {
        obj.nested.count;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.nested = { count: 1 }; // Effect should trigger
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      obj.nested = { count: 2 }; // Effect should not trigger after cleanup
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup with array dependencies', () => {
      const arr = reactive([1, 2, 3]);
      const fn = vi.fn(() => {
        arr[0];
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      arr[0] = 4; // Effect should trigger
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      arr[0] = 5; // Effect should not trigger after cleanup
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple cleanups of the same effect', () => {
      const obj = reactive({ count: 0 });
      const fn = vi.fn(() => {
        obj.count;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      cleanup();
      cleanup(); // Second cleanup should be safe
      obj.count++;
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('effect cleanup edge cases', () => {
    it('should handle cleanup after target object is replaced', () => {
      const wrapper = reactive({ obj: { count: 0 } });
      const fn = vi.fn(() => {
        wrapper.obj.count;
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      // Replace the entire object, which should cause the old target's deps
      // to be "orphaned" but cleanup should still work
      wrapper.obj = { count: 1 };
      expect(fn).toHaveBeenCalledTimes(2);

      cleanup();
      // At this point, cleanup runs on both the old and new object references

      wrapper.obj.count++;
      expect(fn).toHaveBeenCalledTimes(2); // Should not trigger
    });

    it('should handle cleanup with deleted properties', () => {
      const obj = reactive({ count: 0 });
      const fn = vi.fn(() => {
        // Using try-catch to handle property access after deletion
        try {
          obj.count;
        } catch {
          return undefined;
        }
      });

      const cleanup = effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      // Delete the property, which should cause the dep to be undefined
      delete (obj as any).count;

      cleanup();
      // Cleanup should handle the missing property gracefully

      // Add the property back
      (obj as any).count = 1;
      expect(fn).toHaveBeenCalledTimes(1); // Should not trigger
    });
  });

  describe('multiple nested property updates', () => {
    it('should handle multiple nested property updates', () => {
      const obj = reactive({
        nested: {
          a: { value: 1 },
          b: { value: 2 }
        }
      });

      const fn = vi.fn(() => {
        obj.nested.a.value + obj.nested.b.value;
      });

      effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      obj.nested.a.value = 3;
      expect(fn).toHaveBeenCalledTimes(2);

      obj.nested.b.value = 4;
      expect(fn).toHaveBeenCalledTimes(3);

      // Update both simultaneously by replacing parent
      obj.nested = {
        a: { value: 5 },
        b: { value: 6 }
      };
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });
});
