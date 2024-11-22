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
    vi.mocked(fs.statSync).mockImplementation(() => ({
      isDirectory: () => false
    }) as any);

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
});
