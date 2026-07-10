// src/modules/engines/structureConvergence.test.ts
// scale-07 phase 2 — meridian/vestria core convergence. THE phase invariant:
// same Brief ⇒ same section list under every thing template (single-page).
// The engine core is the shared skeleton; capability sections (declared per
// template in templateMeta.capabilitySections) are the ONLY per-template
// additions, entering only when the Brief requires the capability. The 5
// explicit-trigger capability ids (trust/industries/about/materials/process)
// are NEVER auto-inferred — they enter only via explicit inclusion (7b gate,
// phase 4).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { selectProductSections } from '@/modules/audience/product/sectionSelection';
import { runThingGeneration, type ThingGenerationInput } from '@/modules/wizard/generation/thing';
import type { ProductStrategyOutput } from '@/types/product';
import { buildSectionList } from './sectionGrammar';
import { engineCoreSections } from './coreSections';
import { templateMeta } from '@/modules/templates/templateMeta';
import {
  requiredCapabilitiesFromBrief,
  EXPLICIT_TRIGGER_CAPABILITIES,
} from '@/modules/templates/fit';
import { businessTypeKeys } from '@/modules/businessTypes/config';
import type { Brief } from '@/types/brief';

const THING_CORE = ['header', 'hero', 'features', 'testimonials', 'footer'];

describe('structure convergence — same Brief ⇒ same section list (thing single-page)', () => {
  it('frozen thing core is the expected converged skeleton', () => {
    expect([...engineCoreSections.thing]).toEqual(THING_CORE);
  });

  it('no capabilities required ⇒ meridian and vestria produce the IDENTICAL list = thing core', () => {
    const meridian = selectProductSections({ templateId: 'meridian' });
    const vestria = selectProductSections({ templateId: 'vestria' });
    expect(meridian).toEqual(THING_CORE);
    expect(vestria).toEqual(THING_CORE);
    expect(meridian).toEqual(vestria);
  });

  it('a Brief with no capability-deriving fields converges identically too', () => {
    const brief: Brief = { copyEngine: 'thing' };
    expect(requiredCapabilitiesFromBrief(brief)).toEqual([]);
    const meridian = selectProductSections({ templateId: 'meridian', brief });
    const vestria = selectProductSections({ templateId: 'vestria', brief });
    expect(meridian).toEqual(vestria);
    expect(meridian).toEqual(THING_CORE);
  });

  it('unknown/absent templateId falls back to bare engine core (no capability map)', () => {
    expect(selectProductSections()).toEqual(THING_CORE);
    expect(selectProductSections({ templateId: 'not-a-template' })).toEqual(THING_CORE);
  });

  it('catalog required ⇒ vestria adds catalog, meridian does NOT (meridian declares no catalog)', () => {
    const opts = { requiredCapabilities: ['catalog'] as const };
    const meridian = selectProductSections({ templateId: 'meridian', ...opts });
    const vestria = selectProductSections({ templateId: 'vestria', ...opts });
    expect(meridian).toEqual(THING_CORE); // no catalog block declared ⇒ core only
    expect(vestria).toEqual([
      'header', 'hero', 'features', 'testimonials', 'catalog', 'footer',
    ]);
  });

  it('lead-form required (saas Brief, businessType auto-trigger) ⇒ each template adds ITS declared evidence section, same shape', () => {
    const brief: Brief = { businessType: 'saas', copyEngine: 'thing' };
    expect(requiredCapabilitiesFromBrief(brief)).toEqual(['lead-form']);
    const meridian = selectProductSections({ templateId: 'meridian', brief });
    const vestria = selectProductSections({ templateId: 'vestria', brief });
    // Same skeleton + same capability, evidenced by each template's own block.
    expect(meridian).toEqual([
      'header', 'hero', 'features', 'testimonials', 'cta', 'footer',
    ]);
    expect(vestria).toEqual([
      'header', 'hero', 'features', 'testimonials', 'contact', 'footer',
    ]);
    expect(meridian.length).toBe(vestria.length);
  });

  it('packages required ⇒ meridian adds pricing; vestria (no packages block) stays core', () => {
    const opts = { requiredCapabilities: ['packages'] as const };
    expect(selectProductSections({ templateId: 'meridian', ...opts })).toEqual([
      'header', 'hero', 'features', 'testimonials', 'pricing', 'footer',
    ]);
    expect(selectProductSections({ templateId: 'vestria', ...opts })).toEqual(THING_CORE);
  });

  it('explicit-trigger ids enter ONLY via explicit inclusion, and only where declared', () => {
    const opts = { requiredCapabilities: EXPLICIT_TRIGGER_CAPABILITIES };
    // vestria declares all five — canonical capabilityIds order, before footer.
    expect(selectProductSections({ templateId: 'vestria', ...opts })).toEqual([
      'header', 'hero', 'features', 'testimonials',
      'trust', 'industries', 'about', 'materials', 'process',
      'footer',
    ]);
    // meridian declares none of them ⇒ bare core.
    expect(selectProductSections({ templateId: 'meridian', ...opts })).toEqual(THING_CORE);
  });

  it('capability section already in the core never duplicates (grammar dedupe)', () => {
    const out = buildSectionList({
      engine: 'thing',
      requiredCapabilities: ['gallery'],
      capabilitySections: { gallery: 'features' }, // hypothetical core-evidenced cap
    });
    expect(out).toEqual(THING_CORE);
  });

  it('structural capability (multipage) contributes no section (no capabilitySections entry)', () => {
    // INTENT: multipage is a STRUCTURAL capability — it drives page machinery,
    // not any section, so it has no capabilitySections entry and never adds a
    // section to the list. Assert that directly by forcing the requirement.
    expect(
      selectProductSections({ templateId: 'vestria', requiredCapabilities: ['multipage'] })
    ).toEqual(THING_CORE);
  });

  it('serve-gate-v2: inferred structure.mode=multi NO LONGER emits multipage from requiredCapabilitiesFromBrief', () => {
    // The brief-level derivation dropped inferred-multi → multipage (it is a
    // soft signal that must never reject). So an inferred-multi brief adds no
    // section either (it never even reaches the structural cap here). The
    // USER-CONFIRMED 7b path (requiredCapabilitiesFromStructure) is where
    // multipage still hardens — covered in fit.test.ts.
    const brief: Brief = {
      copyEngine: 'thing',
      structure: { mode: 'multi', pages: ['home'] },
    };
    expect(requiredCapabilitiesFromBrief(brief)).not.toContain('multipage');
    expect(selectProductSections({ templateId: 'vestria', brief })).toEqual(THING_CORE);
  });
});

