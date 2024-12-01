interface HTMLGenerationOptions {
  body: string;
  data: any;
  head?: {
    title?: string;
    meta?: Array<{ [key: string]: string }>;
    links?: Array<{ [key: string]: string }>;
    scripts?: string[];
  };
  partial?: boolean;
}

// Helper to escape HTML content
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to create HTML attributes safely
function createAttributes(attrs: { [key: string]: string }): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
}

export function generateHTML(options: HTMLGenerationOptions): string {
  const { body, data, head = {} } = options;

  console.log('data', data);

  // Generate meta tags safely
  const metaTags = [
    '<meta charset="utf-8">',
    ...(head.meta || []).map((attrs) => `<meta ${createAttributes(attrs)}>`),
  ].join('\n    ');

  // Generate link tags safely
  const linkTags = (head.links || [])
    .map((attrs) => `<link ${createAttributes(attrs)}>`)
    .join('\n    ');

  // Generate title safely
  const titleTag = head.title ? `<title>${escapeHtml(head.title)}</title>` : '';

  // Generate script tags (content should be valid JavaScript)
  const scriptTags = (head.scripts || [])
    .map((script) => `<script>${script}</script>`)
    .join('\n    ');

  return `
<!DOCTYPE html>
<html>
  <head>
    ${metaTags}
    ${titleTag}
    ${linkTags}
    ${scriptTags}
    <script>window.__INITIAL_DATA__ = ${escapeHtml(data)};</script>
  </head>
  <body>
    ${body}
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
