import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, diff, render } from '../src';
import { FunctionalComponent, VNode } from '@synxjs/types';

describe('Edge Cases', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Children Handling', () => {
    it('should handle all falsy children types', () => {
      const vnode = createElement('div', null, null, undefined, false, 0);
      const dom = render(vnode);
      if (dom) {
        container.appendChild(dom);
        expect(container.innerHTML).toBe('<div>0</div>');
      }
    });

    it('should handle mixed children types', () => {
      const vnode = createElement('div', null,
        'text',
        createElement('span', null),
        null,
        42
      );
      const dom = render(vnode);
      if (dom) {
        container.appendChild(dom);
        expect(container.textContent).toBe('text42');
        expect(container.querySelector('span')).toBeTruthy();
      }
    });
  });

  describe('Props Handling', () => {
    it('should handle undefined props', () => {
      const vnode = createElement('div', { className: undefined });
      const dom = render(vnode);
      if (dom) {
        container.appendChild(dom);
        expect(container.innerHTML).toBe('<div></div>');
      }
    });
  });

  describe('Error Handling', () => {
    it('should catch errors in child components', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      const ErrorBoundary = ({ children }: { children: any }) => {
        try {
          return children;
        } catch (error) {
          return createElement('div', null, 'Error caught');
        }
      };

      const vnode = createElement(ErrorBoundary, null,
        createElement(ErrorComponent, null)
      );
      const dom = render(vnode);
      if (dom) {
        container.appendChild(dom);
        expect(container.textContent).toBe('Error caught');
      }
    });
  });

  it('should handle component with null render result', () => {
    const Component = (): VNode | null => null;
    const vnode = createElement(Component as FunctionalComponent, null);
    const dom = render(vnode);
    expect(dom).toBe(null);
  });

  it('should handle replacing text with element', () => {
    const oldVNode = createElement('span', null, 'text');
    const newVNode = createElement('div', null, 'new');

    const textNode = document.createTextNode('text');
    container.appendChild(textNode);

    diff(newVNode, oldVNode, container, 0);
    expect(container.innerHTML).toBe('<div>new</div>');
  });

  it('should handle undefined children in diffing', () => {
    const oldVNode = createElement('div', null, undefined);
    const newVNode = createElement('div', null, 'text');

    const dom = render(oldVNode);
    if (dom) {
      container.appendChild(dom);
      diff(newVNode, oldVNode, container, 0);
      expect(container.textContent).toBe('text');
    }
  });
});