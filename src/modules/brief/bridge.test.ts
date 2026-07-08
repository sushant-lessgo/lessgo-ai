// src/modules/brief/bridge.test.ts
// Bridge maps: businessType→ServiceType (incl. fallback), goalIntent→goal
// mappings, null-brief no-op guard, deliveryModel default.

import { describe, it, expect } from 'vitest';
import { buildBriefDraft, type EntrySignals } from './classify';
import {
  serviceTypeForBusinessType,
  briefToProductPrefill,
  briefToServicePrefill,
  SERVICE_GOAL_TO_INTENT,
  LANDING_GOAL_TO_INTENT,
  legacyGoalToBriefGoal,
  intentToBriefGoal,
  intentToLegacyGoal,
} from './bridge';
import { serviceGoals } from '@/types/service';
import { landingGoals } from '@/types/generation';
import { goalIntents } from '@/modules/goals/vocabulary';
import { BriefSchema } from '@/lib/schemas/brief.schema';

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
      goalIntent: 'request-demo',
    });
  });

  it('omits landingGoal for unmapped intents (book-call)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'book-call' }),
      'x'
    );
    expect(briefToProductPrefill(brief)?.landingGoal).toBeUndefined();
  });

  // ─── scale-05 phase 9: intent-first prefill ───
  it('carries goalIntent verbatim (mapped intent — request-demo)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'request-demo' }),
      'x'
    );
    expect(briefToProductPrefill(brief)?.goalIntent).toBe('request-demo');
  });

  it('carries goalIntent even when the legacy landingGoal is unmapped (book-call)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'book-call' }),
      'x'
    );
    const prefill = briefToProductPrefill(brief);
    expect(prefill?.landingGoal).toBeUndefined();
    expect(prefill?.goalIntent).toBe('book-call');
  });

  it('omits goalIntent when the brief has no goal', () => {
    const brief = buildBriefDraft(makeSignals({ goalIntentGuess: null }), 'x');
    expect(briefToProductPrefill(brief)?.goalIntent).toBeUndefined();
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
      goalIntent: 'book-call',
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

  // ─── scale-05 phase 9: intent-first prefill ───
  it('carries goalIntent even when the legacy goal is unmapped (rsvp)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'rsvp' }),
      'x'
    );
    const prefill = briefToServicePrefill(brief);
    expect(prefill?.goal).toBeUndefined();
    expect(prefill?.goalIntent).toBe('rsvp');
  });

  it('carries goalIntent verbatim for a mapped intent (book-call)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'consultant', goalIntentGuess: 'book-call' }),
      'x'
    );
    expect(briefToServicePrefill(brief)?.goalIntent).toBe('book-call');
  });
});

// ─── scale-05 phase 1: reverse maps + legacyGoalToBriefGoal ───

describe('reverse maps — totality (every legacy goal maps to a valid intent)', () => {
  it('SERVICE_GOAL_TO_INTENT covers every ServiceGoal', () => {
    for (const g of serviceGoals) {
      const intent = SERVICE_GOAL_TO_INTENT[g];
      expect(intent, `service goal '${g}' unmapped`).toBeDefined();
      expect(goalIntents).toContain(intent);
    }
  });

  it('LANDING_GOAL_TO_INTENT covers every LandingGoal', () => {
    for (const g of landingGoals) {
      const intent = LANDING_GOAL_TO_INTENT[g];
      expect(intent, `landing goal '${g}' unmapped`).toBeDefined();
      expect(goalIntents).toContain(intent);
    }
  });

  it('maps the renamed intents (signup→signup-free, download→download-app, buy→buy-via-link, demo→request-demo)', () => {
    expect(LANDING_GOAL_TO_INTENT['signup']).toBe('signup-free');
    expect(LANDING_GOAL_TO_INTENT['download']).toBe('download-app');
    expect(LANDING_GOAL_TO_INTENT['buy']).toBe('buy-via-link');
    expect(LANDING_GOAL_TO_INTENT['demo']).toBe('request-demo');
  });
});

describe('legacyGoalToBriefGoal — intent-specific branches', () => {
  it("subscribe-newsletter OVERRIDE: mechanism='M1', NO param, NO destination (vocab M4 never consulted)", () => {
    const goal = legacyGoalToBriefGoal('subscribe-newsletter');
    expect(goal).toEqual({ intent: 'subscribe-newsletter', mechanism: 'M1' });
    expect(goal.param).toBeUndefined();
    expect(goal.destination).toBeUndefined();
  });

  it('subscribe-newsletter override ignores any stray param', () => {
    const goal = legacyGoalToBriefGoal('subscribe-newsletter', {
      url: 'https://substack.com/x',
      links: ['https://substack.com/x'],
    });
    expect(goal).toEqual({ intent: 'subscribe-newsletter', mechanism: 'M1' });
  });

  it('download-app: persists BOTH store links verbatim + destination = links[0]', () => {
    const play = 'https://play.google.com/store/apps/details?id=com.katha';
    const appstore = 'https://apps.apple.com/app/katha/id123';
    const goal = legacyGoalToBriefGoal('download', { links: [play, appstore] });
    expect(goal).toEqual({
      intent: 'download-app',
      mechanism: 'M3',
      destination: play,
      param: { links: [play, appstore] },
    });
  });

  it('download-app: drops empty slots, one link → one entry, destination = that link', () => {
    const appstore = 'https://apps.apple.com/app/katha/id123';
    const goal = legacyGoalToBriefGoal('download', { links: ['', appstore] });
    expect(goal.param?.links).toEqual([appstore]);
    expect(goal.destination).toBe(appstore);
  });

  it('download-app with no links: M3, no destination, no param', () => {
    expect(legacyGoalToBriefGoal('download')).toEqual({
      intent: 'download-app',
      mechanism: 'M3',
    });
  });
});

