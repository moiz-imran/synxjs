import { Route, RouteMatch } from '@synxjs/types';

export function matchRoute(
  pathname: string,
  routes: Route[],
): RouteMatch | null {
  for (const route of routes) {
    const match = matchSingleRoute(pathname, route);
    if (match) return match;

    if (route.children) {
      const childMatch = matchRoute(pathname, route.children);
      if (childMatch) return childMatch;
    }
  }

  return null;
}

export function matchSingleRoute(
  pathname: string,
  route: Route,
): RouteMatch | null {
  const routeParts = route.path.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (routeParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const pathPart = pathParts[i];

    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = pathPart;
    } else if (routePart !== pathPart) {
      return null;
    }
  }

  return {
    params,
    search: Object.fromEntries(new URLSearchParams(window.location.search)),
    pathname,
  };
}
