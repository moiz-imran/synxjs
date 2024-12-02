import { FunctionalComponent } from './component';

export type RouteParams = Record<string, string>;
export type SearchParams = Record<string, string>;

export interface RouteMatch {
  params: RouteParams;
  search: SearchParams;
  pathname: string;
}

export type RouteGuard = (
  to: string,
  from: string,
) => boolean | Promise<boolean>;
export type RouteMiddleware = (
  to: string,
  from: string,
) => void | Promise<void>;

export interface RouteTransition {
  enter?: string;
  leave?: string;
  duration?: number;
}

interface RouteBase {
  path: string;
  children?: Route[];
  guards?: RouteGuard[];
  middleware?: RouteMiddleware[];
  transition?: RouteTransition;
}

export interface LazyRoute extends RouteBase {
  component:
    | (() => Promise<FunctionalComponent<any>>)
    | FunctionalComponent<any>;
  lazy: boolean;
  error?: FunctionalComponent<any>;
  loading?: FunctionalComponent<any>;
}

export interface EagerRoute extends RouteBase {
  component: FunctionalComponent<any>;
}

export type Route = LazyRoute | EagerRoute;

export interface RouterState {
  currentRoute: string;
  params: RouteParams;
  search: SearchParams;
}

export interface RouterOptions {
  middleware?: RouteMiddleware[];
  guards?: RouteGuard[];
}

export interface RouterStore extends Record<string, unknown> {
  routes: Route[];
  state: RouterState;
  options?: RouterOptions;
}

export interface RouterContext {
  navigate: (to: string) => void;
  match: RouteMatch | null;
}
