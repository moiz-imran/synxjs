import { createFunctionalComponentInstance } from '@synxjs/instance';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { createElement, renderVNode, Fragment } from '../src';
import { FunctionalComponent, FunctionalComponentInstance, VNode, VNodeChild, VNodeChildren } from '@synxjs/types';

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

  it('should handle numeric zero values', () => {
    const vnode = createElement('div', null, 0);
    const dom = renderVNode(vnode);
    expect(dom).toBeTruthy();
    expect(dom?.textContent).toBe('0');
  });

  it('should only skip null and undefined', () => {
    const nullVNode = createElement('div', null, null);
    const undefinedVNode = createElement('div', null, undefined);

    expect(renderVNode(nullVNode)?.childNodes?.length).toBe(0);
    expect(renderVNode(undefinedVNode)?.childNodes?.length).toBe(0);
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

describe('Fragment Handling', () => {
  it('should render Fragment with multiple children', () => {
    const vnode = createElement(
      Fragment,
      null,
      createElement('div', null, '1'),
      createElement('div', null, '2')
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(2);
      expect(dom.textContent).toBe('12');
    }
  });

  it('should handle nested Fragments', () => {
    const vnode = createElement(
      Fragment,
      null,
      createElement('div', null, '1'),
      createElement(
        Fragment,
        null,
        createElement('div', null, '2'),
        createElement('div', null, '3')
      )
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      // Since we wrap the fragment in a div, we have 2 children
      expect(dom.children).toHaveLength(2);
      expect(dom.textContent).toBe('123');
    }
  });

  it('should handle Fragment with mixed content', () => {
    const vnode = createElement(
      Fragment,
      null,
      'text',
      createElement('div', null, '1'),
      null,
      undefined,
      createElement('div', null, '2')
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.childNodes).toHaveLength(3); // text node + 2 divs
      expect(dom.textContent).toBe('text12');
    }
  });

  it('should handle Fragment in component return', () => {
    const Component: FunctionalComponent = () =>
      createElement(
        Fragment,
        null,
        createElement('div', null, '1'),
        createElement('div', null, '2')
      );

    const vnode = createElement(Component, null);
    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(2);
      expect(dom.textContent).toBe('12');
    }
  });

  it('should handle empty Fragment', () => {
    const vnode = createElement(Fragment, null);
    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(0);
    }
  });

  it('should handle Fragment with array children', () => {
    const vnode = createElement(
      Fragment,
      null,
      [
        createElement('div', null, '1'),
        createElement('div', null, '2')
      ] as any,
      createElement('div', null, '3')
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(3);
      expect(dom.textContent).toBe('123');
    }
  });

  it('should handle deeply nested Fragments', () => {
    const vnode = createElement(
      Fragment,
      null,
      createElement(
        Fragment,
        null,
        createElement(
          Fragment,
          null,
          createElement('div', null, '1')
        )
      ),
      createElement('div', null, '2')
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(2);
      expect(dom.textContent).toBe('12');
    }
  });

  it('should handle Fragment with component children', () => {
    const ChildComponent: FunctionalComponent = () =>
      createElement('div', null, 'child');

    const vnode = createElement(
      Fragment,
      null,
      createElement(ChildComponent, null),
      createElement('div', null, 'sibling')
    );

    const dom = renderVNode(vnode);
    expect(dom instanceof HTMLElement).toBe(true);
    if (dom instanceof HTMLElement) {
      expect(dom.children).toHaveLength(2);
      expect(dom.textContent).toBe('childsibling');
    }
  });

  it('should maintain parent instance with Fragment', () => {
    const parentInstance = {
      hooks: [],
      currentHook: 0,
      vnode: {} as VNode,
      render: vi.fn(),
      dom: null
    } as FunctionalComponentInstance;

    const vnode = createElement(
      Fragment,
      null,
      createElement('div', null, '1'),
      createElement('div', null, '2')
    );

    const dom = renderVNode(vnode, parentInstance);
    expect(dom instanceof HTMLElement).toBe(true);
    expect(parentInstance.dom).toBe(dom);
  });
});
