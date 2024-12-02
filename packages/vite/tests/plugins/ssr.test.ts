import { describe, it, expect, beforeEach } from 'vitest';
import { ssrPlugin } from '../../src/plugins';
import type { Plugin } from 'vite';

describe('SSR Plugin', () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = ssrPlugin({ adapter: 'vike' });
  });

  it('should have correct name and enforce', () => {
    expect(plugin.name).toBe('synx-ssr');
    expect(plugin.enforce).toBe('post');
  });

  it('should throw if Vike plugin is missing', () => {
    if (plugin.configResolved) {
      expect(() =>
        (plugin.configResolved as Function)({ plugins: [] }),
      ).toThrow('Vike plugin must be installed');
    }
  });

  it('should configure SSR options correctly', () => {
    if (plugin.config) {
      const config = (plugin.config as Function)();
      expect(config.define['process.env.STREAMING']).toBe('false');
      expect(config.define['process.env.SSR_MODE']).toBe('"ssr"');
      expect(config.ssr.noExternal).toContain('@synxjs/*');
      expect(config.vike.prerender).toBe(false);
    }
  });

  it('should enable prerender for SSG mode', () => {
    plugin = ssrPlugin({ adapter: 'vike', mode: 'ssg' });
    if (plugin.config) {
      const config = (plugin.config as Function)();
      expect(config.vike.prerender).toBe(true);
    }
  });

  it('should configure streaming correctly', () => {
    plugin = ssrPlugin({ adapter: 'vike', streaming: true });
    if (plugin.config) {
      const config = (plugin.config as Function)();
      expect(config.define['process.env.STREAMING']).toBe('true');
    }
  });

  it('should handle plugin hook errors gracefully', () => {
    if (plugin.configResolved) {
      expect(() =>
        (plugin.configResolved as Function)({ plugins: [{ name: 'wrong-plugin' }] })
      ).toThrow('Vike plugin must be installed');
    }
  });
});
