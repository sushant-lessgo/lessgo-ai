// src/modules/brief/serveGate.test.ts
// Acceptance fixtures end-to-end through buildBriefDraft + decideServe
// (plan phase 1 step 5). `missing` strings are asserted with STRICT equality
// — tag emission order is part of the contract (rungC → rungE → bridge →
// rungA; out-of-icp exclusive).

import { describe, it, expect } from 'vitest';
import {
  buildBriefDraft,
  applyBusinessTypeCorrection,
  type EntrySignals,
} from './classify';
import { decideServe, BRIDGEABLE_ENGINES, uncoveredCollectionTags } from './serveGate';
import { businessTypes } from '@/modules/businessTypes/config';

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

describe('BRIDGEABLE_ENGINES', () => {
  it('launch bridges: thing→product, trust→service, work→writer (scale-06 phase 9)', () => {
    expect(BRIDGEABLE_ENGINES).toEqual({
      thing: 'product',
      trust: 'service',
      work: 'writer',
    });
  });
});

describe('decideServe — serve paths', () => {
  it('agency-shaped signals ⇒ serve / service / surge, shortlist [hearth,lex,surge]', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'agency',
        category: 'growth marketing agency',
        goalIntentGuess: 'book-call',
        designStyleHint: 'bold-performance',
      }),
      'growth agency for SaaS'
    );
    const decision = decideServe(brief);
    expect(decision).toEqual({
      outcome: 'serve',
      audienceType: 'service',
      templateId: 'surge',
      shortlist: ['hearth', 'lex', 'surge'],
    });
  });

  it('D3 hardening: agency with OFF-LIST designStyleHint still picks surge via defaultStyle retry', () => {
    // 'literary-quiet' matches no trust-shortlisted template → hint misses →
    // businessTypes.agency.defaultStyle ('bold-performance') retry → surge.
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'agency',
        goalIntentGuess: 'book-call',
        designStyleHint: 'literary-quiet',
      }),
      'growth agency for SaaS'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('surge');
    }
  });

  it('null designStyleHint: coach ⇒ hearth via defaultStyle (warm-human)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'coach', goalIntentGuess: 'book-call' }),
      'leadership coach'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
      expect(decision.templateId).toBe('hearth');
    }
  });

  it('saas ⇒ serve / product / meridian', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
      'invoicing tool for freelancers'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
      expect(decision.templateId).toBe('meridian');
    }
  });

  it('app (KNOWN thing type, scale-08 phase 3) IS serveable ⇒ serve / product', () => {
    // Proves the config-only `app` entry rides the existing thing pipeline: same
    // serve outcome as saas, zero new code. Contrast with photographer, whose
    // unbacked gallery cap sends it to the manual/demand lane below. NOTE: goal
    // is signup-free, not app's `download-app` intent — download-app derives the
    // unbacked `store-badges` cap (a GOAL-level gap, orthogonal to businessType),
    // which would push even this serveable type to manual.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'app', goalIntentGuess: 'signup-free' }),
      'habit-tracking mobile app'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
    }
  });

  it('writer (KNOWN, work engine) ⇒ serve / writer / granth — NO bridge:work tag (phase 9)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'writer', goalIntentGuess: 'follow-social' }),
      'Hindi literary fiction author'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('writer');
      expect(decision.templateId).toBe('granth');
      expect(decision.shortlist).toEqual(['granth']);
      // bridge:work MANUAL clause is deleted — no such tag exists on any path.
      expect(decision).not.toHaveProperty('tags');
    }
  });
});

