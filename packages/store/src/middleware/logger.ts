import type { Middleware } from '../types';

export function createLoggerMiddleware<T extends object>(
  options: {
    log?: boolean;
    console?: Console;
  } = {},
): Middleware<T> {
  const { log = true, console: customConsole = console } = options;

  return {
    onBeforeUpdate: async (context) => {
      if (log) {
        customConsole.group(`PulseStore Update (${context.key.toString()})`);
        customConsole.log('Previous:', context.previousValue);
        customConsole.log('Next:', context.value);
        customConsole.groupEnd();
      }
    },
    onAfterUpdate: async (context) => {
      if (log) {
        customConsole.log(
          `Updated ${context.key.toString()} at ${new Date(context.timestamp).toISOString()}`,
        );
      }
    },
    onReset: async (store) => {
      if (log) {
        customConsole.log('Store reset to initial state');
      }
    },
  };
}
