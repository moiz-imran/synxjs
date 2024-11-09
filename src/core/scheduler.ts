// src/core/scheduler.ts

import {
  FunctionalComponentInstance,
  resetCurrentComponent,
  setCurrentComponent,
} from './hooks';
import { diff } from './diff';
import { VNode } from './vdom';

const pendingUpdates = new Set<FunctionalComponentInstance>();
let isScheduled = false;
let isRendering = false;

/**
 * Schedules an update for a functional component instance.
 * @param instance - The functional component instance to update.
 * @param newVNode - The new Virtual DOM node.
 */
export function scheduleUpdate(instance: FunctionalComponentInstance) {
  pendingUpdates.add(instance);

  if (!isScheduled && !isRendering) {
    isScheduled = true;
    queueMicrotask(() => {
      isRendering = true;
      try {
        const updates = Array.from(pendingUpdates);
        pendingUpdates.clear();

        for (const instance of updates) {
          if (instance.dom?.parentNode) {
            const parent = instance.dom.parentNode as HTMLElement;
            const index = Array.from(parent.childNodes).indexOf(instance.dom);

            // Set component context before rendering
            setCurrentComponent(instance);
            const newVNode = instance.render();
            diff(newVNode, instance.vnode, parent, index);
            instance.vnode = newVNode as VNode;
            resetCurrentComponent();
          }
        }
      } finally {
        isRendering = false;
        isScheduled = false;
      }
    });
  }
}
