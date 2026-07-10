// src/modules/generation/blockEligibility.test.ts
// scale-09 phase 4 — deterministic eligibility filter.

import { describe, it, expect } from 'vitest';
import type { BlockDeclaration, SectionBlockSet } from '@/modules/templates/blockManifest';
import {
  isBlockEligible,
  pickFromSet,
  selectEligibleBlock,
  deriveAssetFactsFromServiceAssets,
  deriveAssetFactsFromBrief,
  type AssetFacts,
} from './blockEligibility';
import type { ServiceAssetInput } from '@/types/service';
import type { Brief } from '@/types/brief';

const NO_FACTS: AssetFacts = {
  hasPhotos: false,
  hasLogos: false,
  hasTestimonials: false,
  hasTestimonialPhotos: false,
};

function decl(overrides: Partial<BlockDeclaration>): BlockDeclaration {
  return { layoutName: 'X', label: 'X', consumes: [], ...overrides };
}

describe('isBlockEligible — capacity', () => {
  const capped = decl({ capacity: { minCards: 3, maxCards: 6 } });

  it('no capacity declared ⇒ always eligible', () => {
    expect(isBlockEligible(decl({}), { cardCountHint: 999 })).toBe(true);
  });

  it('no hint ⇒ eligible (capacity does not filter)', () => {
    expect(isBlockEligible(capped, {})).toBe(true);
  });

  it('hint inside [min,max] ⇒ eligible', () => {
    expect(isBlockEligible(capped, { cardCountHint: 3 })).toBe(true);
    expect(isBlockEligible(capped, { cardCountHint: 6 })).toBe(true);
  });

  it('hint below min ⇒ ineligible', () => {
    expect(isBlockEligible(capped, { cardCountHint: 2 })).toBe(false);
  });

  it('hint above max ⇒ ineligible', () => {
    expect(isBlockEligible(capped, { cardCountHint: 7 })).toBe(false);
  });
});

describe('isBlockEligible — assets (ACCEPTANCE: requiresAssets photos)', () => {
  const photoVariant = decl({ requiresAssets: ['photos'] });

  it('requiresAssets photos is ABSENT (ineligible) when hasPhotos=false', () => {
    expect(isBlockEligible(photoVariant, { assetFacts: { ...NO_FACTS, hasPhotos: false } })).toBe(false);
  });

  it('requiresAssets photos is PRESENT (eligible) when hasPhotos=true', () => {
    expect(isBlockEligible(photoVariant, { assetFacts: { ...NO_FACTS, hasPhotos: true } })).toBe(true);
  });

  it('absent assetFacts ⇒ asset requirement UNMET (conservative)', () => {
    expect(isBlockEligible(photoVariant, {})).toBe(false);
  });

  it('multiple required kinds ⇒ all must be true', () => {
    const v = decl({ requiresAssets: ['photos', 'logos'] });
    expect(isBlockEligible(v, { assetFacts: { ...NO_FACTS, hasPhotos: true } })).toBe(false);
    expect(isBlockEligible(v, { assetFacts: { ...NO_FACTS, hasPhotos: true, hasLogos: true } })).toBe(true);
  });

  it('no requiresAssets ⇒ eligible regardless of facts', () => {
    expect(isBlockEligible(decl({}), { assetFacts: NO_FACTS })).toBe(true);
  });
});

describe('pickFromSet — fallback order', () => {
  it('no-hint ⇒ default', () => {
    const set: SectionBlockSet = {
      default: 'A',
      variants: [decl({ layoutName: 'A' }), decl({ layoutName: 'B' })],
    };
    expect(pickFromSet(set, {})).toBe('A');
  });

  it('default eligible ⇒ default even when a later variant also eligible', () => {
    const set: SectionBlockSet = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', capacity: { minCards: 1, maxCards: 5 } }),
        decl({ layoutName: 'B' }),
      ],
    };
    expect(pickFromSet(set, { cardCountHint: 3 })).toBe('A');
  });

  it('default ineligible ⇒ first eligible in declaration order', () => {
    const set: SectionBlockSet = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', capacity: { minCards: 1, maxCards: 2 } }),
        decl({ layoutName: 'B', capacity: { minCards: 3, maxCards: 9 } }),
        decl({ layoutName: 'C', capacity: { minCards: 3, maxCards: 9 } }),
      ],
    };
    expect(pickFromSet(set, { cardCountHint: 5 })).toBe('B');
  });

  it('nothing eligible ⇒ default (never fail)', () => {
    const set: SectionBlockSet = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', requiresAssets: ['photos'] }),
        decl({ layoutName: 'B', requiresAssets: ['logos'] }),
      ],
    };
    expect(pickFromSet(set, { assetFacts: NO_FACTS })).toBe('A');
  });
});

