// src/core/scheduler.ts

import { FunctionalComponentInstance } from './hooks';
import { diff } from './diff';
import { VNode } from './vdom';

/**
 * Schedules an update for a functional component instance.
 * @param instance - The functional component instance to update.
 * @param newVNode - The new Virtual DOM node.
 */
export function scheduleUpdate(
  instance: FunctionalComponentInstance,
  newVNode: VNode | string | number | null,
) {
  if (!instance.dom) {
    console.error('scheduleUpdate: Instance has no DOM node.');
    return;
  }

  const parent = instance.dom.parentNode as HTMLElement;
  if (!parent) {
    console.error('scheduleUpdate: Instance DOM node has no parent.');
    return;
  }

  const index = Array.from(parent.childNodes).indexOf(instance.dom);
  if (index === -1) {
    console.error('scheduleUpdate: Instance DOM node not found in parent.');
    return;
  }

  console.log(`scheduleUpdate: Updating DOM at parent index ${index}`);
  diff(newVNode, instance.vnode, parent, index);
  instance.vnode = newVNode as VNode;
  instance.dom = parent.childNodes[index] as HTMLElement | Text;
}
