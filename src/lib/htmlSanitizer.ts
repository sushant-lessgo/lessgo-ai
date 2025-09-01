// lib/htmlSanitizer.ts - Enhanced HTML sanitization with DOMPurify
import { logger } from '@/lib/logger';

// Security profiles for different use cases
export interface SanitizationProfile {
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  allowedSchemes: string[];
  allowDataAttributes: boolean;
  keepContent: boolean;
}

// Strict profile for published content - maximum security
export const STRICT_PROFILE: SanitizationProfile = {
  allowedTags: [
    'span', 'b', 'strong', 'i', 'em', 'u', 'br',
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  allowedAttributes: {
    'span': ['style', 'class'],
    'div': ['style', 'class'],
    'p': ['style', 'class'],
    'h1': ['style', 'class'],
    'h2': ['style', 'class'],
    'h3': ['style', 'class'],
    'h4': ['style', 'class'],
    'h5': ['style', 'class'],
    'h6': ['style', 'class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowDataAttributes: false,
  keepContent: true
};

// Editor profile - slightly more permissive for rich text editing
export const EDITOR_PROFILE: SanitizationProfile = {
  allowedTags: [
    'span', 'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
    'blockquote', 'a'
  ],
  allowedAttributes: {
    'span': ['style', 'class'],
    'div': ['style', 'class'],
    'p': ['style', 'class'],
    'h1': ['style', 'class'],
    'h2': ['style', 'class'], 
    'h3': ['style', 'class'],
    'h4': ['style', 'class'],
    'h5': ['style', 'class'],
    'h6': ['style', 'class'],
    'ul': ['style', 'class'],
    'ol': ['style', 'class'],
    'li': ['style', 'class'],
    'blockquote': ['style', 'class'],
    'a': ['href', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowDataAttributes: false,
  keepContent: true
};

// Basic formatting profile - minimal tags for simple text formatting
export const FORMATTING_PROFILE: SanitizationProfile = {
  allowedTags: ['span', 'b', 'strong', 'i', 'em', 'u', 'br'],
  allowedAttributes: {
    'span': ['style']
  },
  allowedSchemes: [],
  allowDataAttributes: false,
  keepContent: true
};

// Client-side sanitization using browser DOMPurify
const sanitizeHTMLClient = (html: string, profile: SanitizationProfile): string => {
  if (typeof window === 'undefined') {
    throw new Error('Client-side sanitization called on server');
  }

  // Dynamic import for client-side only
  const DOMPurify = require('dompurify');
  const domPurify = DOMPurify(window);
  
  const config = {
    ALLOWED_TAGS: profile.allowedTags,
    ALLOWED_ATTR: Object.values(profile.allowedAttributes).flat(),
    KEEP_CONTENT: profile.keepContent,
    ALLOW_DATA_ATTR: profile.allowDataAttributes,
    SANITIZE_DOM: true,
    FORBID_CONTENTS: ['script', 'style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  };

  return domPurify.sanitize(html, config);
};

// Server-side sanitization using fallback method
const sanitizeHTMLServer = (html: string, profile: SanitizationProfile): string => {
  // Use comprehensive regex-based sanitization for server-side
  let sanitized = html;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove javascript: and vbscript: schemes
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove dangerous protocols in URLs
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'link', 'meta'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });

  // Filter allowed tags
  const allowedTagsRegex = new RegExp(`<(?!\\/?(${profile.allowedTags.join('|')})\\b)[^>]*>`, 'gi');
  if (profile.keepContent) {
    // Remove tags but keep content
    sanitized = sanitized.replace(allowedTagsRegex, '');
  } else {
    // Remove tags and content
    sanitized = sanitized.replace(allowedTagsRegex, '');
  }

  return sanitized;
};

// Main sanitization function with environment detection
export const sanitizeHTML = (
  html: string, 
  profile: SanitizationProfile = STRICT_PROFILE
): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // If no HTML tags detected, return as-is for performance
  if (!/<[^>]+>/g.test(html)) {
    return html;
  }

  try {
    if (typeof window !== 'undefined') {
      // Client-side: use DOMPurify with browser DOM
      return sanitizeHTMLClient(html, profile);
    } else {
      // Server-side: use fallback sanitization
      return sanitizeHTMLServer(html, profile);
    }
  } catch (error) {
    logger.error('HTML sanitization failed:', error);
    return fallbackSanitization(html);
  }
};

// Fallback sanitization for when all else fails
const fallbackSanitization = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '');
};

// Sanitize CSS style attributes with whitelist approach
const sanitizeStyleAttribute = (styleString: string): string => {
  const allowedProperties = new Set([
    'color', 'background-color', 'font-size', 'font-weight', 'font-style',
    'font-family', 'text-align', 'text-decoration', 'line-height',
    'margin', 'padding', 'border', 'border-radius', 'width', 'height',
    'display', 'opacity', 'text-transform', 'letter-spacing'
  ]);

  const allowedValues = /^[a-zA-Z0-9\s,#%().-]+$/;
  
  try {
    const declarations = styleString.split(';')
      .map(decl => decl.trim())
      .filter(Boolean)
      .map(decl => {
        const [property, value] = decl.split(':').map(part => part.trim());
        
        if (!property || !value) return null;
        
        const normalizedProperty = property.toLowerCase();
        
        if (!allowedProperties.has(normalizedProperty)) return null;
        if (!allowedValues.test(value)) return null;
        
        // Block dangerous values
        if (value.toLowerCase().includes('javascript:') ||
            value.toLowerCase().includes('expression(') ||
            value.toLowerCase().includes('url(javascript:') ||
            value.toLowerCase().includes('data:text/html')) {
          return null;
        }
        
        return `${normalizedProperty}: ${value}`;
      })
      .filter(Boolean);

    return declarations.join('; ');
  } catch (error) {
    logger.warn('Style sanitization failed:', error);
    return '';
  }
};

// Specialized sanitization functions for common use cases

// For published content - maximum security
export const sanitizePublishedContent = (html: string): string => {
  return sanitizeHTML(html, STRICT_PROFILE);
};

// For editor content - balanced security and functionality  
export const sanitizeEditorContent = (html: string): string => {
  return sanitizeHTML(html, EDITOR_PROFILE);
};

// For simple text formatting only
export const sanitizeFormattingContent = (html: string): string => {
  return sanitizeHTML(html, FORMATTING_PROFILE);
};

// Strip all HTML tags - for plain text extraction
export const stripAllHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    if (typeof window !== 'undefined') {
      const DOMPurify = require('dompurify');
      const domPurify = DOMPurify(window);
      return domPurify.sanitize(html, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    } else {
      return html.replace(/<[^>]*>/g, '');
    }
  } catch (error) {
    logger.error('HTML stripping failed:', error);
    return html.replace(/<[^>]*>/g, '');
  }
};

// Validate if HTML content is safe without modification
export const validateHTMLSafety = (html: string, profile: SanitizationProfile = STRICT_PROFILE): {
  isSafe: boolean;
  sanitized: string;
  issues: string[];
} => {
  const issues: string[] = [];
  const sanitized = sanitizeHTML(html, profile);
  
  const isSafe = html.trim() === sanitized.trim();
  
  if (!isSafe) {
    if (/<script\b/gi.test(html)) issues.push('Contains script tags');
    if (/on\w+\s*=/gi.test(html)) issues.push('Contains event handlers');
    if (/javascript:/gi.test(html)) issues.push('Contains javascript: URLs');
    if (/data:text\/html/gi.test(html)) issues.push('Contains data:text/html URLs');
    if (html.length !== sanitized.length) issues.push('Content was modified during sanitization');
  }
  
  return { isSafe, sanitized, issues };
};

// Export default sanitizer using strict profile
export default sanitizePublishedContent;