describe('decideServe — manual paths (strict missing strings)', () => {
  it('photographer (KNOWN work type, gallery cap unbacked) ⇒ rungC:gallery — no rungA (type is known)', () => {
    // scale-08 phase 3: photographer is now a KNOWN businessType with a required
    // `gallery` cap that no shipped template declares. resolveEngine → work via
    // lookup (source 'lookup', NOT tiebreaker), so no rungA tag and the gallery
    // gap surfaces via the latent-cap fallback ⇒ single `rungC:gallery`.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer in Jaipur'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungC:gallery');
      expect(decision.tags).toHaveLength(1);
      expect(decision.tags).not.toContain('bridge:work');
      expect(decision.outOfIcp).toBe(false);
    }
  });

  it('restaurant (unknown, browsing-place) ⇒ rungE:place,rungA:restaurant', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'restaurant', tiebreaker: 'browsing-place' }),
      'family restaurant, browse our menu'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungE:place,rungA:restaurant');
      expect(decision.outOfIcp).toBe(false);
    }
  });

  it('checkout ⇒ out-of-icp EXCLUSIVE (no rungA piggyback, even for unknown type)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'boutique', platformNeeds: 'checkout' }),
      'online store with checkout'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('out-of-icp');
      expect(decision.tags).toEqual(['out-of-icp']);
      expect(decision.outOfIcp).toBe(true);
    }
  });

  it('ordering platform ⇒ out-of-icp too', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'restaurant', platformNeeds: 'ordering' }),
      'restaurant with online ordering'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('out-of-icp');
    }
  });

  it('fallback guard: KNOWN type with an uncoverable cap ⇒ rungC:<cap>, never empty missing', () => {
    // saas + download-app derives 'store-badges' (fit.ts) — no template covers
    // it → shortlist empty, but every explicit clause passes. The fallback
    // must tag the first unmet capability instead of returning missing===''.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'download-app' }),
      'mobile app'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungC:store-badges');
      expect(decision.missing).not.toBe('');
    }
  });
});

describe('uncoveredCollectionTags — pure supply check (scale-10 phase 3)', () => {
  it('required collection COVERED by a shortlisted template (declares the capability) ⇒ no tag', () => {
    // Fixture template declares `products` as a collection-family capability.
    const tags = uncoveredCollectionTags(['products'], [['lead-form', 'products']]);
    expect(tags).toEqual([]);
  });

  it('required collection UNCOVERED (no shortlisted template declares it) ⇒ precise collection:<key> tag', () => {
    const tags = uncoveredCollectionTags(['services'], [['lead-form']]);
    expect(tags).toEqual(['collection:services']);
  });

  it('vestria flat-grid `catalog` capability does NOT cover the `products` collection key', () => {
    // catalog is not a CollectionKey — a template declaring only catalog covers
    // no requiredCollections key.
    const tags = uncoveredCollectionTags(['products'], [['lead-form', 'catalog']]);
    expect(tags).toEqual(['collection:products']);
  });

  it('multiple required keys ⇒ one tag per uncovered key, covered keys omitted', () => {
    const tags = uncoveredCollectionTags(
      ['products', 'services'],
      [['lead-form', 'products']]
    );
    expect(tags).toEqual(['collection:services']);
  });

  it('empty requiredCollections ⇒ no tags', () => {
    expect(uncoveredCollectionTags([], [['lead-form']])).toEqual([]);
  });
});

describe('decideServe — requiredCollections wiring (fixture-mutated, dormant in real config)', () => {
  // Real config sets requiredCollections for NO businessType (dormant). To
  // exercise the wiring we temporarily populate one entry and restore it.
  it('KNOWN serveable type + UNCOVERED requiredCollections ⇒ manual + collection:<key> tag', () => {
    const orig = businessTypes.saas.requiredCollections;
    // saas shortlists to meridian (caps lead-form+packages) — declares no
    // `products` collection capability ⇒ uncovered.
    (businessTypes.saas as { requiredCollections?: readonly string[] }).requiredCollections = [
      'products',
    ];
    try {
      const brief = buildBriefDraft(
        makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
        'invoicing tool for freelancers'
      );
      const decision = decideServe(brief);
      expect(decision.outcome).toBe('manual');
      if (decision.outcome === 'manual') {
        expect(decision.missing).toBe('collection:products');
        expect(decision.tags).toEqual(['collection:products']);
        expect(decision.outOfIcp).toBe(false);
      }
    } finally {
      (businessTypes.saas as { requiredCollections?: readonly string[] }).requiredCollections =
        orig;
    }
  });

  it('real config leaves saas.requiredCollections unset (dormant) ⇒ still serves', () => {
    expect(businessTypes.saas.requiredCollections).toBeUndefined();
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
      'invoicing tool for freelancers'
    );
    expect(decideServe(brief).outcome).toBe('serve');
  });
});

describe('decideServe — chooser correction (stale-tiebreaker regression)', () => {
  it('photographer draft corrected to coach ⇒ serve/service, NO rungC:gallery', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer'
    );
    const corrected = applyBusinessTypeCorrection(draft, 'coach');
    const decision = decideServe(corrected);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
    }
  });
});
