import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, diff, render } from '../src';

describe('Diff', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
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
    it('should handle functional component cleanup', () => {
      const Component = () => createElement('div', null, 'test');
      const vnode = createElement(Component, null);
      const dom = document.createElement('div');
      container.appendChild(dom);

      diff(vnode, null, container);
      expect(container.textContent).toBe('test');

      diff(null, vnode, container);
      expect(container.children.length).toBe(0);
    });

    it('should handle nested component updates', () => {
      const Child = ({ value }: { value: string }) =>
        createElement('span', null, value);
      const Parent = ({ value }: { value: string }) =>
        createElement('div', null, createElement(Child, { value }));

      const oldVNode = createElement(Parent, { value: 'old' });
      const newVNode = createElement(Parent, { value: 'new' });

      diff(newVNode, oldVNode, container, 0);
      expect(container.textContent).toBe('new');
    });
  });

  describe('Component Diffing', () => {
    it('should handle nested functional component updates', () => {
      const ChildComponent = () => createElement('span', null, 'child');
      const ParentComponent = () => createElement('div', null, createElement(ChildComponent, null));

      const oldVNode = createElement(ParentComponent, null);
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);

        const newVNode = createElement(ParentComponent, null);
        diff(newVNode, oldVNode, container, 0);

        expect(container.innerHTML).toBe('<div><span>child</span></div>');
      }
    });

    it('should handle component instance updates', () => {
      const Component = ({ value }: { value: string }) =>
        createElement('div', null, value);

      const oldVNode = createElement(Component, { value: 'old' });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);

        const newVNode = createElement(Component, { value: 'new' });
        diff(newVNode, oldVNode, container, 0);

        expect(container.textContent).toBe('new');
      }
    });
  });

  describe('Children Diffing', () => {
    it('should handle child removal', () => {
      const oldVNode = createElement('div', null,
        createElement('span', null, '1'),
        createElement('span', null, '2')
      );
      const newVNode = createElement('div', null,
        createElement('span', null, '1')
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
      const newVNode = createElement('div', null,
        createElement('span', null, 'new')
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
    it('should handle nested functional component replacement', () => {
      const FirstChild = () => createElement('span', null, 'first');
      const SecondChild = () => createElement('span', null, 'second');
      const Parent = ({ useFirst = true }) =>
        createElement('div', null,
          createElement(useFirst ? FirstChild : SecondChild, null)
        );

      // First render
      const oldVNode = createElement(Parent, { useFirst: true });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        expect(container.textContent).toBe('first');

        // Update with different child component
        const newVNode = createElement(Parent, { useFirst: false });
        diff(newVNode, oldVNode, container, 0);
        expect(container.textContent).toBe('second');
      }
    });

    it('should handle component instance dom updates', () => {
      const Child = ({ text }: { text: string }) => createElement('span', null, text);
      const Parent = ({ text }: { text: string }) =>
        createElement('div', null, createElement(Child, { text }));

      // Initial render
      const oldVNode = createElement(Parent, { text: 'old' });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);

        // Update that requires DOM replacement
        const newVNode = createElement(Parent, { text: 'new' });
        diff(newVNode, oldVNode, container, 0);

        expect(container.innerHTML).toBe('<div><span>new</span></div>');
      }
    });

    it('should handle deep component updates', () => {
      const DeepChild = ({ value }: { value: string }) =>
        createElement('span', null, value);
      const MiddleComponent = ({ value }: { value: string }) =>
        createElement('div', null, createElement(DeepChild, { value }));
      const TopComponent = ({ value }: { value: string }) =>
        createElement(MiddleComponent, { value });

      const oldVNode = createElement(TopComponent, { value: 'old' });
      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);

        const newVNode = createElement(TopComponent, { value: 'new' });
        diff(newVNode, oldVNode, container, 0);

        expect(container.innerHTML).toBe('<div><span>new</span></div>');
      }
    });

    it('should handle component replacement with element', () => {
      const Component = () => createElement('div', null, 'component');
      const oldVNode = createElement(Component, null);
      const newVNode = createElement('span', null, 'element');

      const dom = render(oldVNode);
      if (dom) {
        container.appendChild(dom);
        diff(newVNode, oldVNode, container, 0);
        expect(container.innerHTML).toBe('<span>element</span>');
      }
    });
  });
});
