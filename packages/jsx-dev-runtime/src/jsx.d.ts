// Declare createElement globally
declare function createElement(
  type: never,
  props: never,
  ...children: never[]
): VNode;

declare global {
  const Fragment: unique symbol;
  interface Window {
    createElement: typeof createElement;
  }
}

namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    a: AnchorAttributes<HTMLAnchorElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    li: HTMLAttributes<HTMLLIElement>;
    nav: HTMLAttributes<HTMLElement>;
    header: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    main: HTMLAttributes<HTMLElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    aside: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    th: HTMLAttributes<HTMLTableCellElement>;
    td: HTMLAttributes<HTMLTableCellElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLTableCellElement>;
    dd: HTMLAttributes<HTMLTableCellElement>;
    svg: HTMLAttributes<SVGSVGElement>;
    path: HTMLAttributes<SVGPathElement>;
    article: HTMLAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    code: HTMLAttributes<HTMLElement>;
    input: HTMLAttributes<HTMLInputElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    form: HTMLAttributes<HTMLFormElement>;
  }

  const Fragment: FragmentType;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Element extends VNode {}

// Define common HTML attributes
interface HTMLAttributes extends AriaAttributes {
  className?: string;
  id?: string;
  style?: Partial<CSSStyleDeclaration>;
  onClick?: (event: MouseEvent) => void;
  // Add more common attributes as needed
}

// Define anchor-specific attributes
interface AnchorAttributes<T> extends HTMLAttributes<T> {
  href: string;
  target?: string;
  rel?: string;
}

// Define button-specific attributes
interface ButtonAttributes<T> extends HTMLAttributes<T> {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

/**
 * Interface for ARIA attributes.
 */
interface AriaAttributes {
  role?: string;
  ariaLabel?: string;
  ariaHidden?: boolean | 'true' | 'false';
  ariaDescribedby?: string;
  ariaLabelledby?: string;
  // Add more ARIA attributes as needed
}

export { createElement, JSX };
