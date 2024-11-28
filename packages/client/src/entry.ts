import { hydrate } from '@synxjs/server/hydration';
import { VNode } from '@synxjs/types';

export function hydrateClient(App: (props: any) => VNode): void {
  const container = document.querySelector('[data-hydrate="root"]');
  if (!container) {
    throw new Error('No hydration container found');
  }

  // Get initial data from server
  const data = (window as any).__INITIAL_DATA__;

  // Hydrate the app
  hydrate(App(data), container);
}
