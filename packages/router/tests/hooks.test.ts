// Mock hooks first
vi.mock('@synxjs/hooks', () => ({
  usePulseState: vi.fn().mockImplementation((key, store) => {
    if (key === 'state') {
      return [{ currentRoute: '/', params: {}, search: {} }, vi.fn()];
    }
    if (key === 'routes') {
      return [[], vi.fn()];
    }
    return [null, vi.fn()];
  }),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VNode } from '@synxjs/types';
import { usePulseState } from '@synxjs/hooks';
import {
  useRouter,
  useParams,
  useSearchParams,
  Router,
  setCurrentRouter,
} from '../src';

describe('Router Hooks', () => {
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    router = new Router([
      { path: '/', component: () => null as unknown as VNode },
    ]);
  });

  describe('useRouter', () => {
    it('should throw error when used outside RouterProvider', () => {
      setCurrentRouter(null as any);

      expect(() => useRouter()).toThrow('Router context not found');
    });

    it('should return router interface', () => {
      const result = useRouter();

      expect(result).toHaveProperty('navigate');
      expect(result).toHaveProperty('match');
      expect(typeof result.navigate).toBe('function');
    });

    it('should handle route changes', async () => {
      const { navigate } = useRouter();
      navigate('/about');

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify navigation happened
      expect(window.location.pathname).toBe('/about');
    });
  });

  describe('useParams', () => {
    it('should return route params', () => {
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [
            {
              currentRoute: '/user/123',
              params: { id: '123' },
              search: {},
            },
            vi.fn(),
          ];
        } else if (key === 'routes') {
          return [
            [
              {
                path: '/user/:id',
                component: () => null as unknown as VNode,
              },
            ],
            vi.fn(),
          ];
        }
        return [null, vi.fn()];
      });

      const params = useParams();
      expect(params).toEqual({ id: '123' });
    });
  });

  describe('useSearchParams', () => {
    it('should return search params', async () => {
      vi.mocked(usePulseState).mockImplementation((key) => {
        if (key === 'state') {
          return [
            {
              currentRoute: '/search',
              params: {},
              search: { query: 'test' }
            },
            vi.fn(),
          ];
        } else if (key === 'routes') {
          return [
            [{ path: '/search', component: () => null as unknown as VNode }],
            vi.fn(),
          ];
        }
        return [null, vi.fn()];
      });
      const { navigate } = useRouter();
      navigate('/search?query=test');

      await new Promise((resolve) => setTimeout(resolve, 0));
      const searchParams = useSearchParams();
      expect(searchParams).toEqual({ query: 'test' });
    });
  });
});
