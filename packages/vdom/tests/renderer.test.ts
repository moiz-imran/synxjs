import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, render, renderApp } from '../src';
import { FunctionalComponent } from '@synxjs/types';
import { useEffect } from '../../hooks/src';

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
    const vnode = createElement(
      'div',
      null,
      createElement('span', null, '1'),
      createElement('span', null, '2'),
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

  it('should handle null/undefined/boolean nodes', () => {
    expect(render(null)).toBeNull();
    expect(render(true as any)).toBeNull();
    expect(render(false as any)).toBeNull();
  });

  it('should handle error in component render', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    const dom = render(
      createElement(ErrorComponent as FunctionalComponent, null),
    );
    expect(dom?.textContent).toContain('Error caught');
  });

  it('should handle component instance cache', () => {
    const Component = () => createElement('div', null);
    const vnode = createElement(Component as FunctionalComponent, null);
    const dom1 = render(vnode);
    const dom2 = render(vnode);

    expect(dom1).toEqual(dom2);
  });

  it('should handle renderApp with existing content', () => {
    container.innerHTML = '<div>Old content</div>';
    const App = () => createElement('div', null, 'New content');
    const vnode = createElement(App, null);

    renderApp(container, vnode);
    expect(container.innerHTML).toBe('<div>New content</div>');
  });

  it('should handle renderApp with error boundary', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    const vnode = createElement(ErrorComponent as FunctionalComponent, null);

    renderApp(container, vnode);
    expect(container.textContent).toContain('Error caught');
  });

  it('should handle multiple renders of same component', () => {
    const Component = () => createElement('div', { id: 'test' }, 'content');
    const vnode = createElement(Component as FunctionalComponent, null);

    const dom1 = render(vnode);
    container.appendChild(dom1!);
    const dom2 = render(vnode);
    container.appendChild(dom2!);

    const elements = container.querySelectorAll('#test');
    expect(elements.length).toBe(2);
  });

  it('should handle component with null render result', () => {
    const Component = () => null;
    const vnode = createElement(
      Component as unknown as FunctionalComponent,
      null,
    );
    const result = render(vnode);
    expect(result).toBeNull();
  });

  it('should handle null root container', () => {
    const vnode = createElement('div', null);
    expect(() => renderApp(null as any, vnode)).toThrow();
  });

  it('should handle error in component render', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    renderApp(container, createElement(ErrorComponent, null));
    expect(container.textContent).toContain('Error caught');
  });
});

describe('Renderer Advanced Cases', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
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
    if (dom) {
      container.appendChild(dom);
      expect(container.innerHTML).toBe(
        '<div><span>1</span><span>2</span><span>3</span></div>',
      );
    }
  });

  it('should handle boolean nodes', () => {
    const vnode = createElement('div', null, true);
    const result = render(vnode);
    expect(result instanceof HTMLDivElement).toBe(true);
  });
});
