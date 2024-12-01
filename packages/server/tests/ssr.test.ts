import { createElement } from '@synxjs/vdom';
import { renderPage, renderToStream } from '../src';
import { describe, it, expect } from 'vitest';

describe('Page Rendering', () => {
  it('should render basic page with minimal options', async () => {
    const App = () => createElement('div', null, 'Hello');
    const html = await renderPage(App, { mode: 'ssr' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div data-hydrate="root">');
    expect(html).toContain('<div>Hello</div>');
    expect(html).toContain('window.__INITIAL_DATA__');
    expect(html).toContain('<script type="module" src="/client.js">');
  });

  it('should render page with head options', async () => {
    const App = () => createElement('div', null, 'Content');
    const html = await renderPage(App, {
      mode: 'ssg',
      head: {
        title: 'Test Page',
        meta: [
          { name: 'description', content: 'Test description' },
          { charset: 'utf-8' },
        ],
        links: [{ rel: 'stylesheet', href: '/style.css' }],
      },
    });

    expect(html).toContain('<title>Test Page</title>');
    expect(html).toContain(
      '<meta name="description" content="Test description"',
    );
    expect(html).toContain('<meta charset="utf-8"');
    expect(html).toContain('<link rel="stylesheet" href="/style.css"');
  });

  it('should pass data to App component and serialize it', async () => {
    const App = (props: { message: string }) =>
      createElement('div', null, props.message);

    const data = { message: 'Hello from data' };
    const html = await renderPage(App, {
      mode: 'ssr',
      data,
    });

    // Check that the component rendered with the data
    expect(html).toContain('Hello from data');

    // Check that the data is properly escaped in the script tag
    expect(html).toContain('window.__INITIAL_DATA__');
    expect(html).toContain('&quot;message&quot;:&quot;Hello from data&quot;');
    expect(html).toContain('&quot;props&quot;');
    expect(html).toContain('&quot;state&quot;');
  });

  it('should handle complex data serialization', async () => {
    const App = () => createElement('div', null, 'Test');
    const complexData = {
      html: '<script>alert("test")</script>',
      nested: {
        value: '</script><script>alert("xss")</script>',
      },
    };

    const html = await renderPage(App, {
      mode: 'ssr',
      data: complexData,
    });

    console.log(html);

    // Verify the initial data script exists
    expect(html).toContain('<script>window.__INITIAL_DATA__');

    // Count script tags
    const scriptTags = html.match(/<script[^>]*>/g) || [];
    const closingScriptTags = html.match(/<\/script>/g) || [];

    console.log(scriptTags);
    console.log(closingScriptTags);

    // Should have exactly two pairs of script tags:
    // 1. The __INITIAL_DATA__ script
    // 2. The client.js script
    expect(scriptTags.length).toBe(2);
    expect(closingScriptTags.length).toBe(2);

    // Verify dangerous content is escaped
    const dangerousStrings = [
      '<script>alert("test")',
      '</script><script>',
      'alert("xss")',
    ];

    // These strings shouldn't appear in their raw form
    for (const dangerous of dangerousStrings) {
      const count = (html.match(new RegExp(dangerous, 'g')) || []).length;
      // Should only appear in the stringified data, not as raw HTML
      expect(count).toBeLessThanOrEqual(1);
    }

    // Verify the data script appears before the client.js script
    const dataScriptIndex = html.indexOf('window.__INITIAL_DATA__');
    const clientScriptIndex = html.indexOf('client.js');
    expect(dataScriptIndex).toBeLessThan(clientScriptIndex);
  });

  it('should properly escape meta tag attributes', async () => {
    const App = () => createElement('div', null);
    const maliciousContent = '"></meta><script>alert("xss")</script><meta x="';
    const html = await renderPage(App, {
      mode: 'ssr',
      head: {
        meta: [
          {
            name: 'description',
            content: maliciousContent,
          },
        ],
      },
    });

    // The content should be escaped as HTML entities
    expect(html).toContain('content="');
    expect(html).toContain('&quot;&gt;&lt;/meta&gt;&lt;script&gt;alert(');
    expect(html).toContain('&quot;)&lt;/script&gt;');
    // Should only have the legitimate meta tags
    expect(html.match(/<meta/g)?.length).toBe(2); // charset and description
    expect(html.match(/<\/meta>/g)).toBeNull(); // No closing meta tags
  });

  it('should properly escape link tag attributes', async () => {
    const App = () => createElement('div', null);
    const maliciousContent = '"></link><script>alert("xss")</script><link x="';
    const html = await renderPage(App, {
      mode: 'ssr',
      head: {
        links: [
          {
            rel: 'stylesheet',
            href: maliciousContent,
          },
        ],
      },
    });

    // The href should be escaped as HTML entities
    expect(html).toContain('href="');
    expect(html).toContain('&quot;&gt;&lt;/link&gt;&lt;script&gt;alert(');
    expect(html).toContain('&quot;)&lt;/script&gt;');
    // Should only have the legitimate link tag
    expect(html.match(/<link/g)?.length).toBe(1);
    expect(html.match(/<\/link>/g)).toBeNull(); // No closing link tags
  });

  it('should properly escape title content', async () => {
    const App = () => createElement('div', null);
    const html = await renderPage(App, {
      mode: 'ssr',
      head: {
        title: '</title><script>alert("xss")</script><title>',
      },
    });

    expect(html).toContain('<title>');
    expect(html).toContain('</title>');
    expect(html.match(/<title/g)?.length).toBe(1);
    expect(html.match(/<\/title>/g)?.length).toBe(1);
  });

  it('should handle different rendering modes', async () => {
    const App = () => createElement('div', null, 'Test');

    const ssrHtml = await renderPage(App, { mode: 'ssr' });
    const ssgHtml = await renderPage(App, { mode: 'ssg' });

    // Both modes should produce valid HTML
    expect(ssrHtml).toContain('<!DOCTYPE html>');
    expect(ssgHtml).toContain('<!DOCTYPE html>');

    // Both should include hydration markers
    expect(ssrHtml).toContain('data-hydrate="root"');
    expect(ssgHtml).toContain('data-hydrate="root"');
  });

  it('should handle undefined head options', async () => {
    const App = () => createElement('div', null);
    const html = await renderPage(App, {
      mode: 'ssr',
      head: {
        title: undefined,
        meta: undefined,
        links: undefined,
      },
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    // Should still have charset meta
    expect(html).toContain('<meta charset="utf-8">');
  });
});

describe('Streaming Rendering', () => {
  it('should match SSR hydration data format', async () => {
    const App = () => createElement('div', null, 'Test');
    const data = { message: 'test' };

    const stream = renderToStream(App(), { data });
    const chunks: string[] = [];

    await new Promise<void>((resolve) => {
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        const html = chunks.join('');
        expect(html).toContain('window.__INITIAL_DATA__');
        expect(html).toContain('&quot;message&quot;:&quot;test&quot;');
        expect(html).toContain('&quot;props&quot;');
        expect(html).toContain('&quot;state&quot;');
        resolve();
      });
    });
  });
});
