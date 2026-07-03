/**
 * Blog markdown rendering — WS0 spike, kept as the permanent XSS regression test.
 *
 * Published blog pages render user-authored markdown through ReactMarkdown inside
 * ReactDOMServer.renderToStaticMarkup (the static-export path). This suite pins the
 * two security properties we rely on instead of a sanitizer:
 *  1. raw HTML in markdown is NOT passed through (react-markdown default: skipped)
 *  2. dangerous URL protocols (javascript:) are stripped from links/images
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';

function render(md: string): string {
  return renderToStaticMarkup(React.createElement(ReactMarkdown, null, md));
}

describe('blog markdown under renderToStaticMarkup', () => {
  it('renders headings, paragraphs, lists, links', () => {
    const html = render('# Title\n\nSome **bold** text.\n\n- one\n- two\n\n[link](https://example.com)');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it('does NOT pass raw HTML through (tags escaped to inert text)', () => {
    const html = render('hello\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
    // react-markdown escapes raw HTML: it renders as visible text, never as elements
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('strips javascript: protocol from link hrefs', () => {
    const html = render('[click me](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('strips javascript: protocol from image srcs', () => {
    const html = render('![img](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('renders code blocks without executing content', () => {
    const html = render('```js\nconst x = "<script>bad</script>";\n```');
    expect(html).toContain('<code');
    expect(html).not.toContain('<script>bad');
  });
});
