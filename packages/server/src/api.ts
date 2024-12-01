export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS';

export interface RouteParams {
  [key: string]: string;
}

export interface APIContext {
  req: Request;
  params: RouteParams;
  query: URLSearchParams;
}

export interface CORSConfig {
  origin?: string | string[];
  methods?: HTTPMethod[];
  headers?: string[];
  credentials?: boolean;
}

export interface APIRoute {
  method: HTTPMethod;
  path: string;
  handler: (context: APIContext) => Promise<Response>;
}

export interface APIConfig {
  routes: APIRoute[];
  prefix?: string;
  middleware?: ((context: APIContext) => Promise<Response | void>)[];
  cors?: CORSConfig;
}

export class APIResponse {
  static json(data: any, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...init,
    });
  }

  static error(message: string, status: number = 400): Response {
    return APIResponse.json({ error: message }, { status });
  }

  static redirect(url: string, status: number = 302): Response {
    return new Response(null, {
      status,
      headers: { Location: url },
    });
  }
}

export class APIRouter {
  private routes: Map<string, Map<HTTPMethod, APIRoute>>;
  private prefix: string;
  private middleware: ((context: APIContext) => Promise<Response | void>)[];
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.routes = new Map();
    this.prefix = config.prefix || '/api';
    this.middleware = config.middleware || [];
    this.config = config;

    config.routes.forEach((route) => this.addRoute(route));
  }

  private addRoute(route: APIRoute) {
    const { method, path } = route;
    const fullPath = path.startsWith(this.prefix) ? path : this.prefix + path;

    if (!this.routes.has(fullPath)) {
      this.routes.set(fullPath, new Map());
    }

    this.routes.get(fullPath)!.set(method, route);
  }

  private parseRoute(path: string): RegExp {
    return new RegExp(
      '^' +
      path
        .replace(/\/:([^/]+)/g, '/([^/]+)')
        .replace(/\/$/, '')
      + '/?$'
    );
  }

  private matchRoute(requestPath: string, method: HTTPMethod): [APIRoute | undefined, RouteParams] {
    for (const [routePath, methods] of this.routes.entries()) {
      const pattern = this.parseRoute(routePath);
      const match = requestPath.match(pattern);

      if (match) {
        const params: RouteParams = {};
        const paramNames = (routePath.match(/\/:([^/]+)/g) || []).map((p) =>
          p.slice(2),
        );

        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        // Get the route for the specific HTTP method
        const route = methods.get(method);
        return [route, params];
      }
    }

    return [undefined, {}];
  }

  private handleCORS(req: Request): Response | undefined {
    if (!this.config.cors) return;

    const origin = req.headers.get('Origin');
    if (!origin) return;

    const headers = new Headers();
    const cors = this.config.cors;

    // Handle origin
    if (cors.origin === '*') {
      headers.set('Access-Control-Allow-Origin', '*');
    } else if (Array.isArray(cors.origin)) {
      if (cors.origin.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
      }
    }

    // Handle methods
    if (cors.methods) {
      headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
    }

    // Handle headers
    if (cors.headers) {
      headers.set('Access-Control-Allow-Headers', cors.headers.join(', '));
    }

    // Handle credentials
    if (cors.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    return new Response(null, { headers });
  }

  async handleRequest(req: Request): Promise<Response> {
    try {
      // Handle CORS
      const corsResponse = this.handleCORS(req);
      if (corsResponse) return corsResponse;

      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method as HTTPMethod;

      // Match route and get params
      const [route, params] = this.matchRoute(path, method);
      if (!route) {
        return APIResponse.error('Not Found', 404);
      }

      // Create context
      const context: APIContext = {
        req,
        params,
        query: url.searchParams,
      };

      // Run middleware
      for (const middleware of this.middleware) {
        const result = await middleware(context);
        if (result instanceof Response) {
          return result;
        }
      }

      // Handle the route
      return await route.handler(context);
    } catch (error) {
      console.error('API Error:', error);
      return APIResponse.error('Internal Server Error', 500);
    }
  }
}
