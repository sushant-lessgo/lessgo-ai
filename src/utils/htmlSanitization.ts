/**
 * HTML Sanitization Utilities
 * 
 * Basic HTML sanitization for text formatting.
 * For production use, replace with DOMPurify for comprehensive security.
 */

import { logger } from '@/lib/logger';

// Allowed HTML tags for text formatting
const ALLOWED_TAGS = new Set([
  'span',
  'b', 'strong',
  'i', 'em',
  'u',
  'br'
]);

// Allowed style properties
const ALLOWED_STYLES = new Set([
  'font-weight',
  'font-style',
  'text-decoration',
  'color',
  'font-size',
  'font-family',
  'text-align'
]);

// Allowed style values (for basic validation)
const ALLOWED_STYLE_PATTERNS = {
  'font-weight': /^(normal|bold|[1-9]00)$/,
  'font-style': /^(normal|italic)$/,
  'text-decoration': /^(none|underline)$/,
  'color': /^(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|hsl\([^)]+\)|[a-zA-Z]+)$/,
  'font-size': /^\d+(\.\d+)?(px|em|rem|%)$/,
  'font-family': /^[a-zA-Z0-9\s,'-]+$/,
  'text-align': /^(left|center|right|justify)$/
};

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedStyles?: string[];
  stripDisallowed?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Basic HTML sanitization for text formatting
 * This is a simple implementation - for production use, integrate DOMPurify
 */
export function sanitizeHTML(html: string, options: SanitizationOptions = {}): string {
  const {
    allowedTags = Array.from(ALLOWED_TAGS),
    allowedStyles = Array.from(ALLOWED_STYLES),
    stripDisallowed = true,
    preserveWhitespace = true
  } = options;

  // If no HTML tags detected, return as-is
  if (!/<[^>]+>/g.test(html)) {
    return html;
  }

  try {
    // Create a temporary DOM element for parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Recursively sanitize the DOM tree
    sanitizeNode(tempDiv, new Set(allowedTags), new Set(allowedStyles), stripDisallowed);

    return tempDiv.innerHTML;
  } catch (error) {
    logger.warn('HTML sanitization failed, returning plain text:', () => error);
    // Fallback: strip all HTML tags
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Recursively sanitize a DOM node and its children
 */
function sanitizeNode(
  node: Node, 
  allowedTags: Set<string>, 
  allowedStyles: Set<string>,
  stripDisallowed: boolean
): void {
  // Process child nodes first (bottom-up approach)
  const childNodes = Array.from(node.childNodes);
  for (const child of childNodes) {
    sanitizeNode(child, allowedTags, allowedStyles, stripDisallowed);
  }

  // Only process element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  // Check if tag is allowed
  if (!allowedTags.has(tagName)) {
    if (stripDisallowed) {
      // Replace element with its content
      while (element.firstChild) {
        element.parentNode?.insertBefore(element.firstChild, element);
      }
      element.parentNode?.removeChild(element);
    }
    return;
  }

  // Sanitize attributes
  sanitizeAttributes(element, allowedStyles);
}

/**
 * Sanitize element attributes, keeping only safe style attributes
 */
function sanitizeAttributes(element: HTMLElement, allowedStyles: Set<string>): void {
  // Remove all attributes except 'style'
  const attributesToRemove: string[] = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name !== 'style') {
      attributesToRemove.push(attr.name);
    }
  }
  
  attributesToRemove.forEach(attrName => {
    element.removeAttribute(attrName);
  });

  // Sanitize style attribute
  if (element.hasAttribute('style')) {
    const sanitizedStyle = sanitizeStyleAttribute(element.getAttribute('style') || '', allowedStyles);
    if (sanitizedStyle) {
      element.setAttribute('style', sanitizedStyle);
    } else {
      element.removeAttribute('style');
    }
  }
}

/**
 * Sanitize CSS style string
 */
