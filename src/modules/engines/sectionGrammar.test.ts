// src/modules/engines/sectionGrammar.test.ts
// scale-07 phase 1 — equivalence matrix: the grammar-backed selectors must
// return BYTE-IDENTICAL output to the pre-grammar implementations for every
// input combination. The pre-grammar behavior is captured here as a FROZEN
// reference implementation (verbatim copy of the old selector logic + ordering
// maps as of the phase-1 rewire) plus literal anchor fixtures that pin the
// reference itself. If any of these go red, the rewire changed behavior — fix
// the rewire, not this file.

import { describe, it, expect } from 'vitest';
import { selectServiceSections } from '@/modules/audience/service/sectionSelection';
import type { ServicePresentationFormat } from '@/modules/audience/service/sectionSelection';
import { serviceAwarenessStates } from '@/types/service';
import type { ServiceAwareness, ServiceAssetInput } from '@/types/service';

// NOTE (scale-07 phase 2): the product pilot-list equivalence coverage that
// lived here died with MERIDIAN_PILOT_SECTIONS / VESTRIA_PILOT_SECTIONS and
// the grammar's `extras` escape hatch. Product section selection is now
// covered by structureConvergence.test.ts (engine core + capability sections).
// The service (trust) equivalence matrix below is unchanged — phase 2 does not
// touch trust ordering/gating behavior.

// ---------------------------------------------------------------------------
// FROZEN reference — verbatim capture of selectServiceSections before the
// grammar rewire (sectionSelection.ts @ scale-06 merge). Do not update.
// ---------------------------------------------------------------------------

const REF_AWARENESS_MIDDLE_ORDER: Record<ServiceAwareness, string[]> = {
  'search-aware-comparing': ['hero', 'services', 'testimonials', 'packages', 'cta'],
  'search-aware-cold':      ['hero', 'testimonials', 'services', 'packages', 'cta'],
  'referral-driven':        ['hero', 'services', 'packages', 'testimonials', 'cta'],
  'relationship-warming':   ['hero', 'packages', 'services', 'testimonials', 'cta'],
};

const REF_SURGE_MIDDLE_ORDER: Record<ServiceAwareness, string[]> = {
  'search-aware-comparing': ['hero', 'logos', 'about', 'services', 'casestudies', 'stats', 'testimonials', 'packages', 'cta'],
  'search-aware-cold':      ['hero', 'logos', 'casestudies', 'about', 'services', 'stats', 'testimonials', 'packages', 'cta'],
  'referral-driven':        ['hero', 'logos', 'about', 'services', 'packages', 'casestudies', 'stats', 'testimonials', 'cta'],
  'relationship-warming':   ['hero', 'about', 'logos', 'packages', 'services', 'casestudies', 'stats', 'testimonials', 'cta'],
};

function referenceSelectServiceSections(input: {
  awareness: ServiceAwareness;
  assets: ServiceAssetInput;
  format?: ServicePresentationFormat;
  templateId?: string | null;
}): string[] {
  const { awareness, assets, format, templateId } = input;
  const isSurge = templateId === 'surge';
  const orderMap = isSurge ? REF_SURGE_MIDDLE_ORDER : REF_AWARENESS_MIDDLE_ORDER;
  const middle = orderMap[awareness] ?? orderMap['search-aware-comparing'];
  const showPackages = format !== 'quote-only';
  const body = middle.filter((sectionType) => {
    if (sectionType === 'testimonials') return assets.hasTestimonials;
    if (sectionType === 'packages') return showPackages;
    if (sectionType === 'logos') return assets.hasClientLogos;
    if (sectionType === 'casestudies') return assets.hasCaseStudies;
    return true;
  });
  return ['header', ...body, 'footer'];
}

function makeAssets(overrides: Partial<ServiceAssetInput> = {}): ServiceAssetInput {
  return {
    hasTestimonials: false,
    hasClientLogos: false,
    hasOutcomes: false,
    hasCaseStudies: false,
    hasTeamPhotos: false,
    hasFounderPhoto: false,
    testimonialType: null,
    ...overrides,
  };
}

const BOOLS = [true, false] as const;
const FORMATS: Array<ServicePresentationFormat | undefined> = ['quote-only', 'packages'];

// ---------------------------------------------------------------------------
// Literal anchors — hard-coded expected lists pinning the reference impl
// itself (so a bad copy of the old logic can't self-validate).
// ---------------------------------------------------------------------------

