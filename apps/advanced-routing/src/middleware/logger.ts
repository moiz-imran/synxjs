import { RouteMiddleware } from '@synxjs/router';

export const loggerMiddleware: RouteMiddleware = (to: string, from: string) => {
  console.log(`Navigation: ${from} -> ${to}`);
};
