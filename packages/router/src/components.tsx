import { createElement } from '@synxjs/vdom';
import { Router } from './store';
import { Route } from './types';
import { matchRoute, matchSingleRoute } from './matcher';
import { useRouter } from './hooks';
import type { FunctionalComponent, VNode } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { setCurrentRouter } from './context';

interface RouterProviderProps {
  router: Router;
  renderer: (Routes: FunctionalComponent, context: any) => VNode;
}

function findRoute(pathname: string, routes: Route[]): Route | null {
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

  if (!match) {
    return createElement('div', null, '404 Not Found');
  }

  const route = findRoute(match.pathname, routes);
  if (!route) {
    return createElement('div', null, '404 Not Found');
  }

  return createElement(route.component, null);
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
    currentRoute
  };

  return renderer(Routes, context);
};
