// src/core/scheduler.ts

import {
  resetCurrentComponent,
  setCurrentComponent,
  runEffects,
} from './hooks';
import { diff } from './diff';
import type { FunctionalComponentInstance, VNode } from './types';

const pendingUpdates = new Set<FunctionalComponentInstance>();
let isScheduled = false;
let isRendering = false;

/**
 * Schedules an update for a functional component instance.
 * @param instance - The functional component instance to update.
 */
export function scheduleUpdate(instance: FunctionalComponentInstance): void {
  if (!instance || !instance.dom) {
    return; // Skip invalid instances
  }

  pendingUpdates.add(instance);
  scheduleRender();
}

/**
 * Schedules a microtask to process pending updates.
 */
function scheduleRender(): void {
  if (isScheduled || isRendering) {
    return;
  }

  isScheduled = true;
  queueMicrotask(processUpdates);
}

/**
 * Processes all pending component updates.
 */
function processUpdates(): void {
  if (isRendering) {
    return;
  }

  isRendering = true;
  try {
    const updates = Array.from(pendingUpdates);
    pendingUpdates.clear();

    for (const instance of updates) {
      updateComponent(instance);
    }

    // Run effects after all components have updated
    runEffects();
  } catch (error) {
    console.error('Error during component update:', error);
  } finally {
    isRendering = false;
    isScheduled = false;

    // If new updates were scheduled during processing, schedule another round
    if (pendingUpdates.size > 0) {
      scheduleRender();
    }
  }
}

/**
 * Updates a single component instance.
 */
function updateComponent(instance: FunctionalComponentInstance): void {
  if (!instance.dom?.parentNode) {
    pendingUpdates.delete(instance);
    return;
  }

  const parent = instance.dom.parentNode as HTMLElement;
  const index = Array.from(parent.childNodes).indexOf(instance.dom);

  try {
    setCurrentComponent(instance);
    const newVNode = instance.render();
    diff(newVNode, instance.vnode, parent, index);
    instance.vnode = newVNode as VNode;
  } catch (error) {
    console.error(`Error updating component:`, error);
  } finally {
    resetCurrentComponent();
  }
}
