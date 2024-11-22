import { PulseStore } from '@synxjs/store';
import { RouterState, RouterStore, Route } from './types';
import { setCurrentRouter } from './context';
import { matchRoute } from './matcher';
import { findRoute } from './components';

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

  private async runGuards(to: string, from: string): Promise<boolean> {
    const matchedRoute = matchRoute(to, this.getPulse('routes'));
    if (!matchedRoute) return true;

    const route = findRoute(to, this.getPulse('routes'));
    if (!route?.guards) return true;

    for (const guard of route.guards) {
      const result = await guard(to, from);
      if (!result) return false;
    }

    return true;
  }

  resolveRelativePath(path: string, basePath: string): string {
    if (path.startsWith('/')) return path;

    const baseSegments = basePath.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (path.startsWith('./')) {
      return '/' + [...baseSegments, ...pathSegments.slice(1)].join('/');
    }

    if (path.startsWith('../')) {
      return (
        '/' + [...baseSegments.slice(0, -1), ...pathSegments.slice(1)].join('/')
      );
    }

    return '/' + [...baseSegments, ...pathSegments].join('/');
  }

  async navigate(to: string): Promise<void> {
    const currentPath = this.getPulse('state').currentRoute;
    const resolvedPath = this.resolveRelativePath(to, currentPath);

    // Run guards first
    const canProceed = await this.runGuards(resolvedPath, currentPath);
    if (!canProceed) return;

    // Run middleware
    const route = findRoute(resolvedPath, this.getPulse('routes'));
    if (route?.middleware) {
      for (const middleware of route.middleware) {
        await middleware(resolvedPath, currentPath);
      }
    }

    // Parse search params
    const url = new URL(resolvedPath, window.location.origin);
    const search = Object.fromEntries(url.searchParams);

    window.history.pushState(null, '', resolvedPath);
    this.setPulse('state', {
      currentRoute: resolvedPath,
      params: {},
      search,
    });
  }

  getCurrentRouter(): Router {
    return this;
  }
}
