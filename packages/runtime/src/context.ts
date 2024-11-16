import type { FunctionalComponentInstance } from '@synxjs/types';

let hookStack: FunctionalComponentInstance[] = [];

export function setCurrentComponent(
  component: FunctionalComponentInstance,
): void {
  const existingIndex = hookStack.findIndex((comp) => comp === component);
  if (existingIndex !== -1) {
    hookStack = hookStack.slice(0, existingIndex);
  }
  hookStack.push(component);
}

export function resetCurrentComponent(): void {
  if (hookStack.length > 0) {
    hookStack.pop();
  }
}

export function getCurrentComponent(): FunctionalComponentInstance {
  if (hookStack.length === 0) {
    throw new Error('No component is currently being rendered.');
  }
  return hookStack[hookStack.length - 1];
}

export function updateComponentInStack(
  oldComponent: FunctionalComponentInstance,
  newComponent: FunctionalComponentInstance,
): void {
  const index = hookStack.findIndex((comp) => comp === oldComponent);
  if (index !== -1) {
    hookStack[index] = newComponent;
  }
}

export function resetHookStack(): void {
  hookStack = [];
}
