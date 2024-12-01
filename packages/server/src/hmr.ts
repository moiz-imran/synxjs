import { readFile } from 'fs/promises';
import { parse as parseCSS } from 'css';
import { transformSync } from 'esbuild';
import { extname } from 'path';

export interface HMRPayload {
  type: string;
  path: string;
  timestamp?: number;
  [key: string]: any;
}

export interface HMRHandler {
  (path: string): Promise<HMRPayload>;
}

export const cssHandler: HMRHandler = async (path: string) => {
  const content = await readFile(path, 'utf-8');
  const ast = parseCSS(content);

  return {
    type: 'css-update',
    path,
    css: content,
    ast,
    timestamp: Date.now()
  };
};

export const jsHandler: HMRHandler = async (path: string) => {
  const content = await readFile(path, 'utf-8');

  const result = transformSync(content, {
    loader: extname(path).slice(1) as 'js' | 'ts',
    format: 'esm',
    sourcemap: true
  });

  return {
    type: 'js-update',
    path,
    code: result.code,
    map: result.map,
    timestamp: Date.now()
  };
};

// Default handlers for different file types
export const defaultHandlers: Record<string, HMRHandler> = {
  '.css': cssHandler,
  '.js': jsHandler,
  '.ts': jsHandler,
  '.jsx': jsHandler,
  '.tsx': jsHandler,
};

export const getHandler = (path: string): HMRHandler => {
  const ext = extname(path);
  return defaultHandlers[ext] || defaultHandlers['.js'];
};

export const createHandler = (handler: HMRHandler): HMRHandler => {
  return async (path: string) => {
    try {
      const result = await handler(path);
      return {
        ...result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`HMR handler error for ${path}:`, error);
      return {
        type: 'error',
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  };
};
