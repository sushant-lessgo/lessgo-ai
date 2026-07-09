// src/modules/templates/swap.test.ts
// scale-07 phase 7 — post-generation template swap (golden-style).
//
// The swap safety contract:
// 1. ZERO SECTION LOSS — a template appears in the swap shortlist ONLY if it
//    can render every section the site currently has (engine core ∪ its
//    declared capabilitySections). The swap patch never touches `sections`.
// 2. ZERO WORD CHANGE — the swap patch is EXACTLY {templateId, variantId,
//    paletteId}; content is byte-identical before/after.
// 3. SAME ENGINE ONLY — a different-engine candidate never appears (engine =
//    copy shape; swap never crosses engines).
// 4. ONLY ELIGIBLE — a candidate missing a capability block for a section the
//    site has (e.g. site has `catalog`, meridian has no catalog block) is
//    ABSENT. Retired (techpremium) and bespoke (lumen) never appear.
//
// Pure helpers under test live in TemplateSwapList.tsx (deriveSwapSite /
// swapShortlist / buildSwapPatch) — the same functions both popovers use.

import { describe, it, expect } from 'vitest';
import {
  deriveSwapSite,
  swapShortlist,
  buildSwapPatch,
  type SwapSite,
} from '@/app/edit/[token]/components/ui/TemplateSwapList';
import { engineCoreSections } from '@/modules/engines/coreSections';
import type { TemplateId } from '@/types/service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Converged thing-engine single-page fixture (phase-2 engine core). */
const CONVERGED_SECTION_IDS = [
  'header-a1b2c3d4',
  'hero-e5f6a7b8',
  'features-c9d0e1f2',
  'testimonials-a3b4c5d6',
  'footer-e7f8a9b0',
];

/** Frozen content fixture — the words that must NOT change across a swap. */
const CONVERGED_CONTENT = {
  'hero-e5f6a7b8': {
    layout: 'MeridianHero',
    elements: {
      headline: { content: 'Precision parts, shipped in days', type: 'headline' },
      subheadline: { content: 'CNC machining for teams that cannot wait', type: 'subheadline' },
      cta_text: { content: 'Request a quote', type: 'button' },
    },
  },
  'features-c9d0e1f2': {
    layout: 'MeridianFeatures',
    elements: {
      titles: { content: ['Tolerance to ±0.005mm', 'ISO 9001', '48h quoting'], type: 'list' },
    },
  },
  'testimonials-a3b4c5d6': {
    layout: 'MeridianTestimonials',
    elements: {
      quotes: { content: ['They saved our launch window.'], type: 'list' },
    },
  },
} as const;

/** A project meta+content snapshot, the shape a swap operates over. */
interface ProjectSnapshot {
  templateId: TemplateId;
  variantId: string;
  paletteId: string;
  sections: string[];
  content: typeof CONVERGED_CONTENT;
}

const meridianProject: ProjectSnapshot = {
  templateId: 'meridian',
  variantId: 'developer',
  paletteId: 'mint',
  sections: [...CONVERGED_SECTION_IDS],
  content: CONVERGED_CONTENT,
};

// Module stubs carrying only what buildSwapPatch reads (defaults). Real values
// mirror the template modules' defaults; the swap contract only requires that
// the INCOMING template's defaults are used, never the outgoing ids.
const vestriaModule = { defaultVariantId: 'tailored', defaultPaletteId: 'cobalt' };
const meridianModule = { defaultVariantId: 'developer', defaultPaletteId: 'mint' };

const countWords = (o: unknown) =>
  (JSON.stringify(o).match(/[A-Za-z0-9ऀ-ॿ]+/g) ?? []).length;

// ---------------------------------------------------------------------------
// deriveSwapSite
// ---------------------------------------------------------------------------

