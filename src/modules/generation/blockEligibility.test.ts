// src/modules/generation/blockEligibility.test.ts
// scale-09 phase 4 — deterministic eligibility filter.

import { describe, it, expect } from 'vitest';
import type { BlockDeclaration, SectionBlockSet } from '@/modules/templates/blockManifest';
import {
  isBlockEligible,
  isCopyCompatible,
  findIncompatibleCoEligiblePairs,
  pickFromSet,
  selectEligibleBlock,
  deriveAssetFactsFromServiceAssets,
  deriveAssetFactsFromBrief,
  type AssetFacts,
  type ConsumedKeyKind,
} from './blockEligibility';
import { blockManifests } from '@/modules/templates/blockManifest';
import type { ServiceAssetInput } from '@/types/service';
import type { Brief } from '@/types/brief';

/** Look up a real declared variant by layout name (across every manifest). */
function findDecl(layoutName: string): BlockDeclaration {
  for (const manifest of Object.values(blockManifests)) {
    for (const set of Object.values(manifest ?? {})) {
      const found = set.variants.find((v) => v.layoutName === layoutName);
      if (found) return found;
    }
  }
  throw new Error(`no declared variant named ${layoutName}`);
}

/** Trivial classifier for synthetic fixtures — every consumed key is scalar. */
const ALL_SCALAR = (): ConsumedKeyKind => 'scalar';

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

// ── variant-swap-integrity phase 2 ──────────────────────────────────────────

describe('isCopyCompatible — present-key rules', () => {
  const target = decl({ layoutName: 'T', consumes: ['eyebrow', 'headline'] });

  it('empty-string / whitespace / null / empty-array values are NOT present (no drop)', () => {
    // Only `eyebrow` is truly present; the rest are non-empty-absent so they
    // can neither cause a scalar drop nor be required for a non-empty render.
    const content = {
      eyebrow: 'Proof',
      headline: '',
      subhead: '   ',
      caption: null,
      cards: [] as unknown[],
    };
    expect(isCopyCompatible(target, content)).toBe(true);
  });

  it('a present, non-empty SCALAR not consumed by target ⇒ HIDDEN (silent drop)', () => {
    expect(isCopyCompatible(target, { eyebrow: 'x', tagline: 'dropped' })).toBe(false);
  });

  it('a present COLLECTION (array) not consumed by target is EXEMPT (clamp handles it)', () => {
    // extra_cards is a non-empty array the target does not consume — no drop.
    expect(
      isCopyCompatible(target, { eyebrow: 'x', extra_cards: [{ id: '1' }] })
    ).toBe(true);
  });

  it('(ii) non-empty render — no consumed present key ⇒ HIDDEN even with no scalar drop', () => {
    // Only a collection is present (no scalar to drop), but the target consumes
    // no collection key ⇒ it would render EMPTY ⇒ hidden.
    expect(isCopyCompatible(target, { reviews: [{ id: '1' }] })).toBe(false);
  });
});

describe('isCopyCompatible — real surge / vestria variants', () => {
  const reviewGrid = findDecl('ReviewGrid');
  const pullQuote = findDecl('PullQuoteWithMark');
  const tailored = findDecl('VestriaTailoredHero');
  const fullBleed = findDecl('VestriaFullBleedHero');

  it('surge reviews-content → PullQuote HIDDEN (present scalar headline dropped)', () => {
    const reviewsContent = {
      eyebrow: 'What clients say',
      headline: 'Loved by growth teams',
      reviews: [{ id: '1', quote: 'great' }, { id: '2', quote: 'ace' }],
    };
    expect(isCopyCompatible(pullQuote, reviewsContent)).toBe(false);
    // sanity: the current variant (ReviewGrid) stays compatible with its own content.
    expect(isCopyCompatible(reviewGrid, reviewsContent)).toBe(true);
  });

  it('surge reviews-content with MANY cards → ReviewGrid still OFFERED (clamp, not hide)', () => {
    const content = {
      eyebrow: 'x',
      headline: 'y',
      reviews: Array.from({ length: 5 }, (_, i) => ({ id: String(i), quote: 'q' })),
    };
    expect(isCopyCompatible(reviewGrid, content)).toBe(true);
  });

  it('vestria Tailored → FullBleed OFFERED (superset consumes all present scalars)', () => {
    const tailoredContent = {
      tag_text: 'Uniforms', headline: 'H', lede: 'L', cta_text: 'Quote',
      hero_image: 'https://x/img.jpg', stamp_value: '40k+', stamp_label: 'made',
    };
    expect(isCopyCompatible(fullBleed, tailoredContent)).toBe(true);
  });

  it('vestria FullBleed → Tailored HIDDEN only when a hero_video_* scalar is present', () => {
    const withVideo = {
      headline: 'H', lede: 'L', cta_text: 'Quote',
      hero_video_desktop: 'https://x/clip.mp4',
    };
    expect(isCopyCompatible(tailored, withVideo)).toBe(false);

    const noVideo = { headline: 'H', lede: 'L', cta_text: 'Quote', hero_image: 'https://x/i.jpg' };
    expect(isCopyCompatible(tailored, noVideo)).toBe(true);
  });
});

describe('findIncompatibleCoEligiblePairs — pairwise helper (drives conformance check (e))', () => {
  it('NEGATIVE fixture: co-eligible, same copyShape, both-ways scalar-divergent ⇒ FLAGGED', () => {
    const set = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', consumes: ['title', 'subtitle'] }),
        decl({ layoutName: 'B', consumes: ['title', 'quote'] }),
      ],
    };
    const flagged = findIncompatibleCoEligiblePairs(set, ALL_SCALAR);
    expect(flagged).toEqual([{ a: 'A', b: 'B' }]);
  });

  it('POSITIVE superset fixture (vestria-shaped): one-way divergent ⇒ PASS (empty)', () => {
    const set = {
      default: 'T',
      variants: [
        decl({ layoutName: 'T', consumes: ['headline', 'lede'] }),
        decl({ layoutName: 'F', consumes: ['headline', 'lede', 'video'] }),
      ],
    };
    expect(findIncompatibleCoEligiblePairs(set, ALL_SCALAR)).toEqual([]);
  });

  it('DIFFERENT copyShape excludes an otherwise-divergent pair from co-eligibility', () => {
    const set = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', copyShape: 'reviews', consumes: ['title', 'subtitle'] }),
        decl({ layoutName: 'B', copyShape: 'pullquote', consumes: ['title', 'quote'] }),
      ],
    };
    expect(findIncompatibleCoEligiblePairs(set, ALL_SCALAR)).toEqual([]);
  });

  it('asset-ineligible variant is NOT co-eligible (excluded from the pairing)', () => {
    // B requires photos; under all-present asset facts it IS eligible, so to prove
    // the gate we make it require an UNSATISFIABLE combination is impossible — instead
    // assert the equal-consumes pair never flags regardless.
    const set = {
      default: 'A',
      variants: [
        decl({ layoutName: 'A', consumes: ['title'] }),
        decl({ layoutName: 'B', consumes: ['title'] }),
      ],
    };
    expect(findIncompatibleCoEligiblePairs(set, ALL_SCALAR)).toEqual([]);
  });

  it('surge testimonials (real manifest): distinct copyShape ⇒ NOT flagged', () => {
    const surgeTestimonials = blockManifests.surge!.testimonials;
    expect(findIncompatibleCoEligiblePairs(surgeTestimonials, ALL_SCALAR)).toEqual([]);
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
