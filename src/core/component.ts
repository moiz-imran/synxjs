// src/core/component.ts

import { VNode } from './vdom';
import { effect } from './reactive';

export interface ComponentProps {
  [key: string]: any;
  key?: string;
}

export abstract class Component<P extends ComponentProps = {}, S = {}> {
  props: P;
  state: S;
  private cleanupFns: Array<() => void> = [];

  constructor(props: P) {
    this.props = props;
    this.state = this.initialState();
  }

  protected abstract initialState(): S;

  setState(newState: Partial<S>): void {
    this.state = { ...this.state, ...newState };
    this.update();
  }

  componentDidMount(): void {}
  componentWillUpdate(): void {}
  componentDidUpdate(): void {}
  componentWillUnmount(): void {
    // Cleanup all registered cleanup functions
    this.cleanupFns.forEach((cleanup) => cleanup());
    this.cleanupFns = [];
  }

  abstract render(): VNode;

  /**
   * Subscribes to reactive state changes and registers cleanup functions.
   * @param callback - Function to execute on state change.
   */
  subscribeToStore(callback: () => void): void {
    const cleanup = effect(callback);
    this.cleanupFns.push(cleanup);
  }

  private update(): void {
    this.componentWillUpdate();
    const root = document.getElementById('root');
    if (root && typeof (root as any).__appRender === 'function') {
      (root as any).__appRender();
    }
    this.componentDidUpdate();
  }
}
