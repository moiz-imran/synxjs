import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: false, // Disables code-splitting to create a single bundled output
  },
  {
    // Node.js bundle
    entry: ['src/vite-plugin.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    platform: 'node',
    outDir: 'dist/node',
  },
]);
