import { describe, it, expect, vi } from 'vitest';
import { render } from '../../src/integrations/vike/renderer/_default.page.server';
import type { PageContextServer } from '../../src/integrations/vike/renderer/types';
import { PassThrough } from 'stream';
import { renderToStream, serializeHydrationData } from '@synxjs/server';

// Mock Vike's server utilities
vi.mock('vike/server', () => ({
  escapeInject: vi.fn((template: TemplateStringsArray, ...args: any[]) => {
    const html = String.raw({ raw: template }, ...args);
    return html;
  }),
  dangerouslySkipEscape: vi.fn((html) => html),
}));

// Mock @synxjs/server
vi.mock('@synxjs/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@synxjs/server')>();
  return {
    ...actual,
    serializeHydrationData: vi.fn(),
    renderToString: vi.fn(() => '<div>Test</div>'),
    renderToStream: vi.fn(),
    escapeHtml: vi.fn((str) =>
      str.replace(
        /[<>"'&]/g,
        (c: '<' | '>' | '"' | "'" | '&') =>
          ({
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '&': '&amp;',
          })[c],
      ),
    ),
  };
});

describe('Vike Renderer', () => {
  it('should render page with meta tags', async () => {
    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: {},
      head: {
        meta: [
          { name: 'description', content: 'Test description' },
          { property: 'og:title', content: 'Test <title>' },
          { 'http-equiv': 'content-type', content: 'text/html' },
        ],
      },
      isClient: false as const,
      mode: 'ssr' as const,
    };

    const result = await render(pageContext);
    expect(result.documentHtml).toContain('name="description"');
    expect(result.documentHtml).toContain('content="Test description"');
    expect(result.documentHtml).toContain('property="og:title"');
    expect(result.documentHtml).toContain('content="Test &lt;title&gt;"');
    expect(result.documentHtml).toContain('http-equiv="content-type"');
  });

  it('should render page with link tags', async () => {
    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: {},
      head: {
        links: [
          { rel: 'stylesheet', href: '/styles.css' },
          { rel: 'icon', href: '/favicon<.ico', type: 'image/x-icon' },
          { rel: 'canonical', href: 'https://example.com' },
        ],
      },
      isClient: false as const,
      mode: 'ssr' as const,
    };

    const result = await render(pageContext);
    expect(result.documentHtml).toContain('rel="stylesheet"');
    expect(result.documentHtml).toContain('href="/styles.css"');
    expect(result.documentHtml).toContain('href="/favicon&lt;.ico"');
    expect(result.documentHtml).toContain('type="image/x-icon"');
    expect(result.documentHtml).toContain('href="https://example.com"');
  });

  it('should render page with correct structure', async () => {
    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: { test: true },
      head: {
        title: 'Test Page',
        meta: [{ name: 'description', content: 'Test' }],
      },
      isClient: false as const,
      mode: 'ssr' as const,
    };

    const result = await render(pageContext);
    expect(result.documentHtml).toContain('<!DOCTYPE html>');
    expect(result.documentHtml).toContain('<title>Test Page</title>');
    expect(result.documentHtml).toContain('name="description"');
    expect(result.documentHtml).toContain('window.__INITIAL_DATA__');
  });

  it('should handle rendering errors', async () => {
    const pageContext = {
      Page: () => {
        throw new Error('Render error');
      },
      pageProps: {},
      isClient: false as const,
    };

    await expect(render(pageContext)).rejects.toThrow('Render error');
  });

  it('should handle streaming mode', async () => {
    const mockStream = new PassThrough();
    vi.mocked(renderToStream).mockReturnValue(mockStream);

    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: { test: true },
      streaming: true,
      boundaries: [],
      selective: {},
      onShellReady: vi.fn(),
      onError: vi.fn(),
      isClient: false as const,
      mode: 'ssr' as const,
    };

    const result = await render(pageContext);
    expect(result.documentHtml).toBeInstanceOf(PassThrough);
    expect(vi.mocked(renderToStream)).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        data: { test: true },
        boundaries: [],
        selective: {},
        onShellReady: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('should handle non-Error objects in error handling', async () => {
    const onError = vi.fn();
    const pageContext: PageContextServer = {
      Page: () => {
        throw { custom: 'error object' };
      },
      pageProps: {},
      onError,
      isClient: false as const,
    };

    await expect(render(pageContext)).rejects.toEqual({
      custom: 'error object',
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle Error objects with onError callback', async () => {
    const error = new Error('Test error');
    const onError = vi.fn();
    const pageContext: PageContextServer = {
      Page: () => {
        throw error;
      },
      pageProps: {},
      onError,
      isClient: false as const,
    };

    await expect(render(pageContext)).rejects.toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should handle SSG mode correctly', async () => {
    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: { test: true },
      isClient: false as const,
      mode: 'ssg' as const,
    };

    const result = await render(pageContext);
    expect(result.documentHtml).toContain('<!DOCTYPE html>');
    expect(result.documentHtml).toContain('<div>Test</div>');
    expect(result.documentHtml).not.toContain(
      '<script type="module" src="/client.js"></script>',
    );
    expect(result.documentHtml).toContain('window.__INITIAL_DATA__');
  });

  it('should handle streaming errors correctly', async () => {
    const mockStream = new PassThrough();
    const streamError = new Error('Stream error');
    const onError = vi.fn();
    let streamCallback: ((error: Error) => void) | undefined;

    const testError = new Error('Test error');
    testError.stack = 'Test stack trace';

    // Mock Date.now() for consistent timestamps
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => 1733154861786);

    // Mock serializeHydrationData to properly handle Error objects
    vi.clearAllMocks();
    vi.mocked(serializeHydrationData).mockImplementation((data) => {
      return JSON.stringify(
        {
          props: data,
          state: { signals: {} },
          timestamp: Date.now(),
        },
        (_, value) => {
          if (value instanceof Error) {
            return {
              message: value.message,
              stack: value.stack,
            };
          }
          return value;
        },
      );
    });

    vi.mocked(renderToStream).mockImplementation((_, options) => {
      streamCallback = options?.onError;
      return mockStream;
    });

    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: {
        error: testError,
      },
      streaming: true,
      onError,
      isClient: false as const,
    };

    const result = await render(pageContext);

    await new Promise<void>((resolve) => {
      mockStream.on('error', () => {
        expect(onError).toHaveBeenCalledWith(streamError);
        resolve();
      });

      streamCallback?.(streamError);
      mockStream.emit('error', streamError);
    });

    expect(result.documentHtml).toBeInstanceOf(PassThrough);
    const expectedData = {
      props: {
        error: {
          message: 'Test error',
          stack: 'Test stack trace',
        },
      },
      state: { signals: {} },
      timestamp: 1733154861786,
    };
    expect(result.pageContext.serializedData).toBe(
      JSON.stringify(expectedData),
    );

    // Restore original Date.now
    Date.now = originalDateNow;
  });
});
