import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSignal,
  getServerState,
  resetServerState,
  enableServerMode,
} from '@synxjs/reactivity';
import type { FunctionalComponent } from '@synxjs/types';
import { createElement } from '@synxjs/vdom';
import { renderToString, renderToStream } from '../src';

describe('Server State Management', () => {
  beforeEach(() => {
    enableServerMode(true);
    resetServerState();
  });

  it('should handle synchronous state', async () => {
    const [count, setCount] = createSignal(0);

    const Component = () => {
      setCount(1);
      return createElement('div', null, count());
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div>1</div>');
    expect(getServerState().signals.get(count)).toBe(1);
  });

  it('should handle nested component state', async () => {
    const [name, setName] = createSignal('John');
    const [age, setAge] = createSignal(25);

    const UserInfo: FunctionalComponent = () => {
      setName('Jane');
      setAge(30);
      return {
        type: 'div',
        props: {},
        children: [`${name()} is ${age()} years old`],
      };
    };

    const html = await renderToString({
      type: UserInfo,
      props: {},
      children: [],
    });

    expect(html).toBe('<div>Jane is 30 years old</div>');
    expect(getServerState()).toEqual({
      signals: new Map<() => any, any>([
        [name, 'Jane'],
        [age, 30],
      ]),
    });
  });

  it('should handle state updates', async () => {
    const [data, setData] = createSignal('initial');

    const Component = () => {
      setData('updated data');
      return createElement('div', null, data());
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div>updated data</div>');
    expect(getServerState().signals.get(data)).toBe('updated data');
  });

  it('should handle errors in state updates', async () => {
    const [error, setError] = createSignal<string | null>(null);

    const ErrorComponent: FunctionalComponent = () => {
      try {
        throw new Error('test error');
      } catch (e) {
        setError((e as Error).message);
      }

      return {
        type: 'div',
        props: { class: 'error' },
        children: [error() || ''],
      };
    };

    const html = await renderToString({
      type: ErrorComponent,
      props: {},
      children: [],
    });

    expect(html).toBe('<div class="error">test error</div>');
    expect(getServerState()).toEqual({
      signals: new Map([[error, 'test error']]),
    });
  });

  it('should handle multiple renders with state reset', async () => {
    const Counter: FunctionalComponent = () => {
      const [count, setCount] = createSignal(0);
      setCount((prev) => prev + 1);
      return {
        type: 'div',
        props: {},
        children: [count().toString()],
      };
    };

    // First render
    await renderToString({
      type: Counter,
      props: {},
      children: [],
    });

    // Reset state
    resetServerState();

    // Second render should start fresh
    const html = await renderToString({
      type: Counter,
      props: {},
      children: [],
    });

    expect(html).toBe('<div>1</div>');
    expect(getServerState().signals.size).toBe(1);
  });

  it('should handle array state', async () => {
    const [items, setItems] = createSignal<string[]>([]);

    const Component = () => {
      setItems(['a', 'b', 'c']);
      return createElement('div', null, items().join(','));
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div>a,b,c</div>');
    expect(getServerState().signals.get(items)).toEqual(['a', 'b', 'c']);
  });

  it('should handle object state', async () => {
    const [user, setUser] = createSignal<{ name: string }>({ name: 'initial' });

    const Component = () => {
      setUser({ name: 'updated' });
      return createElement('div', null, user().name);
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div>updated</div>');
    expect(getServerState().signals.get(user)).toEqual({ name: 'updated' });
  });

  it('should handle multiple signals in one component', async () => {
    const [name, setName] = createSignal('John');
    const [age, setAge] = createSignal(25);
    const [active, setActive] = createSignal(false);

    const Component = () => {
      setName('Jane');
      setAge(30);
      setActive(true);
      return createElement(
        'div',
        null,
        `${name()} is ${age()} years old and ${active() ? 'active' : 'inactive'}`,
      );
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div>Jane is 30 years old and active</div>');
    expect(getServerState().signals.get(name)).toBe('Jane');
    expect(getServerState().signals.get(age)).toBe(30);
    expect(getServerState().signals.get(active)).toBe(true);
  });

  it('should handle deeply nested components with signals', async () => {
    const [count, setCount] = createSignal(0);

    const Leaf = () => {
      setCount((prev) => prev + 1);
      return createElement('span', null, count());
    };

    const Branch = () => createElement('div', null, createElement(Leaf, null));
    const Root = () => createElement('main', null, createElement(Branch, null));

    const html = await renderToString(createElement(Root, null));
    expect(html).toBe('<main><div><span>1</span></div></main>');
    expect(getServerState().signals.get(count)).toBe(1);
  });

  it('should handle conditional rendering with signals', async () => {
    const [show, setShow] = createSignal(false);
    const [text, setText] = createSignal('hidden');

    const Component = () => {
      setShow(true);
      setText('visible');
      return createElement(
        'div',
        null,
        show() ? createElement('span', null, text()) : null,
      );
    };

    const html = await renderToString(createElement(Component, null));
    expect(html).toBe('<div><span>visible</span></div>');
    expect(getServerState().signals.get(show)).toBe(true);
    expect(getServerState().signals.get(text)).toBe('visible');
  });

  it('should handle state in streaming mode', async () => {
    const [count, setCount] = createSignal(0);

    const Component = () => {
      setCount(1);
      return createElement('div', null, count());
    };

    const stream = renderToStream(createElement(Component, null));
    const chunks: string[] = [];

    await new Promise<void>((resolve) => {
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        const html = chunks.join('');
        expect(html).toContain('<div>1</div>');
        expect(getServerState().signals.get(count)).toBe(1);
        resolve();
      });
    });
  });
});
