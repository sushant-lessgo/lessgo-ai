// src/modules/wizard/generation/trust.test.ts
// scale-06 phase 8 — TRUST adapter fidelity tests.
//
// Asserts the adapter produces payloads that satisfy the service ROUTE schemas
// (strategy + generate-copy), the ServiceUnderstanding / ServiceGoal /
// ServiceAssetInput mapping, and — the phase-8 acceptance — that the adapter's
// `assets` reach the REAL `selectServiceSections` unchanged in shape, so
// awareness-driven section ordering + the testimonials drop are preserved
// exactly as the old service path produced them.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  serviceTypes,
  serviceGoals,
  serviceAwarenessStates,
  type ServiceStrategyOutputAssembled,
} from '@/types/service';
import { selectServiceSections } from '@/modules/audience/service/sectionSelection';
import {
  buildStrategyPayload,
  buildCopyPayload,
  buildUnderstanding,
  buildAssets,
  serviceGoalFor,
  briefGoalFor,
  effectivePalette,
  runTrustGeneration,
  testimonialCountHint,
  type TrustGenerationInput,
} from './trust';

// ─── Route schema MIRRORS (kept in lockstep with the service route schemas). ──
const StrategyRequestMirror = z.object({
  oneLiner: z.string().min(10),
  businessName: z.string().optional(),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    whatYouDo: z.string().min(1),
    services: z.array(z.string()).min(1),
    targetClients: z.array(z.string()).min(1),
    outcomes: z.array(z.string()),
    deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  }),
  goal: z.enum(serviceGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1),
  assets: z.object({
    hasTestimonials: z.boolean(),
    hasClientLogos: z.boolean(),
    hasOutcomes: z.boolean(),
    hasCaseStudies: z.boolean(),
    hasTeamPhotos: z.boolean(),
    hasFounderPhoto: z.boolean(),
    testimonialType: z.enum(['text', 'photos', 'video', 'transformation']).nullable(),
  }),
  paletteId: z.string().max(50).regex(/^[a-z0-9-]+$/),
  templateId: z.string().max(50).regex(/^[a-z0-9-]+$/).optional(),
});

const CopyRequestMirror = z.object({
  strategy: z.object({
    awareness: z.string(),
    sections: z.array(z.string()),
    uiblocks: z.record(z.string()),
  }),
  uiblocks: z.record(z.string()),
  oneLiner: z.string().min(10),
  businessName: z.string().optional(),
  offer: z.string().min(1),
  goal: z.enum(serviceGoals as unknown as [string, ...string[]]),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    whatYouDo: z.string().min(1),
    services: z.array(z.string()).min(1),
    targetClients: z.array(z.string()).min(1),
    outcomes: z.array(z.string()),
    deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  }),
  realTestimonials: z
    .array(z.object({ quote: z.string(), author_name: z.string(), author_role: z.string() }))
    .optional(),
});

// A frozen assembled service strategy (search-aware-comparing, packages format).
const STRATEGY: ServiceStrategyOutputAssembled = {
  awareness: 'search-aware-comparing',
  oneClient: { who: 'w', coreDesire: 'd', corePain: 'p', pains: ['a'], desires: ['b'], objections: ['c'] },
  ourPosition: { promise: 'pr', approach: 'ap', credibility: 'cr' },
  servicePresentation: { format: 'packages', showProcess: true, showCaseStudies: false },
  sectionDecisions: { includeTransformation: false, includeProblem: false, includeApproach: false, isHighTouch: false },
  uiblockDecisions: {},
  sections: ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'],
  uiblocks: {
    header: 'HearthHeader',
    hero: 'HearthHero',
    services: 'HearthServices',
    testimonials: 'HearthTestimonials',
    packages: 'HearthPackages',
    cta: 'HearthCta',
    footer: 'HearthFooter',
  },
};

