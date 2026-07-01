// lib/htmlSanitizer.test.ts - Test cases for HTML sanitization
import { describe, it, expect } from 'vitest';
import {
  sanitizePublishedContent,
  sanitizeFormattingContent,
  sanitizeEditorContent,
  validateHTMLSafety,
  stripAllHTML
} from './htmlSanitizer';

// Case data for the vitest suite below. The manual runSanitizationTests() runner used by
// /api/test-sanitization now lives in ./htmlSanitizerManualTest (no vitest import) so the
// production build never bundles vitest into a route.
const SANITIZATION_CASES: Array<{ name: string; input: string; shouldBlock: boolean }> = [
  { name: 'Script Tag Injection', input: '<script>alert("XSS")</script>Hello World', shouldBlock: true },
  { name: 'Event Handler Injection', input: '<div onclick="alert(\'XSS\')">Click me</div>', shouldBlock: true },
  { name: 'JavaScript URL Injection', input: '<a href="javascript:alert(\'XSS\')">Click</a>', shouldBlock: true },
  { name: 'Nested Script Tags', input: '<div><script>alert("nested")</script>Safe content</div>', shouldBlock: true },
  { name: 'Basic Formatting', input: '<span style="font-weight: bold">Bold text</span>', shouldBlock: false },
  { name: 'Multiple Elements', input: '<b>Bold</b> and <i>italic</i> text', shouldBlock: false },
  { name: 'Safe Links (Editor Profile)', input: '<a href="https://example.com">Safe link</a>', shouldBlock: false },
];

const hasDangerousContent = (html: string): boolean => {
  const lower = html.toLowerCase();
  return lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('onclick=') ||
    lower.includes('onerror=');
};

describe('HTML Sanitization', () => {
  SANITIZATION_CASES.forEach(({ name, input, shouldBlock }) => {
    it(`${shouldBlock ? 'blocks' : 'preserves'}: ${name}`, () => {
      const sanitized = sanitizePublishedContent(input);
      expect(hasDangerousContent(sanitized)).toBe(false);
      if (shouldBlock) {
        expect(validateHTMLSafety(input).isSafe).toBe(false);
      } else {
        expect(sanitized.trim()).not.toBe('');
      }
    });
  });

  it('strips all HTML tags with stripAllHTML', () => {
    expect(stripAllHTML('<p>Paragraph</p><script>alert(1)</script>')).not.toContain('<');
  });

  it('editor profile preserves safe links, drops scripts', () => {
    const out = sanitizeEditorContent('<a href="https://example.com">Link</a><script>alert(1)</script>');
    expect(out).toContain('example.com');
    expect(hasDangerousContent(out)).toBe(false);
  });

  it('formatting profile drops scripts', () => {
    expect(hasDangerousContent(sanitizeFormattingContent('<b>Hi</b><script>alert(1)</script>'))).toBe(false);
  });
});
