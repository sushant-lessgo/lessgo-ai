// Generation contract: the P0 "no broken/empty page" guard.
//
// scale-06 phase 11 — the product + service fixtures now run through the ONE
// unified engine (`runGeneration`, the phase-5 dispatch) instead of the old
// per-audience module paths, and a WRITER fixture is added:
//  - THING  → runGeneration('thing')  → product strategy/copy routes
//  - TRUST  → runGeneration('trust')  → service strategy/copy routes
//  - WORK   → runGeneration('work')   → deterministic Granth path (no LLM)
//
// The adapters call the audience routes over `fetch`; a FAITHFUL fetch mock
// stands in for those routes by invoking the SAME mock generator + processing
// pipeline the routes run (generateMock*Strategy → generateMock*Copy →
// process*Copy). So the copy that flows into the assembled finalContent is the
// REAL processed content, and the schema guard keeps its teeth — it just now
// travels through the unified engine. The saved finalContent is captured from
// the /api/saveDraft body so we can assert every routed uiblock is covered.
//
// Runs two ways:
//  - MOCK (always): the faithful-route path above — zero network/credits.
//  - GOLDEN (when present): validates frozen real-LLM captures in
//    e2e/fixtures/generated/*.json (produced by scripts/captureGenerationFixture).
//    Skipped cleanly when no captures exist yet.

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { validateGeneratedContent } from './contentValidator';
import { serviceElementSchema } from '@/modules/audience/service/elementSchema';
import { meridianElementSchema, productElementSchema } from '@/modules/audience/product/elementSchema';
import {
  generateMockServiceStrategy,
  generateMockServiceCopy,
} from '@/modules/prompt/mockResponseGeneratorService';
import {
  generateMockMeridianStrategy,
  generateMockMeridianCopy,
} from '@/modules/prompt/mockResponseGeneratorProduct';
import { processServiceCopy } from '@/modules/audience/service/parseCopy';
import { processProductCopy } from '@/modules/audience/product/parseCopy';
import { buildProductCopyPrompt } from '@/modules/audience/product/copyPrompt';
import { buildServiceCopyPrompt } from '@/modules/audience/service/copyPrompt';
import type { ServiceUnderstandingInput, ServiceAssetInput } from '@/types/service';
import { runGeneration } from '@/modules/wizard/generation';
import {
  buildStrategyPayload,
  buildCopyPayload,
  type ThingGenerationInput,
} from '@/modules/wizard/generation/thing';
import type { TrustGenerationInput } from '@/modules/wizard/generation/trust';
import type { WorkGenerationInput } from '@/modules/wizard/generation/work';

/** Recursively assert every object with an `id` field has a non-empty one. */
function assertIdsBackfilled(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(assertIdsBackfilled);
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('id' in obj) expect(obj.id, `empty id on ${JSON.stringify(obj).slice(0, 60)}`).toBeTruthy();
    Object.values(obj).forEach(assertIdsBackfilled);
  }
}

/** True if the assembled finalContent carries a section for every routed type. */
function coversEverySection(finalContent: any, sectionTypes: string[]): boolean {
  const ids = Object.keys(finalContent?.content ?? {});
  return sectionTypes.every((type) => ids.some((id) => id.startsWith(`${type}-`)));
}

const SCHEMAS = {
  service: serviceElementSchema,
  product: meridianElementSchema,
  // scale-08 phase 5 — the manufacturer/Vestria golden (captureGolden writes
  // schema 'vestria'). productElementSchema covers meridian + vestria layouts,
  // so a captured vestria fixture revalidates against the right element set.
  vestria: productElementSchema,
} as const;

// ---------------------------------------------------------------------------
// Faithful route mocks — reproduce the audience routes' internals so the copy
// that reaches the unified engine is REAL processed content (schema-checkable).
// ---------------------------------------------------------------------------

interface Captured {
  uiblocks?: Record<string, string>;
  sections?: string[];
  processed?: Record<string, any>;
  finalContent?: any;
}

function stubProductFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({}) } as any; // not resumable
    }
    if (url.includes('/api/audience/product/strategy')) {
      const strategy = generateMockMeridianStrategy({
        productName: body.productName,
        oneLiner: body.oneLiner,
        features: body.features,
        primaryAudience: body.primaryAudience,
        templateId: body.templateId,
        proof: body.proof,
      });
      cap.uiblocks = strategy.uiblocks;
      cap.sections = strategy.sections;
      return { ok: true, json: async () => ({ success: true, data: strategy }) } as any;
    }
    if (url.includes('/api/audience/product/generate-copy')) {
      const raw = generateMockMeridianCopy({
        strategy: body.strategy,
        uiblocks: body.uiblocks,
        productName: body.productName,
        oneLiner: body.oneLiner,
        offer: body.offer,
      });
      const processed = processProductCopy(raw, body.uiblocks);
      cap.processed = processed;
      return { ok: true, json: async () => ({ success: true, sections: processed }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

function stubServiceFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    if (url.includes('/api/audience/service/strategy')) {
      const strategy = generateMockServiceStrategy({
        oneLiner: body.oneLiner,
        understanding: body.understanding,
        goal: body.goal,
        offer: body.offer,
        assets: body.assets,
        templateId: body.templateId,
      });
      cap.uiblocks = strategy.uiblocks;
      cap.sections = strategy.sections;
      return { ok: true, json: async () => ({ success: true, data: strategy }) } as any;
    }
    if (url.includes('/api/audience/service/generate-copy')) {
      const raw = generateMockServiceCopy({
        strategy: body.strategy,
        uiblocks: body.uiblocks,
        oneLiner: body.oneLiner,
        offer: body.offer,
      });
      const processed = processServiceCopy(raw, body.uiblocks);
      cap.processed = processed;
      return { ok: true, json: async () => ({ success: true, sections: processed }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

// ---------------------------------------------------------------------------
// THING (product / Meridian) through the unified engine.
// ---------------------------------------------------------------------------

function thingInput(): ThingGenerationInput {
  return {
    tokenId: 'contract-thing',
    templateId: 'meridian',
    productName: 'Meridian',
    oneLiner: 'A deploy platform for teams that ship daily.',
    features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
    audiences: ['Staff engineers at fast-shipping startups'],
    categories: [],
    offer: 'Free to start',
    goalIntent: 'signup-free',
    goalParam: {},
    proof: { hasTestimonials: true }, // promised ⇒ keeps the testimonials section
    strategy: null,
    sitemap: null,
  };
}

describe('generation contract — THING via runGeneration (product / Meridian)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', stubProductFetch(cap));
    const result = await runGeneration('thing', thingInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green end-to-end (strategy → copy → save)', () => {
    expect(status).toBe('done');
    expect(cap.processed).toBeTruthy();
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(cap.uiblocks!)) {
      expect(cap.processed![sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(cap.processed!, cap.uiblocks!, meridianElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids recursively (incl. nested footer links)', () => {
    assertIdsBackfilled(cap.processed);
  });

  it('the assembled finalContent covers every routed section', () => {
    expect(coversEverySection(cap.finalContent, cap.sections!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TRUST (service / Hearth+Lex) through the unified engine.
// ---------------------------------------------------------------------------

function trustInput(): TrustGenerationInput {
  return {
    tokenId: 'contract-trust',
    templateId: 'hearth',
    businessTypeKey: 'agency',
    businessName: 'North Star Studio',
    oneLiner: 'A six-week brand studio for DTC founders.',
    targetClients: ['DTC founders at $300k-$2M ARR'],
    services: ['Brand identity', 'Packaging', 'Website refresh'],
    process: 'Strategy-first sprints with a single point of contact',
    credentials: 'Multiple DTC brand launches',
    offer: 'Fixed-price brand identity in six weeks',
    outcomes: ['Launch-ready in 4 weeks'],
    goalIntent: 'book-call',
    goalParam: {},
    proof: {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  };
}

describe('generation contract — TRUST via runGeneration (service / Hearth+Lex)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', stubServiceFetch(cap));
    const result = await runGeneration('trust', trustInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green end-to-end (strategy → copy → save)', () => {
    expect(status).toBe('done');
    expect(cap.processed).toBeTruthy();
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(cap.uiblocks!)) {
      expect(cap.processed![sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(cap.processed!, cap.uiblocks!, serviceElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids (no duplicate React keys)', () => {
    assertIdsBackfilled(cap.processed);
  });

  it('the assembled finalContent covers every routed section', () => {
    expect(coversEverySection(cap.finalContent, cap.sections!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// WORK (writer / Granth) through the unified engine — deterministic, no LLM.
// The work engine skips strategy/copy entirely and builds the fixed Granth
// scaffold; the guard asserts a valid Granth finalContent shape.
// ---------------------------------------------------------------------------

function workFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    // Load-detection defense: the adapter asserts the persisted template is granth.
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({ templateId: 'granth' }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

const WORK_UPLOADS = [
  'https://cdn.example.com/cover-1.jpg',
  'https://cdn.example.com/cover-2.jpg',
  'https://cdn.example.com/cover-3.jpg',
];

function workInput(): WorkGenerationInput {
  return {
    tokenId: 'contract-work',
    templateId: 'granth',
    writerName: 'Test Poet',
    oneLiner: 'A Hindi poet and essayist',
    works: WORK_UPLOADS,
  };
}

describe('generation contract — WORK via runGeneration (writer / Granth)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', workFetch(cap));
    const result = await runGeneration('work', workInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green (deterministic Granth path, no strategy/copy call)', () => {
    expect(status).toBe('done');
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a valid Granth finalContent shape (6 sections, flat layout+content+meta)', () => {
    const fc = cap.finalContent;
    expect(Array.isArray(fc.layout.sections)).toBe(true);
    expect(fc.layout.sections.length).toBe(6);
    expect(Object.keys(fc.content).length).toBe(6);
    expect(fc.meta?.title).toBe('Test Poet');
    // Every listed section id resolves to a content block with a Granth layout.
    for (const id of fc.layout.sections) {
      expect(fc.content[id], `missing content for ${id}`).toBeTruthy();
      expect(String(fc.content[id].layout)).toMatch(/^Granth/);
    }
  });

  it('threads the wizard work uploads onto the book shelf as covers', () => {
    const fc = cap.finalContent;
    const shelf = Object.values(fc.content as Record<string, any>).find(
      (s: any) => s.layout === 'GranthJacketShelf'
    ) as any;
    expect(shelf, 'no GranthJacketShelf section').toBeTruthy();
    const covers = shelf.elements.items.map((it: any) => it.cover_image);
    for (const url of WORK_UPLOADS) {
      expect(covers).toContain(url);
    }
  });

  it('backfills collection ids (books / facts / quotes / socials)', () => {
    assertIdsBackfilled(cap.finalContent);
  });
});

// ---------------------------------------------------------------------------
// scale-08 phase 5 — businessType ENTRY contract (fixture-free, always in CI).
//
// Proves the thing engine is keyed on the businessType CONFIG ENTRY, not on a
// templateId literal:
//  (a) a manufacturer-entry input remaps its captured fields (valueAdds→features,
//      industriesServed→otherAudiences, productCategories→categories, +whatYouMake)
//      and carries brief.businessType / businessType through BOTH payload builders;
//  (b) a saas input never leaks whatYouMake (no manufacturer remap);
//  (c) an `app` input (a scale-08 phase-3 CONFIG-ONLY entry) produces a payload
//      shape IDENTICAL to saas — proving a new business type rides the existing
//      pipeline with zero new code (only the businessType tag differs).
//
// Uses the REAL exported builders (thing.ts) — no fetch, no LLM, no fixture.
// ---------------------------------------------------------------------------

/** A SaaS-shaped thing input (extractionSchemaKey 'thing' ⇒ no manufacturer remap). */
function saasThingInput(businessTypeKey: 'saas' | 'app'): ThingGenerationInput {
  return {
    tokenId: `contract-${businessTypeKey}`,
    templateId: 'meridian',
    businessTypeKey,
    productName: 'Streakly',
    oneLiner: 'A habit tracker that turns daily streaks into a shared game.',
    features: ['Streak sharing', 'Gentle nudges', 'Weekly recap'],
    audiences: ['People who bounce off rigid productivity apps', 'Accountability-buddy pairs'],
    categories: ['Productivity', 'Habits'],
    offer: 'Free with an optional Pro tier',
    goalIntent: 'signup-free',
    goalParam: {},
    strategy: null,
    sitemap: null,
  };
}

/** A manufacturer-shaped input (extractionSchemaKey 'manufacturer' ⇒ field remap). */
function manufacturerThingInput(): ThingGenerationInput {
  return {
    tokenId: 'contract-manufacturer',
    templateId: 'vestria',
    businessTypeKey: 'manufacturer',
    productName: 'Brasswright',
    oneLiner: 'Hand-finished brass hardware for premium furniture makers.',
    // Generic SaaS fields are DELIBERATELY populated to prove the remap ignores
    // them in favour of the manufacturer-captured fields below.
    features: ['generic-feature-should-be-ignored'],
    audiences: ['generic-audience-should-be-ignored'],
    categories: ['generic-category-should-be-ignored'],
    offer: 'Request a sample kit',
    whatYouMake: 'Solid-brass furniture hardware',
    valueAdds: ['No plating flake', 'Custom finishes at MOQ 500', 'Export-ready packing'],
    industriesServed: ['Furniture brands', 'Interior contractors'],
    productCategories: ['Pulls & knobs', 'Hinges'],
    goalIntent: 'enquiry',
    goalParam: {},
    strategy: null,
    sitemap: null,
  };
}

/** Minimal strategy stub — buildCopyPayload only reads `.uiblocks` + passes it through. */
const STRATEGY_STUB = { uiblocks: { hero: 'VestriaTailoredHero' } } as any;

describe('generation contract — businessType ENTRY payloads (fixture-free)', () => {
  it('manufacturer entry remaps captured fields + carries brief.businessType', () => {
    const input = manufacturerThingInput();
    const strat = buildStrategyPayload(input);
    // valueAdds win over the generic feature list.
    expect(strat.features).toEqual(input.valueAdds);
    // industriesServed → otherAudiences; productCategories → categories.
    expect(strat.otherAudiences).toEqual(input.industriesServed);
    expect(strat.categories).toEqual(input.productCategories);
    // manufacturer-only field present.
    expect(strat.whatYouMake).toBe('Solid-brass furniture hardware');
    // voice source carried on the brief.
    expect((strat.brief as any)?.businessType).toBe('manufacturer');

    const copy = buildCopyPayload(input, STRATEGY_STUB);
    expect(copy.features).toEqual(input.valueAdds);
    expect(copy.businessType).toBe('manufacturer');
  });

  it('saas entry carries businessType but NEVER leaks whatYouMake (no remap)', () => {
    const input = saasThingInput('saas');
    const strat = buildStrategyPayload(input);
    expect(strat.features).toEqual(input.features);
    expect(strat.categories).toEqual(input.categories);
    // no manufacturer remap ⇒ no whatYouMake key at all.
    expect('whatYouMake' in strat).toBe(false);
    expect((strat.brief as any)?.businessType).toBe('saas');

    const copy = buildCopyPayload(input, STRATEGY_STUB);
    expect('whatYouMake' in copy).toBe(false);
    expect(copy.businessType).toBe('saas');
  });

  it('app entry (config-only) produces a payload shape identical to saas', () => {
    const saas = saasThingInput('saas');
    const app = saasThingInput('app');
    // Only the businessTypeKey differs between the two inputs.
    const saasStrat = buildStrategyPayload(saas);
    const appStrat = buildStrategyPayload(app);
    const saasCopy = buildCopyPayload(saas, STRATEGY_STUB);
    const appCopy = buildCopyPayload(app, STRATEGY_STUB);

    // Same key set — no extra pipeline field appears for `app`.
    expect(Object.keys(appStrat).sort()).toEqual(Object.keys(saasStrat).sort());
    expect(Object.keys(appCopy).sort()).toEqual(Object.keys(saasCopy).sort());

    // Byte-identical once the businessType tag is normalised — the ONLY diff.
    const TAG = '__biz__';
    const normStrat = (p: Record<string, unknown>) => ({
      ...p,
      brief: { ...(p.brief as any), businessType: TAG },
    });
    expect(normStrat(appStrat)).toEqual(normStrat(saasStrat));
    expect({ ...appCopy, businessType: TAG }).toEqual({ ...saasCopy, businessType: TAG });
  });
});

// ---------------------------------------------------------------------------
// proof-truth phase 2 — the copy prompt must forbid named companies / hard
// metrics in AI-drafted proof, both per-element (on proof-shaped fields) and as
// a global RULE. Asserts the guard text on the thing (product) + trust (service)
// prompts for a proof-bearing section.
// ---------------------------------------------------------------------------

// A distinctive slice of the per-element guard appended in formatElement().
const PER_ELEMENT_GUARD_MARK = 'plausible-generic only';
// A distinctive slice of the global RULES prohibition (the F2 repro class).
const GLOBAL_GUARD_MARK = '284% ROI for GlowSkin';

describe('proof-truth phase 2 — prompt forbids named companies / hard metrics in proof', () => {
  it('THING (product) copy prompt carries per-element + global proof guards', () => {
    const strategy = generateMockMeridianStrategy({
      productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.',
      features: ['Auto deploys', 'Instant rollbacks'],
      primaryAudience: 'Staff engineers',
      proof: { hasTestimonials: true }, // ⇒ testimonials section present
    });
    // Sanity: the proof section actually routed (else the per-element guard can't fire).
    expect(Object.keys(strategy.uiblocks)).toContain('testimonials');

    const prompt = buildProductCopyPrompt({
      strategy,
      uiblocks: strategy.uiblocks,
      productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.',
      offer: 'Free to start',
      landingGoal: 'signup' as any,
      features: ['Auto deploys', 'Instant rollbacks'],
    });

    expect(prompt).toContain(PER_ELEMENT_GUARD_MARK);
    expect(prompt).toContain(GLOBAL_GUARD_MARK);
  });

  it('TRUST (service) copy prompt carries per-element + global proof guards', () => {
    const understanding: ServiceUnderstandingInput = {
      serviceType: 'agency',
      whatYouDo: 'Brand and web studio for DTC founders',
      services: ['Brand identity', 'Packaging'],
      targetClients: ['DTC founders'],
      outcomes: ['Launch-ready in 4 weeks'],
      deliveryModel: 'remote',
    };
    const assets: ServiceAssetInput = {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    };
    const oneLiner = 'A six-week brand studio for DTC founders.';
    const offer = 'Fixed-price brand identity in six weeks';
    const strategy = generateMockServiceStrategy({
      oneLiner,
      understanding,
      goal: 'book-call',
      offer,
      assets,
    });
    // Sanity: a proof-bearing section (testimonials / casestudies) routed.
    const secs = Object.keys(strategy.uiblocks);
    expect(secs.some((s) => s === 'testimonials' || s === 'casestudies')).toBe(true);

    const prompt = buildServiceCopyPrompt({
      strategy,
      uiblocks: strategy.uiblocks,
      oneLiner,
      offer,
      goal: 'book-call',
      understanding,
    });

    expect(prompt).toContain(PER_ELEMENT_GUARD_MARK);
    expect(prompt).toContain(GLOBAL_GUARD_MARK);
  });
});

// Regression for [facts-ignored]: the user-entered services/offer reached the
// prompt only as a buried comma line with no instruction to USE them, so the model
// invented its own services. The fix surfaces them as a source-of-truth block +
// explicit binding rules. These assertions fail on the pre-fix prompt.
describe('facts-ignored — service copy prompt binds services + offer to user input', () => {
  const understanding: ServiceUnderstandingInput = {
    serviceType: 'photographer',
    whatYouDo: 'Editorial and portrait photography for brands and families',
    services: ['Editorial portraits', 'Family sessions', 'Brand shoots'],
    targetClients: ['DTC founders', 'Families'],
    outcomes: ['Gallery in 2 weeks'],
    deliveryModel: 'in-person',
  };
  const oneLiner = 'A portrait studio for brands and families.';
  const offer = 'Book a 90-minute portrait session';

  const strategy = generateMockServiceStrategy({
    oneLiner,
    understanding,
    goal: 'book-call',
    offer,
    assets: {
      hasTestimonials: true,
      hasClientLogos: false,
      hasOutcomes: true,
      hasCaseStudies: false,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  });

  const prompt = buildServiceCopyPrompt({
    strategy,
    uiblocks: strategy.uiblocks,
    oneLiner,
    offer,
    goal: 'book-call',
    understanding,
  });

  it('surfaces every stated service as its own line under a source-of-truth block', () => {
    expect(prompt).toContain('SERVICES THE PROVIDER OFFERS');
    for (const svc of understanding.services) {
      expect(prompt).toContain(`- ${svc}`);
    }
  });

  it('binds the CTA to the stated offer', () => {
    expect(prompt).toContain('Bind the CTA to the stated offer');
    expect(prompt).toContain(offer);
  });

  it('instructs one card per stated service when a services section routes', () => {
    // Only assert the section-scoped rule when a services section is actually present.
    if (strategy.sections.includes('services')) {
      expect(prompt).toContain('one "services" card per stated service');
      expect(prompt).toContain('no invented services');
    }
  });
});

// ---- Golden real-LLM captures (opt-in, present only after a real capture run) ----
const goldenDir = path.resolve(process.cwd(), 'e2e/fixtures/generated');
const goldenFiles = fs.existsSync(goldenDir)
  ? fs.readdirSync(goldenDir).filter((f) => f.endsWith('.json'))
  : [];

describe.skipIf(goldenFiles.length === 0)('generation contract — GOLDEN real-LLM captures', () => {
  it.each(goldenFiles)('%s satisfies its element schema', (file) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(goldenDir, file), 'utf8'));
    const schema = SCHEMAS[fixture.schema as keyof typeof SCHEMAS];
    expect(schema, `unknown schema "${fixture.schema}" in ${file}`).toBeTruthy();
    const errors = validateGeneratedContent(fixture.sections, fixture.uiblocks, schema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });
});
