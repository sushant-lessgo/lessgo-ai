import { describe, it, expect } from 'vitest';
import {
  escapeHTML,
  robotsMetaTag,
  faviconLinkTag,
  jsonLdScriptTag,
  metaPixelSnippet,
  ga4Snippet,
} from './headTags';

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

// Tracking pixels: byte-identity when absent; strict-regex guard against hostile
// input; verbatim vendor markup with the id at both interpolation points.
describe('metaPixelSnippet', () => {
  it('returns the empty string for absent input (byte-identity)', () => {
    expect(metaPixelSnippet(undefined)).toBe('');
    expect(metaPixelSnippet('')).toBe('');
  });

  it('returns the empty string for hostile/invalid input', () => {
    expect(metaPixelSnippet('123"><script>')).toBe('');
    expect(metaPixelSnippet('G-<img>')).toBe('');
    expect(metaPixelSnippet('javascript:x')).toBe('');
    expect(metaPixelSnippet('1234')).toBe(''); // 4 digits < min 5
    expect(metaPixelSnippet('abc123')).toBe('');
  });

  it('emits the verbatim base pixel with the id at both points', () => {
    const out = metaPixelSnippet('1234567890123456');
    expect(out).toContain('connect.facebook.net/en_US/fbevents.js');
    expect(out).toContain("fbq('init', '1234567890123456')");
    expect(out).toContain('facebook.com/tr?id=1234567890123456');
    expect(out.startsWith('\n  ')).toBe(true);
  });
});

describe('ga4Snippet', () => {
  it('returns the empty string for absent input (byte-identity)', () => {
    expect(ga4Snippet(undefined)).toBe('');
    expect(ga4Snippet('')).toBe('');
  });

  it('returns the empty string for hostile/invalid input', () => {
    expect(ga4Snippet('123"><script>')).toBe('');
    expect(ga4Snippet('G-<img>')).toBe('');
    expect(ga4Snippet('javascript:x')).toBe('');
    expect(ga4Snippet('g-abc123')).toBe(''); // lowercase rejected
  });

  it('emits the verbatim gtag.js with the id at both points', () => {
    const out = ga4Snippet('G-ABC1234');
    expect(out).toContain('googletagmanager.com/gtag/js?id=G-ABC1234');
    expect(out).toContain("gtag('config', 'G-ABC1234')");
    expect(out.startsWith('\n  ')).toBe(true);
  });
});
