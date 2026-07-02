import { describe, it, expect } from 'vitest';
import { buildPageMetadata, flattenContent, resolveOgImage } from './buildPageMetadata';

// Flattened content shape the builder consumes: section data at the root, section list under layout.
const flatContent = {
  layout: { sections: ['header-1', 'hero-abc12345', 'features-xyz'] },
  'hero-abc12345': {
    elements: {
      headline: { content: 'Ship landing pages fast' },
      subheadline: { content: 'Founders launch in minutes, not weeks.' },
    },
  },
};

// Nested (DB) shape: section data under `.content`, list at top-level `layout`.
const nestedContent = {
  layout: { sections: ['header-1', 'hero-abc12345', 'features-xyz'] },
  content: {
    'hero-abc12345': {
      elements: {
        headline: { content: 'Ship landing pages fast' },
        subheadline: { content: 'Founders launch in minutes, not weeks.' },
      },
    },
  },
};

describe('flattenContent', () => {
  it('flattens the nested DB shape into the flat shape', () => {
    const flat = flattenContent(nestedContent);
    expect(flat.layout.sections).toEqual(nestedContent.layout.sections);
    expect(flat['hero-abc12345'].elements.headline.content).toBe('Ship landing pages fast');
    expect(flat.content).toBeUndefined();
  });

  it('is idempotent on already-flat content', () => {
    expect(flattenContent(flatContent)).toBe(flatContent);
  });

  it('tolerates null/undefined', () => {
    expect(flattenContent(null)).toBeNull();
    expect(flattenContent(undefined)).toBeUndefined();
  });
});

describe('resolveOgImage', () => {
  it('prefers the manual previewImage override', () => {
    expect(
      resolveOgImage({ slug: 'acme', previewImage: 'https://cdn/x.png', baseUrl: 'https://lessgo.ai' })
    ).toBe('https://cdn/x.png');
  });

  it('serves auto OG from the live custom domain when present', () => {
    expect(
      resolveOgImage({ slug: 'acme', canonicalDomain: 'scalifixai.com', baseUrl: 'https://lessgo.ai' })
    ).toBe('https://scalifixai.com/api/og/acme');
  });

  it('falls back to baseUrl auto OG with no custom domain (byte-identical to the legacy formula)', () => {
    expect(resolveOgImage({ slug: 'acme', baseUrl: 'https://lessgo.ai' })).toBe(
      'https://lessgo.ai/api/og/acme'
    );
  });
});

describe('buildPageMetadata', () => {
  const base = {
    slug: 'acme',
    pageTitle: 'Acme',
    previewImage: undefined,
    baseUrl: 'https://lessgo.ai',
  };

  it('derives description from the hero subheadline (flattened input)', () => {
    const m = buildPageMetadata({ ...base, content: flatContent, canonicalPath: '/' });
    expect(m.description).toBe('Founders launch in minutes, not weeks.');
    expect(m.title).toBe('Acme');
    expect(m.siteName).toBe('Lessgo.ai');
    expect(m.ogType).toBe('website');
  });

  it('produces the same description for the nested shape once flattened (no drift between callers)', () => {
    const fromFlat = buildPageMetadata({ ...base, content: flatContent });
    const fromNested = buildPageMetadata({ ...base, content: flattenContent(nestedContent) });
    expect(fromNested.description).toBe(fromFlat.description);
  });

  it('falls back subheadline → headline → title', () => {
    const noSub = {
      layout: { sections: ['hero-x'] },
      'hero-x': { elements: { headline: { content: 'Just a headline' } } },
    };
    expect(buildPageMetadata({ ...base, content: noSub }).description).toBe('Just a headline');

    const noHero = { layout: { sections: ['features-x'] }, 'features-x': { elements: {} } };
    expect(buildPageMetadata({ ...base, content: noHero }).description).toBe('Acme');
  });

  it('caps the description at 160 chars', () => {
    const long = 'x'.repeat(300);
    const c = { layout: { sections: ['hero-x'] }, 'hero-x': { elements: { subheadline: { content: long } } } };
    expect(buildPageMetadata({ ...base, content: c }).description).toHaveLength(160);
  });

  it('title falls back to hero headline then a generic label when pageTitle is empty', () => {
    expect(buildPageMetadata({ ...base, pageTitle: '', content: flatContent }).title).toBe(
      'Ship landing pages fast'
    );
    const noHero = { layout: { sections: [] } };
    expect(buildPageMetadata({ ...base, pageTitle: '', content: noHero }).title).toBe('Landing Page');
  });

  it('resolves canonical to the subdomain vs the live custom domain, at the page path', () => {
    expect(buildPageMetadata({ ...base, content: flatContent, canonicalPath: '/' }).canonicalURL).toBe(
      'https://acme.lessgo.site'
    );
    expect(
      buildPageMetadata({
        ...base,
        content: flatContent,
        canonicalDomain: 'scalifixai.com',
        canonicalPath: '/gallery',
      }).canonicalURL
    ).toBe('https://scalifixai.com/gallery');
  });
});
