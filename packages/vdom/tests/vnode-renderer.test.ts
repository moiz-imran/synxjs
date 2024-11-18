import { createFunctionalComponentInstance } from '@synxjs/instance';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { createElement, renderVNode } from '../src';
import { FunctionalComponent, VNode } from '@synxjs/types';

describe('VNode Renderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle parent instance DOM assignment', () => {
    const Component = () => createElement('div', null, 'test');
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    const dom = renderVNode(createElement('div', null), instance);
    expect(dom).toBeTruthy();
    expect(instance.dom).toBe(dom);
  });
  it('should handle null children in element vnode', () => {
    const vnode = {
      type: 'div',
      props: {},
      children: [],
    } as VNode<string>;

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLDivElement).toBe(true);
    expect(dom?.childNodes.length).toBe(0);
  });
});

describe('VNode Renderer Edge Cases', () => {
  it('should handle component with no dom', () => {
    const Component = () => null;
    const vnode = createElement(
      Component as unknown as FunctionalComponent,
      null,
    );
    const dom = renderVNode(vnode);
    console.log(dom);
    expect(dom).toBeNull();
  });

  it('should handle element with no children', () => {
    const vnode = {
      type: 'div',
      props: {},
      children: [],
    } as VNode;
    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLDivElement).toBe(true);
  });
});
