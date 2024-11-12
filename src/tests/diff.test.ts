import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createFunctionalComponentInstance,
  componentInstanceCache,
} from '../core/renderer';
import { usePulseState } from '../core/hooks';
import { PulseStore } from '../core/store';
import type { FunctionalComponent, VNode } from '../core/types';
import { diff, renderVNode } from '../core/diff';

describe('Component Diffing', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should reuse component instances', () => {
    const Counter: FunctionalComponent = () => ({
      type: 'div',
      props: { className: 'counter' },
      children: ['0'],
    });

    const counterVNode: VNode = {
      type: Counter,
      props: {},
      children: [],
    };

    const instance = createFunctionalComponentInstance(counterVNode);
    const initialDom = renderVNode(instance.render());
    container.appendChild(initialDom!);

    const cachedInstance = componentInstanceCache.get(
      counterVNode as VNode & object,
    );
    expect(cachedInstance).toBe(instance);

    diff(counterVNode, counterVNode, container, 0);

    const updatedInstance = componentInstanceCache.get(
      counterVNode as VNode & object,
    );
    expect(updatedInstance).toBe(instance);
  });

  test('should handle Pulse store updates', async () => {
    const testStore = new PulseStore({ alertVisible: false });

    const AlertTest: FunctionalComponent = () => {
      const [alertVisible, setAlertVisible] = usePulseState(
        'alertVisible',
        testStore,
      );

      return {
        type: 'div',
        props: {},
        children: [
          {
            type: 'button',
            props: { onClick: () => setAlertVisible(true) },
            children: 'Show Alert',
          },
          alertVisible && {
            type: 'div',
            props: { className: 'alert' },
            children: 'Alert Content',
          },
        ].filter(Boolean),
      } as VNode;
    };

    const vnode: VNode = {
      type: AlertTest,
      props: {},
      children: [],
    };

    createFunctionalComponentInstance(vnode);
    const initialDom = renderVNode(vnode);
    container.appendChild(initialDom!);

    expect(container.querySelector('.alert')).toBeNull();

    container.querySelector('button')?.click();

    await vi.waitFor(() => {
      expect(container.querySelector('.alert')).toBeTruthy();
      expect(testStore.getPulse('alertVisible')).toBe(true);
    });
  });
});
