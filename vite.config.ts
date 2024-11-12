import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      core: path.resolve(__dirname, 'src/core'),
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
  build: {
    outDir: 'public/dist',
    rollupOptions: {
      input: './src/index.tsx',
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: 'assets/[name].[hash].css',
      },
    },
    cssCodeSplit: true,
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 9000,
    open: true,
    host: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
