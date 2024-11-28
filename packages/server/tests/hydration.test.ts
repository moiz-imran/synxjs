import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from '@synxjs/vdom';
import {
  serializeHydrationData,
  generateHydrationScript,
  hydrate,
  addHydrationMarkers,
} from '../src/hydration';

describe('Hydration Data Serialization', () => {
  it('should serialize primitive data types', () => {
    const data = {
      string: 'hello',
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
    };

    const serialized = serializeHydrationData(data);
    expect(serialized).toBe(
      '{"string":"hello","number":42,"boolean":true,"null":null}',
    );
  });

  it('should serialize nested objects', () => {
    const data = {
      nested: {
        foo: 'bar',
        baz: {
          qux: 123,
        },
      },
    };

    const serialized = serializeHydrationData(data);
    expect(serialized).toBe('{"nested":{"foo":"bar","baz":{"qux":123}}}');
  });

  it('should serialize arrays', () => {
    const data = {
      array: [1, 'two', { three: 3 }],
    };

    const serialized = serializeHydrationData(data);
    expect(serialized).toBe('{"array":[1,"two",{"three":3}]}');
  });

  it('should escape HTML in strings', () => {
    const data = {
      html: '<script>alert("xss")</script>',
      nested: {
        html: '</script><script>alert("nested xss")</script>',
      },
    };

    const serialized = serializeHydrationData(data);
    expect(serialized).not.toContain('<script>');
    expect(serialized).not.toContain('</script>');
  });

  it('should handle circular references', () => {
    const circular: any = { foo: 'bar' };
    circular.self = circular;

    expect(() => serializeHydrationData(circular)).not.toThrow();
  });
});

describe('Hydration Script Generation', () => {
  it('should generate script with hydration data', () => {
    const data = { foo: 'bar' };
    const script = generateHydrationScript(data);

    expect(script).toContain('window.__INITIAL_DATA__');
    expect(script).toContain(serializeHydrationData(data));
    expect(script).toMatch(/<script>[\s\S]*<\/script>/);
  });

  it('should generate script with empty data', () => {
    const script = generateHydrationScript({});

    expect(script).toContain('window.__INITIAL_DATA__');
    expect(script).toContain('{}');
    expect(script).toMatch(/<script>[\s\S]*<\/script>/);
  });

  it('should escape HTML in generated script', () => {
    const data = {
      xss: '</script><script>alert("xss")</script>',
    };

    const script = generateHydrationScript(data);

    expect(script).not.toContain('</script><script>');
    expect(script).toMatch(/<script>[\s\S]*<\/script>/);
    expect(script.match(/<script>/g)?.length).toBe(1);
    expect(script.match(/<\/script>/g)?.length).toBe(1);
  });

  it('should generate valid JavaScript', () => {
    const data = {
      string: 'hello "world"',
      array: [1, 2, 3],
      object: { foo: 'bar' },
    };

    const script = generateHydrationScript(data);
    const jsCode = script.match(/<script>([\s\S]*)<\/script>/)?.[1] || '';
    expect(() => {
      new Function(jsCode);
    }).not.toThrow();
  });
});

describe('Client Hydration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should throw if no hydration marker is found', () => {
    const vnode = createElement('div', null, 'test');
    expect(() => hydrate(vnode, container)).toThrow(
      'No hydration marker found',
    );
  });

  it('should attach event listeners to matching nodes', () => {
    const clickHandler = vi.fn();
    const vnode = createElement(
      'button',
      { onClick: clickHandler },
      'Click me',
    );

    container.innerHTML =
      '<div data-hydrate="root"><button>Click me</button></div>';
    hydrate(vnode, container);

    const button = container.querySelector('button');
    button?.click();
    expect(clickHandler).toHaveBeenCalled();
  });

  it('should handle nested event listeners', () => {
    const parentClick = vi.fn();
    const childClick = vi.fn();

    const vnode = createElement(
      'div',
      { onClick: parentClick },
      ...[createElement('button', { onClick: childClick }, 'Child')],
    );

    container.innerHTML =
      '<div data-hydrate="root"><div><button>Child</button></div></div>';
    hydrate(vnode, container);

    const button = container.querySelector('button');
    button?.click();
    expect(childClick).toHaveBeenCalled();

    const div = container.querySelector('div');
    div?.click();
    expect(parentClick).toHaveBeenCalled();
  });
});

describe('Hydration Markers', () => {
  it('should add hydration marker to HTML', () => {
    const html = '<div>content</div>';
    const marked = addHydrationMarkers(html, 'test-id');
    expect(marked).toBe('<div data-hydrate="test-id"><div>content</div></div>');
  });

  it('should handle empty content', () => {
    const marked = addHydrationMarkers('', 'empty');
    expect(marked).toBe('<div data-hydrate="empty"></div>');
  });
});
