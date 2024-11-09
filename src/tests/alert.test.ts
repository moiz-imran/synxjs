import { createElement, FunctionalComponent } from '../core/vdom';
import { renderVNode } from '../core/diff';
import { VNode } from '../core/vdom';
import { PulseStore } from '../core/store';
import { usePulse } from '../core/hooks';

// Set up createElement for JSX
(global as any).createElement = createElement;

describe('Alert Integration', () => {
  let container: HTMLElement;
  let testStore: PulseStore<{ alertVisible: boolean }>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    testStore = new PulseStore<{ alertVisible: boolean }>({
      alertVisible: false,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should show alert when clicking show alert button', async () => {
    const AlertTest: FunctionalComponent = () => {
      const [alertVisible, setAlertVisible] = usePulse(
        'alertVisible',
        testStore,
      );

      return {
        type: 'div',
        props: {},
        children: [
          {
            type: 'button',
            props: {
              onClick: () => setAlertVisible(true),
            },
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

    // Initial render
    const vnode: VNode = {
      type: AlertTest,
      props: {},
      children: [],
    };

    const initialDom = renderVNode(vnode);
    container.appendChild(initialDom!);

    console.log('[alert.test] initialDom', container.innerHTML);

    // Verify initial state
    expect(container.querySelector('.alert')).toBeNull();

    // Click the button
    const button = container.querySelector('button')!;
    button.click();

    // Wait for updates
    await new Promise<void>((resolve) => {
      queueMicrotask(() => {
        const alert = container.querySelector('.alert');
        expect(alert).toBeTruthy();
        expect(testStore.getPulse('alertVisible')).toBe(true);
        resolve();
      });
    });
  });
});
