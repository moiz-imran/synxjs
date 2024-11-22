import { usePulseState } from '@synxjs/hooks';
import { matchRoute } from './matcher';
import { getRouter } from './context';

export function useRouter() {
  const currentRouter = getRouter();

  if (!currentRouter) {
    throw new Error('useRouter must be used within a RouterProvider');
  }

  const [{ currentRoute, ...state }] = usePulseState('state', currentRouter);
  const [routes] = usePulseState('routes', currentRouter);

  const match = matchRoute(currentRoute, routes);

  return {
    navigate: (to: string) => currentRouter.navigate(to),
    match,
    routes,
    state: { ...state, currentRoute },
  };
}

export function useParams<T extends Record<string, string>>(): T {
  const router = useRouter();
  return router.match?.params as T;
}

export function useSearchParams<T extends Record<string, string>>(): T {
  const router = useRouter();
  return router.match?.search as T;
}
