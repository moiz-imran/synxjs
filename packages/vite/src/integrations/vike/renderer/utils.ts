import { escapeHtml } from '@synxjs/server';

export function generateMetaTags(meta?: Array<{ [key: string]: string }>) {
  if (!meta) return '';
  return meta
    .map(
      (m) =>
        `<meta ${Object.entries(m)
          .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
          .join(' ')}>`,
    )
    .join('\n');
}

export function generateLinkTags(links?: Array<{ [key: string]: string }>) {
  if (!links) return '';
  return links
    .map(
      (l) =>
        `<link ${Object.entries(l)
          .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
          .join(' ')}>`,
    )
    .join('\n');
}
