import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, render, diff } from '../src';
import { useEffect } from '../../hooks/src';
import { runEffects } from '@synxjs/runtime';

describe('Component Behavior', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Event Handling', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      const vnode = createElement('button', { onClick: handleClick }, 'Click me');
      const dom = render(vnode);
      if (dom) {
        container.appendChild(dom);
        (dom as HTMLElement).click();
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should properly remove old event listeners', () => {
      const oldHandler = vi.fn();
      const newHandler = vi.fn();
      const oldVNode = createElement('button', { onClick: oldHandler }, 'Click');
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        const newVNode = createElement('button', { onClick: newHandler }, 'Click');
        diff(newVNode, oldVNode, container);
        (dom as HTMLElement).click();
        expect(oldHandler).not.toHaveBeenCalled();
        expect(newHandler).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Component Updates', () => {
    it('should update when props change', () => {
      const Counter = ({ count }: { count: number }) =>
        createElement('div', null, `Count: ${count}`);

      const initialVNode = createElement(Counter, { count: 0 });
      const dom = render(initialVNode);
      if (dom) {
        container.appendChild(dom);
        const updatedVNode = createElement(Counter, { count: 1 });
        diff(updatedVNode, initialVNode, container, 0);
        expect(container.textContent).toBe('Count: 1');
      }
    });

    it('should handle effect cleanup', () => {
      const cleanup = vi.fn();
      const Component = ({ value }: { value: string }) => {
        useEffect(() => cleanup, [value]);
        return createElement('div', null, value);
      };

      const initialVNode = createElement(Component, { value: 'initial' });
      const dom = render(initialVNode);

      // Run any pending effects
      runEffects();

      if (dom) {
        container.appendChild(dom);
        const updatedVNode = createElement(Component, { value: 'updated' });
        diff(updatedVNode, initialVNode, container, 0);
        expect(cleanup).toHaveBeenCalled();
      }
    });
  });
});
