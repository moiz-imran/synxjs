import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileSystemRouter } from '../../src/plugins/fs-router';
import fs, { PathLike } from 'fs';
import { join } from 'path';
import type { Plugin, ViteDevServer } from 'vite';

// Mock filesystem modules
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      readdirSync: vi.fn(() => [] as string[]),
      statSync: vi.fn(),
      Dirent: class {
        name: string;
        constructor(name: string) {
          this.name = name;
        }
      },
    },
  };
});

describe('File System Router Plugin', () => {
  let plugin: Plugin;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = fileSystemRouter();
    if (plugin.configResolved) {
      (plugin.configResolved as Function)({ root: '/mock/root' } as any);
    }
  });

  it('should generate routes from directory structure', async () => {
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === join('/mock/root', 'src/pages')) {
        return ['index.tsx', 'about.tsx', 'users'];
      }
      if (path === join('/mock/root', 'src/pages/users')) {
        return ['index.tsx', '[id].tsx'];
      }
      return [];
    });

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => path.toString().endsWith('users'),
        }) as any,
    );

    if (plugin.load) {
      const result = await (plugin.load as Function)('\0virtual:generated-routes');
      expect(result).toContain('export { routes }');
      expect(result).toContain('/about');
      expect(result).toContain('/users/:id');
    }
  });

  it('should handle dynamic routes with nested directories', async () => {
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === join('/mock/root', 'src/pages')) {
        return ['users'];
      }
      if (path === join('/mock/root', 'src/pages/users')) {
        return ['[id]'];
      }
      if (path === join('/mock/root', 'src/pages/users/[id]')) {
        return ['posts.tsx'];
      }
      return [];
    });

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => !path.toString().endsWith('.tsx'),
        }) as any,
    );

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('/users/:id/posts');
    }
  });

  it('should handle catch-all routes', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'index.tsx',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      '[...slug].tsx',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'users.tsx',
    ]);

    vi.mocked(fs.statSync).mockImplementation(
      () =>
        ({
          isDirectory: () => false,
        }) as any,
    );

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('/:slug*');
    }
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('const routes = [');
      expect(result).toContain('];');
      expect(result).toContain('export { routes }');
    }
  });

    it('should ignore non-route files', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        'index.tsx',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        'styles.css',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        'utils.ts',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        'README.md',
      ]);

      vi.mocked(fs.statSync).mockImplementation(
        () =>
          ({
            isDirectory: () => false,
          }) as any,
      );

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('const routes = [');
      expect(result).toContain('path: "/"');
      expect(result).not.toContain('styles.css');
      expect(result).not.toContain('utils.ts');
      expect(result).not.toContain('README.md');
    }
    });

    it('should handle special file patterns', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        '_layout.tsx',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        'index.tsx',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        '[id].tsx',
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        '[...slug].tsx',
      ]);

      vi.mocked(fs.statSync).mockImplementation(
        () =>
          ({
            isDirectory: () => false,
          }) as any,
      );

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).not.toContain('_layout');
      expect(result).toContain('path: "/"');
      expect(result).toContain('path: "/:id"');
      expect(result).toContain('path: "/:slug*"');
    }
    });

    it('should handle different file structures in directories', async () => {
      const mockFiles = new Map([
        [join('/mock/root', 'src/pages'), ['users', 'posts', 'about.tsx']],
        [join('/mock/root', 'src/pages/users'), ['index.tsx', '[id].tsx']],
        [join('/mock/root', 'src/pages/posts'), ['[postId].tsx']],
      ]);

      vi.mocked(fs.readdirSync).mockImplementation(
        // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
        (path: PathLike) => mockFiles.get(path.toString()) || [],
      );

      vi.mocked(fs.statSync).mockImplementation(
        (path: PathLike) =>
          ({
            isDirectory: () => {
              const pathStr = path.toString();
              return (
                pathStr.endsWith('users') ||
                pathStr.endsWith('posts') ||
                !pathStr.endsWith('.tsx')
              );
            },
          }) as any,
      );

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('/users');
      expect(result).toContain('/users/:id');
      expect(result).toContain('/posts/:postId');
      expect(result).toContain('/about');
    }
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

    if (plugin.load) {
      const result = await(plugin.load as Function)(
        '\0virtual:generated-routes',
      );
      expect(result).toContain('const routes = [');
      expect(result).toContain('];');
      expect(result).toContain('export { routes }');
    }
    });

    it('should have correct name and enforce', () => {
      expect(plugin.name).toBe('synx-fs-router');
      expect(plugin.enforce).toBe('pre');
    });

    it('should resolve virtual module', () => {
      if (plugin.resolveId) {
        const result = (plugin.resolveId as Function)(
          'virtual:generated-routes',
          undefined,
          undefined,
        );
        expect(result).toBe('\0virtual:generated-routes');
      }
    });

    it('should not resolve other modules', () => {
      if (plugin.resolveId) {
        const result = (plugin.resolveId as Function)(
          'other-module',
          undefined,
          undefined,
        );
        expect(result).toBeUndefined();
      }
    });

    describe('HMR', () => {
      it('should set up HMR watchers', () => {
        const mockServer: Partial<ViteDevServer> = {
          watcher: {
            add: vi.fn(),
            on: vi.fn(),
          } as any,
          moduleGraph: {
            invalidateAll: vi.fn(),
          } as any,
          ws: {
            send: vi.fn(),
          } as any,
        };

        if (plugin.configureServer) {
          (plugin.configureServer as Function)(mockServer as ViteDevServer);
          expect(mockServer.watcher?.add).toHaveBeenCalled();
          expect(mockServer.watcher?.on).toHaveBeenCalledWith('add', expect.any(Function));
          expect(mockServer.watcher?.on).toHaveBeenCalledWith('unlink', expect.any(Function));
        }
      });

      it('should handle file changes in pages directory', async () => {
        const mockServer: Partial<ViteDevServer> = {
          watcher: {
            add: vi.fn(),
            on: vi.fn(),
          } as any,
          moduleGraph: {
            invalidateAll: vi.fn(),
          } as any,
          ws: {
            send: vi.fn(),
          } as any,
        };

        if (plugin.configureServer) {
          (plugin.configureServer as Function)(mockServer as ViteDevServer);

          // Get handlers
          const [[, addHandler]] = (mockServer.watcher as any).on.mock.calls
            .filter(([event]: [string]) => event === 'add');

          // Simulate file changes
          addHandler(join('/mock/root', 'src/pages/new-page.tsx'));

          expect(mockServer.moduleGraph?.invalidateAll).toHaveBeenCalled();
          expect(mockServer.ws?.send).toHaveBeenCalledWith({
            type: 'full-reload',
          });
        }
      });

      it('should ignore file changes outside pages directory', async () => {
        const mockServer: Partial<ViteDevServer> = {
          watcher: {
            add: vi.fn(),
            on: vi.fn(),
          } as any,
          moduleGraph: {
            invalidateAll: vi.fn(),
          } as any,
          ws: {
            send: vi.fn(),
          } as any,
        };

        if (plugin.configureServer) {
          (plugin.configureServer as Function)(mockServer as ViteDevServer);

          const [[, addHandler]] = (mockServer.watcher as any).on.mock.calls
            .filter(([event]: [string]) => event === 'add');

          addHandler('/mock/root/src/other/file.tsx');

          expect(mockServer.moduleGraph?.invalidateAll).not.toHaveBeenCalled();
          expect(mockServer.ws?.send).not.toHaveBeenCalled();
        }
      });

      it('should handle file deletions', async () => {
        const mockServer: Partial<ViteDevServer> = {
          watcher: {
            add: vi.fn(),
            on: vi.fn(),
          } as any,
          moduleGraph: {
            invalidateAll: vi.fn(),
          } as any,
          ws: {
            send: vi.fn(),
          } as any,
        };

        if (plugin.configureServer) {
          (plugin.configureServer as Function)(mockServer as ViteDevServer);

          // Get the 'unlink' handler
          const [[, unlinkHandler]] = (
            mockServer.watcher as any
          ).on.mock.calls.filter(([event]: [string]) => event === 'unlink');

          // Simulate file deletion
          unlinkHandler(join('/mock/root', 'src/pages/old-page.tsx'));

          expect(mockServer.moduleGraph?.invalidateAll).toHaveBeenCalled();
          expect(mockServer.ws?.send).toHaveBeenCalledWith({
            type: 'full-reload',
          });
        }
      });
    });

});
