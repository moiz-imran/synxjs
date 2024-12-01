import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateStatic } from '../src/static';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Mock fs promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

describe('Static Site Generation', () => {
  const mockApp = () => ({
    type: 'div',
    props: {},
    children: ['Test'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate static files for routes', async () => {
    const config = {
      routes: [
        { path: 'index', data: { title: 'Home' } },
        { path: 'about', data: { title: 'About' } }
      ],
      outDir: 'dist',
      baseHead: {
        title: 'My Site'
      }
    };

    await generateStatic(mockApp, config);

    expect(mkdir).toHaveBeenCalledWith('dist', { recursive: true });
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledWith(
      join('dist', 'index.html'),
      expect.stringContaining('Home')
    );
    expect(writeFile).toHaveBeenCalledWith(
      join('dist', 'about.html'),
      expect.stringContaining('About')
    );
  });

  it('should handle custom file paths', async () => {
    const config = {
      routes: [{ path: 'custom.html' }, { path: 'nested/page' }],
      outDir: 'dist',
    };

    await generateStatic(mockApp, config);

    expect(writeFile).toHaveBeenCalledWith(
      join('dist', 'custom.html'),
      expect.any(String),
    );
    expect(writeFile).toHaveBeenCalledWith(
      join('dist', 'nested/page.html'),
      expect.any(String),
    );
  });
});
