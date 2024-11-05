// tests/vdom.test.ts
import { createElement } from '../src/core/vdom';

describe('Virtual DOM', () => {
  it('should create a VNode correctly', () => {
    const vnode = createElement('div', { id: 'test' }, 'Hello, World!');
    expect(vnode).toEqual({
      type: 'div',
      props: { id: 'test' },
      children: ['Hello, World!'],
    });
  });
});
