import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  serializeHydrationData,
  generateHydrationScript,
  hydrate,
} from '../src/hydration';

describe('Hydration Data Serialization', () => {
  it('should serialize data with state and timestamp', () => {
    const data = {
      string: 'hello',
      number: 42,
    };

    const result = serializeHydrationData(data);
    const parsed = JSON.parse(result);

    expect(parsed).toMatchObject({
      props: data,
      state: {
        signals: expect.any(Object),
      },
      timestamp: expect.any(Number),
    });
  });

  it('should handle empty data', () => {
    const result = serializeHydrationData({});
    const parsed = JSON.parse(result);

    expect(parsed).toMatchObject({
      props: {},
      state: {
        signals: expect.any(Object),
      },
      timestamp: expect.any(Number),
    });
  });
});

describe('Hydration Script Generation', () => {
  it('should generate escaped data', () => {
    const data = {
      xss: '</script><script>alert("xss")</script>',
    };

    const serialized = generateHydrationScript(data);

    expect(serialized).not.toContain('</script><script>');
    expect(serialized).toContain('\\u003c\\u002fscript\\u003e');
    expect(serialized).toContain('\\u003cscript\\u003e');
  });

  it('should generate valid JavaScript', () => {
    const data = {
      string: 'hello "world"',
      array: [1, 2, 3],
      object: { foo: 'bar' },
    };

    const serialized = generateHydrationScript(data);

    expect(() => {
      // Should be valid JSON
      JSON.parse(serialized);
      // Should be valid when assigned to window.__INITIAL_DATA__
      new Function(`window.__INITIAL_DATA__ = ${serialized}`);
    }).not.toThrow();
  });

  it('should handle nested script tags and HTML', () => {
    const data = {
      nested: {
        html: '<script>alert("nested")</script>',
        text: 'normal text',
        array: ['<script>alert("array")</script>'],
      },
    };

    const serialized = generateHydrationScript(data);

    // Should escape all script tags
    expect(serialized).not.toContain('<script>');
    expect(serialized).not.toContain('</script>');

    // Should use unicode escapes
    expect(serialized).toContain('\\u003cscript\\u003e');
    expect(serialized).toContain('\\u003c\\u002fscript\\u003e');

    // Normal text should be unchanged
    expect(serialized).toContain('normal text');
  });

  it('should handle special JavaScript characters', () => {
    const data = {
      js: {
        template: '${alert("template")}',
        lineTerminator: 'line1\u2028line2\u2029line3',
      },
    };

    const serialized = generateHydrationScript(data);

    // Should escape line terminators
    expect(serialized).toContain('\\u2028');
    expect(serialized).toContain('\\u2029');

    // Template literals are escaped by JSON.stringify
    expect(serialized).toContain('${alert(\\"template\\")}');

    // Verify the result is valid JavaScript
    expect(() => {
      const parsed = JSON.parse(serialized);
      expect(parsed.props.js.template).toBe('${alert("template")}');
      new Function(`window.__INITIAL_DATA__ = ${serialized}`);
    }).not.toThrow();
  });

  it('should handle circular references', () => {
    const circular: any = { foo: 'bar' };
    circular.self = circular;

    expect(() => {
      generateHydrationScript(circular);
    }).toThrow('Converting circular structure to JSON');
  });

  it('should handle non-serializable data types', () => {
    const data = {
      fn: () => {},
      symbol: Symbol('test'),
      normal: 'string',
      num: 123,
    };

    const serialized = generateHydrationScript(data);
    const parsed = JSON.parse(serialized);

    // Functions and symbols should be stripped
    expect(parsed.props.fn).toBeUndefined();
    expect(parsed.props.symbol).toBeUndefined();

    // Normal values should remain
    expect(parsed.props.normal).toBe('string');
    expect(parsed.props.num).toBe(123);
  });
});

