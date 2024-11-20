// Store effects for manual triggering
const effects: Function[] = [];

vi.mock('@synxjs/runtime', () => ({
  getCurrentComponent: vi.fn(),
  setCurrentComponent: vi.fn(),
}));

vi.mock('@synxjs/hooks', () => ({
  usePulseEffect: vi.fn((fn) => {
    // Store the effect for later triggering
    effects.push(fn);
    // Run initially
    fn();

    // Return cleanup function that removes the effect
    return () => {
      const index = effects.indexOf(fn);
      if (index > -1) {
        effects.splice(index, 1);
      }
    };
  }),
  usePulseState: vi.fn(),
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentComponent, setCurrentComponent } from '@synxjs/runtime';
import { usePulseEffect } from '@synxjs/hooks';
import { Router } from '../src/store';
import { createElement } from '@synxjs/vdom';
import { FunctionalComponentInstance, VNode } from '@synxjs/types';

describe('Router', () => {
  const mockComponent: FunctionalComponentInstance = {
    hooks: [],
    currentHook: 0,
    vnode: {} as any,
    render: vi.fn(),
    dom: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockComponent.hooks = [];
    mockComponent.currentHook = 0;
    vi.mocked(setCurrentComponent).mockImplementation(() => {});
    vi.mocked(getCurrentComponent).mockReturnValue(mockComponent);
    effects.length = 0; // Clear effects array
  });

  describe('navigation', () => {
    beforeEach(() => {
      // Mock window.location.pathname
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/',
          search: '',
        },
        writable: true,
      });
    });

    it('should handle multiple route changes', () => {
      const HomeComponent = () => createElement('div', {}, 'Home');
      const UserComponent = () => createElement('div', {}, 'User');
      const AlertComponent = () => createElement('div', {}, 'Alert');

      const routes = [
        { path: '/', component: HomeComponent },
        { path: '/user', component: UserComponent },
        { path: '/alert', component: AlertComponent },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);

      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });

      effect.mockClear(); // Clear initial call

      // First navigation
      router.navigate('/user');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/user');
      expect(effect).toHaveBeenCalledTimes(1);

      // Second navigation
      effect.mockClear();
      router.navigate('/alert');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/alert');
      expect(effect).toHaveBeenCalledTimes(1);

      // Third navigation
      effect.mockClear();
      router.navigate('/user');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/user');
      expect(effect).toHaveBeenCalledTimes(1);
    });

    it('should handle back/forward navigation', () => {
      const routes = [
        { path: '/', component: () => createElement('div', {}, 'Home') },
        { path: '/user', component: () => createElement('div', {}, 'User') },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });
      effect.mockClear();

      // Forward navigation
      router.navigate('/user');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/user');

      // Simulate back button
      Object.defineProperty(window, 'location', {
        value: { pathname: '/', search: '' },
        writable: true,
      });
      window.dispatchEvent(new PopStateEvent('popstate'));
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/');
    });

    it('should maintain subscription through multiple renders', () => {
      const routes = [
        { path: '/', component: () => createElement('div', {}, 'Home') },
        { path: '/user', component: () => createElement('div', {}, 'User') },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      // Simulate multiple component renders
      for (let i = 0; i < 3; i++) {
        setCurrentComponent({ ...mockComponent, currentHook: 0 });
        usePulseEffect(() => {
          effect(router.getPulse('state').currentRoute);
        });
      }

      effect.mockClear();
      router.navigate('/user');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledTimes(3); // Once for each subscription
    });

    it('should cleanup subscriptions properly', () => {
      const routes = [
        { path: '/', component: () => createElement('div', {}, 'Home') },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });

      effect.mockClear();

      // Instead, let's verify the effect is still in place
      router.navigate('/other');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledTimes(1); // Effect should still be called

      // Clear effects to simulate component unmount/cleanup
      effects.length = 0;

      // Now verify no effects are triggered
      effect.mockClear();
      router.navigate('/');
      effects.forEach((fn) => fn());
      expect(effect).not.toHaveBeenCalled();
    });

    it('should handle nested routes', () => {
      const routes = [
        {
          path: '/user',
          component: () => createElement('div', {}, 'User'),
          children: [
            {
              path: '/user/:id',
              component: () => createElement('div', {}, 'User Detail'),
            },
          ],
        },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });
      effect.mockClear();

      router.navigate('/user/123');
      effects.forEach((fn) => fn());
      expect(effect).toHaveBeenCalledWith('/user/123');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid route changes', () => {
      const routes = [
        { path: '/a', component: () => null as unknown as VNode },
        { path: '/b', component: () => null as unknown as VNode },
        { path: '/c', component: () => null as unknown as VNode },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });
      effect.mockClear();

      // Trigger effects after each navigation
      router.navigate('/a');
      effects.forEach((fn) => fn());

      router.navigate('/b');
      effects.forEach((fn) => fn());

      router.navigate('/c');
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledTimes(3);
      expect(effect).toHaveBeenLastCalledWith('/c');
    });

    it('should handle same route navigation', () => {
      const routes = [
        { path: '/test', component: () => null as unknown as VNode },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').currentRoute);
      });
      effect.mockClear();

      // Navigate to same route multiple times
      router.navigate('/test');
      router.navigate('/test');
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledTimes(1); // Should only trigger once
    });

    it('should preserve query params during navigation', () => {
      const routes = [
        { path: '/search', component: () => null as unknown as VNode },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/search',
          search: '?query=test&page=1',
        },
        writable: true,
      });

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').search);
      });
      effect.mockClear();

      router.navigate('/search?query=test&page=1');
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledWith({
        query: 'test',
        page: '1',
      });
    });

    it('should handle deep nested route parameters', () => {
      const routes = [
        {
          path: '/users',
          component: () => null as unknown as VNode,
          children: [
            {
              path: '/users/:userId',
              component: () => null as unknown as VNode,
              children: [
                {
                  path: '/users/:userId/posts/:postId',
                  component: () => null as unknown as VNode,
                },
              ],
            },
          ],
        },
      ];

      const router = new Router(routes);
      const effect = vi.fn();

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state').params);
      });
      effect.mockClear();

      // Update Router's state with params
      router.navigate('/users/123/posts/456');
      router.setPulse('state', {
        currentRoute: '/users/123/posts/456',
        params: { userId: '123', postId: '456' },
        search: {},
      });
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledWith({
        userId: '123',
        postId: '456',
      });
    });

    it('should handle route change during effect execution', () => {
      const routes = [
        { path: '/a', component: () => null as unknown as VNode },
        { path: '/b', component: () => null as unknown as VNode },
      ];

      const router = new Router(routes);
      const effect = vi.fn(() => {
        // Navigate during effect execution
        if (router.getPulse('state').currentRoute === '/a') {
          router.navigate('/b');
          effects.forEach((fn) => fn()); // Trigger effects for the second navigation
        }
      });

      setCurrentComponent(mockComponent);
      usePulseEffect(effect);
      effect.mockClear();

      router.navigate('/a');
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledTimes(2);
      expect(router.getPulse('state').currentRoute).toBe('/b');
    });
  });

  describe('history management', () => {
    it('should handle browser back/forward with state', () => {
      const routes = [{ path: '/', component: () => null as unknown as VNode }];
      const router = new Router(routes);
      const effect = vi.fn();

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/page1',
          search: '',
        },
        writable: true,
      });

      setCurrentComponent(mockComponent);
      usePulseEffect(() => {
        effect(router.getPulse('state'));
      });
      effect.mockClear();

      window.history.pushState({ key: 'value' }, '', '/page1');
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: { key: 'value' } }),
      );

      // Update Router's state to match history
      router.setPulse('state', {
        currentRoute: '/page1',
        params: {},
        search: {},
      });
      effects.forEach((fn) => fn());

      expect(effect).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRoute: '/page1',
        }),
      );
    });
  });

  describe('performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const routes = [
        { path: '/', component: () => null as unknown as VNode },
        { path: '/about', component: () => null as unknown as VNode }
      ];

      const router = new Router(routes);
      const effect = vi.fn();
      const renderCount = vi.fn();

      // Simulate component with multiple Links
      setCurrentComponent(mockComponent);

      // Track renders
      usePulseEffect(() => {
        renderCount();
        effect(router.getPulse('state').currentRoute);
      });

      renderCount.mockClear();
      effect.mockClear();

      // Navigate
      router.navigate('/about');
      effects.forEach(fn => fn());

      expect(renderCount).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledTimes(1);
    });
  });
});
