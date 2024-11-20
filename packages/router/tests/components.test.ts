// Mock hooks with proper route state
vi.mock('@synxjs/hooks', () => ({
  usePulseEffect: vi.fn((fn) => fn()),
  usePulseState: vi.fn().mockImplementation((key, store) => {
    if (key === 'state') {
      return [{ currentRoute: '/' }, vi.fn()];
    }
    if (key === 'routes') {
      return [[{ path: '/', component: () => null }], vi.fn()];
    }
    return [null, vi.fn()];
  }),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from '@synxjs/vdom';
import { FunctionalComponent, VNode } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import { RouterProvider, Routes } from '../src/components';
import { Router } from '../src/store';

describe('Router Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RouterProvider', () => {
    it('should render routes using provided renderer', () => {
      const HomeComponent = () => createElement('div', {}, 'Home');
      const routes = [{ path: '/', component: HomeComponent }];

      const router = new Router(routes);
      const renderer = vi.fn((Routes: FunctionalComponent) => {
        return createElement('div', {}, createElement(Routes, {}));
      });

      RouterProvider({ router, renderer });
      expect(renderer).toHaveBeenCalledTimes(1);
    });

    it('should set current router', () => {
      const routes = [
        { path: '/', component: () => createElement('div', {}, 'Home') },
      ];
      const router = new Router(routes);
      const renderer = vi.fn();

      RouterProvider({ router, renderer });
      expect(router.getCurrentRouter()).toBe(router);
    });
  });

  describe('Routes', () => {
    let router: Router;
    beforeEach(() => {
      router = new Router([
        { path: '/', component: () => null as unknown as VNode },
      ]);
    });

    it('should render 404 when no match found', () => {
      // Mock no matching route
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/not-found' }, vi.fn()];
        }
        if (key === 'routes') {
          return [[{ path: '/', component: () => null }], vi.fn()];
        }
        return [null, vi.fn()];
      });

      const result = Routes({});
      expect(result.type).toBe('div');
      expect(result.children[0]).toBe('404 Not Found');
    });

    it('should render matched component', () => {
      const HomeComponent = () => createElement('div', {}, 'Home');

      // Mock matching route
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/' }, vi.fn()];
        }
        if (key === 'routes') {
          return [[{ path: '/', component: HomeComponent }], vi.fn()];
        }
        return [null, vi.fn()];
      });

      const result = Routes({});
      expect(result.type).toBe(HomeComponent);
    });

    it('should handle nested routes', () => {
      const UserDetailComponent = () => createElement('div', {}, 'User Detail');

      // Mock nested route match
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/user/123' }, vi.fn()];
        }
        if (key === 'routes') {
          return [
            [
              {
                path: '/user',
                component: () => null,
                children: [
                  { path: '/user/:id', component: UserDetailComponent },
                ],
              },
            ],
            vi.fn(),
          ];
        }
        return [null, vi.fn()];
      });

      const result = Routes({});
      expect(result.type).toBe(UserDetailComponent);
    });
  });
});
