import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../src';
import type { VNode, FunctionalComponent } from '@synxjs/types';

describe('Server-Side Rendering', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should render a simple element to string', async () => {
    const vnode: VNode = {
      type: 'div',
      props: { className: 'test' },
      children: ['Hello'],
    };

    const html = await renderToString(vnode);
    expect(html).toBe('<div class="test">Hello</div>');
  });

  it('should render nested elements', async () => {
    const vnode: VNode = {
      type: 'div',
      props: { className: 'parent' },
      children: [
        {
          type: 'span',
          props: { className: 'child' },
          children: ['Nested'],
        },
      ],
    };

    const html = await renderToString(vnode);
    expect(html).toBe(
      '<div class="parent"><span class="child">Nested</span></div>',
    );
  });

  it('should render functional components', async () => {
    const Child: FunctionalComponent<{ name: string }> = ({ name }) => ({
      type: 'span',
      props: {},
      children: [`Hello ${name}`],
    });

    const Parent: FunctionalComponent = () => ({
      type: 'div',
      props: {},
      children: [
        {
          type: Child,
          props: { name: 'World' },
          children: [],
        },
      ],
    });

    const html = await renderToString({
      type: Parent,
      props: {},
      children: [],
    });
    expect(html).toBe('<div><span>Hello World</span></div>');
  });

  it('should handle void elements correctly', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'img',
          props: { src: 'test.jpg', alt: 'Test' },
          children: [],
        },
        {
          type: 'input',
          props: { type: 'text', value: 'test' },
          children: [],
        },
      ],
    };

    const html = await renderToString(vnode);
    expect(html).toBe(
      '<div><img src="test.jpg" alt="Test"><input type="text" value="test"></div>',
    );
  });

  it('should escape text content', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['<script>alert("xss")</script>'],
    };

    const html = await renderToString(vnode);
    expect(html).toBe(
      '<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>',
    );
  });

  it('should handle boolean attributes', async () => {
    const vnode: VNode = {
      type: 'button',
      props: {
        disabled: true,
        hidden: false,
        required: true,
      },
      children: ['Submit'],
    };

    const html = await renderToString(vnode);
    expect(html).toBe('<button disabled required>Submit</button>');
  });

  it('should handle arrays of children', async () => {
    const items = ['One', 'Two', 'Three'];
    const vnode: VNode = {
      type: 'ul',
      props: {},
      children: items.map((item) => ({
        type: 'li',
        props: {},
        children: [item],
        key: item,
      })),
    };

    const html = await renderToString(vnode);
    expect(html).toBe('<ul><li>One</li><li>Two</li><li>Three</li></ul>');
  });

  describe('Error Handling', () => {
    it('should handle errors in functional components', async () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      const vnode: VNode = {
        type: ErrorComponent,
        props: {},
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div class="error">Component error</div>');
    });

    it('should handle non-Error throws', async () => {
      const ErrorComponent = () => {
        throw 'String error'; // Intentionally throwing non-Error
      };

      const vnode: VNode = {
        type: ErrorComponent,
        props: {},
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div class="error">An unknown error occurred</div>');
    });
  });

  describe('Void Elements', () => {
    it('should render void elements without closing tags', async () => {
      const voidElements = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ];

      for (const element of voidElements) {
        const vnode: VNode = {
          type: element,
          props: { class: 'test' },
          children: ['This should be ignored'],
        };

        const html = await renderToString(vnode);
        expect(html).toBe(`<${element} class="test">`);
      }
    });

    it('should handle void elements with array children', async () => {
      const vnode: VNode = {
        type: 'img',
        props: { src: 'test.jpg' },
        children: [
          'ignored',
          { type: 'span', props: {}, children: ['ignored'] },
        ],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<img src="test.jpg">');
    });
  });

  describe('Props Normalization', () => {
    it('should handle boolean attributes', async () => {
      const vnode: VNode = {
        type: 'input',
        props: {
          disabled: true,
          required: false,
          checked: true,
        },
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<input disabled checked>');
    });

    it('should handle null and undefined props', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {
          id: null,
          class: undefined,
          'data-test': '',
        },
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div data-test=""></div>');
    });

    it('should convert camelCase props to kebab-case', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {
          dataTestId: 'test',
          ariaLabel: 'label',
          backgroundColor: 'red',
        },
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toContain('data-test-id="test"');
      expect(html).toContain('aria-label="label"');
      expect(html).toContain('background-color="red"');
    });
  });

  describe('Mixed Children Types', () => {
    it('should handle mixed children types in arrays', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {},
        children: [
          'text',
          123,
          { type: 'span', props: {}, children: ['element'] },
        ],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div>text123<span>element</span></div>');
    });

    it('should handle null and undefined in children array', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {},
        children: [
          null,
          undefined,
          'valid text',
          { type: 'span', props: {}, children: ['valid element'] },
        ],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div>valid text<span>valid element</span></div>');
    });

    it('should handle empty arrays as children', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {},
        children: [],
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div></div>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle void elements with primitive children', async () => {
      // Test both string and number children
      const stringChild: VNode = {
        type: 'input',
        props: { type: 'text' },
        children: ['ignored text'],
      };

      const numberChild: VNode = {
        type: 'img',
        props: { src: 'test.jpg' },
        children: [123],
      };

      const htmlString = await renderToString(stringChild);
      const htmlNumber = await renderToString(numberChild);

      expect(htmlString).toBe('<input type="text">');
      expect(htmlNumber).toBe('<img src="test.jpg">');
    });

    it('should handle non-array, non-primitive children', async () => {
      const vnode: VNode = {
        type: 'div',
        props: {},
        children: { toString: () => 'object child' } as any
      };

      const html = await renderToString(vnode);
      expect(html).toBe('<div>object child</div>');
    });
  });
});
