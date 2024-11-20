import { FunctionalComponent, VNode } from '@synxjs/types';

export type RouteParams = Record<string, string>;
export type SearchParams = Record<string, string>;

export interface RouteMatch {
  params: RouteParams;
  search: SearchParams;
  pathname: string;
}

export interface Route {
  path: string;
  component: FunctionalComponent<any>;
  children?: Route[];
}

export interface RouterState {
  currentRoute: string;
  params: RouteParams;
  search: SearchParams;
}

export interface RouterStore extends Record<string, unknown> {
  routes: Route[];
  state: RouterState;
}

export interface RouterContext {
  navigate: (to: string) => void;
  match: RouteMatch | null;
}
