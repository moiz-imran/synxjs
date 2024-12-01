import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../src/render';
import type { VNode } from '@synxjs/types';
import { enableServerMode } from '@synxjs/reactivity';

describe('Server-Side Rendering', () => {
  beforeEach(() => {
    enableServerMode();
  });

  it('should render primitive values', async () => {
    expect(await renderToString({ type: 'text', props: {}, children: ['text'] })).toBe('text');
    expect(await renderToString({ type: 'text', props: {}, children: [123] })).toBe('123');
    expect(await renderToString({ type: 'text', props: {}, children: [''] })).toBe('');
  });

  it('should escape HTML in text content', async () => {
    const text = '<script>alert("xss")</script>';
    expect(await renderToString({ type: 'text', props: {}, children: [text] })).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should render a simple element', async () => {
    const vnode: VNode = {
      type: 'div',
      props: { className: 'test' },
      children: ['Hello']
    };

    expect(await renderToString(vnode)).toBe('<div class="test">Hello</div>');
  });

  it('should handle void elements', async () => {
    const vnode: VNode = {
      type: 'img',
      props: { src: 'test.jpg', alt: 'Test' },
      children: []
    };

    expect(await renderToString(vnode)).toBe('<img src="test.jpg" alt="Test">');
  });

  it('should normalize props correctly', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {
        className: 'test',
        dataTestId: 'test-id',
        onClick: () => {},
        disabled: true,
        hidden: false
      },
      children: []
    };

    const html = await renderToString(vnode);
    expect(html).toContain('class="test"');
    expect(html).toContain('data-test-id="test-id"');
    expect(html).toContain('disabled');
    expect(html).not.toContain('hidden');
    expect(html).not.toContain('onClick');
  });

  it('should handle nested elements', async () => {
    const vnode: VNode = {
      type: 'div',
      props: { className: 'parent' },
      children: [{
        type: 'span',
        props: { className: 'child' },
        children: ['Nested']
      }]
    };

    expect(await renderToString(vnode)).toBe(
      '<div class="parent"><span class="child">Nested</span></div>'
    );
  });

  it('should handle functional components', async () => {
    const Child = ({ name }: { name: string }) => ({
      type: 'span',
      props: {},
      children: [`Hello ${name}`]
    });

    const Parent = () => ({
      type: 'div',
      props: {},
      children: [{
        type: Child,
        props: { name: 'World' },
        children: []
      }]
    });

    const vnode: VNode = {
      type: Parent,
      props: {},
      children: []
    };

    expect(await renderToString(vnode)).toBe(
      '<div><span>Hello World</span></div>'
    );
  });

  it('should handle null and undefined gracefully', async () => {
    expect(await renderToString(null as any)).toBe('');
    expect(await renderToString(undefined as any)).toBe('');
  });

  it('should handle arrays of children', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: [
        'Text',
        { type: 'span', props: {}, children: ['1'] },
        { type: 'span', props: {}, children: ['2'] }
      ]
    };

    expect(await renderToString(vnode)).toBe(
      '<div>Text<span>1</span><span>2</span></div>'
    );
  });
});
