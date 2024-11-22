import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Link } from '../src/link';
import { FunctionalComponentInstance } from '@synxjs/types';

// Mock hooks
vi.mock('@synxjs/hooks', () => ({
  useMemo: vi.fn((fn) => fn()),
}));

// Create navigate spy
const navigateSpy = vi.fn();

// Mock router context with spy
vi.mock('../src/context', () => ({
  getRouter: vi.fn(() => ({
    navigate: navigateSpy,
  })),
}));

// Mock runtime
const mockComponent: FunctionalComponentInstance = {
  hooks: [],
  currentHook: 0,
  vnode: {} as any,
  render: vi.fn(),
  dom: null,
};

vi.mock('@synxjs/runtime', () => ({
  getCurrentComponent: vi.fn(() => mockComponent),
  setCurrentComponent: vi.fn(),
}));

describe('Link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComponent.hooks = [];
    mockComponent.currentHook = 0;
  });

  it('should render an anchor tag with correct props', () => {
    const result = Link({ to: '/test', children: 'Test Link' });
    expect(result.type).toBe('a');
    expect(result.props.href).toBe('/test');
    expect(result.children?.[0]).toBe('Test Link');
  });

  it('should handle click events', async () => {
    const preventDefault = vi.fn();
    const result = Link({ to: '/test', children: 'Test Link' });

    // Simulate click
    (result.props.onClick as any)({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/test');
  });

  it('should pass through additional props', () => {
    const result = Link({
      to: '/test',
      children: 'Test Link',
      className: 'test-class',
      'data-testid': 'test-link',
    });

    expect(result.props.className).toBe('test-class');
    expect(result.props['data-testid']).toBe('test-link');
    expect(result.props.href).toBe('/test');
    expect(result.children?.[0]).toBe('Test Link');
  });
});
