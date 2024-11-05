// src/core/plugins.ts

import { render } from './renderer';

type Renderer = typeof render;

export interface Plugin {
  install: (renderer: Renderer) => void;
}

export function use(plugin: Plugin): void {
  plugin.install(render);
}
