// src/core/reactive.test.ts

import { reactive, effect } from '../src/core/reactive';

describe('Reactive System', () => {
  it('should track and trigger effects on state change', () => {
    const state = reactive({ count: 0 });
    let dummy = 0;

    effect(() => {
      dummy = state.count;
    });

    expect(dummy).toBe(0);
    state.count = 1;
    expect(dummy).toBe(1);
    state.count = 2;
    expect(dummy).toBe(2);
  });

  it('should not trigger effect when setting the same value', () => {
    const state = reactive({ count: 0 });
    let dummy = 0;
    const effectFn = jest.fn(() => {
      dummy = state.count;
    });

    effect(effectFn);

    expect(dummy).toBe(0);
    expect(effectFn.mock.calls.length).toBe(1);

    state.count = 0;
    expect(dummy).toBe(0);
    expect(effectFn.mock.calls.length).toBe(1); // Should not trigger again
  });
});
