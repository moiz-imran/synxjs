import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cssHandler, jsHandler, getHandler, createHandler } from '../src/hmr';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

// Mock esbuild
vi.mock('esbuild', () => ({
  transformSync: vi.fn().mockReturnValue({
    code: 'transformed code',
    map: 'sourcemap'
  })
}));

describe('HMR Handlers', () => {
  const testDir = join(__dirname, 'test-files');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should handle CSS files', async () => {
    const cssFile = join(testDir, 'test.css');
    await writeFile(cssFile, '.test { color: red; }');

    const result = await cssHandler(cssFile);
    expect(result.type).toBe('css-update');
    expect(result.css).toContain('color: red');
    expect(result.ast).toBeDefined();
  });

  it('should handle JS/TS files', async () => {
    const jsFile = join(testDir, 'test.ts');
    await writeFile(jsFile, 'export const x = 1;');

    const result = await jsHandler(jsFile);
    expect(result.type).toBe('js-update');
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should get correct handler for file extension', () => {
    expect(getHandler('test.css')).toBe(cssHandler);
    expect(getHandler('test.js')).toBe(jsHandler);
    expect(getHandler('test.ts')).toBe(jsHandler);
    expect(getHandler('test.unknown')).toBe(jsHandler); // Default to JS handler
  });

  it('should create handler with error handling', async () => {
    const errorHandler = createHandler(async () => {
      throw new Error('Test error');
    });

    const result = await errorHandler('test.js');
    expect(result.type).toBe('error');
    expect(result.error).toBe('Test error');
  });
});
