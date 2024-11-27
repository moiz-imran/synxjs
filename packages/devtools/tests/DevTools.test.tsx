import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createElement, renderApp } from '@synxjs/vdom';
import { PulseStore } from '@synxjs/store';
import { DevTools } from '../src/components/DevTools';

interface TestState {
  count: number;
  name: string;
}

describe('DevTools', () => {
  let container: HTMLElement;
  let store: PulseStore<TestState>;

  beforeEach(() => {
    // Setup fake timers before any other operations
    vi.useFakeTimers();

    container = document.createElement('div');
    document.body.appendChild(container);

    store = new PulseStore<TestState>({
      count: 0,
      name: 'test',
    });

    // Wait for any pending effects
    vi.runAllTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders with initial state', async () => {
    renderApp(container, <DevTools store={store} />);
    await vi.runAllTimersAsync();

    const stateText = JSON.stringify(store.getPulses(), null, 2);
    expect(container.textContent).toContain(stateText);
  });

  it('toggles visibility when clicking the toggle button', async () => {
    renderApp(container, <DevTools store={store} initialIsOpen={false} />);
    await vi.runAllTimersAsync();

    // Initially closed - should only show toggle button
    const toggleButton = container.querySelector('button') as HTMLButtonElement;
    expect(toggleButton.children[0].classList.toString()).not.toContain(
      'synx-rotate-180',
    );

    // Open
    toggleButton.click();
    await vi.runAllTimersAsync();

    expect(container.querySelector('[role="complementary"]')).not.toBeNull();
    expect(toggleButton.children[0].classList.toString()).toContain(
      'synx-rotate-180',
    );

    // Close
    toggleButton.click();
    await vi.runAllTimersAsync();
    expect(container.querySelector('.devtools-panel')).toBeNull();
  });

  it('updates display when store state changes', async () => {
    renderApp(container, <DevTools store={store} />);
    await vi.runAllTimersAsync();

    const initialState = JSON.stringify({ count: 0, name: 'test' }, null, 2);
    expect(container.textContent).toContain(initialState);

    await store.setPulse('count', 1);
    await vi.runAllTimersAsync();

    const updatedState = JSON.stringify({ count: 1, name: 'test' }, null, 2);
    expect(container.textContent).toContain(updatedState);
  });

  it('supports time travel', async () => {
    renderApp(container, <DevTools store={store} />);

    // Make some state changes
    await store.setPulse('count', 1);
    // await vi.runAllTimersAsync();
    await store.setPulse('count', 2);
    await vi.runAllTimersAsync();
    // Find buttons
    const undoButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.ariaLabel === 'Undo',
    );

    // Undo
    undoButton?.click();
    await vi.runAllTimersAsync();
    expect(container.textContent).toContain('"count": 1');

    const redoButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.ariaLabel === 'Redo',
    );

    // Redo
    redoButton?.click();
    await vi.runAllTimersAsync();
    expect(container.textContent).toContain('"count": 2');
  });

  it('handles theme switching', async () => {
    renderApp(container, <DevTools store={store} theme="dark" />);
    await vi.runAllTimersAsync();

    let panel = container.querySelector(
      '[role="complementary"]',
    ) as HTMLElement;
    expect(panel?.classList.toString()).toContain('dark');

    renderApp(container, <DevTools store={store} theme="light" />);
    await vi.runAllTimersAsync();

    panel = container.querySelector('[role="complementary"]') as HTMLElement;
    expect(panel?.classList.toString()).toContain('light');
  });

  it('shows state updates count', async () => {
    renderApp(container, <DevTools store={store} />);
    await vi.runAllTimersAsync();

    const getUpdateCount = () => {
      const text = container.textContent;
      const match = text?.match(/State updates: (\d+)/);
      return match ? Number(match[1]) : null;
    };

    // Initial state
    expect(getUpdateCount()).toBe(1);

    // Make changes
    await store.setPulse('count', 1);
    await vi.runAllTimersAsync();
    expect(getUpdateCount()).toBe(2);

    await store.setPulse('name', 'updated');
    await vi.runAllTimersAsync();
    expect(getUpdateCount()).toBe(3);
  });
});
