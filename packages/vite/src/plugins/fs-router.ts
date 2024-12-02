import type { Plugin } from 'vite';
import { generateRoutesFromFileSystem, type GeneratedRoute } from './fs-utils';
import { join } from 'path';
import fs from 'fs';

export interface FileSystemRouterOptions {
  pagesDir?: string;
  defaultLayout?: string;
  defaultLoading?: string;
  defaultError?: string;
}

export function fileSystemRouter(
  options: FileSystemRouterOptions = {},
): Plugin {
  const {
    pagesDir = 'src/pages',
    defaultLoading = '_loading',
    defaultError = '_error',
  } = options;

  let root: string;

  function generateRouteCode(route: GeneratedRoute, indent = ''): string {
    let componentPath =
      route.path === '/' ? 'src/pages/index.tsx' : `src/pages${route.path}.tsx`;

    if (!fs.existsSync(componentPath)) {
      componentPath = `src/pages${route.path}/index.tsx`;
    }

    const baseRoute = `{
${indent}  path: ${JSON.stringify(route.path)},
${indent}  component: () =>import('${route.filePath}'),
${indent}  loading: () => import('./src/pages/${defaultLoading}.tsx'),
${indent}  error: () => import('./src/pages/${defaultError}.tsx'),
${indent}  lazy: true`;

    if (route.children && route.children.length > 0) {
      const childrenCode = route.children
        .map((child) => generateRouteCode(child, indent + '  '))
        .join(',\n');
      return `${baseRoute},
${indent}  children: [
${childrenCode}
${indent}  ]
${indent}}`;
    }

    return `${baseRoute}
${indent}}`;
  }

  return {
    name: 'synx-fs-router',
    enforce: 'pre',

    configResolved(config) {
      root = config.root;
    },

    configureServer(server) {
      const pagesPath = join(root, pagesDir);
      server.watcher.add(join(pagesPath, '**/*'));

      server.watcher.on('add', (file) => {
        if (file.startsWith(pagesPath)) {
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: 'full-reload' });
        }
      });
      server.watcher.on('unlink', (file) => {
        if (file.startsWith(pagesPath)) {
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    resolveId(id) {
      if (id === 'virtual:generated-routes') {
        return '\0virtual:generated-routes';
      }
    },

    async load(id) {
      if (id === '\0virtual:generated-routes') {
        const pagesPath = join(root, pagesDir);
        const routes = generateRoutesFromFileSystem(pagesPath);

        return `
          const routes = [
            ${routes.map((route) => generateRouteCode(route, '  ')).join(',\n')}
          ];

          export { routes };
        `;
      }
    },
  } as const;
}