describe('selectEligibleBlock — manifest-driven', () => {
  it('unknown (template, section) ⇒ null (legacy fallback)', () => {
    expect(selectEligibleBlock('lex', 'hero')).toBeNull();
    expect(selectEligibleBlock(null, 'hero')).toBeNull();
    expect(selectEligibleBlock('meridian', 'no-such-section')).toBeNull();
  });

  it('no-hint ⇒ declared default (existing single-variant sections)', () => {
    expect(selectEligibleBlock('meridian', 'features')).toBe('HairlineFeatureGrid');
    expect(selectEligibleBlock('meridian', 'hero')).toBe('TerminalHero');
    expect(selectEligibleBlock('hearth', 'testimonials')).toBe('PullQuoteWithMark');
    expect(selectEligibleBlock('surge', 'testimonials')).toBe('ReviewGrid');
    expect(selectEligibleBlock('vestria', 'hero')).toBe('VestriaTailoredHero');
  });

  it('capacity out-of-range on a single-variant section ⇒ still the default', () => {
    // meridian features capacity {3,9}; a hint of 50 leaves the default ineligible
    // but there is no other variant, so the never-fail fallback returns default.
    expect(selectEligibleBlock('meridian', 'features', { cardCountHint: 50 })).toBe('HairlineFeatureGrid');
    expect(selectEligibleBlock('meridian', 'features', { cardCountHint: 1 })).toBe('HairlineFeatureGrid');
  });

  it('surge testimonials is deterministic across hints (default ReviewGrid)', () => {
    for (const hint of [undefined, 1, 2, 3, 10]) {
      expect(selectEligibleBlock('surge', 'testimonials', { cardCountHint: hint })).toBe('ReviewGrid');
    }
  });
});

describe('deriveAssetFactsFromServiceAssets', () => {
  const base: ServiceAssetInput = {
    hasTestimonials: false,
    hasClientLogos: false,
    hasOutcomes: false,
    hasCaseStudies: false,
    hasTeamPhotos: false,
    hasFounderPhoto: false,
    testimonialType: null,
  };

  it('maps typed service booleans', () => {
    expect(
      deriveAssetFactsFromServiceAssets({
        ...base,
        hasTestimonials: true,
        hasClientLogos: true,
        hasTeamPhotos: true,
        testimonialType: 'photos',
      })
    ).toEqual({ hasPhotos: true, hasLogos: true, hasTestimonials: true, hasTestimonialPhotos: true });
  });

  it('hasPhotos from founder OR team photos', () => {
    expect(deriveAssetFactsFromServiceAssets({ ...base, hasFounderPhoto: true }).hasPhotos).toBe(true);
    expect(deriveAssetFactsFromServiceAssets(base).hasPhotos).toBe(false);
  });

  it('hasTestimonialPhotos only when testimonialType is photos', () => {
    expect(
      deriveAssetFactsFromServiceAssets({ ...base, hasTestimonials: true, testimonialType: 'text' })
        .hasTestimonialPhotos
    ).toBe(false);
  });
});

describe('deriveAssetFactsFromBrief', () => {
  it('reads proofAvailable capability hints (photos/logos), but NOT testimonials-as-content', () => {
    // proofAvailable is a capability-hint list — logos/photos are layout hints
    // (leave alone), but 'testimonials' capability must NOT flip hasTestimonials.
    const brief: Brief = { proofAvailable: ['testimonials', 'client logos'] };
    const facts = deriveAssetFactsFromBrief(brief);
    expect(facts.hasTestimonials).toBe(false); // capability ≠ content
    expect(facts.hasLogos).toBe(true);
    expect(facts.hasPhotos).toBe(false);
  });

  it('empty / undefined brief ⇒ all false', () => {
    expect(deriveAssetFactsFromBrief(undefined)).toEqual(NO_FACTS);
    expect(deriveAssetFactsFromBrief({})).toEqual(NO_FACTS);
  });

  it('facts.entry.testimonials satisfies hasTestimonials', () => {
    const brief = { facts: { entry: { testimonials: ['great work'] } } } as unknown as Brief;
    expect(deriveAssetFactsFromBrief(brief).hasTestimonials).toBe(true);
  });

  // ── capability ≠ content regression (proof-truth spec, acceptance criterion 3) ──
  it('proofAvailable testimonials capability with ZERO captured quotes ⇒ hasTestimonials false', () => {
    const brief = {
      proofAvailable: ['testimonials', 'case studies'],
      facts: { entry: { testimonials: [] } },
    } as unknown as Brief;
    expect(deriveAssetFactsFromBrief(brief).hasTestimonials).toBe(false);
  });

  it('2 verbatim captured testimonials ⇒ hasTestimonials true (real content wins)', () => {
    const brief = {
      proofAvailable: ['testimonials', 'case studies'],
      facts: { entry: { testimonials: ['loved it', 'best ever'] } },
    } as unknown as Brief;
    expect(deriveAssetFactsFromBrief(brief).hasTestimonials).toBe(true);
  });

  it('hasTestimonialPhotos requires REAL captured testimonials, not just the capability hint', () => {
    // capability hint only (testimonial + photo) but no captured quotes ⇒ false
    const capabilityOnly = {
      proofAvailable: ['testimonials', 'photos'],
      facts: { entry: { testimonials: [] } },
    } as unknown as Brief;
    expect(deriveAssetFactsFromBrief(capabilityOnly).hasTestimonialPhotos).toBe(false);

    // real captured testimonials + photo capability ⇒ true
    const realWithPhoto = {
      proofAvailable: ['testimonials', 'photos'],
      facts: { entry: { testimonials: ['great work'] } },
    } as unknown as Brief;
    expect(deriveAssetFactsFromBrief(realWithPhoto).hasTestimonialPhotos).toBe(true);
  });
});
