// src/global.d.ts

// Declare createElement globally
declare function createElement(
  type: never,
  props: never,
  ...children: never[]
): VNode;

declare global {
  interface Window {
    createElement: typeof createElement;
  }
}

// Declare Fragment globally
declare const Fragment: (props: { children: unknown }) => unknown;

// Define the JSX namespace and IntrinsicElements
declare namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    a: AnchorAttributes<HTMLAnchorElement>;
    button: ButtonAttributes<HTMLButtonElement>;
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
    // Add more elements as needed
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Element extends VNode {}
}

// Define common HTML attributes
interface HTMLAttributes<T> extends AriaAttributes<T> {
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
  ariaHidden?: boolean;
  // Add more ARIA attributes as needed
}

// Add other specific attribute interfaces as needed
