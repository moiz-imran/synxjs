import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, render, diff } from '../src';
import { useEffect } from '../../hooks/src';
import { FunctionalComponent } from '@synxjs/types';
import { runEffects } from '@synxjs/runtime';

describe('Component Lifecycle', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle component unmounting', async () => {
    const cleanup = vi.fn();
    const Component = () => {
      useEffect(() => {
        return cleanup;
      }, []);
      return createElement('div', null, 'Test');
    };

    const vnode = createElement(Component as FunctionalComponent, {});
    const dom = render(vnode);

    // Run any pending effects
    runEffects();

    if (dom) {
      container.appendChild(dom);

      // Unmount
      diff(null, vnode, container, 0);

      expect(cleanup).toHaveBeenCalled();
    }
  });

  it('should handle effect cleanup on re-render', async () => {
    const cleanup = vi.fn();
    const Component = ({ value }: { value: string }) => {
      useEffect(() => {
        return cleanup;
      }, [value]);
      return createElement('div', null, value);
    };

    const initialVNode = createElement(
      Component as FunctionalComponent<{ value: string }>,
      { value: 'initial' },
    );
    const dom = render(initialVNode);

    // Run any pending effects
    runEffects();

    if (dom) {
      container.appendChild(dom);
      expect(cleanup).not.toHaveBeenCalled();

      // Update with new props
      const updatedVNode = createElement(
        Component as FunctionalComponent<{ value: string }>,
        { value: 'updated' },
      );

      diff(updatedVNode, initialVNode, container, 0);

      expect(cleanup).toHaveBeenCalled();
    }
  });
});
