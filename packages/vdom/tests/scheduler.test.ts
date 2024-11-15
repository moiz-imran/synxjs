import { describe, it, vi, beforeEach, expect } from 'vitest';
import { scheduleUpdate } from '../src/scheduler';
import { createElement } from '../src';
import { createFunctionalComponentInstance } from '@synxjs/instance';
import type { FunctionalComponent, VNode } from '@synxjs/types';

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should handle invalid instance updates', async () => {
    const invalidInstance = null;
    scheduleUpdate(invalidInstance as any);
    await vi.runAllTimersAsync();
    // Should not throw
  });

  it('should handle instance without DOM', async () => {
    const Component = () => createElement('div', null);
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    scheduleUpdate(instance);
    await vi.runAllTimersAsync();
    // Should not throw
  });

  it('should batch multiple updates', async () => {
    const Component = () => createElement('div', null);
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    // Create a dummy DOM node
    instance.dom = document.createElement('div');
    document.body.appendChild(instance.dom);

    // Schedule multiple updates
    scheduleUpdate(instance);
    scheduleUpdate(instance);
    scheduleUpdate(instance);

    await vi.runAllTimersAsync();

    document.body.removeChild(instance.dom);
  });

  it('should handle component updates when already rendering', async () => {
    const Component = () => createElement('div', null, 'test');
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    // Create a dummy DOM node and parent
    const parent = document.createElement('div');
    instance.dom = document.createElement('div');
    parent.appendChild(instance.dom);
    document.body.appendChild(parent);

    // Schedule multiple updates
    scheduleUpdate(instance);
    scheduleUpdate(instance); // This should be batched

    await vi.runAllTimersAsync();

    expect(parent.textContent).toBe('test');
    document.body.removeChild(parent);
  });

  it('should handle cleanup when parent is removed', async () => {
    const Component = () => createElement('div', null, 'test');
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    // Create DOM but don't attach to parent
    instance.dom = document.createElement('div');

    scheduleUpdate(instance);
    await vi.runAllTimersAsync();
    // Should not throw and should cleanup
  });

  it('should handle concurrent updates', async () => {
    const Component = () => createElement('div', null, 'test');
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    // Setup DOM
    instance.dom = document.createElement('div');
    document.body.appendChild(instance.dom);

    // Trigger concurrent updates
    scheduleUpdate(instance);
    // Force isRendering state
    scheduleUpdate(instance);

    await vi.runAllTimersAsync();
    document.body.removeChild(instance.dom);
  });

  it('should handle component unmounting during update', async () => {
    const Component = () => createElement('div', null, 'test');
    const vnode = createElement(Component as FunctionalComponent, null);
    const instance = createFunctionalComponentInstance(
      vnode as VNode<FunctionalComponent>,
    );

    // Setup DOM that will be removed
    instance.dom = document.createElement('div');
    const parent = document.createElement('div');
    parent.appendChild(instance.dom);

    scheduleUpdate(instance);
    // Remove parent before update processes
    instance.dom.remove();

    await vi.runAllTimersAsync();
  });
});
