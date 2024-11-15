import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, Fragment, render, diff } from '../src';

describe('Fragment Handling', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render fragments with multiple children', () => {
    const vnode = createElement(
      'div',
      null,
      createElement(
        Fragment,
        null,
        createElement('span', null, '1'),
        createElement('span', null, '2')
      )
    );

    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      const spans = container.querySelectorAll('span');
      expect(spans.length).toBe(2);
      expect(container.textContent).toBe('12');
    }
  });

  it('should update fragments correctly', () => {
    const oldVNode = createElement(Fragment, null,
      createElement('div', null, 'old1'),
      createElement('div', null, 'old2')
    );
    const newVNode = createElement(Fragment, null,
      createElement('div', null, 'new1'),
      createElement('div', null, 'new2')
    );

    const dom = render(oldVNode);
    if (dom) {
      container.appendChild(dom);
      diff(newVNode, oldVNode, container, 0);
      expect(container.textContent).toBe('new1new2');
    }
  });
});