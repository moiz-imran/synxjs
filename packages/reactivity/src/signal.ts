import { trackServerSignal } from './server';

export function createSignal<T>(
  initialValue: T,
): [() => T, (v: T | ((prev: T) => T)) => T] {
  let value = initialValue;

  // Create a stable getter function
  const getter = () => value;

  // Create the setter function
  const setter = (newValue: T | ((prev: T) => T)) => {
    value =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(value)
        : newValue;
    return value;
  };

  return trackServerSignal<T>(getter, setter, initialValue);
}
