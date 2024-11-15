import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, render } from '../src';

describe('Error Boundaries', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

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