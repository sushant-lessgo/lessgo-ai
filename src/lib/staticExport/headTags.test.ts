import { describe, it, expect } from 'vitest';
import { escapeHTML, robotsMetaTag, faviconLinkTag, jsonLdScriptTag } from './headTags';

// The byte-identity guarantee: every builder returns '' when its input is absent,
// so a page with no seo settings produces exactly the head it did before.
describe('headTags — empty inputs produce zero bytes', () => {
  it('robotsMetaTag', () => {
    expect(robotsMetaTag(false)).toBe('');
    expect(robotsMetaTag(undefined)).toBe('');
  });

  it('faviconLinkTag', () => {
    expect(faviconLinkTag(undefined)).toBe('');
    expect(faviconLinkTag('')).toBe('');
  });

  it('jsonLdScriptTag', () => {
    expect(jsonLdScriptTag(undefined)).toBe('');
    expect(jsonLdScriptTag('')).toBe('');
  });
});

describe('headTags — content', () => {
  it('robotsMetaTag emits noindex,nofollow', () => {
    expect(robotsMetaTag(true)).toBe('\n  <meta name="robots" content="noindex,nofollow">');
  });

  it('faviconLinkTag escapes attribute-breaking characters', () => {
    expect(faviconLinkTag('https://cdn/f.ico')).toBe('\n  <link rel="icon" href="https://cdn/f.ico">');
    expect(faviconLinkTag('https://cdn/f.ico"><script>')).not.toContain('"><script>');
    expect(faviconLinkTag('https://cdn/f.ico"><script>')).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('jsonLdScriptTag wraps pre-serialized JSON', () => {
    expect(jsonLdScriptTag('{"@type":"Organization"}')).toBe(
      '\n  <script type="application/ld+json">{"@type":"Organization"}</script>'
    );
  });

  it('escapeHTML covers the five special characters', () => {
    expect(escapeHTML(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#039;');
    expect(escapeHTML('')).toBe('');
  });
});
