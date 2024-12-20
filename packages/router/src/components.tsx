import { createElement, Fragment } from '@synxjs/vdom';
import { Router } from './store';
import { matchRoute, matchSingleRoute } from './matcher';
import { useRouter } from './hooks';
import type { FunctionalComponent, VNode, Route } from '@synxjs/types';
import { usePulseState, useState } from '@synxjs/hooks';
import { setCurrentRouter } from './context';

interface RouterProviderProps {
  router: Router;
  renderer: (Routes: FunctionalComponent, context: any) => VNode;
}

export function findRoute(pathname: string, routes: Route[]): Route | null {
  for (const route of routes) {
    if (matchSingleRoute(pathname, route)) return route;

    if (route.children) {
      const childRoute = findRoute(pathname, route.children);
      if (childRoute) return childRoute;
    }
  }

  return null;
}

export const Routes: FunctionalComponent = () => {
  const { match, routes } = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadedComponent, setLoadedComponent] =
    useState<FunctionalComponent | null>(null);

  // Early returns for 404 cases
  if (!match) {
    return createElement('div', null, '404 Not Found');
  }

  const route = findRoute(match.pathname, routes);
  if (!route) {
    return createElement('div', null, '404 Not Found');
  }

  // Handle non-lazy components
  if (!('lazy' in route) || !route.lazy) {
    return createElement(route.component as FunctionalComponent, null);
  }

  // Handle loading state
  if (loading && route.loading) {
    return createElement(route.loading, null);
  }

  // Handle loaded component
  if (loadedComponent) {
    let component = loadedComponent;
    if (typeof loadedComponent === 'object' && 'default' in loadedComponent) {
      component = (loadedComponent as any).default;
    }

    if (route.transition) {
      const { enter, duration = 300 } = route.transition;
      return createElement(
        'div',
        {
          className: enter,
          style: { transition: `all ${duration}ms` },
        },
        createElement(component, null),
      );
    }

    return createElement(component, null);
  }

  // Load component if not already loading
  if (!loading) {
    setLoading(true);
    Promise.resolve((route.component as () => Promise<FunctionalComponent>)())
      .then((Component) => {
        setLoadedComponent(() => Component);
      })
      .catch((error) => {
        console.error('Error loading component', error);
        setLoadedComponent(
          route.error || (() => createElement('div', null, 'Error Loading')),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // Return loading component or null during initial load
  return route.loading
    ? createElement(route.loading, null)
    : createElement(Fragment, null);
};

export const RouterProvider: FunctionalComponent<RouterProviderProps> = ({
  router,
  renderer,
}) => {
  setCurrentRouter(router);

  // Get router state once at the top level
  const [{ currentRoute }] = usePulseState('state', router);
  const [routes] = usePulseState('routes', router);
  const match = matchRoute(currentRoute, routes);

  // Pass router context to children
  const context = {
    navigate: (to: string) => router.navigate(to),
    match,
    routes,
    currentRoute,
  };

  return renderer(Routes, context);
};