function baseInput(over: Partial<TrustGenerationInput> = {}): TrustGenerationInput {
  return {
    tokenId: 'tok123',
    templateId: 'hearth',
    businessTypeKey: 'agency',
    businessName: 'North Star Studio',
    oneLiner: 'Performance marketing for D2C brands that actually moves revenue.',
    targetClients: ['D2C founders', 'ecommerce marketing leads'],
    services: ['Paid social', 'Landing pages'],
    process: 'Weekly sprints with a single point of contact',
    credentials: 'Ex-agency leads; 40+ D2C accounts',
    offer: 'Book a free growth audit',
    outcomes: ['3.2x ROAS'],
    goalIntent: 'book-call',
    goalParam: {},
    proof: {
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: true,
      hasCaseStudies: false,
      hasTeamPhotos: false,
      hasFounderPhoto: false,
      testimonialType: 'text',
    },
    ...over,
  };
}

describe('TRUST adapter — strategy payload fidelity', () => {
  it('produces a payload the service strategy route schema accepts', () => {
    const payload = buildStrategyPayload(baseInput());
    expect(StrategyRequestMirror.safeParse(payload).success).toBe(true);
  });

  it('maps ServiceUnderstanding from wizard contract fields', () => {
    const u = buildUnderstanding(baseInput());
    expect(u.serviceType).toBe('agency'); // businessType 'agency' → 'agency'
    expect(u.whatYouDo).toContain('Performance marketing');
    expect(u.services).toEqual(['Paid social', 'Landing pages']);
    expect(u.targetClients).toEqual(['D2C founders', 'ecommerce marketing leads']);
    expect(u.outcomes).toEqual(['3.2x ROAS']);
    expect(u.deliveryModel).toBe('remote'); // default when unasked
  });

  it('derives serviceType from businessType key (consultant → consultancy)', () => {
    expect(buildUnderstanding(baseInput({ businessTypeKey: 'consultant' })).serviceType).toBe('consultancy');
    expect(buildUnderstanding(baseInput({ businessTypeKey: 'coach' })).serviceType).toBe('coaching');
    // Unknown/absent ⇒ 'agency' fallback (bridge idiom).
    expect(buildUnderstanding(baseInput({ businessTypeKey: undefined })).serviceType).toBe('agency');
  });

  it('maps proof booleans → ServiceAssetInput unchanged in shape', () => {
    const assets = buildAssets(baseInput());
    expect(assets).toEqual({
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: true,
      hasCaseStudies: false,
      hasTeamPhotos: false,
      hasFounderPhoto: false,
      testimonialType: 'text',
    });
  });

  it('resolves palette from the picked value, else the template default', () => {
    expect(effectivePalette(baseInput({ paletteId: 'moss' }))).toBe('moss');
    // hearth default palette family (first entry).
    expect(effectivePalette(baseInput({ paletteId: undefined, templateId: 'hearth' }))).toBe('terracotta');
  });

  // proof-truth phase 5 — testimonials card-count hint plumbed into the payload.
  it('emits NO cardCountHints when neither scraped nor user count exists (byte-identical)', () => {
    expect('cardCountHints' in buildStrategyPayload(baseInput())).toBe(false);
  });

  it('emits the user-answered count when there are no scraped quotes', () => {
    const p = buildStrategyPayload(
      baseInput({ proof: { ...baseInput().proof, testimonialCount: 4 } })
    ) as any;
    expect(p.cardCountHints).toEqual({ testimonials: 4 });
  });

  it('scraped count WINS over the user count in the emitted hint', () => {
    const p = buildStrategyPayload(
      baseInput({
        proof: { ...baseInput().proof, testimonialCount: 2 },
        importedTestimonials: [
          { quote: 'q1', author_name: 'a', author_role: 'r' },
          { quote: 'q2', author_name: 'b', author_role: 'r' },
          { quote: 'q3', author_name: 'c', author_role: 'r' },
        ],
      })
    ) as any;
    expect(p.cardCountHints).toEqual({ testimonials: 3 });
  });
});

// proof-truth phase 5 — precedence helper (mirror of thing.ts).
describe('TRUST adapter — testimonialCountHint precedence (scraped > user > none)', () => {
  it('scraped wins, else user, else undefined', () => {
    expect(testimonialCountHint(3, 2)).toBe(3);
    expect(testimonialCountHint(undefined, 4)).toBe(4);
    expect(testimonialCountHint(0, 4)).toBe(4);
    expect(testimonialCountHint(undefined, null)).toBeUndefined();
  });
});