describe('Hydration Utilities', () => {
  it('should escape script content correctly', () => {
    const data = {
      script: '</script><script>alert("test")</script>',
      comment: '<!-- comment -->',
      template: '${alert("template")}',
    };

    const serialized = generateHydrationScript(data);

    // Script tags should be escaped
    expect(serialized).toContain('\\u003c\\u002fscript\\u003e');
    expect(serialized).toContain('\\u003cscript\\u003e');

    // Comments should be escaped
    expect(serialized).toContain('\\u003c!--');

    // Template literals are handled by JSON.stringify
    expect(serialized).toContain('${alert(\\"template\\")}');
  });

  it('should escape HTML in strings', () => {
    const data = {
      html: '<div>test</div>',
      nested: {
        html: '<span>nested</span>',
      },
    };

    const serialized = generateHydrationScript(data);

    // HTML should be escaped
    expect(serialized).toContain('\\u003cdiv\\u003e');
    expect(serialized).toContain('\\u003c\\u002fdiv\\u003e');
    expect(serialized).toContain('\\u003cspan\\u003e');
    expect(serialized).toContain('\\u003c\\u002fspan\\u003e');
  });
});

// @vitest-environment jsdom
describe('Client-Side Hydration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should throw if no hydration marker is found', () => {
    const vnode = { type: 'div', props: {}, children: [] };
    expect(() => hydrate(vnode, container)).toThrow(
      'No hydration marker found',
    );
  });

  it('should attach event listeners to matching nodes', () => {
    const clickHandler = vi.fn();
    const changeHandler = vi.fn();

    const vnode = {
      type: 'div',
      props: { onClick: clickHandler },
      children: [
        {
          type: 'input',
          props: { onChange: changeHandler },
          children: [],
        },
      ],
    };

    // Setup DOM with hydration marker
    container.innerHTML = `
      <div data-hydrate="root">
        <div>
          <input />
        </div>
      </div>
    `;

    hydrate(vnode, container);

    // Simulate click event
    const div = container.querySelector(
      'div[data-hydrate] > div',
    ) as HTMLElement;
    div?.click();
    expect(clickHandler).toHaveBeenCalled();

    // Simulate change event
    const input = container.querySelector('input');
    input?.dispatchEvent(new Event('change', { bubbles: true }));
    expect(changeHandler).toHaveBeenCalled();
  });

  it('should handle missing or extra DOM nodes', () => {
    const clickHandler = vi.fn();

    const vnode = {
      type: 'div',
      props: {},
      children: [
        { type: 'span', props: { onClick: clickHandler }, children: [] },
      ],
    };

    // Setup DOM with missing span
    const container = document.createElement('div');
    container.innerHTML = '<div data-hydrate="root"><div></div></div>';

    // Should not throw
    expect(() => hydrate(vnode, container)).not.toThrow();

    // Click handler shouldn't be called since node is missing
    container.querySelector('div')?.click();
    expect(clickHandler).not.toHaveBeenCalled();
  });

  it('should handle primitive children', () => {
    const vnode = {
      type: 'div',
      props: {},
      children: ['text', 123, null],
    };

    const container = document.createElement('div');
    container.innerHTML = '<div data-hydrate="root"><div>text123</div></div>';

    // Should not throw for primitive children
    expect(() => hydrate(vnode, container)).not.toThrow();
  });

  it('should handle non-array children', () => {
    const clickHandler = vi.fn();

    // Create vnode with a single child (not in array)
    const vnode = {
      type: 'div',
      props: {},
      children: [
        {
          type: 'button',
          props: { onClick: clickHandler },
          children: ['Click me'],
        },
      ],
    };

    // Setup DOM to match vnode structure
    container.innerHTML = `
      <div data-hydrate="root">
        <div>
          <button>Click me</button>
        </div>
      </div>
    `;

    hydrate(vnode, container);

    // Test event handler
    const button = container.querySelector('button');
    button?.click();
    expect(clickHandler).toHaveBeenCalled();
  });
});
