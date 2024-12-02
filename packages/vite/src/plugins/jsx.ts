import type { Plugin } from 'vite';

export interface JSXPluginOptions {
  development?: boolean;
}

export function jsxPlugin(options: JSXPluginOptions = {}): Plugin {
  const { development = process.env.NODE_ENV !== 'production' } = options;

  return {
    name: 'synx-jsx',
    enforce: 'pre',

    config() {
      return {
        esbuild: {
          jsxFactory: 'jsx',
          jsxFragment: 'Fragment',
          jsxInject: `import { jsx, Fragment } from '@synxjs/${development ? 'jsx-dev-runtime' : 'jsx-runtime'}'`,
        },
        resolve: {
          alias: {
            'react/jsx-runtime': `@synxjs/${development ? 'jsx-dev-runtime' : 'jsx-runtime'}`,
            'react/jsx-dev-runtime': '@synxjs/jsx-dev-runtime',
          },
        },
      };
    },
  };
}
