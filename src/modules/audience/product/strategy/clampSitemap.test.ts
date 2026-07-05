// clampSitemap — the server LAW over the LLM's sitemap proposal (Phase 2).
// Covers the PO-mandated cases: unknown keys, missing home, disallowed
// sections, empty proposal, duplicates, required-section insertion.

import { describe, it, expect } from 'vitest';
import { clampSitemap, assembleProductStrategy } from './parseStrategyProduct';
import { VESTRIA_PAGE_ARCHETYPES } from '../pageArchetypes';

const MENU = VESTRIA_PAGE_ARCHETYPES;
const homeDef = MENU.find((a) => a.key === 'home')!;

const LLM_BASE = {
  awareness: 'solution-aware-skeptical' as const,
  oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
};

describe('clampSitemap', () => {
  it('empty/absent proposal → defaultIncluded pages with default sections', () => {
    for (const proposal of [null, undefined, []]) {
      const pages = clampSitemap(proposal as any, MENU);
      expect(pages.map((p) => p.archetypeKey)).toEqual(
        MENU.filter((a) => a.defaultIncluded).map((a) => a.key)
      );
      expect(pages[0].archetypeKey).toBe('home');
      expect(pages[0].sections).toEqual(homeDef.defaultSections);
    }
  });

  it('drops unknown archetype keys', () => {
    const pages = clampSitemap(
      [
        { archetypeKey: 'home', title: 'Home', sections: ['hero'] },
        { archetypeKey: 'pricing', title: 'Pricing', sections: ['pricing'] }, // not in menu
      ],
      MENU
    );
    expect(pages.map((p) => p.archetypeKey)).toEqual(['home']);
  });

  it('forces home present and FIRST', () => {
    const missing = clampSitemap(
      [{ archetypeKey: 'contact', title: 'Contact', sections: ['contact'] }],
      MENU
    );
    expect(missing[0].archetypeKey).toBe('home');
    expect(missing[0].sections).toEqual(homeDef.defaultSections);

    const misordered = clampSitemap(
      [
        { archetypeKey: 'about', title: 'About', sections: ['about'] },
        { archetypeKey: 'home', title: 'Home', sections: ['hero', 'contact'] },
      ],
      MENU
    );
    expect(misordered.map((p) => p.archetypeKey)).toEqual(['home', 'about']);
    expect(misordered[0].sections).toEqual(['hero', 'contact']);
  });

  it('filters disallowed sections (order-preserving) and dedupes', () => {
    const pages = clampSitemap(
      [
        {
          archetypeKey: 'about',
          title: 'About',
          // catalog not allowed on about; about duplicated
          sections: ['about', 'catalog', 'process', 'about'],
        },
      ],
      MENU
    );
    const about = pages.find((p) => p.archetypeKey === 'about')!;
    expect(about.sections).toEqual(['about', 'process']);
  });

  it('inserts missing required sections; empty result falls back to defaults', () => {
    const pages = clampSitemap(
      [
        { archetypeKey: 'home', title: 'Home', sections: ['trust'] }, // hero (required) missing
        { archetypeKey: 'industries', title: 'Industries', sections: ['pricing'] }, // all disallowed
      ],
      MENU
    );
    expect(pages[0].sections).toEqual(['trust', 'hero']);
    const ind = pages.find((p) => p.archetypeKey === 'industries')!;
    // filtered to [] + required inserted → ['industries']
    expect(ind.sections).toEqual(['industries']);
  });

  it('dedupes duplicate pages (first wins) and defaults empty titles; slugs always from the menu', () => {
    const pages = clampSitemap(
      [
        { archetypeKey: 'home', title: '', sections: ['hero'] },
        { archetypeKey: 'contact', title: 'Get a Quote', sections: ['contact'] },
        { archetypeKey: 'contact', title: 'Contact 2', sections: ['contact'] },
      ],
      MENU
    );
    expect(pages.map((p) => p.archetypeKey)).toEqual(['home', 'contact']);
    expect(pages[0].title).toBe('Home'); // defaulted
    const contact = pages[1];
    expect(contact.title).toBe('Get a Quote'); // AI title kept
    expect(contact.pathSlug).toBe('/contact'); // slug NEVER from the AI
  });
});

describe('assembleProductStrategy (sitemap wiring)', () => {
  it('meridian: no sitemap, fixed 7 sections — behavior unchanged', () => {
    const out = assembleProductStrategy({ llmResponse: LLM_BASE as any, templateId: 'meridian' });
    expect(out.sitemap).toBeUndefined();
    expect(out.sections).toEqual(['header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer']);
    expect(out.uiblocks.hero).toBe('TerminalHero');
  });

  it('vestria: clamped sitemap attached; top-level sections = chrome + HOME body', () => {
    const llm = {
      ...LLM_BASE,
      sitemap: {
        pages: [
          { archetypeKey: 'home', title: 'Home', sections: ['hero', 'industries', 'contact'], reason: 'r' },
          { archetypeKey: 'contact', title: 'Contact', sections: ['contact'], reason: 'r' },
        ],
      },
    };
    const out = assembleProductStrategy({ llmResponse: llm as any, templateId: 'vestria' });
    expect(out.sitemap?.map((p) => p.archetypeKey)).toEqual(['home', 'contact']);
    expect(out.sections).toEqual(['header', 'hero', 'industries', 'contact', 'footer']);
    expect(out.uiblocks.hero).toBe('VestriaTailoredHero');
    expect(out.uiblocks.footer).toBe('VestriaFooter');
  });
});
