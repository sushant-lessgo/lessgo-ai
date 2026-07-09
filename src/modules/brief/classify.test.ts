// src/modules/brief/classify.test.ts
// Phase-1 unit coverage: engine lookup (all 6 businessTypes), tiebreaker
// ladder (all 5 rungs), schema-safety for place/quick-yes (copyEngine must be
// OMITTED — BriefSchema would throw), correction path, low-confidence const.

import { describe, it, expect } from 'vitest';
import {
  LOW_CONFIDENCE_THRESHOLD,
  resolveEngine,
  buildBriefDraft,
  applyBusinessTypeCorrection,
  getEntryFacts,
  type EntrySignals,
} from './classify';
import { businessTypeKeys, businessTypes } from '@/modules/businessTypes/config';
import { getCollections } from '@/modules/brief/collections';

function makeSignals(overrides: Partial<EntrySignals> = {}): EntrySignals {
  return {
    businessTypeGuess: null,
    businessTypeConfidence: 0.9,
    category: null,
    goalIntentGuess: null,
    tiebreaker: 'none',
    structureHint: 'single',
    designStyleHint: null,
    platformNeeds: 'none',
    summary: 'A business.',
    businessName: 'Acme',
    offerings: [],
    audiences: [],
    categories: [],
    outcomes: [],
    deliveryModel: null,
    offer: '',
    oneLiner: 'We do things.',
    proofAvailable: [],
    socialProfiles: [],
    testimonials: [],
    ...overrides,
  };
}

describe('LOW_CONFIDENCE_THRESHOLD', () => {
  it('is 0.6', () => {
    expect(LOW_CONFIDENCE_THRESHOLD).toBe(0.6);
  });
});

describe('resolveEngine — lookup for all 6 businessTypes', () => {
  it.each(businessTypeKeys)('%s → config engine, source lookup', (key) => {
    const result = resolveEngine(makeSignals({ businessTypeGuess: key }));
    expect(result).toEqual({
      engine: businessTypes[key].copyEngine,
      source: 'lookup',
    });
  });
});

describe('resolveEngine — tiebreaker ladder (unknown type, all 5 rungs)', () => {
  const ladder = [
    ['expertise', 'trust'],
    ['portfolio-is-proof', 'work'],
    ['browsing-place', 'place'],
    ['offer-already-understood', 'quick-yes'],
    ['none', 'thing'],
  ] as const;

  // 'florist' is a deliberately UNKNOWN businessType (not a businessTypeKey) —
  // was 'photographer' until scale-08 phase 3 promoted photographer to a known
  // key; repointed so this still exercises the unknown-type tiebreaker ladder.
  it.each(ladder)('%s → %s, source tiebreaker', (rung, engine) => {
    const result = resolveEngine(
      makeSignals({ businessTypeGuess: 'florist', tiebreaker: rung })
    );
    expect(result).toEqual({ engine, source: 'tiebreaker' });
  });
});

describe('buildBriefDraft — schema safety for non-enum engines (D2)', () => {
  it('browsing-place (restaurant) parses CLEAN: copyEngine unset, resolvedEngine=place', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'restaurant', tiebreaker: 'browsing-place' }),
      'family restaurant in Pune, browse our menu'
    );
    expect(brief.copyEngine).toBeUndefined();
    const entry = getEntryFacts(brief);
    expect(entry?.resolvedEngine).toBe('place');
    expect(entry?.classificationSource).toBe('tiebreaker');
  });

  it('offer-already-understood parses CLEAN: copyEngine unset, resolvedEngine=quick-yes', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'tutor', tiebreaker: 'offer-already-understood' }),
      'math tuition, everyone knows what tuition is'
    );
    expect(brief.copyEngine).toBeUndefined();
    expect(getEntryFacts(brief)?.resolvedEngine).toBe('quick-yes');
  });
});

