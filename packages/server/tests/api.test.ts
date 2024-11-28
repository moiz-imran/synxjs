import { describe, it, expect, vi } from 'vitest';
import { APIRouter, APIResponse, type APIConfig } from '../src/api';

describe('API Router', () => {
  describe('Basic Routing', () => {
    it('should handle basic GET request', async () => {
      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/hello',
            handler: async () => APIResponse.json({ message: 'Hello World' }),
          },
        ],
      };

      const router = new APIRouter(config);
      const req = new Request('http://localhost/api/hello');

      const response = await router.handleRequest(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: 'Hello World' });
    });

    it('should return 404 for unknown routes', async () => {
      const router = new APIRouter({ routes: [] });
      const req = new Request('http://localhost/api/unknown');

      const response = await router.handleRequest(req);
      expect(response.status).toBe(404);
    });
  });

  describe('Path Parameters', () => {
    it('should handle path parameters', async () => {
      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/users/:id',
            handler: async ({ params }) => APIResponse.json({ id: params.id }),
          },
        ],
      };

      const router = new APIRouter(config);
      const req = new Request('http://localhost/api/users/123');

      const response = await router.handleRequest(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: '123' });
    });

    it('should handle multiple path parameters', async () => {
      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/users/:userId/posts/:postId',
            handler: async ({ params }) => APIResponse.json(params),
          },
        ],
      };

      const router = new APIRouter(config);
      const req = new Request('http://localhost/api/users/123/posts/456');

      const response = await router.handleRequest(req);
      expect(await response.json()).toEqual({
        userId: '123',
        postId: '456',
      });
    });
  });

  describe('Query Parameters', () => {
    it('should handle query parameters', async () => {
      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/search',
            handler: async ({ query }) =>
              APIResponse.json({
                q: query.get('q'),
                page: query.get('page'),
              }),
          },
        ],
      };

      const router = new APIRouter(config);
      const req = new Request('http://localhost/api/search?q=test&page=1');

      const response = await router.handleRequest(req);
      expect(await response.json()).toEqual({
        q: 'test',
        page: '1',
      });
    });
  });

  describe('Middleware', () => {
    it('should run middleware before routes', async () => {
      const middleware = vi.fn(async ({ req }) => {
        if (!req.headers.has('Authorization')) {
          return APIResponse.error('Unauthorized', 401);
        }
      });

      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/protected',
            handler: async () => APIResponse.json({ data: 'protected' }),
          },
        ],
        middleware: [middleware],
      };

      const router = new APIRouter(config);

      // Request without auth
      const reqNoAuth = new Request('http://localhost/api/protected');
      const responseNoAuth = await router.handleRequest(reqNoAuth);
      expect(responseNoAuth.status).toBe(401);

      // Request with auth
      const reqWithAuth = new Request('http://localhost/api/protected', {
        headers: { Authorization: 'Bearer token' },
      });
      const responseWithAuth = await router.handleRequest(reqWithAuth);
      expect(responseWithAuth.status).toBe(200);
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const config: APIConfig = {
        routes: [
          {
            method: 'GET',
            path: '/test',
            handler: async () => APIResponse.json({ ok: true }),
          },
        ],
        cors: {
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          headers: ['Content-Type'],
          credentials: true,
        },
      };

      const router = new APIRouter(config);
      const req = new Request('http://localhost/api/test', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });

      const response = await router.handleRequest(req);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000',
      );
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        'GET',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
        'Content-Type',
      );
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
        'true',
      );
    });
  });

  describe('Response Helpers', () => {
    it('should handle JSON responses', async () => {
      const data = { test: true };
      const response = APIResponse.json(data);
      expect(await response.json()).toEqual(data);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle error responses', async () => {
      const response = APIResponse.error('Bad Request', 400);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Bad Request' });
    });

    it('should handle redirects', async () => {
      const response = APIResponse.redirect('/new-location');
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/new-location');
    });
  });
});
