import type { Plugin } from 'vite';

export interface SSRPluginOptions {
  adapter: 'vike';
  mode?: 'ssr' | 'ssg';
  streaming?: boolean;
}

export function ssrPlugin(options: SSRPluginOptions): Plugin {
  return {
    name: 'synx-ssr',
    enforce: 'post',

    configResolved(config) {
      const vikePlugin = config.plugins.find((p) => p.name === 'vike:plugin');
      if (!vikePlugin) {
        throw new Error('Vike plugin must be installed to use SSR features');
      }
    },

    config() {
      return {
        define: {
          'process.env.STREAMING': JSON.stringify(options.streaming ?? false),
          'process.env.SSR_MODE': JSON.stringify(options.mode || 'ssr'),
        },
        ssr: {
          noExternal: ['@synxjs/*'],
        },
        vike: {
          prerender: options.mode === 'ssg',
        },
      };
    },
  };
}
