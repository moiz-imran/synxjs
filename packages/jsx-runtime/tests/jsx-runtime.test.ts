import { describe, it, expect } from 'vitest';
import { jsx, jsxs, Fragment } from '../src';
import type { FunctionalComponent, VNode, VNodeProps } from '@synxjs/types';

describe('JSX Runtime', () => {
  it('should create element with props', () => {
    const element = jsx('div', { className: 'test' }, null);

    expect(element).toEqual({
      type: 'div',
      props: { className: 'test' },
      children: [],
      key: undefined,
    });
  });

  it('should handle children prop', () => {
    const element = jsx('div', { children: ['test'] }, null);

    expect(element).toEqual({
      type: 'div',
      props: {},
      children: ['test'],
      key: undefined,
    });
  });

  it('should handle key prop', () => {
    const element = jsx('div', { key: 'test-key' }, null);

    expect(element).toEqual({
      type: 'div',
      props: { key: 'test-key' },
      children: [],
      key: 'test-key',
    });
  });

  it('should handle Fragment', () => {
    const element = jsx(
      Fragment as unknown as FunctionalComponent<object>,
      { children: ['item1', 'item2'] },
      null,
    );

    expect(element).toEqual({
      type: Fragment,
      props: {},
      children: ['item1', 'item2'],
      key: undefined,
    });
  });

  it('should handle functional components', () => {
    const Component: FunctionalComponent<object> = () => jsx('div', {}, null);
    const element = jsx(Component, { value: 'test' }, null);

    expect(element).toEqual({
      type: Component,
      props: { value: 'test' },
      children: [],
      key: undefined,
    });
  });

  describe('jsxs', () => {
    it('should handle multiple children', () => {
      const element = jsxs(
        'div',
        {
          children: ['child1', 'child2'],
        },
        null,
      );

      expect(element).toEqual({
        type: 'div',
        props: {},
        children: ['child1', 'child2'],
        key: undefined,
      });
    });
  });
});
