import { diff, renderVNode } from '../core/diff';
import {
  createFunctionalComponentInstance,
  componentInstanceCache,
  domToInstanceMap,
} from '../core/renderer';
import { FunctionalComponent, VNode } from '../core/vdom';
import { usePulse, useState } from '../core/hooks';
import { setCurrentComponent, resetCurrentComponent } from '../core/hooks';
import { PulseStore } from '../core/store';

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
    // Clear the cache between tests
    (componentInstanceCache as any) = new WeakMap();
    (domToInstanceMap as any) = new Map();
  });

  test('should reuse component instances', () => {
    const Counter: FunctionalComponent = () => ({
      type: 'div',
      props: { className: 'counter' },
      children: '0',
    });

    // Initial render
    const counterVNode: VNode = {
      type: Counter,
      props: {},
      children: [],
    };

    const instance = createFunctionalComponentInstance(counterVNode, Counter);
    const initialDom = renderVNode(instance.render());
    container.appendChild(initialDom!);

    // Get the cached instance
    const cachedInstance = componentInstanceCache.get(
      counterVNode as VNode & object,
    );
    expect(cachedInstance).toBe(instance);

    // Update the same component
    diff(counterVNode, counterVNode, container, 0);

    // Should use the same instance
    const updatedInstance = componentInstanceCache.get(
      counterVNode as VNode & object,
    );
    expect(updatedInstance).toBe(instance);
  });

  test('should preserve DOM nodes during updates', () => {
    const Counter: FunctionalComponent = () => ({
      type: 'div',
      props: { className: 'counter' },
      children: '0',
    });

    // Initial render
    const counterVNode: VNode = {
      type: Counter,
      props: {},
      children: [],
    };

    // Create instance and render
    const instance = createFunctionalComponentInstance(counterVNode, Counter);
    const initialDom = renderVNode(counterVNode);
    container.appendChild(initialDom!);

    // Store initial DOM reference
    const originalDom = container.querySelector('.counter');
    expect(originalDom).toBeTruthy();
    expect(instance.dom).toBe(originalDom);

    // Update
    diff(counterVNode, counterVNode, container, 0);

    // DOM should be preserved
    const updatedDom = container.querySelector('.counter');
    expect(updatedDom).toBe(originalDom);
    expect(instance.dom).toBe(originalDom);
  });

  test('should maintain instance state through parent updates', () => {
    const App: FunctionalComponent<AppProps> = ({ theme = 'light' }) => ({
      type: 'div',
      props: { className: theme === 'dark' ? 'dark' : 'light' },
      children: [
        {
          type: 'div',
          props: { className: 'counter' },
          children: '0',
        },
      ],
    });

    // Initial render
    const initialVNode: VNode = {
      type: App,
      props: { theme: 'light' },
      children: [],
    };

    // Create instance and render
    const instance = createFunctionalComponentInstance(initialVNode, App);
    const initialDom = renderVNode(initialVNode);
    container.appendChild(initialDom!);

    const originalCounter = container.querySelector('.counter');
    expect(originalCounter).toBeTruthy();

    // Theme change
    const updatedVNode: VNode = {
      type: App,
      props: { theme: 'dark' },
      children: [],
    };

    diff(updatedVNode, initialVNode, container, 0);

    const updatedCounter = container.querySelector('.counter');
    expect(updatedCounter).toBe(originalCounter);
  });

  test('should handle conditional rendering correctly', () => {
    const AlertTest: FunctionalComponent = () => {
      const [visible, setVisible] = useState(false);

      const children: VNode[] = [
        {
          type: 'button',
          props: {
            onClick: () => {
              setVisible(true);
            },
          },
          children: 'Show',
        },
      ];

      if (visible) {
        children.push({
          type: 'div',
          props: { className: 'alert' },
          children: 'Alert Content',
        });
      }

      const vnode: VNode = {
        type: 'div',
        props: {},
        children,
      };

      return vnode;
    };

    // Initial render
    const vnode: VNode = {
      type: AlertTest,
      props: {},
      children: [],
    };

    const instance = createFunctionalComponentInstance(vnode, AlertTest);
    const initialDom = renderVNode(vnode);
    container.appendChild(initialDom!);

    // Set component context before clicking
    setCurrentComponent(instance);

    // Find and click the button
    const button = container.querySelector('button')!;
    button.click();

    // Reset component context
    resetCurrentComponent();

    // Wait for microtask queue to process updates
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        const alert = container.querySelector('.alert');
        expect(alert).toBeTruthy();
        resolve();
      });
    });
  });

  test('should handle Pulse store updates correctly', () => {
    // Mock store setup similar to appStore
    const testStore = new PulseStore({
      alertVisible: false,
    });

    const AlertTest: FunctionalComponent = () => {
      const [alertVisible, setAlertVisible] = usePulse(
        'alertVisible',
        testStore,
      );

      const children: VNode[] = [
        {
          type: 'button',
          props: {
            onClick: () => setAlertVisible(true),
          },
          children: 'Show Alert',
        },
      ];

      if (alertVisible) {
        children.push({
          type: 'div',
          props: { className: 'alert' },
          children: 'Alert Content',
        });
      }

      const vnode: VNode = {
        type: 'div',
        props: {},
        children,
      };

      return vnode;
    };

    // Initial render
    const vnode: VNode = {
      type: AlertTest,
      props: {},
      children: [],
    };

    createFunctionalComponentInstance(vnode, AlertTest);
    const initialDom = renderVNode(vnode);
    container.appendChild(initialDom!);

    // Verify initial state
    expect(container.querySelector('.alert')).toBeNull();

    // Click the button
    const button = container.querySelector('button')!;
    button.click();

    // Wait for updates
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        const alert = container.querySelector('.alert');
        console.log('[test] alert', alert);
        expect(alert).toBeTruthy();
        expect(testStore.getPulse('alertVisible')).toBe(true);
        resolve();
      });
    });
  });
});
