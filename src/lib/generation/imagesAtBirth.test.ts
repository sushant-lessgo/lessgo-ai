import { describe, it, expect, vi, afterEach } from 'vitest';
import { injectImagesForPage } from './imagesAtBirth';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
} from '@/modules/generation/multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';

// ─────────────────────────────────────────────────────────────────────────────
// Mocked Pexels fetch. Two blue candidates so light/cool scoring picks a stable
// winner (`https://dl/win.jpg`). Every /api/images/search call returns the same
// photo set — enough to prove the write path end to end.
// ─────────────────────────────────────────────────────────────────────────────
function stubPexels() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        photos: [
          { url: 'https://px/win', downloadUrl: 'https://dl/win.jpg', avgColor: '#2f5fe0' },
          { url: 'https://px/alt', downloadUrl: 'https://dl/alt.jpg', avgColor: '#c9c9c9' },
        ],
      }),
    })
  );
}

// Build a real multi-page finalContent for one sitemap page via the REAL
// assembler (buildMultiPageSkeleton + mergePageIntoFinalContent) — NOT a
// hand-built by-sectionType map. This is the mis-wire guard: injection must work
// against the exact sectionId-keyed / per-entry-.layout shape production emits.
function assemble(page: SitemapPage, copy: Record<string, SectionCopy>) {
  const fc = buildMultiPageSkeleton({
    tokenId: 'tok-1',
    title: 'Acme',
    onboardingData: {
      oneLiner: '',
      productName: 'Acme',
      understanding: {},
      landingGoal: null,
      offer: '',
      sitemap: [page],
      strategy: {},
    },
  });
  mergePageIntoFinalContent({
    fc,
    page,
    order: 0,
    copy,
    templateId: 'vestria',
  });
  return fc;
}

const INDUSTRIES_COPY: Record<string, SectionCopy> = {
  industries: {
    elements: {
      eyebrow: 'Sectors',
      heading: 'Where we work',
      industries: [
        { id: 'ind-1', title: 'Aerospace', description: 'x' },
        { id: 'ind-2', title: 'Automotive', description: 'y' },
        { id: 'ind-3', title: 'Energy', description: 'z' },
      ],
    },
  } as any,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('injectImagesForPage — real-assembly write path', () => {
  it('(a) fills every industries item image, read back THROUGH fc (non-home page)', async () => {
    stubPexels();
    const page: SitemapPage = {
      archetypeKey: 'services',
      title: 'Services',
      pathSlug: '/services',
      sections: ['industries'],
    };
    const fc = assemble(page, INDUSTRIES_COPY);

    const stats = await injectImagesForPage({
      content: fc.pages.services.content,
      templateId: 'vestria',
      paletteId: 'cobalt',
      categories: ['Manufacturing', 'Steel'],
    });

    expect(stats.requested).toBe(3);
    expect(stats.filled).toBe(3);

    // Locate the industries section by its own layout, read back through fc.
    const secId = Object.keys(fc.pages.services.content).find(
      (id) => fc.pages.services.content[id].layout === 'VestriaIndustriesGrid'
    )!;
    expect(secId).toBeDefined();
    const items = fc.pages.services.content[secId].elements.industries as any[];
    for (const item of items) {
      expect(item.image).toBe('https://dl/win.jpg');
    }
  });

  it('(b) home page write is visible in BOTH fc.pages[home].content and fc.content (shared ref)', async () => {
    stubPexels();
    const home: SitemapPage = {
      archetypeKey: 'home',
      title: 'Home',
      pathSlug: '/',
      sections: ['industries'],
    };
    const fc = assemble(home, INDUSTRIES_COPY);

    await injectImagesForPage({
      content: fc.pages.home.content,
      templateId: 'vestria',
      paletteId: 'cobalt', // light/cool → the blue candidate wins deterministically
      categories: ['Manufacturing'],
    });

    const secId = Object.keys(fc.pages.home.content).find(
      (id) => fc.pages.home.content[id].layout === 'VestriaIndustriesGrid'
    )!;
    // Same section object reference in the flat top-level view.
    expect(fc.content[secId]).toBe(fc.pages.home.content[secId]);
    const pageItems = fc.pages.home.content[secId].elements.industries as any[];
    const flatItems = fc.content[secId].elements.industries as any[];
    expect(pageItems[0].image).toBe('https://dl/win.jpg');
    expect(flatItems[0].image).toBe('https://dl/win.jpg');
  });

  it('(c) promised slots (hero_image/about_image) remain absent — untouched', async () => {
    stubPexels();
    const page: SitemapPage = {
      archetypeKey: 'home',
      title: 'Home',
      pathSlug: '/',
      sections: ['hero', 'about', 'industries'],
    };
    const copy: Record<string, SectionCopy> = {
      ...INDUSTRIES_COPY,
      hero: { elements: { headline: 'Hi' } } as any,
      about: { elements: { heading: 'About' } } as any,
    };
    const fc = assemble(page, copy);

    await injectImagesForPage({
      content: fc.pages.home.content,
      templateId: 'vestria',
      paletteId: 'cobalt',
      categories: ['Manufacturing'],
    });

    const heroId = Object.keys(fc.pages.home.content).find((id) => id.startsWith('hero-'))!;
    const aboutId = Object.keys(fc.pages.home.content).find((id) => id.startsWith('about-'))!;
    expect(fc.pages.home.content[heroId].elements.hero_image).toBeUndefined();
    expect(fc.pages.home.content[aboutId].elements.about_image).toBeUndefined();
  });

  it('(d) meridian content → deep-equal unchanged + zero fetches', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const content = {
      'hero-abc12345': { id: 'hero-abc12345', layout: 'TerminalHero', elements: { headline: 'x' } },
      'nav-def45678': { id: 'nav-def45678', layout: 'MeridianNavHeader', elements: { logo_image: '' } },
    };
    const before = JSON.parse(JSON.stringify(content));

    const stats = await injectImagesForPage({
      content: content as any,
      templateId: 'meridian',
      paletteId: 'mint',
      categories: ['SaaS'],
    });

    expect(stats.requested).toBe(0);
    expect(stats.filled).toBe(0);
    expect(content).toEqual(before);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('(e) fetch failure → content unchanged, no throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const page: SitemapPage = {
      archetypeKey: 'services',
      title: 'Services',
      pathSlug: '/services',
      sections: ['industries'],
    };
    const fc = assemble(page, INDUSTRIES_COPY);
    const secId = Object.keys(fc.pages.services.content).find(
      (id) => fc.pages.services.content[id].layout === 'VestriaIndustriesGrid'
    )!;
    const before = JSON.parse(JSON.stringify(fc.pages.services.content[secId]));

    const stats = await injectImagesForPage({
      content: fc.pages.services.content,
      templateId: 'vestria',
      paletteId: 'cobalt',
      categories: ['Manufacturing'],
    });

    expect(stats.filled).toBe(0);
    expect(fc.pages.services.content[secId]).toEqual(before);
  });
});
