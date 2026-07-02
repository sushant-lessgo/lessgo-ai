import { describe, it, expect } from 'vitest';
import { resolveCanonicalURL } from './canonicalUrl';

describe('resolveCanonicalURL', () => {
  it('falls back to the {slug}.lessgo.site subdomain when no custom domain', () => {
    expect(resolveCanonicalURL({ slug: 'acme' })).toBe('https://acme.lessgo.site');
    expect(resolveCanonicalURL({ slug: 'acme', canonicalPath: '/' })).toBe(
      'https://acme.lessgo.site'
    );
  });

  it('uses the live custom domain when provided (root path)', () => {
    expect(
      resolveCanonicalURL({ slug: 'acme', canonicalDomain: 'scalifixai.com', canonicalPath: '/' })
    ).toBe('https://scalifixai.com');
  });

  it('appends the page path for subpages', () => {
    expect(
      resolveCanonicalURL({
        slug: 'acme',
        canonicalDomain: 'scalifixai.com',
        canonicalPath: '/gallery',
      })
    ).toBe('https://scalifixai.com/gallery');
  });

  it('appends the subpath on the subdomain fallback too', () => {
    expect(resolveCanonicalURL({ slug: 'acme', canonicalPath: '/contact' })).toBe(
      'https://acme.lessgo.site/contact'
    );
  });
});
