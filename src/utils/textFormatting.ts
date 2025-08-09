// utils/textFormatting.ts - Text formatting utilities
import type { TextFormatState } from '@/app/edit/[token]/components/editor/InlineTextEditor';

export interface FormatRule {
  property: keyof TextFormatState;
  cssProperty: string;
  transform?: (value: any) => string;
  validate?: (value: any) => boolean;
}

export interface FormatPreset {
  name: string;
  description: string;
  formats: Partial<TextFormatState>;
}

// CSS property mappings
export const formatRules: Record<keyof TextFormatState, FormatRule> = {
  bold: {
    property: 'bold',
    cssProperty: 'fontWeight',
    transform: (value: boolean) => value ? 'bold' : 'normal',
  },
  italic: {
    property: 'italic',
    cssProperty: 'fontStyle',
    transform: (value: boolean) => value ? 'italic' : 'normal',
  },
  underline: {
    property: 'underline',
    cssProperty: 'textDecoration',
    transform: (value: boolean) => value ? 'underline' : 'none',
  },
  color: {
    property: 'color',
    cssProperty: 'color',
    validate: (value: string) => /^#([0-9A-F]{3}){1,2}$/i.test(value) || /^rgb\(/.test(value) || /^hsl\(/.test(value),
  },
  fontSize: {
    property: 'fontSize',
    cssProperty: 'fontSize',
    validate: (value: string) => /^\d+(\.\d+)?(px|em|rem|%)$/.test(value),
  },
  fontFamily: {
    property: 'fontFamily',
    cssProperty: 'fontFamily',
  },
  textAlign: {
    property: 'textAlign',
    cssProperty: 'textAlign',
    validate: (value: string) => ['left', 'center', 'right', 'justify'].includes(value),
  },
  lineHeight: {
    property: 'lineHeight',
    cssProperty: 'lineHeight',
    validate: (value: string) => /^\d+(\.\d+)?(px|em|rem|%)?$/.test(value),
  },
  letterSpacing: {
    property: 'letterSpacing',
    cssProperty: 'letterSpacing',
    validate: (value: string) => /^(-?\d+(\.\d+)?(px|em|rem))|normal$/.test(value),
  },
  textTransform: {
    property: 'textTransform',
    cssProperty: 'textTransform',
    validate: (value: string) => ['none', 'uppercase', 'lowercase', 'capitalize'].includes(value),
  },
};

// Format presets
export const formatPresets: FormatPreset[] = [
  {
    name: 'Heading 1',
    description: 'Large heading text',
    formats: {
      fontSize: '2rem',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.2',
      textTransform: 'none',
    },
  },
  {
    name: 'Heading 2',
    description: 'Medium heading text',
    formats: {
      fontSize: '1.5rem',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.3',
      textTransform: 'none',
    },
  },
  {
    name: 'Body Text',
    description: 'Regular paragraph text',
    formats: {
      fontSize: '1rem',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.6',
      textTransform: 'none',
    },
  },
  {
    name: 'Caption',
    description: 'Small caption text',
    formats: {
      fontSize: '0.875rem',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.4',
      color: '#6B7280',
      textTransform: 'none',
    },
  },
  {
    name: 'Quote',
    description: 'Styled quote text',
    formats: {
      fontSize: '1.125rem',
      fontFamily: 'Georgia, serif',
      lineHeight: '1.6',
      italic: true,
      color: '#4B5563',
      textTransform: 'none',
    },
  },
];

// Font size options
export const fontSizeOptions = [
  { value: '0.75rem', label: 'Extra Small (12px)' },
  { value: '0.875rem', label: 'Small (14px)' },
  { value: '1rem', label: 'Medium (16px)' },
  { value: '1.125rem', label: 'Large (18px)' },
  { value: '1.25rem', label: 'Extra Large (20px)' },
  { value: '1.5rem', label: 'XXL (24px)' },
  { value: '1.875rem', label: 'XXXL (30px)' },
  { value: '2.25rem', label: 'Huge (36px)' },
];

// Font family options
export const fontFamilyOptions = [
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'ui-monospace, monospace', label: 'System Mono' },
];

// Line height options
export const lineHeightOptions = [
  { value: '1', label: 'None (1.0)' },
  { value: '1.2', label: 'Tight (1.2)' },
  { value: '1.4', label: 'Snug (1.4)' },
  { value: '1.5', label: 'Normal (1.5)' },
  { value: '1.6', label: 'Relaxed (1.6)' },
  { value: '1.8', label: 'Loose (1.8)' },
  { value: '2', label: 'Extra Loose (2.0)' },
];

