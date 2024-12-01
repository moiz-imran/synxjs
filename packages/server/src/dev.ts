import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { join, extname } from 'path';
import { readFile } from 'fs/promises';
import { EventEmitter } from 'events';
import { APIRouter } from './api';
import type { APIConfig } from './api';
import { Builder } from './build';
import type { BuildConfig } from './build';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

export interface DevMiddleware {
  (context: {
    request: Request;
    url: URL;
    next: () => Promise<Response>;
  }): Promise<Response>;
}

export interface StaticFileConfig {
  dir: string;
  prefix?: string;
}

export interface DevServerConfig {
  port?: number;
  host?: string;
  middleware?: DevMiddleware[];
  static?: StaticFileConfig[];
  api?: APIConfig;
  hmr?: boolean;
  watch?: {
    paths: string[];
    ignore?: string[];
  };
  hmrHandlers?: Record<string, (path: string) => Promise<any>>;
  build?: BuildConfig;
}

export class DevServer extends EventEmitter {
  private server: Server;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private watcher: ReturnType<typeof watch> | null = null;
  private builder: Builder | null = null;
  private running = false;

  constructor(private config: DevServerConfig = {}) {
    super();
    this.server = createServer(async (req, res) => {
      try {
        const request = new Request(`http://${req.headers.host}${req.url}`);
        const response = await this.handleRequest(request);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));

        const body = await response.arrayBuffer();
        res.end(Buffer.from(body));
      } catch (error) {
        console.error('Request error:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  }

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Run middleware chain
    if (this.config.middleware?.length) {
      let index = 0;
      const next = async (): Promise<Response> => {
        if (index >= this.config.middleware!.length) {
          return this.handleDefaultRequest(request, url);
        }
        return this.config.middleware![index++]({ request, url, next });
      };
      return next();
    }

    return this.handleDefaultRequest(request, url);
  }

  private async handleDefaultRequest(request: Request, url: URL): Promise<Response> {
    console.log('[handleDefaultRequest] config', this.config.api, url.pathname);
    // Try API routes first if it's an API request
    if (this.config.api && url.pathname.startsWith('/api/')) {
      const router = new APIRouter(this.config.api);
      console.log('[handleDefaultRequest] router', router);
      const response = await router.handleRequest(request);
      console.log('[handleDefaultRequest] response', response);
      if (response.status !== 404) {
        return response;
      }
    }

    // Then try static files
    if (this.config.static) {
      for (const staticConfig of this.config.static) {
        const prefix = staticConfig.prefix || '/';
        if (url.pathname.startsWith(prefix)) {
          const path = url.pathname.slice(prefix.length);
          const fullPath = join(staticConfig.dir, path);
          try {
            const content = await readFile(fullPath);
            const ext = extname(fullPath);
            return new Response(content, {
              headers: {
                'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
              }
            });
          } catch {
            continue;
          }
        }
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  private setupHMR() {
    this.wss = new WebSocketServer({ server: this.server });
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });
  }

  private setupWatcher() {
    const { paths = [], ignore = [] } = this.config.watch || {};
    this.watcher = watch(paths, {
      ignored: ignore,
      ignoreInitial: true
    });

    this.watcher.on('change', async (path) => {
      if (!this.clients.size) return;

      const ext = extname(path);
      let data: any = { path };

      try {
        if (this.config.hmrHandlers?.[ext]) {
          data = await this.config.hmrHandlers[ext](path);
        }
      } catch (error) {
        console.error('HMR handler error:', error);
      }

      const message = JSON.stringify({
        type: 'hmr:update',
        ...data,
        timestamp: Date.now()
      });

      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  public async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

    if (this.config.hmr) {
      this.setupHMR();
    }

    if (this.config.watch) {
      this.setupWatcher();
    }

    if (this.config.build) {
      this.builder = new Builder(this.config.build);
      await this.builder.build();
      if (this.config.build.onBuild) {
        await this.config.build.onBuild();
      }
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port || 3000, this.config.host || 'localhost')
        .once('listening', () => {
          this.running = true;
          resolve();
        })
        .once('error', reject);
    });
  }

  public async stop(): Promise<void> {
    if (!this.running) {
      throw new Error('Server is not running');
    }

    this.clients.forEach(client => client.close());
    this.clients.clear();

    if (this.watcher) {
      await this.watcher.close();
    }

    if (this.wss) {
      this.wss.close();
    }

    if (this.builder) {
      if (this.config.build?.onCleanup) {
        await this.config.build.onCleanup();
      }
      await this.builder.stop();
    }

    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else {
          this.running = false;
          resolve();
        }
      });
    });
  }

  public isRunning(): boolean {
    return this.running;
  }
}
