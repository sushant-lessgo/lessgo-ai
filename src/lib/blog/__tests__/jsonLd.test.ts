// Blog (P2): BlogPosting JSON-LD shape.
import { describe, it, expect } from 'vitest';
import { buildBlogPostingJsonLd } from '../jsonLd';
import { serializeJsonLd } from '@/lib/staticExport/structuredData';

const FULL = {
  headline: 'Hello World',
  description: 'A first post',
  url: 'https://acme.com/blog/hello-world',
  imageUrl: 'https://img.example/hero.webp',
  datePublishedISO: '2026-07-01T10:00:00.000Z',
  dateModifiedISO: '2026-07-03T10:00:00.000Z',
  authorName: 'Acme',
  publisherLogoUrl: 'https://img.example/logo.png',
};

describe('buildBlogPostingJsonLd', () => {
  it('emits the full BlogPosting shape', () => {
    const j = buildBlogPostingJsonLd(FULL) as any;
    expect(j['@context']).toBe('https://schema.org');
    expect(j['@type']).toBe('BlogPosting');
    expect(j.headline).toBe('Hello World');
    expect(j.url).toBe(FULL.url);
    expect(j.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': FULL.url });
    expect(j.image).toBe(FULL.imageUrl);
    expect(j.datePublished).toBe(FULL.datePublishedISO);
    expect(j.dateModified).toBe(FULL.dateModifiedISO);
    expect(j.author).toEqual({ '@type': 'Organization', name: 'Acme' });
    expect(j.publisher).toEqual({
      '@type': 'Organization',
      name: 'Acme',
      logo: { '@type': 'ImageObject', url: FULL.publisherLogoUrl },
    });
  });

  it('omits optionals: image, publisher.logo, and dateModified when equal to datePublished', () => {
    const j = buildBlogPostingJsonLd({
      ...FULL,
      imageUrl: undefined,
      publisherLogoUrl: undefined,
      dateModifiedISO: FULL.datePublishedISO,
    }) as any;
    expect(j).not.toHaveProperty('image');
    expect(j).not.toHaveProperty('dateModified');
    expect(j.publisher).toEqual({ '@type': 'Organization', name: 'Acme' });
  });

  it('serializes breakout-safe through serializeJsonLd', () => {
    const j = buildBlogPostingJsonLd({ ...FULL, headline: '</script><script>alert(1)</script>' });
    const s = serializeJsonLd(j);
    expect(s).not.toContain('</script>');
    expect(JSON.parse(s.replace(/\\u003c/g, '<'))['@type']).toBe('BlogPosting');
  });
});
