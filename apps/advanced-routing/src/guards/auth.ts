import { getRouter } from '@synxjs/router';
import type { RouteGuard } from '@synxjs/types';
import { authStore } from '../store';

export const authGuard: RouteGuard = (to: string) => {
  const isAuthenticated = authStore.getPulse('isAuthenticated');
  const router = getRouter();

  if (!isAuthenticated && to !== '/login') {
    // Redirect to login
    router.navigate('/login');
    return false;
  }

  return true;
};
