import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFunctionalComponentInstance,
  componentInstanceCache,
  domToInstanceMap,
} from '../src';
import type { VNode, FunctionalComponent } from '@synxjs/types';
import { createElement } from '../../vdom/src';

// Mock needs to be before any imports
vi.mock('@synxjs/runtime', () => ({
  setCurrentComponent: vi.fn(),
  resetCurrentComponent: vi.fn(),
}));

// Import the mocked module
import { setCurrentComponent, resetCurrentComponent } from '@synxjs/runtime';

describe('Instance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFunctionalComponentInstance', () => {
    it('should create a new instance', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);

      expect(instance).toEqual(
        expect.objectContaining({
          hooks: [],
          currentHook: 0,
          vnode,
          dom: null,
        }),
      );
    });

    it('should cache the instance', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      expect(componentInstanceCache.get(vnode)).toBe(instance);
    });

    it('should throw error for non-function components', () => {
      const vnode = {
        type: 'div',
        props: {},
      } as unknown as VNode<FunctionalComponent>;

      expect(() => createFunctionalComponentInstance(vnode)).toThrow(
        'Expected vnode.type to be a function',
      );
    });

    it('should handle component props in render', () => {
      const Component = (props: { value: string }) =>
        createElement('div', null, props.value);
      const vnode = createElement(Component, {
        value: 'test',
      }) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      const result = instance.render();

      expect(result).toEqual(
        expect.objectContaining({
          type: 'div',
          children: ['test'],
        }),
      );
    });

    it('should reset currentHook on each render', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      instance.currentHook = 5;

      instance.render();
      expect(instance.currentHook).toBe(0);
    });

    it('should manage component lifecycle with runtime functions', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      instance.render();

      expect(setCurrentComponent).toHaveBeenCalledWith(instance);
      expect(resetCurrentComponent).toHaveBeenCalled();
    });

    it('should handle render errors', () => {
      const Component = (): never => {
        throw new Error('Test error');
      };
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      expect(() => instance.render()).toThrow('Test error');
    });

    it('should handle components without props', () => {
      const Component = () => createElement('div', null);
      const vnode = {
        type: Component,
        props: {},
        children: [],
      } as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      const result = instance.render();

      expect(result).toEqual(
        expect.objectContaining({
          type: 'div',
          props: {},
          children: [],
        })
      );
    });

    it("should handle null/undefined props", () => {
      const Component = (props: { value?: string }) =>
        createElement('div', null, props.value);
      const vnode = createElement(Component, null) as VNode<FunctionalComponent>;

      const instance = createFunctionalComponentInstance(vnode);
      const result = instance.render();
      expect(result).toEqual(
        expect.objectContaining({
          type: 'div',
          children: [undefined]
        })
      );
    });

    it("should reuse cached instance for same vnode", () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(Component, null) as VNode<FunctionalComponent>;

      const instance1 = createFunctionalComponentInstance(vnode);
      const instance2 = createFunctionalComponentInstance(vnode);

      expect(instance1).toBe(instance2);
    });

    it("should handle DOM node cleanup", () => {
      const element = document.createElement('div');
      const Component = () => createElement('div', null);
      const vnode = createElement(Component, null) as VNode<FunctionalComponent>;
      const instance = createFunctionalComponentInstance(vnode);

      domToInstanceMap.set(element, instance);
      expect(domToInstanceMap.get(element)).toBe(instance);

      domToInstanceMap.delete(element);
      expect(domToInstanceMap.get(element)).toBeUndefined();
    });
  });

  describe('Instance Maps', () => {
    it('should maintain DOM to instance mapping', () => {
      const element = document.createElement('div');
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;
      const instance = createFunctionalComponentInstance(vnode);

      domToInstanceMap.set(element, instance);
      expect(domToInstanceMap.get(element)).toBe(instance);
    });

    it('should handle text nodes in DOM mapping', () => {
      const textNode = document.createTextNode('test');
      const Component = () => createElement('div', null);
      const vnode = createElement(
        Component,
        null,
      ) as VNode<FunctionalComponent>;
      const instance = createFunctionalComponentInstance(vnode);

      domToInstanceMap.set(textNode, instance);
      expect(domToInstanceMap.get(textNode)).toBe(instance);
    });
  });
});