describe('sectionGrammar equivalence — literal anchors', () => {
  it('trust baseline (comparing, all assets, packages format)', () => {
    expect(
      selectServiceSections({
        awareness: 'search-aware-comparing',
        goal: 'book-call',
        assets: makeAssets({ hasTestimonials: true }),
      })
    ).toEqual(['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer']);
  });

  it('trust: no testimonials + quote-only drops both optionals', () => {
    expect(
      selectServiceSections({
        awareness: 'search-aware-comparing',
        goal: 'book-call',
        assets: makeAssets(),
        format: 'quote-only',
      })
    ).toEqual(['header', 'hero', 'services', 'cta', 'footer']);
  });

  it('trust cold: testimonials lead when present', () => {
    expect(
      selectServiceSections({
        awareness: 'search-aware-cold',
        goal: 'book-call',
        assets: makeAssets({ hasTestimonials: true }),
      })
    ).toEqual(['header', 'hero', 'testimonials', 'services', 'packages', 'cta', 'footer']);
  });

  it('surge all-on (comparing) — full 11-section order', () => {
    expect(
      selectServiceSections({
        awareness: 'search-aware-comparing',
        goal: 'book-call',
        assets: makeAssets({ hasTestimonials: true, hasClientLogos: true, hasCaseStudies: true }),
        templateId: 'surge',
      })
    ).toEqual([
      'header', 'hero', 'logos', 'about', 'services', 'casestudies', 'stats',
      'testimonials', 'packages', 'cta', 'footer',
    ]);
  });

  it('surge nothing-on quote-only keeps identity-core about/stats', () => {
    expect(
      selectServiceSections({
        awareness: 'referral-driven',
        goal: 'book-call',
        assets: makeAssets(),
        format: 'quote-only',
        templateId: 'surge',
      })
    ).toEqual(['header', 'hero', 'about', 'services', 'stats', 'cta', 'footer']);
  });

});

// ---------------------------------------------------------------------------
// Exhaustive matrix — trust default (hearth/lex/undefined)
// 4 awareness × hasTestimonials × format(quote-only|not) = 16, ×3 templateIds
// ---------------------------------------------------------------------------

describe('sectionGrammar equivalence — trust default matrix (hearth/lex)', () => {
  const templateIds = [undefined, 'hearth', 'lex'] as const;
  for (const templateId of templateIds) {
    for (const awareness of serviceAwarenessStates) {
      for (const hasTestimonials of BOOLS) {
        for (const format of FORMATS) {
          it(`${templateId ?? 'no-template'} / ${awareness} / testimonials=${hasTestimonials} / format=${format}`, () => {
            const assets = makeAssets({ hasTestimonials });
            const expected = referenceSelectServiceSections({ awareness, assets, format, templateId });
            const actual = selectServiceSections({
              awareness,
              goal: 'book-call',
              assets,
              format,
              templateId: templateId as never,
            });
            expect(actual).toEqual(expected);
          });
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Exhaustive matrix — SURGE branch
// 4 awareness × logos × casestudies × testimonials × format = 64
// ---------------------------------------------------------------------------

describe('sectionGrammar equivalence — surge matrix', () => {
  for (const awareness of serviceAwarenessStates) {
    for (const hasClientLogos of BOOLS) {
      for (const hasCaseStudies of BOOLS) {
        for (const hasTestimonials of BOOLS) {
          for (const format of FORMATS) {
            it(`${awareness} / logos=${hasClientLogos} / cases=${hasCaseStudies} / testimonials=${hasTestimonials} / format=${format}`, () => {
              const assets = makeAssets({ hasTestimonials, hasClientLogos, hasCaseStudies });
              const expected = referenceSelectServiceSections({
                awareness, assets, format, templateId: 'surge',
              });
              const actual = selectServiceSections({
                awareness,
                goal: 'book-call',
                assets,
                format,
                templateId: 'surge',
              });
              expect(actual).toEqual(expected);

              // Gating law survives verbatim:
              expect(actual.includes('logos')).toBe(hasClientLogos);
              expect(actual.includes('casestudies')).toBe(hasCaseStudies);
              expect(actual.includes('testimonials')).toBe(hasTestimonials);
              expect(actual.includes('packages')).toBe(format !== 'quote-only');
              // Identity-core sections are always on for surge:
              expect(actual).toContain('about');
              expect(actual).toContain('stats');
            });
          }
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Awareness fallback (out-of-range value ⇒ comparing order), preserved from
// the old `orderMap[awareness] ?? orderMap['search-aware-comparing']`.
// ---------------------------------------------------------------------------

describe('sectionGrammar equivalence — awareness fallback', () => {
  it('unknown awareness falls back to search-aware-comparing order', () => {
    const assets = makeAssets({ hasTestimonials: true });
    const out = selectServiceSections({
      awareness: 'not-a-state' as ServiceAwareness,
      goal: 'book-call',
      assets,
    });
    expect(out).toEqual(['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer']);
  });
});