function sanitizeStyleAttribute(styleString: string, allowedStyles: Set<string>): string {
  const sanitizedStyles: string[] = [];
  
  // Parse CSS declarations
  const declarations = styleString.split(';').map(decl => decl.trim()).filter(Boolean);
  
  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map(part => part.trim());
    
    if (!property || !value) continue;
    
    const normalizedProperty = property.toLowerCase();
    
    // Check if property is allowed
    if (!allowedStyles.has(normalizedProperty)) continue;
    
    // Validate value against patterns
    const pattern = ALLOWED_STYLE_PATTERNS[normalizedProperty as keyof typeof ALLOWED_STYLE_PATTERNS];
    if (pattern && !pattern.test(value)) continue;
    
    // Add to sanitized styles
    sanitizedStyles.push(`${normalizedProperty}: ${value}`);
  }
  
  return sanitizedStyles.join('; ');
}

/**
 * Strip all HTML tags from content
 */
export function stripHTMLTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Check if content contains potentially unsafe HTML
 */
export function containsUnsafeHTML(html: string): boolean {
  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(html)) {
    return true;
  }

  // Check for event handlers
  if (/on\w+\s*=/gi.test(html)) {
    return true;
  }

  // Check for javascript: URLs
  if (/javascript:/gi.test(html)) {
    return true;
  }

  // Check for data: URLs (could contain scripts)
  if (/data:[^;]*;.*script/gi.test(html)) {
    return true;
  }

  return false;
}

/**
 * Validate that HTML only contains formatting spans
 */
export function isValidFormattingHTML(html: string): boolean {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    return validateFormattingNode(tempDiv);
  } catch (error) {
    return false;
  }
}

function validateFormattingNode(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return true;
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    // Only allow span elements for formatting
    if (tagName !== 'span') {
      return false;
    }
    
    // Check that only style attribute is present
    for (let i = 0; i < element.attributes.length; i++) {
      if (element.attributes[i].name !== 'style') {
        return false;
      }
    }
    
    // Validate all child nodes
    for (const child of Array.from(element.childNodes)) {
      if (!validateFormattingNode(child)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Clean up redundant formatting spans
 * Merges adjacent spans with identical styling
 */
export function optimizeFormattingHTML(html: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    optimizeFormattingNode(tempDiv);
    
    return tempDiv.innerHTML;
  } catch (error) {
    logger.warn('HTML optimization failed:', () => error);
    return html;
  }
}

function optimizeFormattingNode(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  
  const element = node as HTMLElement;
  const children = Array.from(element.childNodes);
  
  // First optimize all children
  children.forEach(child => optimizeFormattingNode(child));
  
  // Then try to merge adjacent spans with identical styles
  for (let i = 0; i < element.childNodes.length - 1; i++) {
    const current = element.childNodes[i];
    const next = element.childNodes[i + 1];
    
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      next.nodeType === Node.ELEMENT_NODE &&
      (current as HTMLElement).tagName === 'SPAN' &&
      (next as HTMLElement).tagName === 'SPAN' &&
      (current as HTMLElement).getAttribute('style') === (next as HTMLElement).getAttribute('style')
    ) {
      // Merge the spans
      while (next.firstChild) {
        current.appendChild(next.firstChild);
      }
      element.removeChild(next);
      i--; // Recheck the current position
    }
  }
}

/**
 * DOMPurify integration placeholder
 * Replace this with actual DOMPurify when it's installed
 */
export function sanitizeWithDOMPurify(html: string): string {
  // TODO: Implement when DOMPurify is added
  // return DOMPurify.sanitize(html, {
  //   ALLOWED_TAGS: ['span', 'b', 'strong', 'i', 'em', 'u'],
  //   ALLOWED_ATTR: ['style'],
  //   ALLOWED_CSS: ['font-weight', 'font-style', 'text-decoration', 'color', 'font-size', 'font-family']
  // });
  
  logger.warn('DOMPurify not available, using basic sanitization');
  return sanitizeHTML(html);
}

// Export the main sanitization function
export { sanitizeHTML as default };