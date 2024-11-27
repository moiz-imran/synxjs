import { FunctionalComponent } from '@synxjs/types';
import { useState, useEffect } from '@synxjs/hooks';
import { store } from '../store';
import { AppState } from '../types';

export const StoreDebugger: FunctionalComponent = () => {
  const [state, setState] = useState<AppState>(store.getPulses());

  useEffect(() => {
    // Subscribe to all keys in the store
    const cleanup = store.subscribeScoped(
      Object.keys(store.getPulses()) as Array<keyof AppState>,
      (newState) => setState(newState),
    );

    return cleanup;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded shadow-lg max-w-md">
      <h3 className="text-lg font-bold mb-2">Store State</h3>
      <pre className="text-sm overflow-auto max-h-60">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
};
