import type {
  FunctionalComponent,
  FunctionalComponentInstance,
  VNode,
} from '@synxjs/types';
import {
  runEffects,
  setCurrentComponent,
  resetCurrentComponent,
  cleanupEffects,
  updateComponentInStack,
} from '@synxjs/runtime';
import { diff } from './diff';
import { updateAttributes } from './attributes';

const pendingUpdates = new Set<FunctionalComponentInstance>();
let isScheduled = false;
let isRendering = false;

export function scheduleUpdate(instance: FunctionalComponentInstance): void {
  if (!instance || !instance.dom) return;

  pendingUpdates.add(instance);
  scheduleRender();
}

function scheduleRender(): void {
  if (isScheduled || isRendering) return;

  isScheduled = true;
  queueMicrotask(processUpdates);
}

function processUpdates(): void {
  if (isRendering) return;

  isRendering = true;
  try {
    // First pass: render all components and their children
    const updates = Array.from(pendingUpdates);
    pendingUpdates.clear();

    for (const instance of updates) {
      updateComponent(instance);
    }

    // Only run effects after ALL components (including children) have rendered
    runEffects();

    // Handle any new updates that were queued during this cycle
    if (pendingUpdates.size > 0) {
      queueMicrotask(processUpdates);
    }
  } finally {
    isRendering = false;
    isScheduled = false;
  }
}

function updateComponent(instance: FunctionalComponentInstance): void {
  if (!instance.dom?.parentNode) {
    pendingUpdates.delete(instance);
    cleanupEffects(instance);
    return;
  }

  const parent = instance.dom.parentNode as HTMLElement;
  const index = Array.from(parent.childNodes).indexOf(instance.dom);

  try {
    setCurrentComponent(instance);
    const oldVNode = instance.vnode;
    const newVNode = instance.render();

    // Create new instance with updated vnode
    const updatedInstance = {
      ...instance,
      vnode: newVNode as VNode<FunctionalComponent>,
    };

    // Update instance in hook stack
    updateComponentInStack(instance, updatedInstance);

    if (!newVNode) {
      cleanupEffects(updatedInstance);
      if ((instance.dom as HTMLElement)._listeners) {
        updateAttributes(instance.dom as HTMLElement, {}, {});
      }
    }

    // Let children render before running any effects
    diff(newVNode as VNode, oldVNode, parent, index);
  } finally {
    resetCurrentComponent();
  }
}
