import { describe, it, expect } from 'vitest';
import { createElement, Fragment, isVNode, isFunctionalComponent, isFragment } from '../src';

describe('createElement utilities', () => {
  it('should correctly identify VNodes', () => {
    const vnode = createElement('div', null);
    const nonVNode = { foo: 'bar' };

    expect(isVNode(vnode)).toBe(true);
    expect(isVNode(nonVNode)).toBe(false);
    expect(isVNode(null)).toBe(false);
  });

  it('should correctly identify functional components', () => {
    const FuncComponent = () => createElement('div', null);
    const nonFuncComponent = 'div';

    expect(isFunctionalComponent(FuncComponent)).toBe(true);
    expect(isFunctionalComponent(nonFuncComponent)).toBe(false);
  });

  it('should correctly identify fragments', () => {
    const fragmentNode = createElement(Fragment, null);
    const nonFragmentNode = createElement('div', null);

    expect(isFragment(fragmentNode)).toBe(true);
    expect(isFragment(nonFragmentNode)).toBe(false);
  });
});