describe('deriveSwapSite — store layout → site facts', () => {
  it('extracts deduped section TYPES from ${type}-${uuid} ids', () => {
    const site = deriveSwapSite(CONVERGED_SECTION_IDS, undefined);
    expect([...site.sectionTypes].sort()).toEqual(
      ['features', 'footer', 'header', 'hero', 'testimonials'].sort()
    );
    expect(site.multipage).toBe(false);
  });

  it('unions every page slice and flags multipage when >1 page', () => {
    const site = deriveSwapSite(
      ['header-x1', 'hero-x2'],
      {
        home: { sections: ['hero-x2', 'catalog-x3'] },
        products: { sections: ['catalog-x3', 'contact-x4'] },
      }
    );
    expect([...site.sectionTypes].sort()).toEqual(
      ['catalog', 'contact', 'header', 'hero'].sort()
    );
    expect(site.multipage).toBe(true);
  });

  it('single stored page (home only) is not multipage', () => {
    const site = deriveSwapSite(['hero-x1'], { home: { sections: ['hero-x1'] } });
    expect(site.multipage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Shortlist — same-engine + only-eligible
// ---------------------------------------------------------------------------

describe('swapShortlist — fit-filtered targets', () => {
  const convergedSite = deriveSwapSite(CONVERGED_SECTION_IDS, undefined);

  it('converged meridian site → meridian + vestria (both render every section)', () => {
    expect(swapShortlist('meridian', convergedSite)).toEqual(['meridian', 'vestria']);
  });

  it('CROSS-ENGINE templates are ABSENT (trust/work never offered on a thing site)', () => {
    const list = swapShortlist('meridian', convergedSite);
    for (const foreign of ['hearth', 'lex', 'surge', 'granth', 'lumen'] as const) {
      expect(list).not.toContain(foreign);
    }
  });

  it('retired (techpremium) + bespoke (lumen) are ABSENT everywhere', () => {
    expect(swapShortlist('meridian', convergedSite)).not.toContain('techpremium');
    const trustSite: SwapSite = {
      sectionTypes: [...engineCoreSections.trust],
      multipage: false,
    };
    const trustList = swapShortlist('hearth', trustSite);
    expect(trustList).not.toContain('lumen');
    expect(trustList).not.toContain('techpremium');
  });

  it('retired current template (techpremium, no engine) yields an empty list', () => {
    expect(swapShortlist('techpremium', convergedSite)).toEqual([]);
  });

  it('INELIGIBLE excluded: site has `catalog` → meridian ABSENT (no catalog block)', () => {
    const vestriaSite = deriveSwapSite(
      [...CONVERGED_SECTION_IDS, 'catalog-b1c2d3e4', 'contact-f5a6b7c8'],
      undefined
    );
    const list = swapShortlist('vestria', vestriaSite);
    expect(list).toContain('vestria');
    expect(list).not.toContain('meridian');
  });

  it('INELIGIBLE excluded: multipage site → meridian ABSENT (no multipage capability)', () => {
    const multiSite: SwapSite = {
      sectionTypes: [...engineCoreSections.thing],
      multipage: true,
    };
    const list = swapShortlist('vestria', multiSite);
    expect(list).toEqual(['vestria']);
  });

  it('INELIGIBLE excluded: meridian site with cta/pricing → vestria ABSENT (no cta/pricing blocks)', () => {
    // Meridian's lead-form/packages evidence sections are `cta`/`pricing`;
    // vestria's are `contact`/`catalog`. Vestria owns the capabilities but NOT
    // meridian's section types — a swap would drop rendered sections, so it
    // must be excluded. Safety over availability.
    const meridianFullSite = deriveSwapSite(
      [...CONVERGED_SECTION_IDS, 'cta-a0b1c2d3', 'pricing-d4e5f6a7'],
      undefined
    );
    expect(swapShortlist('meridian', meridianFullSite)).toEqual(['meridian']);
  });

  it('unknown/legacy section type conservatively excludes every candidate', () => {
    const weirdSite = deriveSwapSite([...CONVERGED_SECTION_IDS, 'problem-99aa88bb'], undefined);
    expect(swapShortlist('meridian', weirdSite)).toEqual([]);
  });

  it('trust core site → hearth/lex/surge all offered (existing service swap preserved)', () => {
    const trustSite: SwapSite = {
      sectionTypes: [...engineCoreSections.trust],
      multipage: false,
    };
    expect(swapShortlist('hearth', trustSite)).toEqual(['hearth', 'lex', 'surge']);
  });

  it('surge site with surge-only sections (logos/casestudies) → hearth/lex ABSENT', () => {
    const surgeSite: SwapSite = {
      sectionTypes: [...engineCoreSections.trust, 'logos', 'about', 'casestudies', 'stats'],
      multipage: false,
    };
    const list = swapShortlist('surge', surgeSite);
    expect(list).not.toContain('hearth');
    expect(list).not.toContain('lex');
  });
});

// ---------------------------------------------------------------------------
// Swap — zero section loss, zero word change, default variant/palette
// ---------------------------------------------------------------------------

describe('swap meridian↔vestria — golden zero-loss/zero-change', () => {
  const site = deriveSwapSite(meridianProject.sections, undefined);

  it('vestria is an eligible target for the converged meridian fixture', () => {
    expect(swapShortlist('meridian', site)).toContain('vestria');
  });

  it('the swap patch is EXACTLY {templateId, variantId, paletteId}', () => {
    const patch = buildSwapPatch('vestria', vestriaModule);
    expect(Object.keys(patch).sort()).toEqual(['paletteId', 'templateId', 'variantId']);
    expect(patch).toEqual({
      templateId: 'vestria',
      variantId: 'tailored',
      paletteId: 'cobalt',
    });
  });

  it('swap uses the INCOMING template defaults, never the outgoing variant/palette', () => {
    const patch = buildSwapPatch('vestria', vestriaModule);
    expect(patch.variantId).not.toBe(meridianProject.variantId);
    expect(patch.paletteId).not.toBe(meridianProject.paletteId);
    expect(patch.variantId).toBe(vestriaModule.defaultVariantId);
    expect(patch.paletteId).toBe(vestriaModule.defaultPaletteId);
  });

  it('meridian → vestria: zero sections lost, zero words changed', () => {
    const before = structuredClone(meridianProject);
    const after: ProjectSnapshot = { ...before, ...buildSwapPatch('vestria', vestriaModule) };

    expect(after.sections).toEqual(meridianProject.sections); // zero section loss
    expect(after.content).toEqual(meridianProject.content); // zero word change (deep)
    expect(countWords(after.content)).toBe(countWords(meridianProject.content));
    expect(after.templateId).toBe('vestria');
  });

  it('round-trip meridian → vestria → meridian restores meta, content untouched throughout', () => {
    const original = structuredClone(meridianProject);
    const onVestria: ProjectSnapshot = {
      ...original,
      ...buildSwapPatch('vestria', vestriaModule),
    };
    // vestria site is the SAME sections — meridian must still be eligible back.
    expect(swapShortlist('vestria', deriveSwapSite(onVestria.sections, undefined))).toContain(
      'meridian'
    );
    const back: ProjectSnapshot = { ...onVestria, ...buildSwapPatch('meridian', meridianModule) };

    expect(back.templateId).toBe('meridian');
    expect(back.variantId).toBe(meridianModule.defaultVariantId);
    expect(back.paletteId).toBe(meridianModule.defaultPaletteId);
    expect(back.sections).toEqual(meridianProject.sections);
    expect(back.content).toEqual(meridianProject.content);
    expect(countWords(back.content)).toBe(countWords(meridianProject.content));
  });
});
