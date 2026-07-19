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
  applyEnginePick,
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

describe('resolveEngine — committed lookup', () => {
  const committedKeys = businessTypeKeys.filter(
    (k) => businessTypes[k].engineState === 'committed'
  );
  it.each(committedKeys)('%s → resolved via config lookup', (key) => {
    const entry = businessTypes[key];
    if (entry.engineState !== 'committed') throw new Error('fixture drift');
    expect(resolveEngine(makeSignals({ businessTypeGuess: key }))).toEqual({
      state: 'resolved',
      engine: entry.copyEngine,
      source: 'lookup',
    });
  });
});

describe('resolveEngine — ambiguous registry types → ask (D4)', () => {
  it('designer → ask {work,trust}, prior work, reason ambiguous-type', () => {
    expect(resolveEngine(makeSignals({ businessTypeGuess: 'designer' }))).toEqual({
      state: 'ask',
      candidates: ['work', 'trust'],
      prior: 'work',
      reason: 'ambiguous-type',
    });
  });

  it('agency → ask {trust,work}, prior trust, reason ambiguous-type', () => {
    expect(resolveEngine(makeSignals({ businessTypeGuess: 'agency' }))).toEqual({
      state: 'ask',
      candidates: ['trust', 'work'],
      prior: 'trust',
      reason: 'ambiguous-type',
    });
  });
});

describe('resolveEngine — unknown type tiebreaker ladder', () => {
  // Definite rungs still RESOLVE (preserves honest place/quick-yes → demand
  // routing at the serve gate). 'florist' = an UNKNOWN businessType stand-in.
  const definite = [
    ['expertise', 'trust'],
    ['portfolio-is-proof', 'work'],
    ['browsing-place', 'place'],
    ['offer-already-understood', 'quick-yes'],
  ] as const;

  it.each(definite)('%s → resolved %s, source tiebreaker', (rung, engine) => {
    expect(
      resolveEngine(makeSignals({ businessTypeGuess: 'florist', tiebreaker: rung }))
    ).toEqual({ state: 'resolved', engine, source: 'tiebreaker' });
  });

  it('none → ask (unknown-type) with tiebreaker prior thing — no silent thing collapse', () => {
    expect(
      resolveEngine(makeSignals({ businessTypeGuess: 'florist', tiebreaker: 'none' }))
    ).toEqual({ state: 'ask', candidates: [], prior: 'thing', reason: 'unknown-type' });
  });

  it('null guess + none → ask (unknown-type), same as an unrecognized label', () => {
    expect(
      resolveEngine(makeSignals({ businessTypeGuess: null, tiebreaker: 'none' }))
    ).toEqual({ state: 'ask', candidates: [], prior: 'thing', reason: 'unknown-type' });
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
  it('committed consultant: copyEngine set via lookup, facts.entry carries prefill + rawInput', () => {
    // (agency was the fixture here pre-engineDecider; it flipped to AMBIGUOUS, so
    // this "known lookup carries prefill" intent moves to a still-committed
    // trust type. Ambiguous agency coverage lives in the ambiguous block below.)
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'consultant',
        category: 'pricing consultancy',
        goalIntentGuess: 'book-call',
        designStyleHint: 'authority-professional',
        summary: 'Pricing consultant for SaaS.',
        businessName: 'GrowthCo',
        offerings: ['pricing audits'],
        audiences: ['SaaS founders'],
      }),
      'pricing consultant for SaaS'
    );
    expect(brief.businessType).toBe('consultant');
    expect(brief.copyEngine).toBe('trust');
    // goal mechanism = primary (first) from goalIntentMeta
    expect(brief.goal).toEqual({ intent: 'book-call', mechanism: 'M1' });
    expect(brief.structure).toEqual({ mode: 'single', pages: [] });
    expect(brief.designStyleHint).toBe('authority-professional');
    const entry = getEntryFacts(brief);
    expect(entry?.rawInput).toBe('pricing consultant for SaaS');
    expect(entry?.resolvedEngine).toBe('trust');
    expect(entry?.classificationSource).toBe('lookup');
    expect(entry?.engineStatus).toBe('known');
    expect(entry?.businessName).toBe('GrowthCo');
  });

  it('low-confidence committed lookup ⇒ engineStatus almost-sure (presentation only, same engine)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'consultant', businessTypeConfidence: 0.4 }),
      'some consultancy'
    );
    expect(brief.copyEngine).toBe('trust');
    expect(getEntryFacts(brief)?.resolvedEngine).toBe('trust');
    expect(getEntryFacts(brief)?.engineStatus).toBe('almost-sure');
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

describe('buildBriefDraft — ambiguous types leave the engine undetermined (engineDecider)', () => {
  it('agency (ambiguous): businessType kept, copyEngine unset, resolvedEngine null, status ambiguous', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'book-call' }),
      'growth agency for SaaS'
    );
    // We KNOW the type, but not the engine — that is the D4 pick's job.
    expect(brief.businessType).toBe('agency');
    expect(brief.copyEngine).toBeUndefined();
    const entry = getEntryFacts(brief);
    expect(entry?.resolvedEngine).toBeNull();
    expect(entry?.engineStatus).toBe('ambiguous');
  });

  it('designer (ambiguous): copyEngine unset, resolvedEngine null', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'designer' }),
      'branding & design studio'
    );
    expect(brief.copyEngine).toBeUndefined();
    expect(getEntryFacts(brief)?.resolvedEngine).toBeNull();
  });

  it('unknown + none: copyEngine unset, resolvedEngine null, status ambiguous (no silent thing)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'mystery-biz', tiebreaker: 'none' }),
      'something we cannot classify'
    );
    expect(brief.copyEngine).toBeUndefined();
    expect(getEntryFacts(brief)?.resolvedEngine).toBeNull();
    expect(getEntryFacts(brief)?.engineStatus).toBe('ambiguous');
  });

  it('confidence is clamped into [0,1] (R1 — presentation defense, never changes resolution)', () => {
    const hi = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', businessTypeConfidence: 5 }),
      'x'
    );
    expect(hi.confidence).toBe(1);
    const lo = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', businessTypeConfidence: -3 }),
      'x'
    );
    expect(lo.confidence).toBe(0);
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

