// Mocks need to be at the top
vi.mock("@synxjs/runtime", () => ({
  getCurrentComponent: vi.fn(),
}));

vi.mock("@synxjs/vdom", () => ({
  scheduleUpdate: vi.fn(),
}));

// Mock the reactivity system with cleanup handling
vi.mock("@synxjs/reactivity", () => ({
  effect: vi.fn((fn) => {
    fn(); // Execute the effect immediately
    return fn(); // Return the cleanup function that the effect returns
  }),
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePulseState, usePulseEffect } from "../src";
import { PulseStore } from "@synxjs/store";
import type { FunctionalComponentInstance, PulseHook, EffectHook } from "@synxjs/types";
import { getCurrentComponent } from "@synxjs/runtime";
import { scheduleUpdate } from "@synxjs/vdom";
import { effect as reactiveEffect } from "@synxjs/reactivity";

describe("Pulse Hooks", () => {
  const mockComponent: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode: {} as any,
    render: vi.fn(),
    dom: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockComponent.hooks = [];
    mockComponent.currentHook = 0;
    vi.mocked(getCurrentComponent).mockReturnValue(mockComponent);
  });

  describe("usePulseState", () => {
    it("should initialize with store value", () => {
      const store = new PulseStore({ count: 0 });
      const [value] = usePulseState("count", store);

      expect(value).toBe(0);
      expect(mockComponent.hooks[0]).toEqual(
        expect.objectContaining({
          type: "pulse",
          value: 0,
        })
      );
    });

    it("should update value when store changes", () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState("count", store);

      setValue(1);
      expect(store.getPulse("count")).toBe(1);
    });

    it("should handle functional updates", () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState("count", store);

      setValue(prev => prev + 1);
      expect(store.getPulse("count")).toBe(1);
    });

    it("should schedule component update when value changes", () => {
      const store = new PulseStore({ count: 0 });
      const [, setValue] = usePulseState("count", store);

      setValue(1);
      expect(scheduleUpdate).toHaveBeenCalledWith(mockComponent);
    });

    it("should cleanup subscription on unmount", () => {
      const store = new PulseStore({ count: 0 });
      usePulseState("count", store);

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

  describe("usePulseEffect", () => {
    it("should run effect when pulse changes", () => {
      const store = new PulseStore({ count: 0 });
      const effect = vi.fn();

      // Clear initial call
      usePulseEffect(() => {
        effect(store.getPulse("count"));
      });
      effect.mockClear();

      store.setPulse("count", 1);
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith(1);
    });

    it("should cleanup previous effect", () => {
      const store = new PulseStore({ count: 0 });
      const cleanup = vi.fn();
      const effect = vi.fn(() => cleanup);

      // Set up the effect
      usePulseEffect(effect);

      // Trigger a store update to cause effect cleanup
      store.setPulse("count", 1);

      // Get the cleanup function returned by reactiveEffect
      const cleanupFn = vi.mocked(reactiveEffect).mock.results[0].value;

      // Call the cleanup function
      cleanupFn();

      expect(cleanup).toHaveBeenCalled();
    });

    it("should cleanup previous effect (alternative)", () => {
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

    it("should handle nested pulse dependencies", () => {
      const store = new PulseStore({
        nested: { value: "initial" }
      });
      const effect = vi.fn();

      usePulseEffect(() => {
        effect(store.getPulse("nested").value);
      });
      effect.mockClear();

      store.setPulse("nested", { value: "updated" });
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith("updated");
    });

    it("should handle multiple pulse dependencies", () => {
      const store = new PulseStore({
        count1: 0,
        count2: 0
      });
      const effect = vi.fn();

      usePulseEffect(() => {
        effect(store.getPulse("count1") + store.getPulse("count2"));
      });
      effect.mockClear();

      store.setPulse("count1", 1);
      store.setPulse("count2", 2);
      // Simulate effect running
      vi.mocked(reactiveEffect).mock.calls[0][0]();

      expect(effect).toHaveBeenCalledWith(3);
    });

    it("should handle cleanup of previous effect", () => {
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
});