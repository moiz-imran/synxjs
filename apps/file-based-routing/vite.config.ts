import { defineConfig } from 'vite';
import { fileSystemRouter } from '@synxjs/vite/plugins';
import type { PluginOption } from 'vite';

export default defineConfig({
  plugins: [
    fileSystemRouter({
      pagesDir: 'src/pages',
      defaultLayout: '_layout',
      defaultLoading: '_loading',
      defaultError: '_error',
    }) as PluginOption,
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
