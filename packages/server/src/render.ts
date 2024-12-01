import { enableServerMode } from '@synxjs/reactivity';
import type { VNode } from '@synxjs/types';
import { escapeHtml } from './utils/html';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Helper to convert React-style props to HTML attributes
function normalizeProps(props: Record<string, any>): Record<string, any> {
  if (!props) return {};

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    // Skip event handlers during SSR
    if (key.startsWith('on')) continue;

    // Convert className to class
    if (key === 'className') {
      normalized['class'] = value;
      continue;
    }

    // Convert camelCase to kebab-case for other attributes
    const normalizedKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    normalized[normalizedKey] = value;
  }
  return normalized;
}

function renderProps(props: Record<string, any>): string {
  const normalized = normalizeProps(props);

  return Object.entries(normalized)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      if (value != null) {
        return `${key}="${escapeHtml(String(value))}"`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

export async function renderToString(node: VNode | string | number | null | undefined): Promise<string> {
  if (node == null) return '';

  // Handle primitive values directly
  if (typeof node === 'string' || typeof node === 'number') {
    return escapeHtml(String(node));
  }

  // Handle VNode
  const { type, props, children } = node;

  // Handle functional components
  if (typeof type === 'function') {
    const result = type(props);
    return renderToString(result);
  }

  // Special case for text nodes
  if (type === 'text') {
    return escapeHtml(children.join(''));
  }

  // Enable server mode for reactivity system
  enableServerMode();

  if (!node || typeof node !== 'object') {
    return '';
  }

  const renderedProps = renderProps(props || {});
  const childrenStr = Array.isArray(children)
    ? (await Promise.all(children.map(child => renderToString(child as VNode)))).join('')
    : await renderToString(children as VNode);

  const tag = type;
  const propsStr = renderedProps ? ` ${renderedProps}` : '';

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${propsStr}>`;
  }

  return `<${tag}${propsStr}>${childrenStr}</${tag}>`;
}
