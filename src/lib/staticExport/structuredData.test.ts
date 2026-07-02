import { describe, it, expect } from 'vitest';
import { extractLogoUrl, buildStructuredData, serializeJsonLd } from './structuredData';

describe('extractLogoUrl', () => {
  const withLogo = {
    layout: { sections: ['header-abc123', 'hero-x'] },
    'header-abc123': { elements: { logo_image: { content: 'https://cdn.example.com/logo.png' } } },
  };

  it('finds the header logo_image', () => {
    expect(extractLogoUrl(withLogo)).toBe('https://cdn.example.com/logo.png');
  });

  it('returns undefined without a header section or logo', () => {
    expect(extractLogoUrl({ layout: { sections: ['hero-x'] }, 'hero-x': { elements: {} } })).toBeUndefined();
    expect(
      extractLogoUrl({ layout: { sections: ['header-a'] }, 'header-a': { elements: {} } })
    ).toBeUndefined();
    expect(extractLogoUrl(null)).toBeUndefined();
  });

  it('rejects non-https values (relative, data:, http:)', () => {
    const make = (v: any) => ({
      layout: { sections: ['header-a'] },
      'header-a': { elements: { logo_image: { content: v } } },
    });
    expect(extractLogoUrl(make('/uploads/logo.png'))).toBeUndefined();
    expect(extractLogoUrl(make('data:image/png;base64,x'))).toBeUndefined();
    expect(extractLogoUrl(make('http://cdn/logo.png'))).toBeUndefined();
    expect(extractLogoUrl(make(42))).toBeUndefined();
  });
});

describe('buildStructuredData', () => {
  const base = {
    name: 'Acme',
    description: 'We do things.',
    url: 'https://acme.lessgo.site',
  };

  it("'none' returns null (no JSON-LD emitted)", () => {
    expect(buildStructuredData({ ...base, type: 'none' })).toBeNull();
  });

  it("'auto' (and undefined) emits a safe generic Organization", () => {
    for (const type of [undefined, 'auto' as const, 'Organization' as const]) {
      const d = buildStructuredData({ ...base, type })!;
      expect(d['@context']).toBe('https://schema.org');
      expect(d['@type']).toBe('Organization');
      expect(d.name).toBe('Acme');
      expect(d.url).toBe(base.url);
      expect(d.logo).toBeUndefined();
    }
  });

  it('Organization includes the logo only when provided', () => {
    const d = buildStructuredData({ ...base, logoUrl: 'https://cdn/logo.png' })!;
    expect(d.logo).toBe('https://cdn/logo.png');
  });

  it('Service wraps a provider Organization', () => {
    const d = buildStructuredData({ ...base, type: 'Service' })!;
    expect(d['@type']).toBe('Service');
    expect(d.provider).toEqual({ '@type': 'Organization', name: 'Acme' });
  });

  it('LocalBusiness and Product carry the image when provided', () => {
    const lb = buildStructuredData({ ...base, type: 'LocalBusiness', imageUrl: 'https://cdn/og.png' })!;
    expect(lb['@type']).toBe('LocalBusiness');
    expect(lb.image).toBe('https://cdn/og.png');

    const p = buildStructuredData({ ...base, type: 'Product', imageUrl: 'https://cdn/og.png' })!;
    expect(p['@type']).toBe('Product');
    expect(p.image).toBe('https://cdn/og.png');
    expect(p.url).toBeUndefined(); // Product shape carries no url field
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so a hostile payload cannot break out of the script tag', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script>');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});
