// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { cleanFormattedHTML, wrapElementContentWithStyles } from './textFormatting';

/**
 * Regression tests for the rich-text corruption class (QA 2026-07-07):
 * the old regex sanitizer unescaped `&lt;`/`&gt;` in ordinary text and
 * double-serialized on a second formatting pass.
 */
describe('cleanFormattedHTML', () => {
  it('keeps a styled formatting span intact', () => {
    const html = 'Hello <span style="color: rgb(255, 0, 0)">world</span>!';
    expect(cleanFormattedHTML(html)).toBe(html);
  });

  it('NEVER unescapes entities — escaped markup stays inert text', () => {
    const html = 'Costs &lt;span&gt; less &amp; more';
    expect(cleanFormattedHTML(html)).toBe('Costs &lt;span&gt; less &amp; more');
  });

  it('unwraps spans without style', () => {
    expect(cleanFormattedHTML('a <span>b</span> c')).toBe('a b c');
  });

  it('removes empty styled spans', () => {
    expect(cleanFormattedHTML('a <span style="color: red"></span>b')).toBe('a b');
  });

  it('merges single-child nested spans, inner styles winning', () => {
    const html =
      '<span style="font-weight: 600"><span style="text-decoration: underline">word</span></span>';
    const out = cleanFormattedHTML(html);
    expect(out).toContain('font-weight: 600');
    expect(out).toContain('text-decoration: underline');
    // one span, not nested
    expect(out.match(/<span/g)?.length).toBe(1);
  });

  it('strips non-style attributes from formatting spans', () => {
    const out = cleanFormattedHTML('<span style="color: red" onclick="x()" class="y">a</span>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('class');
    expect(out).toContain('color: red');
  });

  it('preserves non-span inline markup (<em> accents)', () => {
    const html = 'A headline with an <em>accent</em>.';
    expect(cleanFormattedHTML(html)).toBe(html);
  });

  it('is idempotent — a second pass changes nothing', () => {
    const html = 'Hi <span style="color: blue"><em>there</em></span> &lt;tag&gt;';
    const once = cleanFormattedHTML(html);
    expect(cleanFormattedHTML(once)).toBe(once);
  });
});

describe('wrapElementContentWithStyles', () => {
  it('wraps plain text in a single styled span', () => {
    const out = wrapElementContentWithStyles('Hello', { color: 'red' });
    expect(out).toBe('<span style="color: red;">Hello</span>');
  });

  it('preserves inner markup when wrapping', () => {
    const out = wrapElementContentWithStyles('Hello <em>there</em>', { color: 'red' });
    expect(out).toContain('<em>there</em>');
    expect(out.match(/<span/g)?.length).toBe(1);
  });

  it('merges into an existing whole-content wrapper span instead of nesting', () => {
    const out = wrapElementContentWithStyles(
      '<span style="font-weight: 600">Bold</span>',
      { 'text-decoration': 'underline' }
    );
    expect(out.match(/<span/g)?.length).toBe(1);
    expect(out).toContain('font-weight: 600');
    expect(out).toContain('text-decoration: underline');
  });

  it('repeat formatting stays a single span (no growth)', () => {
    let html = 'Word';
    html = wrapElementContentWithStyles(html, { color: 'red' });
    html = wrapElementContentWithStyles(html, { 'font-style': 'italic' });
    html = wrapElementContentWithStyles(html, { color: 'blue' });
    expect(html.match(/<span/g)?.length).toBe(1);
    expect(html).toContain('color: blue');
    expect(html).toContain('font-style: italic');
  });
});
