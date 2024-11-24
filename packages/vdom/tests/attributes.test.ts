import { describe, expect, it } from 'vitest';
import { updateAttributes } from '../src/attributes';

describe('Attributes', () => {
  it('should handle event listener removal', () => {
    const element = document.createElement('div');
    const handler = () => {};

    // Add event listener
    updateAttributes(element, { onClick: handler }, {});

    // Remove event listener
    updateAttributes(element, {}, { onClick: handler });

    // Verify it was removed (no error thrown)
    element.click();
  });

  it('should handle undefined style object', () => {
    const element = document.createElement('div');
    updateAttributes(element, { style: undefined }, {});
    expect(element.style.cssText).toBe('');
  });

  it('should handle style object updates', () => {
    const element = document.createElement('div');

    // Initial style
    updateAttributes(element, { style: { color: 'red' } }, {});
    expect(element.style.color).toBe('red');

    // Update style
    updateAttributes(element, { style: { color: 'blue' } }, { style: { color: 'red' } });
    expect(element.style.color).toBe('blue');

    // Remove style
    updateAttributes(element, {}, { style: { color: 'blue' } });
    expect(element.style.color).toBe('');
  });
});
