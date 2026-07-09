// src/modules/sections/elementDetermination.test.ts
// scale-07 phase 8 — frozen-fixture guard for the engine element contract:
// same Brief ⇒ same element map under meridian and vestria (the element list
// keys off (engine, sectionType), not the template's layout name), while the
// layout path survives untouched for editor callers, service legacy, work,
// and techpremium/naayom editor-only blocks.

import { describe, it, expect } from 'vitest';
import { getCompleteElementsMap, getRequiredElements } from './elementDetermination';
import { getLayoutElements } from './layoutElementSchema';
import {
  thingElementContract,
  resolveEngineSectionSchema,
} from '@/modules/engines/elementContracts';

// ── Fixtures ────────────────────────────────────────────────────────────────

const onboardingStore = {
  oneLiner: 'A deploy platform for teams that ship daily.',
  validatedFields: {
    marketCategory: 'Developer Tools',
    targetAudience: 'Staff engineers at fast-shipping startups',
  },
  hiddenInferredFields: { awarenessLevel: 'solution-aware' },
  featuresFromAI: [
    { feature: 'Auto deploys', benefit: 'Ship without babysitting' },
  ],
} as any;

// The thing-engine shared core, as the two templates' generation pipelines
// route it today (uiblocks: sectionType → layout name).
const MERIDIAN_UIBLOCKS: Record<string, string> = {
  header: 'MeridianNavHeader',
  hero: 'TerminalHero',
  features: 'HairlineFeatureGrid',
  testimonials: 'ProofWithLogoRail',
  footer: 'HairlineFooter',
};

const VESTRIA_UIBLOCKS: Record<string, string> = {
  header: 'VestriaNavHeader',
  hero: 'VestriaTailoredHero',
  features: 'VestriaServicesGrid',
  testimonials: 'VestriaQuotes',
  footer: 'VestriaFooter',
};

const SHARED_SECTIONS = Object.keys(MERIDIAN_UIBLOCKS);

function makePageStore(uiblocks: Record<string, string>) {
  return {
    layout: {
      sections: Object.keys(uiblocks),
      sectionLayouts: uiblocks,
    },
    meta: {
      onboardingData: {
        oneLiner: onboardingStore.oneLiner,
        validatedFields: onboardingStore.validatedFields,
        featuresFromAI: onboardingStore.featuresFromAI,
      },
    },
  } as any;
}

const sorted = (arr: string[]) => [...arr].sort();
const names = (els: Array<{ element: string }>) => els.map((e) => e.element);

// ── 1. Convergence: same Brief ⇒ same element map ──────────────────────────

describe('engine element contract — meridian/vestria convergence (frozen fixture)', () => {
  const mMap = getCompleteElementsMap(onboardingStore, makePageStore(MERIDIAN_UIBLOCKS));
  const vMap = getCompleteElementsMap(onboardingStore, makePageStore(VESTRIA_UIBLOCKS));

  it.each(SHARED_SECTIONS)(
    '%s: identical element lists under meridian and vestria',
    (section) => {
      expect(sorted(vMap[section].allElements)).toEqual(sorted(mMap[section].allElements));
      expect(sorted(vMap[section].mandatoryElements)).toEqual(
        sorted(mMap[section].mandatoryElements)
      );
      expect(sorted(vMap[section].optionalElements)).toEqual(
        sorted(mMap[section].optionalElements)
      );
      // Layout stays display-only metadata — it MAY differ.
      expect(mMap[section].layout).not.toBe(vMap[section].layout);
    }
  );

  it('contract list is a superset of BOTH templates’ raw layout lists (union seeding)', () => {
    const pairs: Array<[string, string, string]> = SHARED_SECTIONS.map((s) => [
      s,
      MERIDIAN_UIBLOCKS[s],
      VESTRIA_UIBLOCKS[s],
    ]);
    for (const [section, mLayout, vLayout] of pairs) {
      const contractAll = new Set(mMap[section].allElements);
      for (const el of names(getLayoutElements(mLayout))) {
        expect(contractAll.has(el), `${section}: missing meridian field ${el}`).toBe(true);
      }
      for (const el of names(getLayoutElements(vLayout))) {
        expect(contractAll.has(el), `${section}: missing vestria field ${el}`).toBe(true);
      }
    }
  });

  // Frozen mandatory sets — meridian owns the mandates (divergence rule Q4):
  // vestria-only ELEMENTS enter demoted to optional (e.g. footer brand_text);
  // vestria fields inside a shared REQUIRED collection inherit the collection's
  // requirement (features.kicker).
  it('mandatory sets are frozen to the meridian-wins reconciliation', () => {
    expect(sorted(mMap.header.mandatoryElements)).toEqual([
      'cta_text',
      'logo_text',
      'nav_items.children',
      'nav_items.href',
      'nav_items.label',
      'signin_text',
    ]);
    expect(sorted(mMap.hero.mandatoryElements)).toEqual(['cta_text', 'headline', 'lede']);
    expect(sorted(mMap.features.mandatoryElements)).toEqual([
      'features.description',
      'features.icon',
      'features.kicker',
      'features.link_text',
      'features.title',
      'headline',
    ]);
    expect(sorted(mMap.testimonials.mandatoryElements)).toEqual([
      'headline',
      'testimonials.author_name',
      'testimonials.author_role',
      'testimonials.quote',
    ]);
    expect(sorted(mMap.footer.mandatoryElements)).toEqual([
      'copyright',
      'footer_columns.heading',
      'footer_columns.links',
      'wordmark',
    ]);
  });

  it('vestria-only rendered fields surface under meridian (union), as optionals', () => {
    expect(mMap.hero.optionalElements).toContain('tag_text');
    expect(mMap.hero.optionalElements).toContain('stamp_value');
    expect(mMap.footer.optionalElements).toContain('brand_text'); // demoted from vestria-required
    expect(mMap.footer.allElements).toContain('link_columns.heading');
  });

  it('meridian fields surface under vestria (union)', () => {
    expect(vMap.hero.allElements).toContain('status_text');
    expect(vMap.hero.optionalElements).toContain('cta_subtext');
    expect(vMap.footer.allElements).toContain('wordmark');
    expect(vMap.footer.allElements).toContain('footer_columns.heading');
  });
});

