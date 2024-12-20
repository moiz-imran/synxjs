import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, diff, render } from '../src';
import type { FunctionalComponent, VNode } from '@synxjs/types';
import { createFunctionalComponentInstance } from '@synxjs/instance';

describe('Diff', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Clear any pending effects/timers
    vi.useFakeTimers();
    await Promise.resolve();
  });

  afterEach(async () => {
    document.body.removeChild(container);
    // Clean up any remaining effects/timers
    await vi.runAllTimersAsync();
    await Promise.resolve();
  });

  describe('Text Updates', () => {
    it('should update text content in elements', () => {
      const oldVNode = createElement('div', null, 'Old Text');
      const newVNode = createElement('div', null, 'New Text');
      const dom = document.createElement('div');
      dom.textContent = 'Old Text';
      container.appendChild(dom);

      diff(newVNode, oldVNode, container, 0);
      expect(container.textContent).toBe('New Text');
    });

    it('should update direct text nodes', () => {
      const oldText = document.createTextNode('old');
      container.appendChild(oldText);

      diff(
        createElement('span', null, 'new'),
        createElement('span', null, 'old'),
        container,
      );
      expect(container.textContent).toBe('new');
    });
  });

  describe('Element Updates', () => {
    it('should handle replacing elements of different types', () => {
      const oldVNode = createElement('div', null, 'old');
      const newVNode = createElement('span', null, 'new');
      const dom = document.createElement('div');
      dom.textContent = 'old';
      container.appendChild(dom);

      diff(newVNode, oldVNode, container, 0);
      expect(container.innerHTML).toBe('<span>new</span>');
    });

    it('should handle null/undefined vnodes', () => {
      const vnode = createElement('div', null, 'test');
      const dom = document.createElement('div');
      container.appendChild(dom);

      diff(null, vnode, container);
      expect(container.children.length).toBe(0);
    });
  });

  describe('Component Updates', () => {
    it('should handle nested component updates', async () => {
      const Child = ({ value }: { value: string }) => {
        return createElement('span', { className: 'child' }, value);
      };

      const Parent = ({ value }: { value: string }) => {
        return createElement(
          'div',
          { className: 'parent' },
          createElement(Child, { value }),
        );
      };

      const oldVNode = createElement(Parent as FunctionalComponent, {
        value: 'old',
      });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        await vi.runAllTimersAsync();

        const newVNode = createElement(Parent as FunctionalComponent, {
          value: 'new',
        });
        diff(newVNode, oldVNode, container, 0);
        await vi.runAllTimersAsync();

        expect(container.innerHTML).toBe(
          '<div class="parent"><span class="child">new</span></div>',
        );
      }
    });
  });

  describe('Component Diffing', () => {
    it('should handle nested functional component updates', async () => {
      const ChildComponent = () => {
        return createElement('span', null, 'child');
      };

      const ParentComponent = () => {
        return createElement('div', null, createElement(ChildComponent, null));
      };

      const oldVNode = createElement(
        ParentComponent as FunctionalComponent,
        null,
      );
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        await vi.runAllTimersAsync();
        await Promise.resolve();

        const newVNode = createElement(
          ParentComponent as FunctionalComponent,
          null,
        );
        diff(newVNode, oldVNode, container, 0);
        await vi.runAllTimersAsync();
        await Promise.resolve();

        expect(container.innerHTML).toBe('<div><span>child</span></div>');
      }
    });

    it('should handle component instance updates', async () => {
      const Component = ({ value }: { value: string }) => {
        return createElement('div', null, value);
      };

      const oldVNode = createElement(Component as FunctionalComponent, {
        value: 'old',
      });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        await vi.runAllTimersAsync();
        await Promise.resolve();

        const newVNode = createElement(Component as FunctionalComponent, {
          value: 'new',
        });
        diff(newVNode, oldVNode, container, 0);
        await vi.runAllTimersAsync();
        await Promise.resolve();

        expect(container.textContent).toBe('new');
      }
    });
  });

  describe('Children Diffing', () => {
    it('should handle child removal', () => {
      const oldVNode = createElement(
        'div',
        null,
        createElement('span', null, '1'),
        createElement('span', null, '2'),
      );
      const newVNode = createElement(
        'div',
        null,
        createElement('span', null, '1'),
      );

      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        diff(newVNode, oldVNode, container, 0);
        expect(container.querySelectorAll('span').length).toBe(1);
      }
    });

    it('should handle text node replacement', () => {
      const oldVNode = createElement('div', null, 'old');
      const newVNode = createElement(
        'div',
        null,
        createElement('span', null, 'new'),
      );

      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        diff(newVNode, oldVNode, container, 0);
        expect(container.innerHTML).toBe('<div><span>new</span></div>');
      }
    });
  });

  describe('Diff Complex Cases', () => {
    it('should handle nested functional component replacement', async () => {
      const FirstChild = () => createElement('span', null, 'first');
      const SecondChild = () => createElement('span', null, 'second');
      const Parent = ({ useFirst = true }) =>
        createElement(
          'div',
          null,
          createElement(useFirst ? FirstChild : SecondChild, null),
        );

      const oldVNode = createElement(Parent as FunctionalComponent, {
        useFirst: true,
      });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        await vi.runAllTimersAsync();
        expect(container.textContent).toBe('first');

        const newVNode = createElement(Parent as FunctionalComponent, {
          useFirst: false,
        });
        diff(newVNode, oldVNode, container, 0);
        await vi.runAllTimersAsync();
        expect(container.textContent).toBe('second');
      }
    });

    it('should handle deep component updates', async () => {
      const DeepChild = ({ value }: { value: string }) =>
        createElement('span', null, value);
      const MiddleComponent = ({ value }: { value: string }) =>
        createElement('div', null, createElement(DeepChild, { value }));
      const TopComponent = ({ value }: { value: string }) =>
        createElement(MiddleComponent, { value });

      const oldVNode = createElement(TopComponent as FunctionalComponent, {
        value: 'old',
      });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        await vi.runAllTimersAsync();

        const newVNode = createElement(TopComponent as FunctionalComponent, {
          value: 'new',
        });
        diff(newVNode, oldVNode, container, 0);
        await vi.runAllTimersAsync();

        expect(container.innerHTML).toBe('<div><span>new</span></div>');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle component with no dom', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(Component as FunctionalComponent, null);
      const dom = render(vnode);
      if (dom) {
        // dom.remove();
        diff(vnode, null, container, 0);
        // Should not throw
      }
    });

    it('should handle error in component render', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      const vnode = createElement(ErrorComponent as FunctionalComponent, null);
      diff(vnode, null, container, 0);
      expect(container.textContent).toContain('Error caught');
    });

    it('should handle text node updates', () => {
      container.appendChild(document.createTextNode('old'));
      diff(
        createElement('span', null, 'new'),
        createElement('span', null, 'old'),
        container,
        0,
      );
      expect(container.textContent).toBe('new');
    });
  });

  describe('Advanced Diff Cases', () => {
    it('should handle null parent with existing element', () => {
      const element = document.createElement('div');
      const vnode = createElement('div', null);
      diff(vnode, null, element as any, 0);
      // Should not throw
    });

    it('should handle component update with no dom', () => {
      const Component = () => createElement('div', null);
      const oldVNode = createElement(Component as FunctionalComponent, null);
      const newVNode = createElement(Component as FunctionalComponent, null);
      const instance = createFunctionalComponentInstance(
        oldVNode as VNode<FunctionalComponent>,
      );
      instance.dom = null;
      diff(newVNode, oldVNode, container, 0);
      // Should not throw
    });

    it('should handle text node updates with no existing element', () => {
      const textNode = document.createTextNode('old');
      container.appendChild(textNode);
      diff(
        createElement('span', null, 'new'),
        createElement('span', null, 'old'),
        container,
        1,
      ); // Use index where no element exists
      expect(container.textContent).toBe('oldnew');
    });

    it('should handle component with changed props', () => {
      const Component = ({ value }: { value: string }) =>
        createElement('div', null, value);

      const oldVNode = createElement(Component as FunctionalComponent, {
        value: 'old',
      });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        const newVNode = createElement(Component as FunctionalComponent, {
          value: 'new',
        });
        diff(newVNode, oldVNode, container, 0);
        expect(container.textContent).toBe('new');
      }
    });
  });

  describe('Component Behavior', () => {
    it('should maintain state through route changes', async () => {
      const Counter = ({ count }: { count: number }) =>
        createElement('div', null, `Count: ${count}`);

      // First render
      const initialVNode = createElement(Counter as FunctionalComponent, { count: 0 });
      const dom = render(initialVNode);
      if (dom) {
        container.appendChild(dom);
        expect(container.textContent).toBe('Count: 0');

        // Simulate unmount (route change away)
        diff(null, initialVNode, container, 0);

        // Simulate remount (route change back)
        const remountVNode = createElement(Counter as FunctionalComponent, { count: 0 });
        diff(remountVNode, null, container, 0);

        expect(container.textContent).toBe('Count: 0');
      }
    });
  });

  describe('Diff Edge Cases', () => {
    it('should handle cleanup of removed components', () => {
      const Component = () => createElement('div', null);
      const vnode = createElement(Component, null);
      const dom = render(vnode);
      if (dom) container.appendChild(dom);

      diff(null, vnode, container);
      expect(container.children.length).toBe(0);
    });

    it('should handle component replacement', () => {
      const OldComponent = () => createElement('div', null, 'old');
      const NewComponent = () => createElement('div', null, 'new');

      const oldVNode = createElement(OldComponent, null);
      const dom = render(oldVNode);
      if (dom) container.appendChild(dom);

      const newVNode = createElement(NewComponent, null);
      diff(newVNode, oldVNode, container);
      expect(container.textContent).toBe('new');
    });

    it('should handle text node replacement with element', () => {
      container.appendChild(document.createTextNode('old'));
      const newVNode = createElement('div', null, 'new');
      diff(newVNode, null, container);
      expect(container.innerHTML).toBe('<div>new</div>');
    });

    it('should handle element removal with listeners', () => {
      const handler = vi.fn();
      const vnode = createElement('button', { onClick: handler }, 'Click');
      const dom = render(vnode);
      if (dom) container.appendChild(dom);

      diff(null, vnode, container);
      expect(container.children.length).toBe(0);
    });
  });
});