describe('buildBriefDraft — enum engines + carrier payload', () => {
  it('known agency: copyEngine set via lookup, facts.entry carries prefill + rawInput', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'agency',
        category: 'growth marketing agency',
        goalIntentGuess: 'book-call',
        designStyleHint: 'bold-performance',
        summary: 'Growth agency for SaaS.',
        businessName: 'GrowthCo',
        offerings: ['paid social'],
        audiences: ['SaaS founders'],
      }),
      'growth agency for SaaS'
    );
    expect(brief.businessType).toBe('agency');
    expect(brief.copyEngine).toBe('trust');
    // goal mechanism = primary (first) from goalIntentMeta
    expect(brief.goal).toEqual({ intent: 'book-call', mechanism: 'M1' });
    expect(brief.structure).toEqual({ mode: 'single', pages: [] });
    expect(brief.designStyleHint).toBe('bold-performance');
    const entry = getEntryFacts(brief);
    expect(entry?.rawInput).toBe('growth agency for SaaS');
    expect(entry?.resolvedEngine).toBe('trust');
    expect(entry?.classificationSource).toBe('lookup');
    expect(entry?.businessName).toBe('GrowthCo');
  });

  it('unknown florist via portfolio-is-proof: copyEngine=work IS set (enum member)', () => {
    // 'florist' = UNKNOWN businessType stand-in (was 'photographer' pre scale-08
    // phase 3, which is now a known key resolved via lookup, not tiebreaker).
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'florist', tiebreaker: 'portfolio-is-proof' }),
      'artisan florist studio'
    );
    expect(brief.businessType).toBe('florist');
    expect(brief.copyEngine).toBe('work');
    expect(getEntryFacts(brief)?.classificationSource).toBe('tiebreaker');
  });

  it('null guess omits businessType', () => {
    const brief = buildBriefDraft(makeSignals({ businessTypeGuess: null }), 'x');
    expect(brief.businessType).toBeUndefined();
  });
});

describe('buildBriefDraft — scrape-carried collections → facts.collections (scale-10 phase 2)', () => {
  it('writes entries VERBATIM with code-derived slugs', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'saas',
        collections: {
          products: [
            { name: 'Widget One', oneLiner: 'The first widget', imageUrl: 'https://x/1.png' },
            { name: 'Widget Two' },
          ],
        },
      }),
      'we sell widgets'
    );
    const cols = getCollections(brief);
    expect(cols.products).toHaveLength(2);
    expect(cols.products?.[0]).toEqual({
      name: 'Widget One',
      slug: 'widget-one', // code-derived via slugify, never from AI
      oneLiner: 'The first widget',
      imageUrl: 'https://x/1.png',
    });
    expect(cols.products?.[1]).toEqual({ name: 'Widget Two', slug: 'widget-two' });
  });

  it('DROPs empty collections — no entries ⇒ key absent', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', collections: { services: [], 'case-studies': [] } }),
      'a consultancy'
    );
    expect(getCollections(brief).services).toBeUndefined();
    expect(brief.facts?.collections).toBeUndefined();
  });

  it('no collections signal at all ⇒ facts.collections unset', () => {
    const brief = buildBriefDraft(makeSignals({ businessTypeGuess: 'saas' }), 'x');
    expect(brief.facts?.collections).toBeUndefined();
  });

  it('drops empty-name entries but keeps the rest', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'photographer',
        collections: { services: [{ name: 'Weddings' }, { name: '   ' }] },
      }),
      'wedding photographer'
    );
    expect(getCollections(brief).services).toEqual([{ name: 'Weddings', slug: 'weddings' }]);
  });
});

describe('applyBusinessTypeCorrection (D7 — the single correction path)', () => {
  it('collections persist through a businessType correction', () => {
    const draft = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'photographer',
        tiebreaker: 'portfolio-is-proof',
        collections: { services: [{ name: 'Weddings', oneLiner: 'Full-day coverage' }] },
      }),
      'wedding photographer'
    );
    const corrected = applyBusinessTypeCorrection(draft, 'coach');
    expect(corrected.businessType).toBe('coach');
    // entries survive the correction (correction changes type, not collections)
    expect(getCollections(corrected).services).toEqual([
      { name: 'Weddings', slug: 'weddings', oneLiner: 'Full-day coverage' },
    ]);
  });

  it('photographer→coach: resets classification state, no stale tiebreaker', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer'
    );
    const corrected = applyBusinessTypeCorrection(draft, 'coach');
    expect(corrected.businessType).toBe('coach');
    expect(corrected.copyEngine).toBe('trust');
    const entry = getEntryFacts(corrected);
    expect(entry?.classificationSource).toBe('lookup');
    expect(entry?.tiebreaker).toBe('none');
    expect(entry?.resolvedEngine).toBe('trust');
    // prefill payload survives the correction
    expect(entry?.rawInput).toBe('wedding photographer');
  });

  it('does not mutate the input draft', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer'
    );
    applyBusinessTypeCorrection(draft, 'coach');
    expect(draft.businessType).toBe('photographer');
    expect(getEntryFacts(draft)?.tiebreaker).toBe('portfolio-is-proof');
  });
});
