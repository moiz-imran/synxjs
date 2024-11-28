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

import { generateRoutesFromFileSystem } from '../src/fs-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs, { PathLike } from 'fs';

describe('File System Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate routes from directory structure', () => {
    // Mock file system structure
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === '/root') {
        return ['index.tsx', 'about.tsx', 'users'];
      }
      if (path === '/root/users') {
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

    const routes = generateRoutesFromFileSystem('/root');
    expect(routes).toMatchObject([
      { path: '/', lazy: true },
      { path: '/about', lazy: true },
      {
        path: '/users',
        lazy: true,
        children: [
          { path: '/users', lazy: true },
          { path: '/users/:id', lazy: true },
        ],
      },
    ]);
  });

  it('should handle empty directories', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    const routes = generateRoutesFromFileSystem('/empty');
    expect(routes).toHaveLength(0);
  });

  it('should ignore non-route files', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'index.tsx',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'styles.css',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'utils.ts',
    ]);
    vi.mocked(fs.statSync).mockImplementation(
      () =>
        ({
          isDirectory: () => false,
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/root');
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/');
  });

  it('should handle nested dynamic routes', () => {
    // Mock file system structure
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === '/root') {
        return ['users'];
      }
      if (path === '/root/users') {
        return ['[userId]'];
      }
      if (path === '/root/users/[userId]') {
        return ['[postId].tsx'];
      }
      return [];
    });

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => !path.toString().endsWith('.tsx'),
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/root');
    expect(routes[0].path).toBe('/users');
    expect(routes[0].children?.[0].path).toBe('/users/:userId');
  });

  it('should handle non-tsx/jsx files', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'index.tsx',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'about.css',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'utils.ts',
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'README.md',
    ]);

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => false,
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes).toHaveLength(1); // Only index.tsx should be included
    expect(routes[0].path).toBe('/');
  });

  it('should handle special file patterns', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      '_layout.tsx', // Should be ignored (starts with _)
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'index.tsx', // Should be root route
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      '[id].tsx', // Should be dynamic route
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      '[...slug].tsx', // Should be catch-all route
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'users.tsx', // Should be regular route
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      'about.tsx', // Should be regular route
    ]);

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => false,
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');

    // Verify routes
    expect(routes).toHaveLength(5); // Excluding _layout.tsx
    expect(routes.map((r) => r.path)).toEqual([
      '/',
      '/:id',
      '/:slug*',
      '/users',
      '/about',
    ]);
  });

  it('should handle directory with matching tsx file', () => {
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['users']],
      ['/mock/root/src/pages/users', ['index.tsx', '[id].tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
    );

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => {
            const pathStr = path.toString();
            return pathStr.endsWith('users') && !pathStr.endsWith('.tsx');
          },
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: '/users',
      children: [
        {
          path: '/users',
        },
        {
          path: '/users/:id',
        },
      ],
    });
  });

  it('should handle directory without matching tsx file', () => {
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['users']],
      ['/mock/root/src/pages/users', ['index.tsx', '[id].tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
    );

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => {
            const pathStr = path.toString();
            // Only 'users' is a directory
            return pathStr.endsWith('users') && !pathStr.endsWith('.tsx');
          },
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes.length).toBe(1);

    const usersSubRoutes = routes?.[0]?.children;

    expect(usersSubRoutes?.length).toBe(2);
    expect(usersSubRoutes?.map((r) => r.path)).toEqual([
      '/users',
      '/users/:id',
    ]);
  });

  it('should handle deeply nested routes', () => {
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['users']],
      ['/mock/root/src/pages/users', ['[id]']],
      ['/mock/root/src/pages/users/[id]', ['posts']],
      ['/mock/root/src/pages/users/[id]/posts', ['[postId].tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
    );

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => {
            const pathStr = path.toString();
            return (
              !pathStr.endsWith('.tsx') &&
              (pathStr.includes('users') ||
                pathStr.includes('[id]') ||
                pathStr.includes('posts'))
            );
          },
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');

    // Should generate nested dynamic routes
    expect(routes[0].path).toBe('/users');
    expect(routes[0].children?.[0].path).toBe('/users/:id');
    expect(routes[0].children?.[0].children?.[0].path).toBe('/users/:id/posts');
    expect(routes[0].children?.[0].children?.[0].children?.[0].path).toBe(
      '/users/:id/posts/:postId',
    );
  });

  it('should handle errors gracefully', () => {
    // Simulate fs errors
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes).toEqual([]);
  });

  it('should handle different file structures in directories', () => {
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['users', 'posts', 'about.tsx']],
      ['/mock/root/src/pages/users', ['index.tsx', '[id].tsx']],
      ['/mock/root/src/pages/posts', ['[postId].tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
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

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');

    expect(routes).toHaveLength(3);
    expect(routes.map((r) => r.path)).toEqual(['/users', '/posts', '/about']);

    const usersRoutes = routes[0].children;
    expect(usersRoutes?.length).toBe(2);
    expect(usersRoutes?.map((r) => r.path)).toEqual(['/users', '/users/:id']);

    const postsRoutes = routes[1].children;
    expect(postsRoutes?.length).toBe(1);
    expect(postsRoutes?.map((r) => r.path)).toEqual(['/posts/:postId']);
  });

  it('should handle dynamic routes, including catch-all routes', () => {
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['users', '[id]', '[...slug].tsx']],
      ['/mock/root/src/pages/users', ['index.tsx']],
      ['/mock/root/src/pages/[id]', ['posts.tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
    );

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => {
            const pathStr = path.toString();
            return (
              pathStr.endsWith('users') ||
              pathStr.endsWith('[id]') ||
              !pathStr.endsWith('.tsx')
            );
          },
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');

    expect(routes).toHaveLength(3);
    expect(routes.map((r) => r.path)).toEqual(['/users', '/:id', '/:slug*']);
  });

  it('should generate routes for dynamic routes with nested directories', () => {
    // Mock file system structure
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === '/mock/root/src/pages') {
        return ['users'];
      }
      if (path === '/mock/root/src/pages/users') {
        return ['[id]'];
      }
      if (path === '/mock/root/src/pages/users/[id]') {
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

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: '/users',
      children: [
        {
          path: '/users/:id',
          children: [
            {
              path: '/users/:id/posts',
              lazy: true,
            },
          ],
        },
      ],
    });
  });

  it('should generate routes for catch-all dynamic routes with nested directories', () => {
    // Mock file system structure
    // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      if (path === '/mock/root/src/pages') {
        return ['users'];
      }
      if (path === '/mock/root/src/pages/users') {
        return ['[...slug]'];
      }
      if (path === '/mock/root/src/pages/users/[...slug]') {
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

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: '/users',
      children: [
        {
          path: '/users/:slug*',
          children: [
            {
              path: '/users/:slug*/posts',
              lazy: true,
            },
          ],
        },
      ],
    });
  });

  it('should generate routes for paths that start with a forward slash', () => {
    // Mock file system structure
    const mockFiles = new Map([
      ['/mock/root/src/pages', ['/users']],
      ['/mock/root/src/pages/users', ['[id].tsx']],
    ]);

    vi.mocked(fs.readdirSync).mockImplementation(
      // @ts-ignore -- need to override the return type of readdirSync to match the actual implementation
      (path: PathLike) => mockFiles.get(path) || [],
    );

    vi.mocked(fs.statSync).mockImplementation(
      (path: PathLike) =>
        ({
          isDirectory: () => !path.toString().endsWith('.tsx'),
        }) as any,
    );

    const routes = generateRoutesFromFileSystem('/mock/root/src/pages');
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: '/users',
      lazy: true,
    });
  });
});
