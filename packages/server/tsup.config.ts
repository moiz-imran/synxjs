import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/hydration.ts', 'src/entry.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: [
    '@synxjs/types',
    '@synxjs/vdom',
    '@synxjs/core'
  ]
});
