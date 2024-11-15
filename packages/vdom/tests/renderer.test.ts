import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, render, renderApp } from '../src';

describe('Renderer Edge Cases', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle null/undefined/boolean children', () => {
    const vnode = createElement('div', null, null, undefined, true, false);
    const dom = render(vnode);
    if (dom) container.appendChild(dom);
    expect(container.innerHTML).toBe('<div></div>');
  });

  it('should handle renderApp with complex component', () => {
    const App = () => createElement('div', null, 'Hello App');
    const vnode = createElement(App, null);

    renderApp(container, vnode);
    expect(container.innerHTML).toBe('<div>Hello App</div>');
  });

  it('should handle nested arrays of children', () => {
    const items = ['1', '2', '3'];
    const vnode = createElement(
      'div',
      null,
      ...items.map((item) => createElement('span', null, item)),
    );

    const dom = render(vnode);
    if (dom) container.appendChild(dom);
    expect(container.innerHTML).toBe(
      '<div><span>1</span><span>2</span><span>3</span></div>',
    );
  });

  it('should handle boolean nodes', () => {
    const vnode = createElement('div', null, true);
    const result = render(vnode);
    expect(result instanceof HTMLDivElement).toBe(true);
  });
  it('should handle children arrays correctly', () => {
    const vnode = createElement('div', null,
      createElement('span', null, '1'),
      createElement('span', null, '2')
    );

    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      expect(container.querySelectorAll('span').length).toBe(2);
    }
  });

  it('should handle non-array children', () => {
    const vnode = createElement('div', null, 'single child');
    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      expect(container.textContent).toBe('single child');
    }
  });

  it('should handle undefined/null children', () => {
    const vnode = createElement('div', { children: undefined });
    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      expect(container.innerHTML).toBe('<div></div>');
    }
  });
});
