import { describe, it, expect, beforeEach } from 'vitest';
import { jsxPlugin } from '../../src/plugins';
import type { Plugin } from 'vite';

describe('JSX Plugin', () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = jsxPlugin();
  });

  it('should have correct name and enforce', () => {
    expect(plugin.name).toBe('synx-jsx');
    expect(plugin.enforce).toBe('pre');
  });

  describe('config', () => {
    it('should generate correct production config', () => {
      plugin = jsxPlugin({ development: false });
      const config = (plugin.config as Function)?.();

      expect(config).toEqual({
        esbuild: {
          jsx: 'automatic',
          jsxImportSource: '@synxjs',
          jsxDev: false,
          minifyIdentifiers: true,
          keepNames: false,
        },
        define: {
          __DEV__: false,
        },
      });
    });

    it('should generate correct development config', () => {
      plugin = jsxPlugin({ development: true });
      const config = (plugin.config as Function)?.();

      expect(config).toEqual({
        esbuild: {
          jsx: 'automatic',
          jsxImportSource: '@synxjs',
          jsxDev: true,
          minifyIdentifiers: false,
          keepNames: true,
        },
        define: {
          __DEV__: true,
        },
      });
    });
  });

  describe('transform', () => {
    it('should transform tsx files in development mode', () => {
      plugin = jsxPlugin({ development: true });
      const result = (plugin.transform as Function)?.(
        'const x = 1;',
        'file.tsx',
      );

      expect(result).toEqual({
        code: '// File: file.tsx\nconst x = 1;',
        map: null,
      });
    });

    it('should not transform non-tsx files', () => {
      plugin = jsxPlugin({ development: true });
      const result = (plugin.transform as Function)?.(
        'const x = 1;',
        'file.ts',
      );

      expect(result).toBeNull();
    });

    it('should not transform files in production mode', () => {
      plugin = jsxPlugin({ development: false });
      const result = (plugin.transform as Function)?.(
        'const x = 1;',
        'file.tsx',
      );

      expect(result).toBeNull();
    });
  });
});
