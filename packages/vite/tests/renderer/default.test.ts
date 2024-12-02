import { describe, it, expect, vi } from 'vitest';
import { render } from '../../src/vike/renderer/_default.page.server';
import type { PageContextServer } from '../../src/vike/renderer/types';

// Mock Vike's server utilities
vi.mock('vike/server', () => ({
  escapeInject: vi.fn((template: TemplateStringsArray, ...args: any[]) => {
    const html = String.raw({ raw: template }, ...args);
    return html;
  }),
  dangerouslySkipEscape: vi.fn(html => html)
}));

// Mock @synxjs/server
vi.mock('@synxjs/server', () => ({
  renderToString: vi.fn(() => '<div>Test</div>'),
  renderToStream: vi.fn(),
  escapeHtml: vi.fn(str => str)
}));

describe('Vike Renderer', () => {
  it('should render page with correct structure', async () => {
    const pageContext: PageContextServer = {
      Page: () => ({ type: 'div', props: {}, children: ['Test'] }),
      pageProps: { test: true },
      head: {
        title: 'Test Page',
        meta: [{ name: 'description', content: 'Test' }]
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
});
