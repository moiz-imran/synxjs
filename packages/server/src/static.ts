import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { VNode } from '@synxjs/types';
import { renderPage, RenderOptions } from './ssr';

export interface StaticRouteConfig {
  path: string;
  data?: any;
}

export interface StaticConfig {
  routes: StaticRouteConfig[];
  outDir: string;
  baseHead?: RenderOptions['head'];
}

export async function generateStatic(
  App: (props: any) => VNode,
  config: StaticConfig,
): Promise<void> {
  const { routes, outDir, baseHead = {} } = config;

  // Ensure output directory exists
  await mkdir(outDir, { recursive: true });

  // Generate each route
  await Promise.all(
    routes.map(async ({ path, data }) => {
      const html = await renderPage(App, {
        mode: 'ssg',
        data,
        head: baseHead,
      });

      const filePath = join(
        outDir,
        path.endsWith('.html') ? path : `${path}.html`,
      );
      await mkdir(join(outDir, path), { recursive: true });
      await writeFile(filePath, html);
    }),
  );
}
