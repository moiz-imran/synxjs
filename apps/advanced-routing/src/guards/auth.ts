import { RouteGuard } from '@synxjs/router';
import { authStore } from '../store';

export const authGuard: RouteGuard = (to: string) => {
  const isAuthenticated = authStore.getPulse('isAuthenticated');

  if (!isAuthenticated && to !== '/login') {
    // Redirect to login
    window.history.pushState(null, '', '/login');
    return false;
  }

  return true;
};