describe('applyEnginePick (engineDecider — the D4-pick writer)', () => {
  it('picks a SCHEMA engine (trust) on an ambiguous agency ⇒ copyEngine set, confirmed', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'book-call' }),
      'growth agency'
    );
    expect(draft.copyEngine).toBeUndefined(); // pre-pick
    const picked = applyEnginePick(draft, 'trust');
    expect(picked.copyEngine).toBe('trust');
    const entry = getEntryFacts(picked);
    expect(entry?.resolvedEngine).toBe('trust');
    expect(entry?.engineStatus).toBe('confirmed');
    expect(entry?.classificationSource).toBe('user-pick');
    expect(entry?.tiebreaker).toBe('none');
  });

  it('picks WORK on ambiguous designer ⇒ copyEngine work, confirmed', () => {
    const draft = buildBriefDraft(makeSignals({ businessTypeGuess: 'designer' }), 'studio');
    const picked = applyEnginePick(draft, 'work');
    expect(picked.copyEngine).toBe('work');
    expect(getEntryFacts(picked)?.resolvedEngine).toBe('work');
  });

  it('picks PLACE ⇒ copyEngine NEVER written (BriefSchema-safe), resolvedEngine place', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: null, tiebreaker: 'none' }),
      'a place'
    );
    const picked = applyEnginePick(draft, 'place');
    expect(picked.copyEngine).toBeUndefined();
    const entry = getEntryFacts(picked);
    expect(entry?.resolvedEngine).toBe('place');
    expect(entry?.engineStatus).toBe('confirmed');
  });

  it('picking a non-schema engine CLEARS a previously-set copyEngine', () => {
    // saas resolves committed thing (copyEngine set); a later place pick must
    // unset it so BriefSchema stays valid.
    const draft = buildBriefDraft(makeSignals({ businessTypeGuess: 'saas' }), 'x');
    expect(draft.copyEngine).toBe('thing');
    const picked = applyEnginePick(draft, 'quick-yes');
    expect(picked.copyEngine).toBeUndefined();
    expect(getEntryFacts(picked)?.resolvedEngine).toBe('quick-yes');
  });

  it('does not mutate the input draft', () => {
    const draft = buildBriefDraft(makeSignals({ businessTypeGuess: 'agency' }), 'x');
    applyEnginePick(draft, 'work');
    expect(getEntryFacts(draft)?.resolvedEngine).toBeNull();
  });
});
