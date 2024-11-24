import { RouteGuard } from '@synxjs/router';
import { authStore } from '../store';

export const adminGuard: RouteGuard = (to: string) => {
  const isAdmin = authStore.getPulse('isAdmin');

  if (!isAdmin) {
    console.warn('Access denied: Admin only');
    return false;
  }

  return true;
};
