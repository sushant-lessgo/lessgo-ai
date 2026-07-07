// src/modules/brief/bridge.test.ts
// Bridge maps: businessType→ServiceType (incl. fallback), goalIntent→goal
// mappings, null-brief no-op guard, deliveryModel default.

import { describe, it, expect } from 'vitest';
import { buildBriefDraft, type EntrySignals } from './classify';
import {
  serviceTypeForBusinessType,
  briefToProductPrefill,
  briefToServicePrefill,
} from './bridge';

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

describe('serviceTypeForBusinessType (D3)', () => {
  it('maps the trust types directly', () => {
    expect(serviceTypeForBusinessType('agency')).toBe('agency');
    expect(serviceTypeForBusinessType('consultant')).toBe('consultancy');
    expect(serviceTypeForBusinessType('coach')).toBe('coaching');
  });

  it("falls back to 'agency' (OneLinerStep idiom) for unmapped/undefined", () => {
    expect(serviceTypeForBusinessType('saas')).toBe('agency');
    expect(serviceTypeForBusinessType(undefined)).toBe('agency');
    expect(serviceTypeForBusinessType('photographer')).toBe('agency');
  });
});

describe('null-brief no-op guard (hydrate safety)', () => {
  it('returns null for null/undefined brief', () => {
    expect(briefToProductPrefill(null)).toBeNull();
    expect(briefToProductPrefill(undefined)).toBeNull();
    expect(briefToServicePrefill(null)).toBeNull();
    expect(briefToServicePrefill(undefined)).toBeNull();
  });

  it('returns null when facts.entry is absent', () => {
    expect(briefToProductPrefill({ businessType: 'saas' })).toBeNull();
    expect(briefToServicePrefill({ businessType: 'agency', facts: {} })).toBeNull();
  });
});

describe('briefToProductPrefill', () => {
  it('maps prefill fields + landingGoal (request-demo → demo)', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'saas',
        goalIntentGuess: 'request-demo',
        summary: 'Invoicing for freelancers.',
        businessName: 'InvoiceBot',
        offerings: ['auto-chasing', 'templates'],
        audiences: ['freelancers'],
        categories: ['fintech'],
        offer: '14-day trial',
        oneLiner: 'Invoicing that chases late payers',
      }),
      'invoicing tool'
    );
    expect(briefToProductPrefill(brief)).toEqual({
      oneLiner: 'Invoicing that chases late payers',
      productName: 'InvoiceBot',
      understanding: {
        categories: ['fintech'],
        audiences: ['freelancers'],
        whatItDoes: 'Invoicing for freelancers.',
        features: ['auto-chasing', 'templates'],
      },
      offer: '14-day trial',
      landingGoal: 'demo',
    });
  });

  it('omits landingGoal for unmapped intents (book-call)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'book-call' }),
      'x'
    );
    expect(briefToProductPrefill(brief)?.landingGoal).toBeUndefined();
  });
});

describe('briefToServicePrefill', () => {
  it('maps prefill fields, direct goal match, testimonials', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'consultant',
        goalIntentGuess: 'book-call',
        summary: 'Pricing strategy for B2B SaaS.',
        businessName: 'PriceRight',
        offerings: ['pricing audits'],
        audiences: ['B2B SaaS founders'],
        outcomes: ['higher ACV'],
        deliveryModel: 'hybrid',
        testimonials: ['Great advisor!'],
        oneLiner: 'Pricing consultant for SaaS',
      }),
      'pricing consultant'
    );
    expect(briefToServicePrefill(brief)).toEqual({
      oneLiner: 'Pricing consultant for SaaS',
      businessName: 'PriceRight',
      understanding: {
        serviceType: 'consultancy',
        whatYouDo: 'Pricing strategy for B2B SaaS.',
        services: ['pricing audits'],
        targetClients: ['B2B SaaS founders'],
        outcomes: ['higher ACV'],
        deliveryModel: 'hybrid',
      },
      goal: 'book-call',
      importedTestimonials: ['Great advisor!'],
    });
  });

  it("deliveryModel defaults to 'remote' when null", () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', deliveryModel: null }),
      'x'
    );
    expect(briefToServicePrefill(brief)?.understanding.deliveryModel).toBe('remote');
  });

  it('omits goal for unmapped intents (rsvp)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'rsvp' }),
      'x'
    );
    expect(briefToServicePrefill(brief)?.goal).toBeUndefined();
  });
});
