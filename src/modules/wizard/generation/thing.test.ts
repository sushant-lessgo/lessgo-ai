// src/modules/wizard/generation/thing.test.ts
// scale-06 phase 5 — THING adapter fidelity tests.
//
// Asserts the adapter produces payloads that satisfy the product ROUTE schemas
// (strategy + generate-copy), incl. the phase-4 `proof` object populated from the
// store's proof booleans, plus smoke coverage of the multi-page fan-out and
// manufacturer (vestria remap) sub-paths.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { landingGoals } from '@/types/generation';
import {
  buildStrategyPayload,
  buildCopyPayload,
  landingGoalFor,
  briefGoalFor,
  runThingGeneration,
  type ThingGenerationInput,
} from './thing';
import type { ProductStrategyOutput } from '@/types/product';

// ─── Route schema MIRRORS (kept in lockstep with the route request schemas;
// reference the SAME frozen `landingGoals` const so the enum can't drift). ───
const StrategyRequestMirror = z.object({
  productName: z.string().min(1),
  oneLiner: z.string().min(10),
  features: z.array(z.string()).min(1),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1),
  primaryAudience: z.string().min(1),
  otherAudiences: z.array(z.string()),
  categories: z.array(z.string()),
  whatYouMake: z.string().optional(),
  templateId: z.enum(['meridian', 'vestria']).optional(),
  proof: z.object({ hasTestimonials: z.boolean().optional() }).optional(),
});

const CopyRequestMirror = z.object({
  strategy: z.object({
    awareness: z.string(),
    oneReader: z.any(),
    oneIdea: z.any(),
    featureAnalysis: z.array(z.any()),
    sections: z.array(z.string()),
    uiblocks: z.record(z.string()),
  }),
  uiblocks: z.record(z.string()),
  productName: z.string().min(1),
  oneLiner: z.string().min(10),
  offer: z.string().min(1),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  features: z.array(z.string()),
  realTestimonials: z
    .array(z.object({ quote: z.string(), author_name: z.string(), author_role: z.string() }))
    .optional(),
  templateId: z.enum(['meridian', 'vestria']).optional(),
});

const STRATEGY: ProductStrategyOutput = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  sections: ['header', 'hero', 'features', 'testimonials', 'footer'],
  uiblocks: {
    header: 'MeridianHeader',
    hero: 'MeridianHero',
    features: 'MeridianFeatures',
    testimonials: 'MeridianTestimonials',
    footer: 'MeridianFooter',
  },
};

function baseInput(over: Partial<ThingGenerationInput> = {}): ThingGenerationInput {
  return {
    tokenId: 'tok123',
    templateId: 'meridian',
    productName: 'Acme Deploy',
    oneLiner: 'Ship your app without babysitting the pipeline.',
    features: ['Auto deploys', 'Instant rollbacks'],
    audiences: ['staff engineers', 'platform leads'],
    categories: [],
    offer: 'Start free',
    goalIntent: 'signup-free',
    goalParam: {},
    proof: { hasTestimonials: false },
    strategy: null,
    sitemap: null,
    ...over,
  };
}

describe('THING adapter — strategy payload fidelity', () => {
  it('produces a payload the strategy route schema accepts (SaaS/meridian)', () => {
    const payload = buildStrategyPayload(baseInput());
    expect(StrategyRequestMirror.safeParse(payload).success).toBe(true);
  });

  it('populates the proof object from the store proof booleans', () => {
    expect(buildStrategyPayload(baseInput({ proof: { hasTestimonials: false } })).proof).toEqual({
      hasTestimonials: false,
    });
    expect(buildStrategyPayload(baseInput({ proof: { hasTestimonials: true } })).proof).toEqual({
      hasTestimonials: true,
    });
    // Absent proof ⇒ no proof key (old-wizard byte-identical behavior).
    expect('proof' in buildStrategyPayload(baseInput({ proof: undefined }))).toBe(false);
  });

  it('maps primaryAudience / otherAudiences from the audience field', () => {
    const p = buildStrategyPayload(baseInput());
    expect(p.primaryAudience).toBe('staff engineers');
    expect(p.otherAudiences).toEqual(['platform leads']);
  });

  it('MANUFACTURER (vestria) remap: valueAdds→features, productCategories→categories, industriesServed→otherAudiences, whatYouMake', () => {
    const p = buildStrategyPayload(
      baseInput({
        templateId: 'vestria',
        features: ['saas feature'],
        valueAdds: ['bespoke joinery', 'CNC precision'],
        categories: ['generic'],
        productCategories: ['counters', 'shelving'],
        audiences: [],
        industriesServed: ['hospitality', 'retail'],
        whatYouMake: 'commercial joinery',
      })
    );
    expect(p.features).toEqual(['bespoke joinery', 'CNC precision']);
    expect(p.categories).toEqual(['counters', 'shelving']);
    expect(p.otherAudiences).toEqual(['hospitality', 'retail']);
    expect(p.whatYouMake).toBe('commercial joinery');
    // Empty audience ⇒ manufacturer fallback primary audience.
    expect(p.primaryAudience).toBe('trade buyers / procurement teams');
    expect(StrategyRequestMirror.safeParse(p).success).toBe(true);
  });
});