describe('explicit-trigger discipline — the 5 new ids are NEVER auto-inferred', () => {
  // requiredCapabilitiesFromBrief's only sources (serve-gate-v2): businessType
  // entry caps, mechanism M1 (→ lead-form), intent download-app (→ store-badges).
  // The inferred structure.mode==='multi' → multipage derivation was DELETED
  // (soft signal). Exercise the maximal derivation for every businessType and
  // assert none of the 5 explicit-trigger ids leak.
  for (const businessType of businessTypeKeys) {
    it(`${businessType} + M1 + download-app + multi derives none of trust/industries/about/materials/process`, () => {
      const brief: Brief = {
        businessType,
        copyEngine: 'thing',
        goal: { intent: 'download-app', mechanism: 'M1' },
        structure: { mode: 'multi', pages: ['home'] },
      };
      const derived = requiredCapabilitiesFromBrief(brief);
      for (const cap of EXPLICIT_TRIGGER_CAPABILITIES) {
        expect(derived, `"${cap}" must be explicit-trigger only`).not.toContain(cap);
      }
    });
  }

  it('no businessType entry declares an explicit-trigger capability as required', () => {
    for (const businessType of businessTypeKeys) {
      const brief: Brief = { businessType, copyEngine: 'thing' };
      const derived = requiredCapabilitiesFromBrief(brief);
      for (const cap of EXPLICIT_TRIGGER_CAPABILITIES) {
        expect(derived).not.toContain(cap);
      }
    }
  });
});

// ─── Phase-9 acceptance fixture: page removed at the 7b gate ⇒ NO copy for it
//
// Vestria multipage: the structure gate hands the CONFIRMED sitemap to the
// generation adapter; the fan-out (restored phase 3) iterates that sitemap and
// nothing else. Removing a page at the gate must therefore produce ZERO copy
// calls for it — no charge, no stored content. This drives runThingGeneration
// end-to-end with a mocked fetch and asserts exactly one copy call per
// SURVIVING page and none carrying the removed page's section.
describe('acceptance (phase 9) — vestria multipage: page removed at the gate gets NO copy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const STRATEGY: ProductStrategyOutput = {
    awareness: 'solution-aware-skeptical',
    oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
    oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
    featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
    sections: ['header', 'hero', 'features', 'testimonials', 'footer'],
    uiblocks: {
      header: 'VestriaHeader',
      hero: 'VestriaHero',
      features: 'VestriaFeatures',
      testimonials: 'VestriaTestimonials',
      footer: 'VestriaFooter',
    },
  };

  function input(): ThingGenerationInput {
    return {
      tokenId: 'tok-gate',
      templateId: 'vestria',
      productName: 'Acme Fabrication',
      oneLiner: 'Precision metal parts, made to spec.',
      features: ['CNC machining', 'Finishing'],
      audiences: ['OEM buyers'],
      categories: [],
      offer: 'Request a quote',
      goalIntent: null,
      goalParam: {},
      strategy: STRATEGY,
      // The AI proposed home + about + contact; the user REMOVED contact at
      // the 7b gate — the confirmed sitemap carries only the survivors.
      sitemap: [
        { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'features'] },
        { archetypeKey: 'about', title: 'About', pathSlug: '/about', sections: ['about'] },
      ] as any,
    };
  }

  it('fan-out fires exactly one copy call per surviving page; the removed page (and its section) never generates', async () => {
    const copyCalls: Array<{ uiblocks: Record<string, string> }> = [];
    const urls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: any) => {
        urls.push(url);
        const body = init?.body ? JSON.parse(init.body) : undefined;
        if (url.includes('/api/loadDraft')) return { ok: true, json: async () => ({}) } as any;
        if (url.includes('/api/audience/product/generate-copy')) {
          copyCalls.push({ uiblocks: body.uiblocks });
          return {
            ok: true,
            json: async () => ({
              success: true,
              sections: { hero: { elements: { headline: 'H' } } },
            }),
          } as any;
        }
        if (url.includes('/api/saveDraft')) return { ok: true, json: async () => ({}) } as any;
        return { ok: false, status: 500, json: async () => ({ error: 'unexpected' }) } as any;
      })
    );

    const result = await runThingGeneration(input());
    expect(result.status).toBe('done');

    // One copy call per SURVIVING sitemap page — the removed page got none.
    expect(copyCalls).toHaveLength(2);
    // The removed page's section never appears in any copy request.
    for (const call of copyCalls) {
      expect(Object.keys(call.uiblocks)).not.toContain('contact');
    }
    // Strategy came from the gate — zero refetch (charge-once holds through removal).
    expect(urls.some((u) => u.includes('/api/audience/product/strategy'))).toBe(false);
  });
});
