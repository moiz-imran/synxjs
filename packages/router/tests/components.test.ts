// Mock hooks with proper route state
const states = new Map<string, any>();
vi.mock('@synxjs/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@synxjs/hooks')>();

  return {
    ...actual,
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
    useState: vi.fn().mockImplementation((initialValue) => {
      const key = String(mockComponent.currentHook++);
      if (!states.has(key)) {
        states.set(key, initialValue);
      }

      const setValue = (newValue: any) => {
        const value = newValue;
        states.set(key, value);
      };

      return [states.get(key), setValue];
    }),
  };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from '@synxjs/vdom';
import {
  FunctionalComponent,
  FunctionalComponentInstance,
  VNode,
} from '@synxjs/types';
import { usePulseState, useState } from '@synxjs/hooks';
import { RouterProvider, Routes } from '../src/components';
import { Router } from '../src/store';
import { getCurrentComponent } from '@synxjs/runtime';

// Mock runtime
const mockComponent: FunctionalComponentInstance = {
  hooks: [],
  currentHook: 0,
  vnode: {} as any,
  render: vi.fn(),
  dom: null,
};

vi.mock('@synxjs/runtime', () => ({
  getCurrentComponent: vi.fn(() => mockComponent),
  setCurrentComponent: vi.fn(),
}));

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

      vi.clearAllMocks();
      mockComponent.hooks = [];
      mockComponent.currentHook = 0;
      vi.mocked(getCurrentComponent).mockReturnValue(mockComponent);

      // Reset useState mock for each test
      vi.mocked(useState).mockClear();
      states.clear();
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

    it('should handle component loading errors', async () => {
      const ErrorComponent = () => createElement('div', {}, 'Error Loading');

      const routes = [
        {
          path: '/error',
          component: () => Promise.reject(new Error('Failed to load')),
          lazy: true,
          error: ErrorComponent,
        },
      ];

      const router = new Router(routes);
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/error' }, vi.fn()];
        }
        if (key === 'routes') {
          return [routes, vi.fn()];
        }
        return [null, vi.fn()];
      });

      let result = Routes({});

      // Wait for the error to be handled
      await new Promise((resolve) => setTimeout(resolve, 0));
      mockComponent.currentHook = 0; // Reset for next render

      result = Routes({});
      expect(result.type).toBe(ErrorComponent);
    });

    it('should handle transition states', async () => {
      const ContentComponent = () => createElement('div', {}, 'Content');
      const routes = [
        {
          path: '/transition',
          lazy: true,
          component: () => Promise.resolve(ContentComponent),
          transition: {
            enter: 'fade-in',
            leave: 'fade-out',
            duration: 300,
          },
        },
      ];

      const router = new Router(routes);
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/transition' }, vi.fn()];
        }
        if (key === 'routes') {
          return [routes, vi.fn()];
        }
        return [null, vi.fn()];
      });

      let result = Routes({});
      expect(result).toBe(null);

      await new Promise((resolve) => setTimeout(resolve, 0));
      mockComponent.currentHook = 0; // Reset for next render

      result = Routes({});

      expect(result.type).toBe('div');
      expect(result.props.className).toBe('fade-in');
      expect(result.props.style).toEqual({
        transition: 'all 300ms',
      });
      expect((result.children?.[0] as VNode).type).toBe(ContentComponent);
    });

    it('should handle lazy loaded components', async () => {
      const LazyComponent = vi.fn(() => createElement('div', {}, 'Lazy'));
      const LoadingComponent = () => createElement('div', {}, 'Loading');

      const routes = [
        {
          path: '/lazy',
          component: () => Promise.resolve(LazyComponent),
          lazy: true,
          loading: LoadingComponent,
        },
      ];

      const router = new Router(routes);
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [{ currentRoute: '/lazy' }, vi.fn()];
        }
        if (key === 'routes') {
          return [routes, vi.fn()];
        }
        return [null, vi.fn()];
      });

      let result = Routes({});
      expect(result.type).toBe(LoadingComponent);

      // Wait for lazy component to load
      await new Promise((resolve) => setTimeout(resolve, 0));
      mockComponent.currentHook = 0; // Reset for next render

      result = Routes({});
      expect(result.type).toBe(LazyComponent);
    });
  });
});
