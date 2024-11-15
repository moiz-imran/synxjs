import { describe, it } from 'vitest';
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
});