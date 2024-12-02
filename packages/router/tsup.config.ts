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
]);
