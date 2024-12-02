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
          jsx: 'automatic',
          jsxImportSource: '@synxjs',
          jsxDev: development,
          minifyIdentifiers: !development,
          keepNames: development,
        },
        define: {
          __DEV__: development,
        }
      };
    },

    transform(code, id) {
      if (!id.endsWith('.tsx') || !development) return null;

      return {
        code: `// File: ${id}\n${code}`,
        map: null
      };
    }
  };
}
