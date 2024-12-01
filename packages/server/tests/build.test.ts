import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Builder } from '../src/build';
import { build as esbuild } from 'esbuild';

// Mock esbuild
vi.mock('esbuild', () => ({
  build: vi.fn().mockResolvedValue({
    watch: vi.fn().mockResolvedValue({
      onRebuild: vi.fn(),
    }),
    dispose: vi.fn(),
  }),
}));

describe('Builder', () => {
  let builder: Builder;
  const mockConfig = {
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build with default config', async () => {
    builder = new Builder(mockConfig);
    await builder.build();

    expect(esbuild).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPoints: ['src/index.ts'],
        outdir: 'dist',
        bundle: true,
        minify: false,
        sourcemap: true,
      }),
    );
  });

  it('should handle watch mode', async () => {
    builder = new Builder({
      ...mockConfig,
      watch: true,
    });

    await builder.build();
    expect(esbuild).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      }),
    );
  });

  it('should handle build errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockPlugin = builder['getHMRPlugin']();

    // Simulate build error
    mockPlugin.setup!({
      onEnd: (callback: any) => callback({ errors: ['Test error'] }),
    } as any);

    expect(consoleSpy).toHaveBeenCalledWith('Build errors:', ['Test error']);
    consoleSpy.mockRestore();
  });

  it('should cleanup watch context on stop', async () => {
    builder = new Builder({
      ...mockConfig,
      watch: true,
    });

    await builder.build();
    await builder.stop();

    expect(builder['buildContext'].dispose).toHaveBeenCalled();
  });
});
