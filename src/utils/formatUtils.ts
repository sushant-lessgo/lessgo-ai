// formatUtils.ts - Simple DOM-based text formatting utilities
// Applies formatting directly to elements without React state complexity

/**
 * Apply basic text formatting (bold, italic, underline) to an element
 * Formats the entire element (no partial selection support in V2)
 */
export function applyFormat(
  element: HTMLElement,
  format: 'bold' | 'italic' | 'underline',
  active: boolean
): void {
  switch (format) {
    case 'bold':
      element.style.fontWeight = active ? 'bold' : 'normal';
      break;
    case 'italic':
      element.style.fontStyle = active ? 'italic' : 'normal';
      break;
    case 'underline':
      element.style.textDecoration = active ? 'underline' : 'none';
      break;
  }
}

/**
 * Apply color to element content
 * Wraps content in span with inline style for persistence
 */
export function applyColor(element: HTMLElement, color: string): void {
  const content = element.textContent || '';
  element.innerHTML = `<span style="color: ${color}">${escapeHtml(content)}</span>`;
}

/**
 * Apply font size to element content
 * Wraps content in span with inline style for persistence
 */
export function applySize(element: HTMLElement, size: string): void {
  const content = element.textContent || '';
  element.innerHTML = `<span style="font-size: ${size}">${escapeHtml(content)}</span>`;
}

/**
 * Get currently active formats from element's computed styles
 */
export function getActiveFormats(element: HTMLElement): {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  size: string;
} {
  const style = window.getComputedStyle(element);

  return {
    bold: parseInt(style.fontWeight) >= 600,
    italic: style.fontStyle === 'italic',
    underline: style.textDecoration.includes('underline'),
    color: style.color,
    size: style.fontSize
  };
}

/**
 * Clear all formatting from element
 * Removes inline styles and nested spans
 */
export function clearFormatting(element: HTMLElement): void {
  // Get plain text content
  const plainText = element.textContent || '';

  // Clear element
  element.textContent = plainText;

  // Remove inline styles
  element.removeAttribute('style');
}

/**
 * Check if element has any formatting (HTML content)
 */
export function hasFormatting(element: HTMLElement): boolean {
  return element.querySelector('span[style]') !== null;
}

/**
 * Simple HTML escaping to prevent XSS when creating spans
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get content from element (HTML if formatted, text otherwise)
 */
export function getElementContent(element: HTMLElement): string {
  if (hasFormatting(element)) {
    return element.innerHTML;
  }
  return element.textContent || '';
}
