import { PulseStore } from '@synxjs/store';
import { RouterState, RouterStore, Route, RouterOptions } from './types';
import { setCurrentRouter } from './context';
import { matchRoute } from './matcher';
import { findRoute } from './components';

const initialState: RouterState = {
  currentRoute: window.location.pathname,
  params: {},
  search: Object.fromEntries(new URLSearchParams(window.location.search)),
};

export class Router extends PulseStore<RouterStore> {
  constructor(routes: Route[], options?: RouterOptions) {
    super({
      routes,
      state: initialState,
      options,
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
    // Run global guards first
    const globalGuards = this.getPulse('options')?.guards || [];
    for (const guard of globalGuards) {
      const result = await guard(to, from);
      if (!result) return false;
    }

    // Then run route-specific guards
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

  private async runMiddleware(to: string, from: string): Promise<void> {
    // Run global middleware first
    const globalMiddleware = this.getPulse('options')?.middleware || [];
    for (const middleware of globalMiddleware) {
      await middleware(to, from);
    }

    // Then run route-specific middleware
    const route = findRoute(to, this.getPulse('routes'));
    if (route?.middleware) {
      for (const middleware of route.middleware) {
        await middleware(to, from);
      }
    }
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

    if (resolvedPath === currentPath) return;

    // Run guards first
    const canProceed = await this.runGuards(resolvedPath, currentPath);
    if (!canProceed) return;

    // Run middleware
    await this.runMiddleware(resolvedPath, currentPath);

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
