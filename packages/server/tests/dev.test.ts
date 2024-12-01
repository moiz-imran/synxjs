import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import { DevServer } from '../src/dev';
import WebSocket from 'ws';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { createHandler } from '../src/hmr';

// Mock esbuild
vi.mock('esbuild', () => ({
  build: vi.fn().mockResolvedValue({}),
}));

describe('Development Server', () => {
  let server: DevServer;
  const testDir = join(__dirname, 'test-files');
  const staticDir = join(testDir, 'static');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(staticDir, { recursive: true });
  });

  afterEach(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Core Functionality', () => {
    it('should handle server lifecycle', async () => {
      server = new DevServer({ port: 3001 });

      expect(server.isRunning()).toBe(false);
      await server.start();
      expect(server.isRunning()).toBe(true);
      await server.stop();
      expect(server.isRunning()).toBe(false);

      // Should handle multiple stops gracefully
      await expect(server.stop()).rejects.toThrow('Server is not running');
    });

    it('should handle concurrent server instances', async () => {
      const server1 = new DevServer({ port: 3002 });
      const server2 = new DevServer({ port: 3002 });

      await server1.start();
      await expect(server2.start()).rejects.toThrow('EADDRINUSE');

      await server1.stop();
      await server2.start(); // Should work now
      await server2.stop();
    });
  });

  describe('Request Pipeline', () => {
    it('should process requests in correct order: middleware -> static -> api -> 404', async () => {
      const order: string[] = [];

      server = new DevServer({
        port: 3003,
        middleware: [
          async ({ next }) => {
            order.push('middleware');
            return next();
          },
        ],
        static: [{ dir: staticDir, prefix: '/static' }],
        api: {
          routes: [
            {
              method: 'GET',
              path: '/api/test',
              handler: async () => {
                console.log('api handler');
                order.push('api');
                return new Response('ok');
              },
            },
          ],
        },
      });

      await server.start();

      await fetch('http://localhost:3003/api/test');
      expect(order).toEqual(['middleware', 'api']);
    });

    it('should handle middleware chain correctly', async () => {
      server = new DevServer({
        port: 3004,
        middleware: [
          async ({ next }) => {
            const response = await next();
            const text = await response.text();
            return new Response(text + '1');
          },
          async ({ next }) => {
            const response = await next();
            const text = await response.text();
            return new Response(text + '2');
          },
          async () => new Response('3'),
        ],
      });

      await server.start();
      const response = await fetch('http://localhost:3004');
      expect(await response.text()).toBe('321');
    });
  });

  describe('Static File Serving', () => {
    it('should serve static files with correct MIME types', async () => {
      await writeFile(join(staticDir, 'test.html'), '<h1>Test</h1>');
      await writeFile(join(staticDir, 'test.css'), 'body { color: red; }');
      await writeFile(join(staticDir, 'test.js'), 'console.log("test")');

      server = new DevServer({
        port: 3005,
        static: [{ dir: staticDir, prefix: '/assets' }],
      });

      await server.start();

      const htmlRes = await fetch('http://localhost:3005/assets/test.html');
      expect(htmlRes.headers.get('content-type')).toBe('text/html');

      const cssRes = await fetch('http://localhost:3005/assets/test.css');
      expect(cssRes.headers.get('content-type')).toBe('text/css');

      const jsRes = await fetch('http://localhost:3005/assets/test.js');
      expect(jsRes.headers.get('content-type')).toBe('application/javascript');
    });

    it('should handle multiple static directories', async () => {
      const staticDir2 = join(testDir, 'static2');
      await mkdir(staticDir2, { recursive: true });

      await writeFile(join(staticDir, 'file1.txt'), 'content1');
      await writeFile(join(staticDir2, 'file2.txt'), 'content2');

      server = new DevServer({
        port: 3006,
        static: [
          { dir: staticDir, prefix: '/static1' },
          { dir: staticDir2, prefix: '/static2' },
        ],
      });

      await server.start();

      const res1 = await fetch('http://localhost:3006/static1/file1.txt');
      expect(await res1.text()).toBe('content1');

      const res2 = await fetch('http://localhost:3006/static2/file2.txt');
      expect(await res2.text()).toBe('content2');
    });
  });

  describe('Hot Module Replacement', () => {
    it('should notify clients of file changes', async () => {
      const testFile = join(testDir, 'test.js');
      await writeFile(testFile, 'initial');

      server = new DevServer({
        port: 3007,
        hmr: true,
        watch: {
          paths: [testDir],
        },
      });

      await server.start();

      const ws = new WebSocket('ws://localhost:3007');
      await new Promise((resolve) => ws.on('open', resolve));

      const message = await new Promise((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        writeFile(testFile, 'modified');
      });

      expect(message).toMatchObject({
        type: 'hmr:update',
        path: expect.stringContaining('test.js'),
      });

      ws.close();
    });

    it('should handle custom HMR handlers', async () => {
      const testFile = join(testDir, 'style.css');
      await writeFile(testFile, '.test{}');

      server = new DevServer({
        port: 3008,
        hmr: true,
        watch: {
          paths: [testDir],
        },
        hmrHandlers: {
          '.css': createHandler(async (path) => ({
            type: 'css-update',
            path,
            css: '.test{color:red}',
          })),
        },
      });

      await server.start();

      const ws = new WebSocket('ws://localhost:3008');
      await new Promise((resolve) => ws.on('open', resolve));

      const message = await new Promise((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        writeFile(testFile, '.test{color:blue}');
      });

      expect(message).toMatchObject({
        type: 'css-update',
        css: '.test{color:red}',
      });

      ws.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle middleware errors', async () => {
      server = new DevServer({
        port: 3009,
        middleware: [
          async () => {
            throw new Error('Middleware error');
          },
        ],
      });

      await server.start();
      const response = await fetch('http://localhost:3009');
      expect(response.status).toBe(500);
    });

    it('should handle static file errors', async () => {
      server = new DevServer({
        port: 3010,
        static: [
          {
            dir: 'nonexistent',
            prefix: '/static',
          },
        ],
      });

      await server.start();
      const response = await fetch('http://localhost:3010/static/file.txt');
      expect(response.status).toBe(404);
    });

    it('should handle HMR handler errors', async () => {
      const testFile = join(testDir, 'test.css');
      await writeFile(testFile, '.test{}');

      server = new DevServer({
        port: 3011,
        hmr: true,
        watch: {
          paths: [testDir],
        },
        hmrHandlers: {
          '.css': createHandler(async (path) => {
            throw new Error('HMR handler error');
          }),
        },
      });

      await server.start();

      const ws = new WebSocket('ws://localhost:3011');
      await new Promise((resolve) => ws.on('open', resolve));

      const message = await new Promise((resolve) => {
        ws.on('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        writeFile(testFile, '.test{color:red}');
      });

      expect(message).toMatchObject({
        type: 'error',
        path: expect.stringContaining('test.css'),
      });

      ws.close();
    });
  });

  describe('Build Integration', () => {
    it('should run build on start', async () => {
      const buildSpy = vi.fn();

      server = new DevServer({
        port: 3012,
        build: {
          onBuild: buildSpy,
        },
      });

      await server.start();
      expect(buildSpy).toHaveBeenCalled();
    });

    it('should clean up build on stop', async () => {
      const cleanupSpy = vi.fn();

      server = new DevServer({
        port: 3013,
        build: {
          onCleanup: cleanupSpy,
        },
      });

      await server.start();
      await server.stop();
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});
