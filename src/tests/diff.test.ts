import { diff, renderVNode } from '../core/diff';
import {
  createFunctionalComponentInstance,
  componentInstanceCache,
  // domToInstanceMap,
} from '../core/renderer';
import { usePulseState, useState } from '../core/hooks';
import { setCurrentComponent, resetCurrentComponent } from '../core/hooks';
import { PulseStore } from '../core/store';
import type { FunctionalComponent, VNode } from '../core/types';

interface AppProps {
  theme?: 'light' | 'dark';
}

describe('Component Diffing', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Component Instance Management', () => {
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

    test('should preserve DOM nodes during updates', () => {
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
      const initialDom = renderVNode(counterVNode);
      container.appendChild(initialDom!);

      const originalDom = container.querySelector('.counter');
      expect(originalDom).toBeTruthy();
      expect(instance.dom).toBe(originalDom);

      diff(counterVNode, counterVNode, container, 0);

      const updatedDom = container.querySelector('.counter');
      expect(updatedDom).toBe(originalDom);
      expect(instance.dom).toBe(originalDom);
    });
  });

  describe('Component Updates', () => {
    test('should maintain instance state through parent updates', () => {
      const App: FunctionalComponent<AppProps> = ({ theme = 'light' }) => ({
        type: 'div',
        props: { className: theme === 'dark' ? 'dark' : 'light' },
        children: [
          {
            type: 'div',
            props: { className: 'counter' },
            children: ['0'],
          },
        ],
      });

      const initialVNode: VNode = {
        type: App,
        props: { theme: 'light' },
        children: [],
      };

      createFunctionalComponentInstance(initialVNode);
      const initialDom = renderVNode(initialVNode);
      container.appendChild(initialDom!);

      const originalCounter = container.querySelector('.counter');
      expect(originalCounter).toBeTruthy();

      const updatedVNode: VNode = {
        type: App,
        props: { theme: 'dark' },
        children: [],
      };

      diff(updatedVNode, initialVNode, container, 0);

      const updatedCounter = container.querySelector('.counter');
      expect(updatedCounter).toBe(originalCounter);
    });
  });

  describe('Conditional Rendering', () => {
    test('should handle conditional rendering correctly', async () => {
      const AlertTest: FunctionalComponent = () => {
        const [visible, setVisible] = useState(false);

        return {
          type: 'div',
          props: {},
          children: [
            {
              type: 'button',
              props: { onClick: () => setVisible(true) },
              children: 'Show',
            },
            visible && {
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

      const instance = createFunctionalComponentInstance(vnode);
      const initialDom = renderVNode(vnode);
      container.appendChild(initialDom!);

      setCurrentComponent(instance);
      container.querySelector('button')?.click();
      resetCurrentComponent();

      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          expect(container.querySelector('.alert')).toBeTruthy();
          resolve();
        });
      });
    });
  });

  describe('Store Integration', () => {
    test('should handle Pulse store updates correctly', async () => {
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

      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          expect(container.querySelector('.alert')).toBeTruthy();
          expect(testStore.getPulse('alertVisible')).toBe(true);
          resolve();
        });
      });
    });
  });
});
