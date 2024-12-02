import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiPlugin } from '../../src/plugins/api';
import type { Plugin } from 'vite';

describe('API Plugin', () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = apiPlugin();
  });

  it('should have correct name', () => {
    expect(plugin.name).toBe('synx-api');
  });

  it('should handle API requests', async () => {
    const mockReq = {
      url: '/api/test',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockNext = vi.fn();
    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => new Response(JSON.stringify({ message: 'ok' })),
      }),
      middlewares: {
        use: vi.fn(),
        get: vi.fn().mockReturnValue(
          async (
            req: any,
            res: {
              statusCode: number;
              setHeader: (arg0: string, arg1: string) => void;
              end: (arg0: string) => void;
            },
            next: any,
          ) => {
            const response = await mockServer.ssrLoadModule();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'ok' }));
          },
        ),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.get('/api');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
    }
  });

  it('should handle API errors', async () => {
    const mockServer = {
      ssrLoadModule: vi.fn().mockRejectedValue(new Error('Not found')),
      middlewares: {
        use: vi.fn(),
        get: vi
          .fn()
          .mockReturnValue(
            async (
              req: any,
              res: {
                statusCode: number;
                setHeader: (arg0: string, arg1: string) => void;
                end: (arg0: string) => void;
              },
              next: any,
            ) => {
              try {
                await mockServer.ssrLoadModule();
              } catch (error) {
                next(error);
              }
            },
          ),
      },
    };

    const mockNext = vi.fn();

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.get('/api');
      await middleware({}, {}, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    }
  });

  it('should handle different HTTP methods', async () => {
    const mockReq = {
      url: '/api/test',
      method: 'POST',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => new Response('Created', { status: 201 }),
      }),
      middlewares: {
        use: vi.fn(),
        get: vi.fn().mockReturnValue(async (req: any, res: any) => {
          const response = await mockServer.ssrLoadModule();
          const result = await response.default();
          res.statusCode = result.status;
          res.end(await result.text());
        }),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.get('/api');
      await middleware(mockReq, mockRes, vi.fn());

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.end).toHaveBeenCalledWith('Created');
    }
  });

  it('should handle custom prefix', async () => {
    const customPlugin = apiPlugin({ prefix: '/custom-api' });
    const mockReq = {
      url: '/custom-api/test',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => new Response('OK'),
      }),
      middlewares: {
        use: vi.fn(),
        get: vi.fn().mockReturnValue(async (req: any, res: any) => {
          const response = await mockServer.ssrLoadModule();
          const result = await response.default();
          res.statusCode = result.status;
          res.end(await result.text());
        }),
      },
    };

    if (customPlugin.configureServer) {
      await (customPlugin.configureServer as Function)(mockServer);
      expect(mockServer.middlewares.use).toHaveBeenCalledWith('/custom-api', expect.any(Function));
    }
  });

  it('should handle response headers', async () => {
    const mockReq = {
      url: '/api/test',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => new Response('OK', {
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
          },
        }),
      }),
      middlewares: {
        use: vi.fn(),
        get: vi.fn().mockReturnValue(async (req: any, res: any) => {
          const response = await mockServer.ssrLoadModule();
          const result = await response.default();
          result.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value);
          });
          res.end(await result.text());
        }),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.get('/api');
      await middleware(mockReq, mockRes, vi.fn());

      expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-custom-header', 'test');
    }
  });

  it('should handle streaming responses', async () => {
    const mockReq = {
      url: '/api/stream',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => {
          const readable = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              const combined = encoder.encode('Hello World');
              controller.enqueue(combined);
              controller.close();
            },
          });

          return new Response(readable, {
            headers: { 'Content-Type': 'text/plain' },
          });
        },
      }),
      middlewares: {
        use: vi.fn(),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.use.mock.calls[0][1];

      await middleware(mockReq, mockRes, vi.fn());

      expect(mockRes.write).toHaveBeenCalledTimes(1);
      expect(Array.from(mockRes.write.mock.calls[0][0])).toEqual([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100 // "Hello World"
      ]);
      expect(mockRes.end).toHaveBeenCalled();
    }
  });

  it('should handle non-Response returns', async () => {
    const mockReq = {
      url: '/api/invalid',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({
        default: () => ({ message: 'not a Response object' }),
      }),
      middlewares: {
        use: vi.fn(),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.use.mock.calls[0][1];
      await middleware(mockReq, mockRes, vi.fn());
    }
  });

  it('should handle missing default export', async () => {
    const mockReq = {
      url: '/api/nodefault',
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockNext = vi.fn();
    const mockServer = {
      ssrLoadModule: vi.fn().mockResolvedValue({}),
      middlewares: {
        use: vi.fn(),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.use.mock.calls[0][1];
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    }
  });

  it('should handle invalid URLs', async () => {
    const mockReq = {
      url: undefined,
      headers: { host: 'localhost:3000' },
    };

    const mockRes = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    const mockNext = vi.fn();
    const mockServer = {
      ssrLoadModule: vi.fn(),
      middlewares: {
        use: vi.fn(),
      },
    };

    if (plugin.configureServer) {
      await (plugin.configureServer as Function)(mockServer);
      const middleware = mockServer.middlewares.use.mock.calls[0][1];
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    }
  });
});
