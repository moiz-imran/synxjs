import type { Plugin } from 'vite';

export interface APIPluginOptions {
  dir?: string;
  prefix?: string;
}

export function apiPlugin(options: APIPluginOptions = {}): Plugin {
  const { dir = 'src/api', prefix = '/api' } = options;

  return {
    name: 'synx-api',
    configureServer(server) {
      server.middlewares.use(prefix, async (req, res, next) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const path = url.pathname.replace(prefix, '');
          const apiModule = await server.ssrLoadModule(`/${dir}${path}.ts`);

          if (apiModule.default) {
            const response = await apiModule.default(req);
            if (response instanceof Response) {
              res.statusCode = response.status;
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              if (response.body) {
                const reader = response.body.getReader();
                const stream = new ReadableStream({
                  async start(controller) {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      controller.enqueue(value);
                    }
                    controller.close();
                  },
                });

                await stream.pipeTo(
                  new WritableStream({
                    write(chunk) {
                      res.write(chunk);
                    },
                    close() {
                      res.end();
                    },
                  }),
                );
              }
            }
          } else {
            next();
          }
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