// Letter spacing options
export const letterSpacingOptions = [
  { value: '-0.05em', label: 'Tighter' },
  { value: '-0.025em', label: 'Tight' },
  { value: '0', label: 'Normal' },
  { value: '0.025em', label: 'Wide' },
  { value: '0.05em', label: 'Wider' },
  { value: '0.1em', label: 'Widest' },
];

// Color palette
export const colorPalette = [
  { value: '#000000', label: 'Black' },
  { value: '#374151', label: 'Gray 700' },
  { value: '#6B7280', label: 'Gray 500' },
  { value: '#9CA3AF', label: 'Gray 400' },
  { value: '#DC2626', label: 'Red' },
  { value: '#EA580C', label: 'Orange' },
  { value: '#CA8A04', label: 'Yellow' },
  { value: '#16A34A', label: 'Green' },
  { value: '#0891B2', label: 'Cyan' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#7C3AED', label: 'Purple' },
  { value: '#C2185B', label: 'Pink' },
];

// Utility functions
export function applyFormatToElement(element: HTMLElement, format: Partial<TextFormatState>): void {
  Object.entries(format).forEach(([key, value]) => {
    const rule = formatRules[key as keyof TextFormatState];
    if (rule) {
      if (rule.validate && !rule.validate(value)) {
        console.warn(`Invalid value for ${key}: ${value}`);
        return;
      }
      
      const cssValue = rule.transform ? rule.transform(value) : value;
      (element.style as any)[rule.cssProperty] = cssValue;
    }
  });
}

export function getFormatFromElement(element: HTMLElement): TextFormatState {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
    italic: computedStyle.fontStyle === 'italic',
    underline: computedStyle.textDecoration.includes('underline'),
    color: computedStyle.color,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    textAlign: computedStyle.textAlign as any,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    textTransform: computedStyle.textTransform as any,
  };
}

