import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStream } from '../src/streaming';
import { Head, VNode } from '@synxjs/types';
import { enableServerMode } from '@synxjs/reactivity';
import * as hydration from '../src/hydration';

describe('Streaming SSR', () => {
  beforeEach(() => {
    enableServerMode();
  });

  it('should stream HTML in chunks', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Test'],
    };

    const stream = renderToStream(vnode);
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        try {
          // First chunk should contain shell
          expect(chunks[0]).toContain('<!DOCTYPE html>');
          expect(chunks[0]).toContain('<head>');
          expect(chunks[0]).toContain('<body>');

          // Second chunk should contain content
          expect(chunks[1]).toContain('<div data-hydrate="root">');
          expect(chunks[1]).toContain('<div>Test</div>');

          // Last chunk should contain closing tags
          expect(chunks[chunks.length - 1]).toContain('</body></html>');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should handle hydration data correctly', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Content'],
    };

    const data = { foo: 'bar' };
    const stream = renderToStream(vnode, { data });
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        const html = chunks.join('');
        try {
          // Data should be in the shell (first chunk)
          expect(chunks[0]).toContain('window.__INITIAL_DATA__');
          // Data should be properly escaped in HTML
          expect(html).toContain(
            '&quot;props&quot;:{&quot;foo&quot;:&quot;bar&quot;}',
          );
          expect(html).toContain('&quot;state&quot;');
          expect(html).toContain('&quot;timestamp&quot;');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    const vnode: VNode = {
      type: () => {
        throw error;
      },
      props: {},
      children: [],
    };

    let errorCaught = false;
    const stream = renderToStream(vnode, {
      onError: (err) => {
        errorCaught = true;
        expect(err).toBe(error);
      },
    });

    await new Promise<void>((resolve) => {
      stream.on('error', () => {
        expect(errorCaught).toBe(true);
        resolve();
      });
    });
  });

  it('should handle head options correctly', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Content'],
    };

    const head: Head = {
      title: 'Test Page',
      meta: [
        { name: 'description', content: 'Test description' },
        { property: 'og:title', content: 'Test <title>' },
      ],
      links: [{ rel: 'stylesheet', href: '/style.css' }],
      scripts: ['console.log("test")'],
    };

    const stream = renderToStream(vnode, { head });
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        const html = chunks.join('');
        try {
          expect(html).toContain('<title>Test Page</title>');
          expect(html).toContain(
            'name="description" content="Test description"',
          );
          expect(html).toContain(
            'property="og:title" content="Test &amp;lt;title&amp;gt;"',
          );
          expect(html).toContain('<link rel="stylesheet" href="/style.css"');
          expect(html).toContain('<script>console.log("test")</script>');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should handle circular references in data', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Content'],
    };

    const circularData: any = { foo: 'bar' };
    circularData.self = circularData;

    await expect(async () => {
      const stream = renderToStream(vnode, { data: circularData });
      await new Promise((resolve) => {
        stream.on('end', resolve);
      });
    }).rejects.toThrow('Failed to serialize data');
  });

  it('should call onShellReady callback', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Content'],
    };

    let shellReadyCalled = false;
    const stream = renderToStream(vnode, {
      onShellReady: () => {
        shellReadyCalled = true;
      },
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', () => {});
      stream.on('end', () => {
        expect(shellReadyCalled).toBe(true);
        resolve();
      });
    });
  });

  it('should handle non-circular errors', async () => {
    const vnode: VNode = {
      type: 'div',
      props: {},
      children: ['Content'],
    };

    vi.spyOn(hydration, 'serializeHydrationData').mockRejectedValue(
      new Error('Serialization error'),
    );

    await expect(async () => {
      const stream = renderToStream(vnode, {
        data: { key: 'value' },
        onError: (err) => {
          expect(err.message).toBe('Serialization error');
        },
      });
      await new Promise((resolve) => {
        stream.on('end', resolve);
      });
    }).rejects.toThrow('Serialization error');
  });
});
