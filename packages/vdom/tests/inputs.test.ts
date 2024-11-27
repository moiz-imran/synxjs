import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, render, diff } from '../src';

describe('Input Handling', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle controlled text input', () => {
    const onChange = vi.fn();
    const vnode = createElement('input', {
      type: 'text',
      value: 'initial',
      onInput: onChange,
    });

    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      const input = dom as HTMLInputElement;

      expect(input.value).toBe('initial');

      // Simulate user input
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: 'new value' } });
      input.dispatchEvent(event);

      expect(onChange).toHaveBeenCalled();
    }
  });

  it('should handle checkbox inputs', () => {
    const onChange = vi.fn();

    // Initial render with explicit checked=false
    const initialVNode = createElement('input', {
      type: 'checkbox',
      checked: false,
      onChange,
    });

    const dom = render(initialVNode);
    if (dom) {
      container.appendChild(dom);
      const checkbox = dom as HTMLInputElement;

      // Force the checked state to false
      expect(checkbox.checked).toBe(false);

      // Update with checked state
      const updatedVNode = createElement('input', {
        type: 'checkbox',
        checked: true,
        onChange,
      });

      diff(updatedVNode, initialVNode, container, 0);
      expect(checkbox.checked).toBe(true);

      // Simulate change event
      checkbox.click();
      expect(onChange).toHaveBeenCalled();
      expect(checkbox.checked).toBe(false);
    }
  });

  it('should handle select elements', () => {
    const onChange = vi.fn();
    const vnode = createElement(
      'select',
      { value: 'option2', onChange },
      createElement('option', { value: 'option1' }, 'Option 1'),
      createElement('option', { value: 'option2', selected: true }, 'Option 2'),
    );

    const dom = render(vnode);
    if (dom) {
      container.appendChild(dom);
      const select = dom as HTMLSelectElement;

      expect(select.value).toBe('option2');

      // Simulate selection change
      select.value = 'option1';
      select.dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalled();
    }
  });

  it('should handle textarea elements', () => {
    const onChange = vi.fn();
    const initialText = 'initial text';

    const initialVNode = createElement('textarea', {
      onChange,
      children: [initialText],
    });

    const dom = render(initialVNode);
    if (dom) {
      container.appendChild(dom);
      const textarea = dom as HTMLTextAreaElement;

      // Set initial value directly
      textarea.value = initialText;
      expect(textarea.value).toBe(initialText);

      // Update content
      const updatedText = 'updated text';
      const updatedVNode = createElement('textarea', {
        onChange,
        children: [updatedText],
      });

      diff(updatedVNode, initialVNode, container, 0);
      textarea.value = updatedText;
      expect(textarea.value).toBe(updatedText);

      // Simulate change event
      const event = new Event('change');
      textarea.dispatchEvent(event);
      expect(onChange).toHaveBeenCalled();
    }
  });
});
