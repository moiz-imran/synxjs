import { PulseStore } from '@synxjs/store';
import { RouterState, RouterStore, Route } from './types';
import { setCurrentRouter } from './context';

const initialState: RouterState = {
  currentRoute: window.location.pathname,
  params: {},
  search: Object.fromEntries(new URLSearchParams(window.location.search)),
};

export class Router extends PulseStore<RouterStore> {
  constructor(routes: Route[]) {
    super({
      routes,
      state: initialState,
    });

    // Listen for popstate events
    window.addEventListener('popstate', () => {
      this.setPulse('state', {
        currentRoute: window.location.pathname,
        params: {},
        search: Object.fromEntries(new URLSearchParams(window.location.search)),
      });
    });

    setCurrentRouter(this);
  }

  navigate(to: string): void {
    window.history.pushState(null, '', to);

    // Ensure we're triggering a single update
    const currentState = this.getPulse('state');

    this.setPulse('state', {
      ...currentState,
      currentRoute: to,
      params: {},
      search: Object.fromEntries(new URLSearchParams(window.location.search)),
    });
  }

  getCurrentRouter(): Router {
    return this;
  }
}
