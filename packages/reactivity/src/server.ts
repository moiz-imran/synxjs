// Type for server-side state storage
interface ServerState {
  signals: Map<() => any, any>;
}

// Global state for SSR
let serverState: ServerState = {
  signals: new Map()
};

// Allow manual control of server mode for testing
let isServer = typeof window === 'undefined';

export function enableServerMode(enabled: boolean = true) {
  isServer = enabled;
}

// Get current server state
export function getServerState(): ServerState {
  return serverState;
}

// Reset server state (called between renders)
export function resetServerState(): void {
  serverState = {
    signals: new Map()
  };
}

// Track a signal in server state
export function trackServerSignal<T>(
  getter: () => T,
  setter: (value: T | ((prev: T) => T)) => T,
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => T] {
  // Store initial value immediately
  serverState.signals.set(getter, initialValue);

  // Create tracked setter that updates server state
  const trackedSetter = (newValue: T | ((prev: T) => T)) => {
    const result = setter(newValue);
    serverState.signals.set(getter, result);
    return result;
  };

  return [getter, trackedSetter];
}
