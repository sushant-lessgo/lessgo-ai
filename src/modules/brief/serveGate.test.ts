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
import { decideServe, BRIDGEABLE_ENGINES } from './serveGate';

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
  it('photographer (unknown, portfolio tiebreaker) ⇒ rungC:gallery,rungA:photographer — NO bridge:work', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer in Jaipur'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungC:gallery,rungA:photographer');
      expect(decision.tags).toHaveLength(2);
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
