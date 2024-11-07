// src/core/ComponentInstance.ts

import { VNode } from "./vdom";

export interface ComponentInstance {
  hooks: any[];
  currentHook: number;
  vnode: VNode;
  render: () => void;
}
