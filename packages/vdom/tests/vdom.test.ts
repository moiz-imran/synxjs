import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, Fragment, render, diff } from '../src';

describe('VDOM Core', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('createElement', () => {
    it('should create a VNode with correct properties', () => {
      const props = { className: 'test', id: 'test-id' };
      const vnode = createElement('div', props, 'Hello');

      expect(vnode).toMatchObject({
        type: 'div',
        props: props,
        children: ['Hello']
      });
    });

    it('should handle Fragment', () => {
      const vnode = createElement(Fragment, null, 'Item 1', 'Item 2');

      expect(vnode).toMatchObject({
        type: Fragment,
        props: {},
        children: ['Item 1', 'Item 2']
      });
    });

    it('should flatten children arrays', () => {
      const vnode = createElement('div', null, 'Item 1', 'Item 2');

      expect(vnode.children).toEqual(['Item 1', 'Item 2']);
    });
  });

  describe('render', () => {
    it('should render a simple element to the DOM', () => {
      const vnode = createElement('div', { className: 'test' }, 'Hello World');
      const dom = render(vnode);
      if (dom) container.appendChild(dom);

      expect(container.innerHTML).toBe('<div class="test">Hello World</div>');
    });

    it('should render nested elements', () => {
      const vnode = createElement(
        'div',
        { className: 'parent' },
        createElement('span', { className: 'child' }, 'Child Text'),
      );

      const dom = render(vnode);
      if (dom) container.appendChild(dom);

      expect(container.innerHTML).toBe(
        '<div class="parent"><span class="child">Child Text</span></div>',
      );
    });
  });

  describe('diff', () => {
    it('should update text content when changed', () => {
      const oldVNode = createElement('div', null, 'Old Text');
      const newVNode = createElement('div', null, 'New Text');

      const dom = render(oldVNode);
      if (dom) container.appendChild(dom);
      diff(newVNode, oldVNode, container);

      expect(container.textContent).toBe('New Text');
    });

    it('should update attributes when changed', () => {
      const oldVNode = createElement('div', { className: 'old' });
      const newVNode = createElement('div', { className: 'new' });

      const dom = render(oldVNode);
      if (dom) container.appendChild(dom);
      diff(newVNode, oldVNode, container);

      expect(container.firstChild).toHaveClass('new');
    });

    it('should remove elements when new vnode is null', () => {
      const oldVNode = createElement('div', null, 'Text');

      const dom = render(oldVNode);
      if (dom) container.appendChild(dom);
      diff(null, oldVNode, container);

      expect(container.children.length).toBe(0);
    });
  });
});
