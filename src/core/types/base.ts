// Common primitive types
export type Primitive = string | number | boolean | null | undefined;
export type AnyFunction = (...args: any[]) => any;
export type VoidFunction = () => void;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };