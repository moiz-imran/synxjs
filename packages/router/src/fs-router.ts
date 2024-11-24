import fs from 'fs';
import path from 'path';
import type { Route } from './types';

const { join, parse } = path;

export function generateRoutesFromFileSystem(dir: string): Route[] {
  function processDirectory(
    currentDir: string,
    parentPath: string = '',
  ): Route[] {
    const entries = fs.readdirSync(currentDir);

    return entries
      .map((entry) => {
        const fullPath = join(currentDir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const relativePath = join(parentPath, entry);
          const normalizedPath =
            entry.startsWith('[') && entry.endsWith(']')
              ? relativePath.replace(/\[(.*?)\]/g, ':$1')
              : relativePath;

          return {
            path: normalizedPath.startsWith('/')
              ? normalizedPath
              : '/' + normalizedPath,
            component: () => import(join(fullPath, 'index')),
            children: processDirectory(fullPath, normalizedPath),
            lazy: true,
          };
        }

        const { name, ext } = parse(entry);
        if (ext !== '.tsx' && ext !== '.jsx') return null;

        // Handle index files
        if (name === 'index') {
          return {
            path: parentPath ? '/' + parentPath : '/',
            component: () => import(fullPath),
            lazy: true,
          };
        }

        // Handle dynamic routes
        if (name.startsWith('[') && name.endsWith(']')) {
          const paramName = name.slice(1, -1);
          const path = parentPath
            ? `/${parentPath}/:${paramName}`
            : `/:${paramName}`;
          return {
            path,
            component: () => import(fullPath),
            lazy: true,
          };
        }

        // Handle regular routes
        const routeName = name.replace(/\.[^/.]+$/, ''); // Remove file extension
        const path = parentPath
          ? `/${parentPath}/${routeName}`
          : `/${routeName}`;
        return {
          path,
          component: () => import(fullPath),
          lazy: true,
        };
      })
      .filter(Boolean) as Route[];
  }

  return processDirectory(dir);
}
