import type { RouteMiddleware } from '@synxjs/types';

export const loggerMiddleware: RouteMiddleware = (to: string, from: string) => {
  console.log(`Navigation: ${from} -> ${to}`);
};
