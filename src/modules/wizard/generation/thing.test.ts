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
  runStrategy,
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
  // scale-07 phase 5 (carryover a): Brief goal + explicit capabilities reach
  // the route (assembly-only). Route validates with BriefSchema; the mirror
  // just pins presence/shape of what the adapter sends.
  brief: z
    .object({
      goal: z.object({ intent: z.string(), mechanism: z.string() }).passthrough().optional(),
      // scale-08 phase 1: voice source.
      businessType: z.string().optional(),
    })
    .optional(),
  requiredCapabilities: z.array(z.string()).optional(),
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
  // scale-08 phase 1: voice source.
  businessType: z.string().optional(),
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

  it('forwards the composed Brief goal (carryover a) — absent when no intent', () => {
    const p = buildStrategyPayload(baseInput()) as any;
    expect(p.brief?.goal?.intent).toBe('signup-free');
    expect(p.brief?.goal?.mechanism).toBeTruthy();
    expect('brief' in buildStrategyPayload(baseInput({ goalIntent: null }))).toBe(false);
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
        businessTypeKey: 'manufacturer',
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

  it('scale-08 phase 2: vestria templateId WITHOUT businessTypeKey=manufacturer does NOT remap (key moved to config, not template)', () => {
    const p = buildStrategyPayload(
      baseInput({
        templateId: 'vestria', // template says vestria...
        businessTypeKey: 'saas', // ...but the businessType is NOT manufacturer
        features: ['saas feature'],
        valueAdds: ['bespoke joinery', 'CNC precision'],
        categories: ['generic'],
        productCategories: ['counters', 'shelving'],
        audiences: ['founders', 'platform leads'],
        industriesServed: ['hospitality', 'retail'],
        whatYouMake: 'commercial joinery',
      })
    );
    // No manufacturer remap: SaaS features/categories/audiences win, whatYouMake absent.
    expect(p.features).toEqual(['saas feature']);
    expect(p.categories).toEqual(['generic']);
    expect(p.otherAudiences).toEqual(['platform leads']);
    expect('whatYouMake' in p).toBe(false);
    expect(p.primaryAudience).toBe('founders');
    // Same holds for the copy payload's effective features.
    expect(
      buildCopyPayload(
        baseInput({ templateId: 'vestria', businessTypeKey: 'saas', features: ['saas feature'], valueAdds: ['x'] }),
        STRATEGY
      ).features
    ).toEqual(['saas feature']);
  });

  it('carries brief.businessType (voice source) when businessTypeKey is set — scale-08 phase 1', () => {
    const p = buildStrategyPayload(baseInput({ businessTypeKey: 'manufacturer' })) as any;
    expect(p.brief?.businessType).toBe('manufacturer');
    // Goal still rides alongside businessType in the same brief object.
    expect(p.brief?.goal?.intent).toBe('signup-free');
    // Brief is now sent even with no goal, when only businessType exists.
    const noGoal = buildStrategyPayload(
      baseInput({ goalIntent: null, businessTypeKey: 'manufacturer' })
    ) as any;
    expect(noGoal.brief?.businessType).toBe('manufacturer');
    expect('goal' in (noGoal.brief ?? {})).toBe(false);
    // Neither goal nor businessType ⇒ no brief key at all.
    expect(
      'brief' in buildStrategyPayload(baseInput({ goalIntent: null, businessTypeKey: undefined }))
    ).toBe(false);
  });
});

describe('THING adapter — copy payload fidelity', () => {
  it('produces a payload the copy route schema accepts', () => {
    const payload = buildCopyPayload(baseInput(), STRATEGY);
    expect(CopyRequestMirror.safeParse(payload).success).toBe(true);
  });

  it('carries businessType (voice source) — scale-08 phase 1', () => {
    expect(buildCopyPayload(baseInput({ businessTypeKey: 'manufacturer' }), STRATEGY).businessType).toBe(
      'manufacturer'
    );
    // Absent key ⇒ undefined (route defaults voice to modern-tech).
    expect(buildCopyPayload(baseInput(), STRATEGY).businessType).toBeUndefined();
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

// ─── runStrategy — the standalone strategy step (scale-07 phase 3) ───

describe('THING adapter — runStrategy (pre-gate strategy step)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the SAME buildStrategyPayload body and returns the strategy', async () => {
    const calls: FetchArgs[] = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
    const result = await runStrategy(baseInput());
    expect(result.status).toBe('done');
    if (result.status === 'done') expect(result.strategy).toEqual(STRATEGY);

    const strategyCalls = calls.filter((c) => c.url.includes('/api/audience/product/strategy'));
    expect(strategyCalls).toHaveLength(1); // exactly one charged call
    expect(strategyCalls[0].body).toEqual(buildStrategyPayload(baseInput()));
  });

  it('402 ⇒ status:credits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 402, json: async () => ({ error: 'out of credits' }) }))
    );
    expect((await runStrategy(baseInput())).status).toBe('credits');
  });

  it('network failure ⇒ status:error with a message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('boom');
      })
    );
    const result = await runStrategy(baseInput());
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.error).toBe('boom');
  });
});

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
        businessTypeKey: 'manufacturer',
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
    const copyCall = calls.find((c) => c.url.includes('/api/audience/product/generate-copy'));
    expect(copyCall).toBeTruthy();
    // scale-08 phase 1: the fan-out copy body carries the voice source.
    expect(copyCall!.body.businessType).toBe('manufacturer');
    // Strategy came from the structure gate — the fan-out run must NOT refetch
    // (credit-charge-once: the /strategy route charges per call).
    expect(calls.some((c) => c.url.includes('/api/audience/product/strategy'))).toBe(false);
  });

  it('pre-gate strategy (single-page): runCopyAndSave with ZERO strategy calls — no second charge', async () => {
    const result = await runThingGeneration(baseInput({ strategy: STRATEGY }));
    expect(result.status).toBe('done');
    expect(calls.some((c) => c.url.includes('/api/audience/product/strategy'))).toBe(false);
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