// ── 2. Single-template sections: byte-identical to today’s schemas ─────────

describe('engine element contract — single-template sections are verbatim', () => {
  const cases: Array<[string, string]> = [
    ['pricing', 'ThreeTierPricing'],
    ['cta', 'ArcCTA'],
    ['trust', 'VestriaClientStrip'],
    ['industries', 'VestriaIndustriesGrid'],
    ['about', 'VestriaAboutStats'],
    ['materials', 'VestriaMaterials'],
    ['process', 'VestriaProcessRail'],
    ['catalog', 'VestriaCatalogueGrid'],
    ['contact', 'VestriaLeadForm'],
  ];

  it.each(cases)('%s resolves to exactly today’s %s element list', (section, layout) => {
    const viaContract = getRequiredElements(section, layout, {});
    const viaLayout = names(getLayoutElements(layout));
    expect(sorted(viaContract.all)).toEqual(sorted(viaLayout));
  });
});

// ── 3. Hero variants: full-bleed shares the contract, keeps media keys ─────

describe('engine element contract — vestria hero variants', () => {
  it('VestriaFullBleedHero resolves to the same contract list as VestriaTailoredHero', () => {
    const tailored = getRequiredElements('hero', 'VestriaTailoredHero', {});
    const fullBleed = getRequiredElements('hero', 'VestriaFullBleedHero', {});
    expect(sorted(fullBleed.all)).toEqual(sorted(tailored.all));
    expect(fullBleed.all).toContain('hero_video_desktop');
    expect(fullBleed.all).toContain('hero_video_poster');
  });
});

// ── 4. Non-migrations: everything else stays on the layout path ────────────

describe('layout path survives for non-engine-covered callers', () => {
  it('techpremium/naayom editor-only blocks are NOT contract-routed', () => {
    for (const layout of [
      'TrustStrip',
      'ProcessSteps',
      'ContactForm',
      'ProductCatalogList',
      'ProductDetailRecord',
      'SharedLeadForm',
    ]) {
      expect(resolveEngineSectionSchema(layout), layout).toBeNull();
    }
    // TrustStrip (sectionType 'trust') must keep its OWN elements — never the
    // vestria trust contract.
    const viaGeneration = getRequiredElements('trust', 'TrustStrip', {});
    expect(sorted(viaGeneration.all)).toEqual(sorted(names(getLayoutElements('TrustStrip'))));
    expect(viaGeneration.all).not.toContain('label_text'); // VestriaClientStrip field
  });

  it('service-legacy and work layouts are NOT contract-routed', () => {
    expect(resolveEngineSectionSchema('PetalFramedHero')).toBeNull();
    expect(resolveEngineSectionSchema('GranthJacketShelf')).toBeNull();
    const hero = getRequiredElements('hero', 'PetalFramedHero', {});
    expect(sorted(hero.all)).toEqual(sorted(names(getLayoutElements('PetalFramedHero'))));
  });

  it('unknown layouts still return empty (unchanged fall-through)', () => {
    expect(getRequiredElements('hero', 'NoSuchLayout', {})).toEqual({
      mandatory: [],
      optional: [],
      all: [],
      excluded: [],
    });
  });

  it('raw layout lookups (editor path) still return the UNCONVERGED per-template lists', () => {
    // getLayoutElements is the editor-runtime path (useElementCRUD) — it must
    // keep returning the raw meridian schema, without vestria's union fields.
    const rawMeridianHero = names(getLayoutElements('TerminalHero'));
    expect(rawMeridianHero).not.toContain('tag_text');
    expect(rawMeridianHero).toContain('status_text');
  });
});

// ── 5. Contract shape sanity ────────────────────────────────────────────────

describe('thing element contract shape', () => {
  it('covers the thing engine core + both templates’ capability sections', () => {
    expect(sorted(Object.keys(thingElementContract))).toEqual([
      'about',
      'catalog',
      'contact',
      'cta',
      'features',
      'footer',
      'header',
      'hero',
      'industries',
      'materials',
      'pricing',
      'process',
      'testimonials',
      'trust',
    ]);
  });

  it('every contract entry declares its own sectionType key', () => {
    for (const [sectionType, schema] of Object.entries(thingElementContract)) {
      expect(schema.sectionType, sectionType).toBe(sectionType);
    }
  });
});
