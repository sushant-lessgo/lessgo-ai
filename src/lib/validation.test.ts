import { describe, it, expect } from 'vitest';
import { sanitizeSeo } from './validation';

// sanitizeSeo is the server-entry gate for user-controlled strings that get baked
// into the published <head>. Best-effort: hostile/invalid input degrades to
// undefined — it must never throw or fail the publish.
describe('sanitizeSeo', () => {
  it('passes a valid blob through', () => {
    const seo = {
      title: 'My SEO Title',
      description: 'A snippet.',
      ogImage: 'https://cdn.example.com/og.png',
      noIndex: true,
      faviconUrl: 'https://cdn.example.com/f.ico',
      structuredDataType: 'Organization',
    };
    expect(sanitizeSeo(seo)).toEqual(seo);
  });

  it('strips unknown keys', () => {
    expect(sanitizeSeo({ title: 'ok', __proto__pollution: 'x', canonical: 'https://evil.com' })).toEqual(
      { title: 'ok' }
    );
  });

  it('rejects non-https URLs (javascript:, data:, http:)', () => {
    expect(sanitizeSeo({ ogImage: 'javascript:alert(1)' })).toBeUndefined();
    expect(sanitizeSeo({ ogImage: 'data:text/html,<script>' })).toBeUndefined();
    expect(sanitizeSeo({ faviconUrl: 'http://insecure.com/f.ico' })).toBeUndefined();
  });

  it('rejects over-length fields', () => {
    expect(sanitizeSeo({ title: 'x'.repeat(71) })).toBeUndefined();
    expect(sanitizeSeo({ description: 'x'.repeat(201) })).toBeUndefined();
  });

  it('rejects an unknown structuredDataType', () => {
    expect(sanitizeSeo({ structuredDataType: 'Scam' })).toBeUndefined();
  });

  it('tolerates garbage input without throwing', () => {
    expect(sanitizeSeo(null)).toBeUndefined();
    expect(sanitizeSeo(undefined)).toBeUndefined();
    expect(sanitizeSeo('a string')).toBeUndefined();
    expect(sanitizeSeo(42)).toBeUndefined();
    expect(sanitizeSeo([])).toBeUndefined();
  });

  it('collapses an empty/all-undefined blob to undefined', () => {
    expect(sanitizeSeo({})).toBeUndefined();
    expect(sanitizeSeo({ title: undefined })).toBeUndefined();
  });
});
