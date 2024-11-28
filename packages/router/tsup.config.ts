import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Browser bundle
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: false,
    outDir: 'dist',
    external: [
      '@synxjs/types',
      '@synxjs/hooks',
      '@synxjs/store',
      '@synxjs/vdom',
      '@synxjs/jsx-runtime',
      '@synxjs/jsx-dev-runtime',
      '@synxjs/runtime',
    ],
  },
  {
    // Node.js bundle for Vite plugin
    entry: ['src/vite-plugin.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'node',
    outDir: 'dist/node',
    external: ['vite', 'fs', 'path'],
  },
  {
    // File system router utilities
    entry: ['src/fs-router.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'node',
    outDir: 'dist/node',
    external: ['fs', 'path'],
  },
]);