describe('legacyGoalToBriefGoal — mechanism-generic composition', () => {
  it('demo + Calendly URL → request-demo upgraded to M3 with destination + param', () => {
    const goal = legacyGoalToBriefGoal('demo', { url: 'https://calendly.com/acme/30min' });
    expect(goal).toEqual({
      intent: 'request-demo',
      mechanism: 'M3',
      destination: 'https://calendly.com/acme/30min',
      param: { url: 'https://calendly.com/acme/30min' },
    });
  });

  it('demo without a URL stays M1 (form fallback), no destination', () => {
    expect(legacyGoalToBriefGoal('demo')).toEqual({
      intent: 'request-demo',
      mechanism: 'M1',
    });
  });

  it('book-call (service) + scheduling link → M3 external', () => {
    const goal = legacyGoalToBriefGoal('book-call', { url: 'https://cal.com/pricer' });
    expect(goal.mechanism).toBe('M3');
    expect(goal.destination).toBe('https://cal.com/pricer');
  });

  it('enquiry + phone → M2 with composed wa.me destination (digits only)', () => {
    const goal = legacyGoalToBriefGoal('enquiry', { phone: '+1 (555) 123-4567' });
    expect(goal).toEqual({
      intent: 'enquiry',
      mechanism: 'M2',
      destination: "https://wa.me/15551234567?text=Hi%2C%20I%20found%20your%20website%20and%20I'm%20interested.",
      param: { phone: '+1 (555) 123-4567', message: "Hi, I found your website and I'm interested." },
    });
  });

  it('enquiry + email → M2 mailto destination', () => {
    const goal = legacyGoalToBriefGoal('enquiry', { email: 'hi@acme.com' });
    expect(goal.mechanism).toBe('M2');
    expect(goal.destination).toBe('mailto:hi@acme.com');
  });

  it('pure-M1 goals (waitlist, apply, lead-magnet, download-portfolio) → M1, no destination', () => {
    expect(legacyGoalToBriefGoal('waitlist')).toEqual({ intent: 'waitlist', mechanism: 'M1' });
    expect(legacyGoalToBriefGoal('apply')).toEqual({ intent: 'apply', mechanism: 'M1' });
    expect(legacyGoalToBriefGoal('lead-magnet')).toEqual({ intent: 'lead-magnet', mechanism: 'M1' });
    // download-portfolio maps onto the lead-magnet intent (closest M1 fit).
    expect(legacyGoalToBriefGoal('download-portfolio')).toEqual({
      intent: 'lead-magnet',
      mechanism: 'M1',
    });
  });

  it('M3-primary goals with a URL (free-trial, signup, buy) compose external destinations', () => {
    expect(legacyGoalToBriefGoal('free-trial', { url: 'https://app.acme.com/trial' }).destination)
      .toBe('https://app.acme.com/trial');
    expect(legacyGoalToBriefGoal('signup', { url: 'https://app.acme.com/signup' }).mechanism)
      .toBe('M3');
    expect(legacyGoalToBriefGoal('buy')).toEqual({ intent: 'buy-via-link', mechanism: 'M3' });
  });

  it('totality: every legacy goal composes a valid Brief.goal with intent + mechanism', () => {
    for (const g of [...serviceGoals, ...landingGoals]) {
      const goal = legacyGoalToBriefGoal(g);
      expect(goalIntents).toContain(goal.intent);
      expect(['M1', 'M2', 'M3', 'M4', 'M5']).toContain(goal.mechanism);
    }
  });
});