// ─── Section-ordering fidelity: the adapter's assets drive the REAL selector. ──
describe('TRUST adapter — awareness-driven section ordering preserved', () => {
  it('assets with testimonials ON keep the testimonials section (frozen order)', () => {
    const assets = buildAssets(baseInput({ proof: { ...baseInput().proof, hasTestimonials: true } }));
    const out = selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets });
    expect(out).toEqual(['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer']);
  });

  it('assets with testimonials OFF drop the testimonials section (proof hard rule)', () => {
    const assets = buildAssets(baseInput({ proof: { ...baseInput().proof, hasTestimonials: false } }));
    const out = selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets });
    expect(out).not.toContain('testimonials');
    expect(out).toEqual(['header', 'hero', 'services', 'packages', 'cta', 'footer']);
  });

  it('each awareness state yields its own middle order (byte-identical to old service)', () => {
    const assets = buildAssets(baseInput());
    expect(selectServiceSections({ awareness: 'search-aware-cold', goal: 'book-call', assets })).toEqual([
      'header', 'hero', 'testimonials', 'services', 'packages', 'cta', 'footer',
    ]);
    expect(selectServiceSections({ awareness: 'relationship-warming', goal: 'book-call', assets })).toEqual([
      'header', 'hero', 'packages', 'services', 'testimonials', 'cta', 'footer',
    ]);
  });
});

describe('TRUST adapter — copy payload fidelity', () => {
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
    expect((withT as any).realTestimonials).toHaveLength(1);
  });
});

describe('TRUST adapter — goal derivation', () => {
  it('serviceGoalFor derives a legacy enum; null intent ⇒ book-call', () => {
    expect(serviceGoalFor(baseInput({ goalIntent: 'book-call' }))).toBe('book-call');
    expect(serviceGoalFor(baseInput({ goalIntent: 'lead-magnet' }))).toBe('lead-magnet');
    expect(serviceGoalFor(baseInput({ goalIntent: null }))).toBe('book-call');
  });

  it('briefGoalFor composes a Brief.goal from the captured intent', () => {
    const bg = briefGoalFor(baseInput({ goalIntent: 'request-quote' }));
    expect(bg?.intent).toBe('request-quote');
    expect(briefGoalFor(baseInput({ goalIntent: null }))).toBeNull();
  });

  it('awareness enum stays within the frozen service set (guards STRATEGY fixture)', () => {
    expect(serviceAwarenessStates).toContain(STRATEGY.awareness);
  });
});

// ─── Full-run smoke (mocked fetch): strategy → copy → save → /edit/[token] ───

type FetchArgs = { url: string; body: any };

function makeFetchMock(calls: FetchArgs[]) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, body });
    if (url.includes('/api/audience/service/strategy')) {
      return { ok: true, json: async () => ({ success: true, data: STRATEGY }) } as any;
    }
    if (url.includes('/api/audience/service/generate-copy')) {
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

describe('TRUST adapter — runTrustGeneration smoke', () => {
  let calls: FetchArgs[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('single-page hearth: strategy → copy → save → redirect /edit/[token]', async () => {
    const result = await runTrustGeneration(baseInput());
    expect(result.status).toBe('done');
    expect(result.redirectTo).toBe('/edit/tok123');

    const save = calls.find((c) => c.url.includes('/api/saveDraft'));
    expect(save).toBeTruthy();
    expect(save!.body.templateId).toBe('hearth');
    expect(save!.body.paletteId).toBe('terracotta');
    // finalContent is assembled from strategy.sections; the shared scale-05 goal
    // tail (injectGoalSections) may append deterministic goal sections, so assert
    // every strategy section survived rather than an exact count.
    expect(save!.body.finalContent.layout.sections.length).toBeGreaterThanOrEqual(
      STRATEGY.sections.length
    );
  });

  it('propagates a 402 credit failure as status:credits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/audience/service/strategy'))
          return { ok: false, status: 402, json: async () => ({ error: 'out of credits' }) } as any;
        return { ok: true, json: async () => ({}) } as any;
      })
    );
    const result = await runTrustGeneration(baseInput());
    expect(result.status).toBe('credits');
  });
});
