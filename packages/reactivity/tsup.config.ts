import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: ['@synxjs/types'],
  esbuildOptions: (options) => {
    options.banner = {
      js: '// Test setup\nif (typeof window === "undefined") { global.window = undefined; }',
    };
  },
});
