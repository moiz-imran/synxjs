import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createElement,
  renderApp,
  useState,
  useEffect,
  PulseStore,
  usePulseState,
} from '../src';

describe('Core Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  describe('Component Lifecycle', () => {
    it('should handle component mounting with hooks', async () => {
      const effectFn = vi.fn();
      const Component = () => {
        const [count, setCount] = useState(0);
        useEffect(() => {
          effectFn();
          return () => effectFn('cleanup');
        }, []);

        return createElement(
          'div',
          {
            onClick: () => setCount((c) => c + 1),
          },
          count,
        );
      };

      renderApp(container, createElement(Component, null));

      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(container.textContent).toBe('0');

      container.firstChild?.dispatchEvent(new MouseEvent('click'));
      await vi.runAllTimersAsync();
      expect(container.textContent).toBe('1');
    });
  });

  describe('Store Integration', () => {
    it('should sync store updates with components', async () => {
      const store = new PulseStore({ count: 0 });

      const Counter = () => {
        const [count, setCount] = usePulseState('count', store);
        return createElement(
          'div',
          {
            onClick: () => setCount((c) => c + 1),
          },
          count,
        );
      };

      renderApp(container, createElement(Counter, null));

      expect(container.textContent).toBe('0');
      store.setPulse('count', 1);
      await vi.runAllTimersAsync();
      expect(container.textContent).toBe('1');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in components with effects', () => {
      const cleanup = vi.fn();
      const ErrorComponent = () => {
        useEffect(() => {
          throw new Error('Test error');
        }, []);
        return createElement('div', null, 'Error component');
      };

      // First create a div to catch the error
      const errorDiv = createElement('div', null, 'Error caught');

      // Then create the error boundary that will render our error div
      const ErrorBoundary = ({ children }: { children: any }) => {
        try {
          return createElement('div', null, children);
        } catch {
          return errorDiv;
        }
      };

      // First render the error boundary
      const vnode = createElement(
        ErrorBoundary,
        null,
        createElement(ErrorComponent, null),
      );

      // Render and let it throw
      try {
        renderApp(container, vnode);
      } catch (error) {
        // Expected error
        cleanup();
      }

      // Run any pending effects
      vi.runAllTimers();

      // Verify error state
      expect(container.textContent).toBe('Error caught');
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('Complex Interactions', () => {
    it('should handle multiple hooks with store updates', async () => {
      const store = new PulseStore({ shared: 0 });

      const Component = () => {
        const [local, setLocal] = useState(0);
        const [shared, setShared] = usePulseState('shared', store);

        useEffect(() => {
          setLocal(1);
          setShared(1);
        }, []);

        return createElement(
          'div',
          null,
          createElement('span', { id: 'local' }, local),
          createElement('span', { id: 'shared' }, shared),
        );
      };

      renderApp(container, createElement(Component, null));

      // Run initial render
      vi.runAllTimers();

      // Wait for microtasks
      await Promise.resolve();

      // Run effect updates
      vi.runAllTimers();

      // Wait for state updates
      await Promise.resolve();

      // Run final render
      vi.runAllTimers();

      expect(container.querySelector('#local')?.textContent).toBe('1');
      expect(container.querySelector('#shared')?.textContent).toBe('1');
    });
  });

  describe('Nested Components', () => {
    it('should handle prop updates in nested components', async () => {
      const Child = ({ value }: { value: string }) => {
        return createElement('span', { className: 'child' }, value);
      };

      const Parent = () => {
        const [value, setValue] = useState('initial');
        useEffect(() => {
          setValue('updated');
        }, []);
        return createElement(
          'div',
          { className: 'parent' },
          createElement(Child, { value }),
        );
      };

      renderApp(container, createElement(Parent, null));

      // Wait for initial render
      await vi.runAllTimersAsync();
      // Wait for effect to run
      await Promise.resolve();
      // Wait for state update
      await vi.runAllTimersAsync();

      expect(container.querySelector('.child')?.textContent).toBe('updated');
    });
  });

  describe('Multiple Store Subscriptions', () => {
    it('should handle multiple components subscribing to same store', async () => {
      const store = new PulseStore({ count: 0 });

      const Counter = ({ id }: { id: string }) => {
        const [count] = usePulseState('count', store);
        return createElement('div', { id }, count);
      };

      const App = () =>
        createElement(
          'div',
          null,
          createElement(Counter, { id: 'c1' }),
          createElement(Counter, { id: 'c2' }),
        );

      renderApp(container, createElement(App, null));
      store.setPulse('count', 1);
      await vi.runAllTimersAsync();

      expect(container.querySelector('#c1')?.textContent).toBe('1');
      expect(container.querySelector('#c2')?.textContent).toBe('1');
    });
  });

  describe('Cleanup Behavior', () => {
    it('should cleanup effects when component unmounts', async () => {
      const cleanup = vi.fn();
      const Component = () => {
        useEffect(() => cleanup, []);
        return createElement('div', null, 'mounted');
      };

      renderApp(container, createElement(Component, null));
      await vi.runAllTimersAsync();

      // Create a new component to replace the old one
      renderApp(
        container,
        createElement(() => createElement('div', null), null),
      );
      await vi.runAllTimersAsync();

      expect(cleanup).toHaveBeenCalled();
    });

    it('should cleanup store subscriptions on unmount', async () => {
      const store = new PulseStore({ value: 0 });
      const callback = vi.fn();

      const Component = () => {
        const [value] = usePulseState('value', store);
        useEffect(() => {
          callback(value);
        }, [value]);
        return createElement('div', null, value);
      };

      renderApp(container, createElement(Component, null));
      await vi.runAllTimersAsync();

      // Unmount
      renderApp(
        container,
        createElement(() => createElement('div', null), null),
      );
      store.setPulse('value', 1);
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('Complex State Updates', () => {
    it('should handle interleaved state and store updates', async () => {
      const store = new PulseStore({ shared: 0 });

      const Component = () => {
        const [local, setLocal] = useState(0);
        const [shared, setShared] = usePulseState('shared', store);

        useEffect(() => {
          setLocal((l) => l + 1); // Update local first
          setShared((s) => s + 1); // Then update shared
        }, []);

        return createElement(
          'div',
          null,
          createElement('span', { id: 'local' }, local),
          createElement('span', { id: 'shared' }, shared),
        );
      };

      renderApp(container, createElement(Component, null));
      await vi.runAllTimersAsync();

      expect(container.querySelector('#local')?.textContent).toBe('1');
      expect(container.querySelector('#shared')?.textContent).toBe('1');
    });

    it('should handle conditional rendering with state', async () => {
      const Component = () => {
        const [show, setShow] = useState(false);

        useEffect(() => {
          setShow(true);
        }, []);

        return createElement(
          'div',
          null,
          show ? createElement('span', { id: 'conditional' }, 'shown') : null,
        );
      };

      renderApp(container, createElement(Component, null));

      // Wait for initial render
      await vi.runAllTimersAsync();
      // Wait for effect to run
      await Promise.resolve();
      // Wait for state update
      await vi.runAllTimersAsync();

      expect(container.querySelector('#conditional')?.textContent).toBe(
        'shown',
      );
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners properly with nested functional components', async () => {
      const eventListenerSpy = vi.spyOn(
        HTMLButtonElement.prototype,
        'addEventListener',
      );
      const removeEventListenerSpy = vi.spyOn(
        HTMLButtonElement.prototype,
        'removeEventListener',
      );
      const store = new PulseStore({ value: 'initial' });

      const Button = ({ onClick }: { onClick: () => void }) => {
        return createElement('button', { onClick }, 'Click me');
      };

      const Parent = () => {
        const [value, setValue] = usePulseState('value', store);

        return createElement(Button, {
          onClick: () => {
            setValue((v) => (v === 'initial' ? 'updated' : 'initial'));
          },
        });
      };

      // Initial render
      renderApp(container, createElement(Parent, null));
      await vi.runAllTimersAsync();

      expect(eventListenerSpy).toHaveBeenCalledTimes(1);
      expect(eventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );

      // Reset counts
      eventListenerSpy.mockClear();
      removeEventListenerSpy.mockClear();

      // First update
      const button = container.querySelector('button');
      button?.click();
      await vi.runAllTimersAsync();

      // Should remove old listener and add new one
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(eventListenerSpy).toHaveBeenCalledTimes(1);

      // Reset counts
      eventListenerSpy.mockClear();
      removeEventListenerSpy.mockClear();

      // Second update
      button?.click();
      await vi.runAllTimersAsync();

      // Should remove old listener and add new one
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(eventListenerSpy).toHaveBeenCalledTimes(1);

      // Cleanup
      eventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
