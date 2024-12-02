import { defineConfig, PluginOption } from 'vite';
import { jsxPlugin } from '@synxjs/vite/plugins';

export default defineConfig({
  plugins: [
    jsxPlugin({
      development: process.env.NODE_ENV !== 'production',
    }) as PluginOption,
  ],
});
