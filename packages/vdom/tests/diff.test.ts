import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, diff, render } from '../src';
import type { FunctionalComponent } from '@synxjs/types';

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
});