export function validateFormat(format: Partial<TextFormatState>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  Object.entries(format).forEach(([key, value]) => {
    const rule = formatRules[key as keyof TextFormatState];
    if (rule?.validate && !rule.validate(value)) {
      errors.push(`Invalid value for ${key}: ${value}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function mergeFormats(base: TextFormatState, override: Partial<TextFormatState>): TextFormatState {
  return { ...base, ...override };
}

export function formatToCSS(format: Partial<TextFormatState>): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  Object.entries(format).forEach(([key, value]) => {
    const rule = formatRules[key as keyof TextFormatState];
    if (rule) {
      const cssValue = rule.transform ? rule.transform(value) : String(value);
      (styles as any)[rule.cssProperty] = cssValue;
    }
  });
  
  return styles;
}

export function isFormatEqual(format1: TextFormatState, format2: TextFormatState): boolean {
  return Object.keys(format1).every(key => {
    const k = key as keyof TextFormatState;
    return format1[k] === format2[k];
  });
}

export function getFormatDiff(base: TextFormatState, current: TextFormatState): Partial<TextFormatState> {
  const diff: Partial<TextFormatState> = {};
  
  Object.keys(current).forEach(key => {
    const k = key as keyof TextFormatState;
    if (base[k] !== current[k]) {
      diff[k] = current[k] as any;
    }
  });
  
  return diff;
}

export function resetFormat(): TextFormatState {
  return {
    bold: false,
    italic: false,
    underline: false,
    color: '#000000',
    fontSize: '1rem',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'left',
    lineHeight: '1.5',
    letterSpacing: 'normal',
    textTransform: 'none',
  };
}

export function getPresetByName(name: string): FormatPreset | undefined {
  return formatPresets.find(preset => preset.name === name);
}

export function applyPreset(name: string): Partial<TextFormatState> {
  const preset = getPresetByName(name);
  return preset ? preset.formats : {};
}

// Accessibility helpers
export function getContrastRatio(color1: string, color2: string): number {
  // Simple contrast ratio calculation
  // In production, use a proper color contrast library
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function isAccessibleContrast(textColor: string, backgroundColor: string): boolean {
  const ratio = getContrastRatio(textColor, backgroundColor);
  return ratio >= 4.5; // WCAG AA standard
}

export function suggestAccessibleColor(baseColor: string, backgroundColor: string): string {
  if (isAccessibleContrast(baseColor, backgroundColor)) {
    return baseColor;
  }
  
  // Simple suggestion: return black or white based on background
  const bgRgb = hexToRgb(backgroundColor);
  if (!bgRgb) return baseColor;
  
  const luminance = getLuminance(bgRgb);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Format animation utilities
export function animateFormatChange(element: HTMLElement, property: string, fromValue: string, toValue: string, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      if (property === 'fontSize') {
        const fromNum = parseFloat(fromValue);
        const toNum = parseFloat(toValue);
        const currentSize = fromNum + (toNum - fromNum) * easeProgress;
        element.style.fontSize = currentSize + 'px';
      } else if (property === 'color') {
        // Simple color interpolation (would need more sophisticated approach in production)
        element.style.color = progress < 0.5 ? fromValue : toValue;
      } else {
        element.style[property as any] = progress < 0.5 ? fromValue : toValue;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
}

// Keyboard shortcut mappings
export const keyboardShortcuts = {
  'Ctrl+B': 'bold',
  'Ctrl+I': 'italic',
  'Ctrl+U': 'underline',
  'Ctrl+Shift+X': 'strikethrough',
  'Ctrl+=': 'increase-font-size',
  'Ctrl+-': 'decrease-font-size',
  'Ctrl+Shift+L': 'align-left',
  'Ctrl+Shift+E': 'align-center',
  'Ctrl+Shift+R': 'align-right',
  'Ctrl+Shift+J': 'align-justify',
  'Ctrl+\\': 'clear-formatting',
} as const;

export function getShortcutForAction(action: string): string | undefined {
  return Object.entries(keyboardShortcuts).find(([, value]) => value === action)?.[0];
}

// Format history utilities
export interface FormatHistoryItem {
  id: string;
  timestamp: number;
  format: TextFormatState;
  description: string;
}

export function createFormatHistoryItem(format: TextFormatState, description: string): FormatHistoryItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    format: { ...format },
    description,
  };
}

export function formatHistoryToString(history: FormatHistoryItem[]): string {
  return history.map(item => `${item.description} (${new Date(item.timestamp).toLocaleTimeString()})`).join(', ');
}

// Export commonly used combinations
export const commonFormats = {
  heading1: { fontSize: '2rem', lineHeight: '1.2' },
  heading2: { fontSize: '1.5rem', lineHeight: '1.3' },
  heading3: { fontSize: '1.25rem', lineHeight: '1.4' },
  body: { fontSize: '1rem', lineHeight: '1.6' },
  caption: { fontSize: '0.875rem', color: '#6B7280', lineHeight: '1.4' },
  quote: { fontSize: '1.125rem', fontStyle: 'italic', color: '#4B5563' },
  code: { fontFamily: 'ui-monospace, monospace', backgroundColor: '#F3F4F6', padding: '0.25rem' },
} as const;

// ===== PARTIAL TEXT SELECTION FORMATTING =====
// Implementation from selection.md for applying formats to selected text only

import { sanitizeHTML, isValidFormattingHTML } from './htmlSanitization';

export interface PartialFormatResult {
  success: boolean;
  error?: string;
  formattedHTML?: string;
  affectedRange?: Range;
}

/**
 * Apply formatting to currently selected text using Range API
 * Implements the selection.md approach with surroundContents()
 */
export function formatSelectedText(options: Partial<TextFormatState>): PartialFormatResult {
  const selection = window.getSelection();
  
  if (!selection || !selection.rangeCount) {
    return { success: false, error: 'No text selection found' };
  }

  const range = selection.getRangeAt(0);
  
  if (range.collapsed) {
    return { success: false, error: 'Selection is collapsed (no text selected)' };
  }

  try {
    // Create wrapper span element
    const span = document.createElement('span');
    
    // Apply styles based on format options using existing formatRules
    Object.entries(options).forEach(([key, value]) => {
      const rule = formatRules[key as keyof TextFormatState];
      if (rule && value !== undefined) {
        const cssValue = rule.transform ? rule.transform(value) : String(value);
        (span.style as any)[rule.cssProperty] = cssValue;
      }
    });

    // Extract selected content
    const selectedContent = range.extractContents();
    
    // Wrap the content in our formatted span
    span.appendChild(selectedContent);
    
    // Insert the formatted span at the selection point
    range.insertNode(span);
    
    // Clear the selection to avoid confusion
    selection.removeAllRanges();
    
    console.log('✨ Applied partial text formatting:', {
      text: span.textContent?.substring(0, 50),
      appliedFormats: options,
    });

    // Get the containing element's HTML for storage
    const containingElement = span.closest('[data-element-key]') as HTMLElement;
    const rawHTML = containingElement?.innerHTML || '';
    
    // Sanitize the HTML before returning
    const sanitizedHTML = sanitizeHTML(rawHTML);
    
    console.log('✨ Partial text formatting complete:', {
      rawHTML: rawHTML.substring(0, 100),
      sanitizedHTML: sanitizedHTML.substring(0, 100),
      isValid: isValidFormattingHTML(sanitizedHTML),
    });

    return {
      success: true,
      formattedHTML: sanitizedHTML,
      affectedRange: range,
    };
  } catch (error) {
    console.error('❌ Failed to format selected text:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown formatting error' 
    };
  }
}

/**
 * Toggle specific format on selected text
 * Combines current formatting with new format intelligently
 */
export function toggleFormatOnSelection(formatKey: keyof TextFormatState, value?: any): PartialFormatResult {
  const currentFormat = getSelectionFormatting();
  const newFormat: Partial<TextFormatState> = {};

  // Toggle or set the specific format
  switch (formatKey) {
    case 'bold':
      newFormat.bold = !currentFormat.bold;
      break;
    case 'italic':
      newFormat.italic = !currentFormat.italic;
      break;
    case 'underline':
      newFormat.underline = !currentFormat.underline;
      break;
    case 'color':
      newFormat.color = value || '#000000';
      break;
    case 'fontSize':
      newFormat.fontSize = value || '16px';
      break;
    case 'fontFamily':
      newFormat.fontFamily = value || 'inherit';
      break;
    case 'textAlign':
      newFormat.textAlign = value || 'left';
      break;
    default:
      (newFormat as any)[formatKey] = value;
  }

  return formatSelectedText(newFormat);
}

/**
 * Get current formatting state of selected text
 * Returns the combined formatting properties of the selection
 */
export function getSelectionFormatting(): Partial<TextFormatState> {
  const selection = window.getSelection();
  
  if (!selection || !selection.rangeCount) {
    return {};
  }

  const range = selection.getRangeAt(0);
  
  if (range.collapsed) {
    return {};
  }

  // Get the computed style of the range's start container
  const startElement = range.startContainer.nodeType === Node.TEXT_NODE
    ? range.startContainer.parentElement
    : range.startContainer as HTMLElement;

  if (!startElement) {
    return {};
  }

  const computedStyle = window.getComputedStyle(startElement);

  return {
    bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
    italic: computedStyle.fontStyle === 'italic',
    underline: computedStyle.textDecoration.includes('underline'),
    color: computedStyle.color,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    textAlign: computedStyle.textAlign as any,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    textTransform: computedStyle.textTransform as any,
  };
}

/**
 * Remove formatting from selected text
 * Unwraps formatting spans while preserving text content
 */
export function removeFormattingFromSelection(): PartialFormatResult {
  const selection = window.getSelection();
  
  if (!selection || !selection.rangeCount) {
    return { success: false, error: 'No text selection found' };
  }

  const range = selection.getRangeAt(0);
  
  if (range.collapsed) {
    return { success: false, error: 'Selection is collapsed (no text selected)' };
  }

  try {
    // Find all formatted spans within the selection
    const container = range.commonAncestorContainer;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node) => {
          const element = node as HTMLElement;
          return element.tagName === 'SPAN' && element.hasAttribute('style')
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const spansToUnwrap: HTMLSpanElement[] = [];
    let currentNode = walker.nextNode();
    
    while (currentNode) {
      spansToUnwrap.push(currentNode as HTMLSpanElement);
      currentNode = walker.nextNode();
    }

    // Unwrap each formatting span
    spansToUnwrap.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });

    console.log('🧹 Removed formatting from selection:', {
      spansRemoved: spansToUnwrap.length,
    });

    // Get the containing element's HTML for storage
    const containingElement = range.startContainer.parentElement?.closest('[data-element-key]') as HTMLElement;
    const rawHTML = containingElement?.innerHTML || '';
    
    // Sanitize the HTML before returning
    const sanitizedHTML = sanitizeHTML(rawHTML);

    return {
      success: true,
      formattedHTML: sanitizedHTML,
      affectedRange: range,
    };
  } catch (error) {
    console.error('❌ Failed to remove formatting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error removing formatting' 
    };
  }
}

/**
 * Utility to check if current selection has any formatting
 */
export function selectionHasFormatting(): boolean {
  const selection = window.getSelection();
  
  if (!selection || !selection.rangeCount) {
    return false;
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  // Check if selection contains any formatted spans
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node: Node) => {
        const element = node as HTMLElement;
        return element.tagName === 'SPAN' && element.hasAttribute('style')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  return walker.nextNode() !== null;
}