describe('THING adapter — copy payload fidelity', () => {
  it('produces a payload the copy route schema accepts', () => {
    const payload = buildCopyPayload(baseInput(), STRATEGY);
    expect(CopyRequestMirror.safeParse(payload).success).toBe(true);
  });

  it('includes realTestimonials only when present', () => {
    expect('realTestimonials' in buildCopyPayload(baseInput(), STRATEGY)).toBe(false);
    const withT = buildCopyPayload(
      baseInput({ importedTestimonials: [{ quote: 'q', author_name: 'a', author_role: 'r' }] }),
      STRATEGY
    );
    expect(withT.realTestimonials).toHaveLength(1);
  });
});

describe('THING adapter — goal derivation', () => {
  it('landingGoalFor derives a legacy enum; null intent ⇒ signup', () => {
    expect(landingGoalFor(baseInput({ goalIntent: 'signup-free' }))).toBe('signup');
    expect(landingGoalFor(baseInput({ goalIntent: 'free-trial' }))).toBe('free-trial');
    expect(landingGoalFor(baseInput({ goalIntent: null }))).toBe('signup');
  });

  it('briefGoalFor composes a Brief.goal from the captured intent', () => {
    const bg = briefGoalFor(baseInput({ goalIntent: 'book-call' }));
    expect(bg?.intent).toBe('book-call');
    expect(briefGoalFor(baseInput({ goalIntent: null }))).toBeNull();
  });
});

// ─── Full-run smoke (mocked fetch) — single-page + multi-page fan-out ───

type FetchArgs = { url: string; body: any };

function makeFetchMock(calls: FetchArgs[]) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, body });
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({}) } as any; // not resumable
    }
    if (url.includes('/api/audience/product/strategy')) {
      return { ok: true, json: async () => ({ success: true, data: STRATEGY }) } as any;
    }
    if (url.includes('/api/audience/product/generate-copy')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          sections: { hero: { elements: { headline: 'H' } }, footer: { elements: {} } },
        }),
      } as any;
    }
    if (url.includes('/api/saveDraft')) {
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: 'unexpected' }) } as any;
  });
}

describe('THING adapter — runThingGeneration smoke', () => {
  let calls: FetchArgs[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('single-page meridian: strategy → copy → save → redirect /edit/[token]', async () => {
    const result = await runThingGeneration(baseInput());
    expect(result.status).toBe('done');
    expect(result.redirectTo).toBe('/edit/tok123');

    const save = calls.find((c) => c.url.includes('/api/saveDraft'));
    expect(save).toBeTruthy();
    expect(save!.body.templateId).toBe('meridian');
    // The proof hard rule dropped nothing here (route is mocked), but finalContent
    // is assembled from strategy.sections.
    expect(save!.body.finalContent.layout.sections.length).toBe(STRATEGY.sections.length);
  });

  it('multi-page vestria: skeleton save + per-page fan-out ⇒ done', async () => {
    const result = await runThingGeneration(
      baseInput({
        templateId: 'vestria',
        strategy: STRATEGY,
        sitemap: [
          { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'features'] },
        ] as any,
      })
    );
    expect(result.status).toBe('done');
    expect(result.redirectTo).toBe('/edit/tok123');

    // Skeleton save carried templateId vestria; at least one per-page copy call fired.
    const skeleton = calls.find(
      (c) => c.url.includes('/api/saveDraft') && c.body?.templateId === 'vestria'
    );
    expect(skeleton).toBeTruthy();
    expect(calls.some((c) => c.url.includes('/api/audience/product/generate-copy'))).toBe(true);
  });

  it('propagates a 402 credit failure as status:credits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/loadDraft')) return { ok: true, json: async () => ({}) } as any;
        if (url.includes('/api/audience/product/strategy'))
          return { ok: false, status: 402, json: async () => ({ error: 'out of credits' }) } as any;
        return { ok: true, json: async () => ({}) } as any;
      })
    );
    const result = await runThingGeneration(baseInput());
    expect(result.status).toBe('credits');
  });
});
