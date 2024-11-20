import { Router } from './store';

export let currentRouter: Router | null = null;

export function setCurrentRouter(router: Router | null) {
  currentRouter = router;
}

export function getRouter() {
  if (!currentRouter) {
    throw new Error('Router context not found');
  }
  return currentRouter;
}