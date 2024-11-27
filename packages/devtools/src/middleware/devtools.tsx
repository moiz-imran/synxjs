import type { Middleware } from '@synxjs/types';

export interface DevToolsMiddlewareOptions {
  maxHistory?: number;
  actionFormatter?: (action: string) => string;
}

export function createDevToolsMiddleware<T extends object>(
  options: DevToolsMiddlewareOptions = {},
): Middleware<T> {
  const { maxHistory = 50, actionFormatter = (action: string) => action } =
    options;

  return {
    onBeforeUpdate: async (context) => {
      console.group(actionFormatter(`Update: ${String(context.key)}`));
      console.log('Previous:', context.previousValue);
      console.log('Next:', context.value);
      console.groupEnd();
    },
    onReset: async (store) => {
      console.log('Store Reset');
    },
  };
}
