// src/core/store.ts

type Listener = () => void;

export class ReactiveStore<T extends Record<string, any>> {
  private state: T;
  private listeners: Listener[] = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Retrieves the current state.
   */
  getState(): T {
    return this.state;
  }

  /**
   * Updates the state and notifies all listeners.
   * @param newState - Partial state to merge with the current state.
   */
  setState(newState: Partial<T>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  /**
   * Subscribes a listener to state changes.
   * @param listener - The callback to invoke on state changes.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all subscribed listeners of a state change.
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }
}
