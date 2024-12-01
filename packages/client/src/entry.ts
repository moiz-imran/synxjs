import type { VNode, FunctionalComponent } from '@synxjs/types';
import { hydrate } from '@synxjs/server/hydration';
import type { HydrationOptions } from './types';

export function hydrateClient(
  App: FunctionalComponent,
  options: HydrationOptions = {}
): void {
  const {
    containerId = 'root',
    onHydrated,
    shouldWaitForData = false
  } = options;

  // Find hydration container
  const container = document.querySelector(`[data-hydrate="${containerId}"]`);
  if (!container) {
    throw new Error('No hydration container found');
  }

  // Get initial data from window
  const initialData = (window as any).__INITIAL_DATA__?.props;

  // If we should wait for data and no data exists yet, wait and retry
  if (shouldWaitForData && typeof initialData === 'undefined') {
    setTimeout(() => hydrateClient(App, options), 10);
    return;
  }

  // Create app VNode with initial data
  const vnode: VNode = App(initialData);

  // Hydrate the app
  hydrate(vnode, container);

  // Call onHydrated callback if provided
  onHydrated?.();
}
