import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hydrateClient } from '../src';
import { hydrate } from '@synxjs/server/hydration';
import type { VNode } from '@synxjs/types';

// Mock the server hydration module
vi.mock('@synxjs/server/hydration', () => ({
  hydrate: vi.fn(),
}));

describe('Client Hydration', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset the DOM
    document.body.innerHTML = '';

    // Reset window.__INITIAL_DATA__
    delete (window as any).__INITIAL_DATA__;
  });

  it('should throw if no hydration container is found', () => {
    const App = () => ({ type: 'div', props: {}, children: [] });

    expect(() => hydrateClient(App)).toThrow('No hydration container found');
  });

  it('should hydrate app with initial data', () => {
    // Setup DOM
    const container = document.createElement('div');
    container.setAttribute('data-hydrate', 'root');
    document.body.appendChild(container);

    // Setup initial data
    const initialData = { foo: 'bar' };
    (window as any).__INITIAL_DATA__ = { props: initialData };

    // Create test app
    const App = (props: any): VNode => ({
      type: 'div',
      props,
      children: [],
    });

    hydrateClient(App);

    expect(hydrate).toHaveBeenCalledWith(
      {
        type: 'div',
        props: initialData,
        children: [],
      },
      container,
    );
  });

  it('should hydrate app without initial data', () => {
    // Setup DOM
    const container = document.createElement('div');
    container.setAttribute('data-hydrate', 'root');
    document.body.appendChild(container);

    // Create test app
    const App = (props: any): VNode => ({
      type: 'div',
      props,
      children: [],
    });

    hydrateClient(App);

    expect(hydrate).toHaveBeenCalledWith(
      {
        type: 'div',
        props: undefined,
        children: [],
      },
      container,
    );
  });

  it('should wait for data when shouldWaitForData is true', async () => {
    // Setup DOM
    const container = document.createElement('div');
    container.setAttribute('data-hydrate', 'root');
    document.body.appendChild(container);

    // Create test app
    const App = (props: any): VNode => ({
      type: 'div',
      props,
      children: [],
    });

    // Start hydration without data
    hydrateClient(App, { shouldWaitForData: true });
    expect(hydrate).not.toHaveBeenCalled();

    // Add data after delay
    setTimeout(() => {
      (window as any).__INITIAL_DATA__ = { props: { foo: 'bar' } };
    }, 50);

    // Wait for hydration
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(hydrate).toHaveBeenCalledWith(
      {
        type: 'div',
        props: { foo: 'bar' },
        children: [],
      },
      container,
    );
  });
});
