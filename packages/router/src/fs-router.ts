import fs from 'fs';
import path from 'path';
import type { LazyRoute } from './types';

const { join, parse } = path;

export type GeneratedRoute = Omit<LazyRoute, 'children'> & {
  filePath: string;
  children?: GeneratedRoute[];
};

export function generateRoutesFromFileSystem(dir: string): GeneratedRoute[] {
  try {
    return processDirectory(dir);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function processDirectory(
  currentDir: string,
  parentPath: string = '',
): GeneratedRoute[] {
  const entries = fs.readdirSync(currentDir);
  return entries.flatMap((entry) =>
    processEntry(currentDir, entry, parentPath),
  );
}

function processEntry(
  currentDir: string,
  entry: string,
  parentPath: string,
): GeneratedRoute[] {
  const fullPath = join(currentDir, entry);
  const stat = fs.statSync(fullPath);

  if (stat.isDirectory()) {
    return [processDirectoryEntry(fullPath, parentPath, entry)];
  } else {
    const fileEntry = processFileEntry(fullPath, parentPath, entry);
    if (fileEntry) {
      return [fileEntry];
    }
    return [];
  }
}

function processDirectoryEntry(
  fullPath: string,
  parentPath: string,
  entry: string,
): GeneratedRoute {
  const relativePath = join(parentPath, entry);
  const normalizedPath = normalizedDynamicPath(relativePath);

  return {
    path: normalizedPath.startsWith('/')
      ? normalizedPath
      : '/' + normalizedPath,
    component: loadDynamicComponent(join(fullPath, 'index')),
    children: processDirectory(fullPath, normalizedPath),
    lazy: true,
    filePath: fullPath,
  };
}

function processFileEntry(
  fullPath: string,
  parentPath: string,
  entry: string,
): GeneratedRoute | null {
  const { name, ext } = parse(entry);

  // Skip special files and non-tsx/jsx files
  if (name.startsWith('_') || (ext !== '.tsx' && ext !== '.jsx')) {
    return null;
  }

  if (name === 'index') {
    return {
      path: parentPath ? '/' + parentPath : '/',
      component: loadDynamicComponent(fullPath),
      filePath: fullPath,
      lazy: true,
    };
  }

  const normalizedPath = normalizedDynamicPath(
    parentPath ? `/${parentPath}/${name}` : `/${name}`,
  );

  return {
    path: normalizedPath,
    component: loadDynamicComponent(fullPath),
    filePath: fullPath,
    lazy: true,
  };
}

function normalizedDynamicPath(path: string): string {
  return path.replace(/\[(.*?)\]/g, (match, param) => {
    if (param.startsWith('...')) {
      return `:${param.slice(3)}*`;
    } else {
      return `:${param}`;
    }
  });
}

function loadDynamicComponent(filePath: string) {
  return () => import(filePath);
}
