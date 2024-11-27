import { Middleware } from '@synxjs/types';

export function createPersistenceMiddleware<T extends object>(options: {
  key: string;
  storage?: Storage;
}): Middleware<T> {
  const { key, storage = localStorage } = options;

  return {
    onAfterUpdate: async (context) => {
      const state = context.store.getPulses();
      storage.setItem(key, JSON.stringify(state));
    },
    onReset: async (store) => {
      const state = store.getPulses();
      storage.setItem(key, JSON.stringify(state));
    },
  };
}
