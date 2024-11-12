import type { FunctionalComponentInstance, VNode } from '@synxjs/types';
import {
  runEffects,
  setCurrentComponent,
  resetCurrentComponent,
} from '@synxjs/runtime';
import { diff } from './diff';

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
    const updates = Array.from(pendingUpdates);
    pendingUpdates.clear();

    for (const instance of updates) {
      updateComponent(instance);
    }

    runEffects();
  } finally {
    isRendering = false;
    isScheduled = false;

    if (pendingUpdates.size > 0) {
      scheduleRender();
    }
  }
}

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
  } finally {
    resetCurrentComponent();
  }
}
