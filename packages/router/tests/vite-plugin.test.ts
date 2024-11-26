import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileSystemRouter } from '../src/vite-plugin';
import fs, { PathLike, Stats } from 'fs';
import { join } from 'path';
import type { Plugin, ViteDevServer } from 'vite';

// Mock fs module
vi.mock('fs', async (originalImport) => ({
  default: {
    ...(await originalImport<typeof fs>()),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

describe('Vite Plugin: File System Router', () => {
  let plugin: Plugin;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = fileSystemRouter();

    // Set mock root
    if (plugin.configResolved) {
      (plugin.configResolved as Function)({ root: '/mock/root' } as any);
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

  it('should generate basic routes', async () => {
    // Mock basic file structure
    const mockReaddirSync = vi.mocked(fs.readdirSync);
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    mockReaddirSync.mockImplementation((path: PathLike) => {
      if (path === join('/mock/root', 'src/pages')) {
        return ['index.tsx', 'about.tsx', '_layout.tsx'];
      }
      return [];
    });

    const mockStatSync = vi.mocked(fs.statSync);
    mockStatSync.mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => false,
        }) as Stats,
    );

    if (plugin.load) {
      const result = await (plugin.load as Function)(
        '\0virtual:generated-routes',
        { ssr: false },
      );
      expect(typeof result).toBe('string');
      if (typeof result === 'string') {
        expect(result).toContain('export { routes }');
        expect(result).toContain('"/about"');
      }
    }
  });

  it('should handle dynamic routes', async () => {
    // Mock file structure with dynamic routes
    const mockReaddirSync = vi.mocked(fs.readdirSync);
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    mockReaddirSync.mockImplementation((path: PathLike) => {
      if (path === join('/mock/root', 'src/pages')) {
        return ['[id].tsx'];
      }
      return [];
    });

    const mockStatSync = vi.mocked(fs.statSync);
    mockStatSync.mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => false,
        }) as Stats,
    );

    if (plugin.load) {
      const result = await (plugin.load as Function)(
        '\0virtual:generated-routes',
        { ssr: false },
      );
      if (typeof result === 'string') {
        expect(result).toContain('/:id');
      }
    }
  });

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

      const watcher = mockServer.watcher as { add: any; on: any };
      expect(watcher.add).toHaveBeenCalled();
      expect(watcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(watcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
    }
  });

  it('should handle nested routes', async () => {
    // Mock nested file structure
    const mockFiles = new Map([
      [join('/mock/root', 'src/pages'), ['users', 'users.tsx']],
      [join('/mock/root', 'src/pages/users'), ['[id].tsx']],
    ]);
    const mockReaddirSync = vi.mocked(fs.readdirSync);
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    mockReaddirSync.mockImplementation((path: string) => {
      return mockFiles.get(path) || [];
    });

    const mockStatSync = vi.mocked(fs.statSync);
    mockStatSync.mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => {
            const pathStr = path.toString();
            return pathStr.endsWith('users') && !pathStr.endsWith('.tsx');
          },
        }) as Stats,
    );

    if (plugin.load) {
      const result = await (plugin.load as Function)(
        '\0virtual:generated-routes',
        { ssr: false },
      );
      if (typeof result === 'string') {
        expect(result).toContain('users');
        expect(result).toContain('[id]');
      }
    }
  });

  describe('HMR', () => {
    it('should handle file additions', async () => {
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

        // Get the 'add' handler
        const [[, addHandler]] = (
          mockServer.watcher as any
        ).on.mock.calls.filter(([event]: [string]) => event === 'add');

        // Simulate file addition
        addHandler(join('/mock/root', 'src/pages/new-page.tsx'));

        expect(mockServer.moduleGraph?.invalidateAll).toHaveBeenCalled();
        expect(mockServer.ws?.send).toHaveBeenCalledWith({
          type: 'full-reload',
        });
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

        // Get both handlers
        const [[, addHandler]] = (
          mockServer.watcher as any
        ).on.mock.calls.filter(([event]: [string]) => event === 'add');
        const [[, unlinkHandler]] = (
          mockServer.watcher as any
        ).on.mock.calls.filter(([event]: [string]) => event === 'unlink');

        // Simulate file changes outside pages directory
        addHandler('/mock/root/src/other/file.tsx');
        unlinkHandler('/mock/root/src/other/file.tsx');

        expect(mockServer.moduleGraph?.invalidateAll).not.toHaveBeenCalled();
        expect(mockServer.ws?.send).not.toHaveBeenCalled();
      }
    });

    it('should handle multiple file changes', async () => {
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

        // Get both handlers
        const [[, addHandler]] = (
          mockServer.watcher as any
        ).on.mock.calls.filter(([event]: [string]) => event === 'add');
        const [[, unlinkHandler]] = (
          mockServer.watcher as any
        ).on.mock.calls.filter(([event]: [string]) => event === 'unlink');

        // Simulate multiple file changes
        addHandler(join('/mock/root', 'src/pages/page1.tsx'));
        addHandler(join('/mock/root', 'src/pages/page2.tsx'));
        unlinkHandler(join('/mock/root', 'src/pages/page3.tsx'));

        expect(mockServer.moduleGraph?.invalidateAll).toHaveBeenCalledTimes(3);
        expect(mockServer.ws?.send).toHaveBeenCalledTimes(3);
        expect(mockServer.ws?.send).toHaveBeenCalledWith({
          type: 'full-reload',
        });
      }
    });
  });
});