describe('legacyGoalToBriefGoal — end-to-end wizard shape (phase-6 contract)', () => {
  it('download-app: wizard goalParam (2-slot links) → brief.goal.param.links is EXACTLY what the phase-6 badge injector reads', () => {
    // Shape as GoalParamFields writes it: fixed 2-slot array (0=Play, 1=App Store).
    const wizardGoalParam = {
      links: [
        'https://play.google.com/store/apps/details?id=com.katha',
        'https://apps.apple.com/app/katha/id123',
      ],
    };
    const brief = { goal: legacyGoalToBriefGoal('download', wizardGoalParam) };
    // Phase 6 reads exactly brief.goal.param.links and host-sniffs both stores.
    expect(brief.goal.param?.links).toEqual([
      'https://play.google.com/store/apps/details?id=com.katha',
      'https://apps.apple.com/app/katha/id123',
    ]);
    expect(brief.goal.param?.links?.some((l) => l.includes('play.google.com'))).toBe(true);
    expect(brief.goal.param?.links?.some((l) => l.includes('apps.apple.com'))).toBe(true);
    expect(brief.goal.destination).toBe(brief.goal.param?.links?.[0]);
  });

  it("subscribe-newsletter: wizard → brief.goal.mechanism === 'M1' (design call #6)", () => {
    const brief = { goal: legacyGoalToBriefGoal('subscribe-newsletter', {}) };
    expect(brief.goal.mechanism).toBe('M1');
  });

  it('composed goals (with and without param) pass BriefSchema — zod param is additive', () => {
    const withParam = legacyGoalToBriefGoal('download', {
      links: ['https://play.google.com/x', 'https://apps.apple.com/y'],
    });
    const withoutParam = legacyGoalToBriefGoal('waitlist');
    expect(BriefSchema.safeParse({ goal: withParam }).success).toBe(true);
    expect(BriefSchema.safeParse({ goal: withoutParam }).success).toBe(true);
    // Existing Briefs (no param key at all) stay valid.
    expect(
      BriefSchema.safeParse({ goal: { intent: 'book-call', mechanism: 'M1' } }).success
    ).toBe(true);
  });
});

// ─── scale-05 phase 9: intentToLegacyGoal (legacy mirror) ───

describe('intentToLegacyGoal — legacy mirror with per-audience fallback', () => {
  it('mirrors mapped intents to their legacy product goal', () => {
    expect(intentToLegacyGoal('signup-free', 'product')).toBe('signup');
    expect(intentToLegacyGoal('free-trial', 'product')).toBe('free-trial');
    expect(intentToLegacyGoal('download-app', 'product')).toBe('download');
    expect(intentToLegacyGoal('buy-via-link', 'product')).toBe('buy');
    expect(intentToLegacyGoal('request-demo', 'product')).toBe('demo');
    expect(intentToLegacyGoal('enquiry', 'product')).toBe('enquiry');
    expect(intentToLegacyGoal('waitlist', 'product')).toBe('waitlist');
  });

  it('mirrors mapped intents to their legacy service goal', () => {
    expect(intentToLegacyGoal('book-call', 'service')).toBe('book-call');
    expect(intentToLegacyGoal('request-quote', 'service')).toBe('request-quote');
    expect(intentToLegacyGoal('lead-magnet', 'service')).toBe('lead-magnet');
    expect(intentToLegacyGoal('apply', 'service')).toBe('apply');
    expect(intentToLegacyGoal('subscribe-newsletter', 'service')).toBe('subscribe-newsletter');
  });

  it("unmapped intents fall back per audience (product → 'signup', service → 'book-call')", () => {
    // book-call has no product LandingGoal; rsvp has no service ServiceGoal.
    expect(intentToLegacyGoal('book-call', 'product')).toBe('signup');
    expect(intentToLegacyGoal('rsvp', 'product')).toBe('signup');
    expect(intentToLegacyGoal('rsvp', 'service')).toBe('book-call');
    expect(intentToLegacyGoal('free-trial', 'service')).toBe('book-call');
  });

  it('every intent yields a valid legacy goal for BOTH audiences (totality)', () => {
    for (const intent of goalIntents) {
      const p = intentToLegacyGoal(intent, 'product');
      const s = intentToLegacyGoal(intent, 'service');
      expect(landingGoals).toContain(p);
      expect(serviceGoals).toContain(s);
    }
  });
});

// ─── scale-05 phase 9: intentToBriefGoal (writeback prefers the real intent) ───

describe('intentToBriefGoal — intent-first writeback', () => {
  it('composes directly from the intent, matching legacyGoalToBriefGoal for round-trippable goals', () => {
    expect(intentToBriefGoal('download-app', { links: ['https://play.google.com/x'] }))
      .toEqual(legacyGoalToBriefGoal('download', { links: ['https://play.google.com/x'] }));
    expect(intentToBriefGoal('subscribe-newsletter'))
      .toEqual({ intent: 'subscribe-newsletter', mechanism: 'M1' });
  });

  it('preserves intents that the legacy mirror would LOSE (book-me → book-call round-trip)', () => {
    // book-me mirrors to legacy book-call; the reverse map would resolve
    // book-call, discarding book-me. Intent-first keeps the real intent.
    const viaIntent = intentToBriefGoal('book-me');
    expect(viaIntent.intent).toBe('book-me');
    const legacyMirror = intentToLegacyGoal('book-me', 'service'); // 'book-call'
    expect(legacyGoalToBriefGoal(legacyMirror).intent).toBe('book-call');
  });
});
