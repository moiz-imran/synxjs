import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

declare global {
  interface Window {
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame: (handle: number) => void;
  }
}

global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return Number(setTimeout(() => callback(performance.now()), 0));
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
