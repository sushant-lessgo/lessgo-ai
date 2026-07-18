import { describe, it, expect } from 'vitest';
import {
  escapeHTML,
  isSafeURL,
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

  // faviconLinkTag escapes INTERNALLY — the htmlGenerator call site must not wrap it
  // again. This pins the single-escape (no `&amp;amp;`) the do-NOT-wrap list relies on.
  it('escapes & exactly once (favicon is escaped inside the builder, never at the call site)', () => {
    expect(faviconLinkTag('https://cdn/f.ico?v=1&x=2')).toBe(
      '\n  <link rel="icon" href="https://cdn/f.ico?v=1&amp;x=2">'
    );
    expect(faviconLinkTag('https://cdn/f.ico?v=1&x=2')).not.toContain('&amp;amp;');
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

// publish-trust M4: the head's escaping + scheme-gate contract.
describe('escapeHTML — attribute-injection matrix', () => {
  it('neutralizes a full attribute-breakout payload', () => {
    expect(escapeHTML('"><script>alert(1)</script>')).toBe(
      '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('leaves injection-free strings byte-identical', () => {
    expect(escapeHTML('https://acme.com/api/og/slug')).toBe('https://acme.com/api/og/slug');
    expect(escapeHTML('')).toBe('');
  });

  it('escapes & in query strings exactly once (the only benign-output delta)', () => {
    expect(escapeHTML('https://cdn/x.png?a=1&b=2&c=3')).toBe(
      'https://cdn/x.png?a=1&amp;b=2&amp;c=3'
    );
  });

  // Contract: escapeHTML is NOT idempotent — it re-encodes the & of an existing entity.
  // That is correct for raw input, and exactly why every sink must be wrapped ONCE.
  // (Documents the do-NOT-double-wrap rule the call sites depend on.)
  it('re-encodes pre-encoded input (no-double-wrap contract)', () => {
    expect(escapeHTML('&amp;')).toBe('&amp;amp;');
    expect(escapeHTML(escapeHTML('a&b'))).toBe('a&amp;amp;b');
  });
});

describe('isSafeURL', () => {
  it('accepts absolute https/http and root-relative URLs', () => {
    expect(isSafeURL('https://acme.com/og.png?b=1&c=2')).toBe(true);
    expect(isSafeURL('http://acme.com/og.png')).toBe(true);
    expect(isSafeURL('HTTPS://ACME.COM/OG.PNG')).toBe(true);
    expect(isSafeURL('/rel/path')).toBe(true);
    expect(isSafeURL('/')).toBe(true);
  });

  it('rejects javascript: in every obfuscation the browser still executes', () => {
    expect(isSafeURL('javascript:alert(1)')).toBe(false);
    expect(isSafeURL('JaVaScRiPt:alert(1)')).toBe(false);
    expect(isSafeURL(' javascript:x')).toBe(false);
    expect(isSafeURL('java\tscript:x')).toBe(false);
    expect(isSafeURL('java\nscript:x')).toBe(false);
    expect(isSafeURL('java script:x')).toBe(false);
    expect(isSafeURL('\x00javascript:x')).toBe(false);
  });

  it('rejects other hostile/unusable schemes and shapes', () => {
    expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeURL('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeURL('//evil.com')).toBe(false); // protocol-relative → off-origin
    expect(isSafeURL('/\\evil.com')).toBe(false); // browser-quirk twin of //
    expect(isSafeURL('not-a-url')).toBe(false);
    expect(isSafeURL('ftp://acme.com/x')).toBe(false);
    expect(isSafeURL('')).toBe(false);
    expect(isSafeURL('   ')).toBe(false);
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
