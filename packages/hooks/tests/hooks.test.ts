vi.mock('@synxjs/runtime', () => ({
  getCurrentComponent: vi.fn(),
  queueEffect: vi.fn(),
}));

// Now we can import everything else
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState, useEffect, useCallback, useMemo, useMount } from '../src';
import type {
  EffectHook,
  FunctionalComponentInstance,
  StateHook,
} from '@synxjs/types';
import { getCurrentComponent, queueEffect } from '@synxjs/runtime';

describe('Hooks', () => {
  const mockComponent: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode: {} as any,
    render: vi.fn(),
    dom: null,
  };

  beforeEach(() => {
    // Reset mocks and component state
    vi.clearAllMocks();
    mockComponent.hooks = [];
    mockComponent.currentHook = 0;
    vi.mocked(getCurrentComponent).mockReturnValue(mockComponent);
  });

  describe('useState', () => {
    it('should initialize state', () => {
      const [value] = useState(0);
      expect(value).toBe(0);
      expect(mockComponent.hooks.length).toBe(1);
    });

    it('should update state', () => {
      const [, setValue] = useState(0);
      setValue(1);
      expect((mockComponent.hooks[0] as StateHook<number>).value).toBe(1);
    });

    it('should handle functional updates', () => {
      const [, setValue] = useState(0);
      setValue((prev) => prev + 1);
      expect((mockComponent.hooks[0] as StateHook<number>).value).toBe(1);
    });
  });

  describe('useEffect', () => {
    it('should queue effect on mount', () => {
      const effect = vi.fn();

      useEffect(effect, []);

      // Check that the hook was created correctly
      expect(mockComponent.hooks[0]).toEqual(
        expect.objectContaining({
          type: 'effect',
          effect,
          deps: [],
        }),
      );

      // Check if effect was queued when deps changed
      const prevHook = mockComponent.hooks[0] as EffectHook;
      mockComponent.currentHook = 0;
      useEffect(effect, [1]);

      expect(queueEffect).toHaveBeenCalled();
    });

    it('should handle dependencies', () => {
      const effect = vi.fn();
      const cleanup = vi.fn();
      effect.mockReturnValue(cleanup);

      // Initial mount
      useEffect(effect, [1]);
      const hook = mockComponent.hooks[0] as EffectHook;
      expect(hook.effect).toBe(effect);
      expect(hook.deps).toEqual([1]);

      // Same deps - shouldn't re-run
      mockComponent.currentHook = 0;
      useEffect(effect, [1]);
      expect(effect).toHaveBeenCalledTimes(1);

      // Different deps - should cleanup and re-run
      mockComponent.currentHook = 0;
      useEffect(effect, [2]);
      expect(cleanup).toHaveBeenCalled();
      expect(queueEffect).toHaveBeenCalled();
    });

    it('should handle cleanup on unmount', () => {
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      useEffect(effect, []);
      const hook = mockComponent.hooks[0] as EffectHook;

      // Simulate unmount
      if (hook.cleanup) {
        hook.cleanup();
      }

      expect(cleanup).toHaveBeenCalled();
    });

    it('should throw if used outside component', () => {
      vi.mocked(getCurrentComponent).mockReturnValue(null as any);

      expect(() => useEffect(() => {})).toThrow(
        'useEffect must be used within a functional component',
      );
    });

    it('should handle undefined deps', () => {
      const effect = vi.fn();
      useEffect(effect); // No deps provided
      expect(effect).toHaveBeenCalled();
    });

    it('should handle effect cleanup and re-run', () => {
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      // First render
      useEffect(effect, [1]);
      expect(effect).toHaveBeenCalled();

      // Second render with different deps
      mockComponent.currentHook = 0;
      useEffect(effect, [2]);

      // Should cleanup previous effect and queue new one
      expect(cleanup).toHaveBeenCalled();
      expect(queueEffect).toHaveBeenCalled();
    });
  });

  describe('useCallback', () => {
    it('should memoize callback', () => {
      const callback = () => {};
      const memoized1 = useCallback(callback, [1]);

      mockComponent.currentHook = 0;
      const memoized2 = useCallback(callback, [1]);

      expect(memoized1).toBe(memoized2);
    });

    it('should update callback when deps change', () => {
      // Create unique callbacks for each call
      const callback1 = () => console.log('1');
      const callback2 = () => console.log('2');

      const memoized1 = useCallback(callback1, [1]);

      mockComponent.currentHook = 0;
      const memoized2 = useCallback(callback2, [2]);

      expect(memoized1).not.toBe(memoized2);
    });

    it('should handle undefined deps', () => {
      const callback1 = () => console.log('1');
      const callback2 = () => console.log('2');

      const memoized1 = useCallback(callback1);

      mockComponent.currentHook = 0;
      const memoized2 = useCallback(callback2);

      expect(memoized1).not.toBe(memoized2);
    });
  });

  describe('useMemo', () => {
    it('should memoize value', () => {
      const factory = vi.fn(() => ({ value: 1 }));
      const value1 = useMemo(factory, [1]);

      mockComponent.currentHook = 0;
      const value2 = useMemo(factory, [1]);

      expect(value1).toBe(value2);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should recompute when deps change', () => {
      const factory = vi.fn(() => ({ value: 1 }));
      const value1 = useMemo(factory, [1]);

      mockComponent.currentHook = 0;
      const value2 = useMemo(factory, [2]);

      expect(value1).not.toBe(value2);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should throw if used outside component', () => {
      vi.mocked(getCurrentComponent).mockReturnValue(null as any);

      expect(() => useMemo(() => {}, [])).toThrow(
        'useMemo must be used within a functional component',
      );
    });

    it('should handle undefined deps', () => {
      const factory = vi.fn(() => ({ value: 1 }));
      // @ts-expect-error
      const value1 = useMemo(factory);

      mockComponent.currentHook = 0;
      // @ts-expect-error
      const value2 = useMemo(factory);

      expect(value1).not.toBe(value2);
    });
  });

  describe('useMount', () => {
    it('should run callback only once', () => {
      const callback = vi.fn();
      useMount(callback);
      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate rerender
      mockComponent.currentHook = 0;
      useMount(callback);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
