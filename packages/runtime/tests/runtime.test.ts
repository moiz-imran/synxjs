import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setCurrentComponent,
  resetCurrentComponent,
  getCurrentComponent,
  resetHookStack,
  queueEffect,
  runEffects,
  cleanupEffects,
} from "../src";
import type { FunctionalComponentInstance, Effect } from "@synxjs/types";

describe("Runtime", () => {
  describe("Context Management", () => {
    beforeEach(() => {
      resetHookStack();
    });

    it("should set and get current component", () => {
      const mockComponent = {
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance;

      setCurrentComponent(mockComponent);
      expect(getCurrentComponent()).toBe(mockComponent);
    });

    it("should handle nested component contexts", () => {
      const parentComponent = {
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance;

      const childComponent = {
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance;

      setCurrentComponent(parentComponent);
      setCurrentComponent(childComponent);
      expect(getCurrentComponent()).toBe(childComponent);

      resetCurrentComponent();
      expect(getCurrentComponent()).toBe(parentComponent);
    });

    it("should throw when getting component with empty stack", () => {
      resetHookStack();
      expect(() => getCurrentComponent()).toThrow(
        "No component is currently being rendered"
      );
    });

    it("should handle repeated component setting", () => {
      const component1 = {
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance;

      const component2 = {
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance;

      // Set up initial stack
      setCurrentComponent(component1);
      setCurrentComponent(component2);
      expect(getCurrentComponent()).toBe(component2);

      // Set component1 again - should remove everything after it
      setCurrentComponent(component1);
      expect(getCurrentComponent()).toBe(component1);

      // Verify stack is truncated
      setCurrentComponent(component2);
      resetCurrentComponent();
      expect(getCurrentComponent()).toBe(component1);
    });

    it("should handle deep component nesting and resets", () => {
      const components = Array.from({ length: 10 }, () => ({
        hooks: [],
        currentHook: 0,
        vnode: {} as any,
        render: vi.fn(),
        dom: null,
      } as FunctionalComponentInstance));

      // Push all components
      components.forEach(setCurrentComponent);
      expect(getCurrentComponent()).toBe(components[components.length - 1]);

      // Reset multiple times
      for (let i = 0; i < 5; i++) {
        resetCurrentComponent();
      }
      expect(getCurrentComponent()).toBe(components[4]);
    });
  });

  describe("Effect Management", () => {
    beforeEach(() => {
      // Clear any queued effects
      runEffects();
    });

    it("should queue and run effects", () => {
      const effect = vi.fn();
      queueEffect(effect);
      expect(effect).not.toHaveBeenCalled();

      runEffects();
      expect(effect).toHaveBeenCalled();
    });

    it("should handle effect errors", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const failingEffect = () => {
        throw new Error("Effect error");
      };

      queueEffect(failingEffect);

      try {
        runEffects();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Effect error");
      }

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("should cleanup component effects", () => {
      const cleanup = vi.fn();
      const mockComponent = {
        hooks: [
          { type: "effect", cleanup },
          { type: "state" }, // Non-effect hook
          { type: "effect", cleanup: undefined }, // Effect without cleanup
        ],
      } as FunctionalComponentInstance;

      cleanupEffects(mockComponent);
      expect(cleanup).toHaveBeenCalled();
    });

    it("should handle components without hooks", () => {
      const mockComponent = {} as FunctionalComponentInstance;
      expect(() => cleanupEffects(mockComponent)).not.toThrow();
    });

    it("should handle multiple effects in sequence", () => {
      let sequence: number[] = [];

      const effect1 = vi.fn(() => {
        sequence.push(1);
      });

      const effect2 = vi.fn(() => {
        sequence.push(2);
      });

      queueEffect(effect1);
      queueEffect(effect2);
      runEffects();

      expect(sequence).toEqual([1, 2]);
      expect(effect1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);
    });
  });
});