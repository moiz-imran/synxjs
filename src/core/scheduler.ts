// src/core/scheduler.ts

import { FunctionalComponentInstance } from './hooks';
import { diff } from './diff';
import { VNode } from './vdom';

let isScheduled = false;
let pendingUpdates = new Set<FunctionalComponentInstance>();

/**
 * Schedules an update for a functional component instance.
 * @param instance - The functional component instance to update.
 * @param newVNode - The new Virtual DOM node.
 */
export function scheduleUpdate(
  instance: FunctionalComponentInstance,
  newVNode: VNode | string | number | null,
) {
  pendingUpdates.add(instance);

  if (!isScheduled) {
    isScheduled = true;
    queueMicrotask(() => {
      isScheduled = false;
      // Process all pending updates in one batch
      pendingUpdates.forEach(inst => {
        if (!inst.dom) return;
        const parent = inst.dom.parentNode as HTMLElement;
        if (!parent) return;

        const index = Array.from(parent.childNodes).indexOf(inst.dom);
        if (index === -1) return;

        diff(newVNode, inst.vnode, parent, index);
        inst.vnode = newVNode as VNode;
        inst.dom = parent.childNodes[index] as HTMLElement | Text;
      });
      pendingUpdates.clear();
    });
  }
}
