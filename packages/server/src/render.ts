import { enableServerMode } from '@synxjs/reactivity';
import type { VNode } from '@synxjs/types';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Helper to convert React-style props to HTML attributes
function normalizeProps(props: Record<string, any>): Record<string, any> {
  if (!props) return {};

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
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

// Update renderProps to use normalized props
function renderProps(props: Record<string, any>): string {
  const normalized = normalizeProps(props);

  return Object.entries(normalized).map(([key, value]) => {
    if (typeof value === 'boolean') {
      return value ? key : '';
    }
    if (value != null) {
      return `${key}="${escapeHTML(String(value))}"`;
    }
    return '';
  }).filter(Boolean).join(' ');
}

export async function renderToString(vnode: VNode): Promise<string> {
  enableServerMode(true);

  try {
    // Handle function components
    if (typeof vnode.type === 'function') {
      const result = await vnode.type(vnode.props || {});
      return renderToString(result);
    }

    const props = renderProps(vnode.props);
    const propsString = props ? ` ${props}` : '';

    // Handle primitive children (strings, numbers)
    if (typeof vnode.children === 'string' || typeof vnode.children === 'number') {
      const content = escapeHTML(String(vnode.children));
      if (VOID_ELEMENTS.has(vnode.type as string)) {
        return `<${vnode.type}${propsString}>`;
      }
      return `<${vnode.type}${propsString}>${content}</${vnode.type}>`;
    }

    // Handle array children
    if (Array.isArray(vnode.children)) {
      const children = await Promise.all(
        vnode.children
          .filter((child) => child != null) // Filter out null and undefined
          .map((child) =>
            typeof child === 'object'
              ? renderToString(child as VNode)
              : escapeHTML(String(child)),
          ),
      );

      if (VOID_ELEMENTS.has(vnode.type as string)) {
        return `<${vnode.type}${propsString}>`;
      }
      return `<${vnode.type}${propsString}>${children.join('')}</${vnode.type}>`;
    }

    // Default case
    if (VOID_ELEMENTS.has(vnode.type as string)) {
      return `<${vnode.type}${propsString}>`;
    }
    return `<${vnode.type}${propsString}>${vnode.children || ''}</${vnode.type}>`;

  } catch (error: unknown) {
    if (error instanceof Error) {
      return `<div class="error">${escapeHTML(error.message)}</div>`;
    }
    return `<div class="error">An unknown error occurred</div>`;
  }
}
