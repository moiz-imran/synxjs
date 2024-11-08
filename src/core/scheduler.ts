// src/core/scheduler.ts

import {
  FunctionalComponentInstance,
  resetCurrentComponent,
  runEffects,
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
export function scheduleUpdate(
  instance: FunctionalComponentInstance,
  newVNode: VNode | string | number | null,
) {
  if (instance) {
    pendingUpdates.add(instance);
  }

  if (!isScheduled) {
    isScheduled = true;
    queueMicrotask(() => {
      isScheduled = false;

      if (isRendering) {
        scheduleUpdate(instance, newVNode);
        return;
      }

      isRendering = true;
      const updates = Array.from(pendingUpdates);
      pendingUpdates.clear();

      try {
        updates.forEach((inst) => {
          if (!inst.dom) return;
          const parent = inst.dom.parentNode as HTMLElement;
          if (!parent) return;

          const index = Array.from(parent.childNodes).indexOf(inst.dom);
          if (index === -1) return;

          try {
            setCurrentComponent(inst);
            inst.currentHook = 0;

            // Get current state before update
            const oldVNode = inst.vnode;
            const oldDom = inst.dom;

            // Render new state
            const updatedVNode = inst.render();

            // Update the DOM content directly if it's a text update
            if (oldDom instanceof Text && typeof updatedVNode === 'string') {
              oldDom.textContent = updatedVNode;
            } else {
              // Otherwise use diff for structural changes
              diff(updatedVNode, oldVNode, parent, index);
            }

            // Update instance references
            inst.vnode = updatedVNode as VNode;
            inst.dom = parent.childNodes[index] as HTMLElement | Text;
          } finally {
            resetCurrentComponent();
          }
        });
      } finally {
        isRendering = false;
        runEffects();
      }
    });
  }
}
