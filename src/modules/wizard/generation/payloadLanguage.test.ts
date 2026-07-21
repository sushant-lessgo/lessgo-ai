// src/modules/wizard/generation/payloadLanguage.test.ts
// language-settings phase 3 — the SEAM test for first-generation language.
//
// ⚠️ THIS TEST EXISTS BECAUSE OF ONE SPECIFIC DEFECT (plan amendment A1): 3 of the
// 7 audience-route request bodies in thing.ts/trust.ts are built INLINE, not via
// the payload builders. A test that only exercised `buildStrategyPayload` /
// `buildCopyPayload` would sit GREEN while a Dutch site generated its root page
// in Dutch and every sub-page + collection item in English.
//
// So this file DRIVES THE ADAPTERS with a stubbed `fetch` and asserts the
// `language` field on EVERY request body that actually leaves the client:
//
//   #1 thing  /api/audience/product/strategy      (buildStrategyPayload)
//   #2 thing  /api/audience/product/generate-copy (buildCopyPayload, single page)
//   #3 thing  /api/audience/product/generate-copy (INLINE — multi-page fan-out)
//   #4 thing  /api/audience/product/generate-copy (INLINE — collection item)
//   #5 trust  /api/audience/service/strategy      (buildStrategyPayload)
//   #6 trust  /api/audience/service/generate-copy (buildCopyPayload)
//   #7 trust  /api/audience/service/generate-copy (INLINE — collection item)
//
// It also pins the persistence half: the ZERO-DIFF contract (no `localeConfig`
// key on ANY save body for English) and the declaration on every save site for a
// non-English pick.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProductStrategyOutput } from '@/types/product';
import type { ServiceStrategyOutputAssembled } from '@/types/service';

// runCollectionFanOut is DORMANT in production (no template declares a
// collection-family capability), so the collection-item call sites are
// unreachable through the real bridge. Override JUST that export to invoke the
// caller-supplied `generateItemCopy` once — the inline body under test is the
// caller's, so this proves the REAL request body, not a stand-in.
vi.mock('@/modules/generation/multiPageAssembly', async (importActual) => {
  const actual = await importActual<typeof import('@/modules/generation/multiPageAssembly')>();
  return {
    ...actual,
    runCollectionFanOut: vi.fn(async (opts: any) => {
      if (!opts.generateItemCopy) return { status: 'done' };
      const res = await opts.generateItemCopy({
        pageKey: 'work-item-1',
        pathSlug: '/work/item-1',
        collectionKey: 'works',
        entry: { name: 'Item One', slug: 'item-one' },
      });
      return res.status === 'done' ? { status: 'done' } : res;
    }),
  };
});

import { runStrategy, runThingGeneration, type ThingGenerationInput } from './thing';
import {
  runTrustStrategy,
  runTrustGeneration,
  type TrustGenerationInput,
} from './trust';
// phase 4 (reload gap): the store is driven for real — a fresh instance plus the
// persisted content is the only honest way to simulate a reload.
import { useWizardStore, buildThingInput, buildTrustInput } from '@/hooks/useWizardStore';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const PRODUCT_STRATEGY: ProductStrategyOutput = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  sections: ['header', 'hero', 'features', 'footer'],
  uiblocks: {
    header: 'MeridianHeader',
    hero: 'MeridianHero',
    features: 'MeridianFeatures',
    footer: 'MeridianFooter',
  },
};

const SERVICE_STRATEGY: ServiceStrategyOutputAssembled = {
  awareness: 'search-aware-comparing',
  oneClient: { who: 'w', coreDesire: 'd', corePain: 'p', pains: ['a'], desires: ['b'], objections: ['c'] },
  ourPosition: { promise: 'pr', approach: 'ap', credibility: 'cr' },
  servicePresentation: { format: 'packages', showProcess: true, showCaseStudies: false },
  sectionDecisions: {
    includeTransformation: false,
    includeProblem: false,
    includeApproach: false,
    isHighTouch: false,
  },
  uiblockDecisions: {},
  sections: ['header', 'hero', 'services', 'cta', 'footer'],
  uiblocks: {
    header: 'HearthHeader',
    hero: 'HearthHero',
    services: 'HearthServices',
    cta: 'HearthCta',
    footer: 'HearthFooter',
  },
};

function thingInput(over: Partial<ThingGenerationInput> = {}): ThingGenerationInput {
  return {
    tokenId: 'tok123',
    templateId: 'meridian',
    productName: 'Acme Deploy',
    oneLiner: 'Ship your app without babysitting the pipeline.',
    features: ['Auto deploys'],
    audiences: ['staff engineers'],
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

function trustInput(over: Partial<TrustGenerationInput> = {}): TrustGenerationInput {
  return {
    tokenId: 'tok123',
    templateId: 'hearth',
    businessTypeKey: 'agency',
    businessName: 'North Star Studio',
    oneLiner: 'Performance marketing for D2C brands that actually moves revenue.',
    targetClients: ['D2C founders'],
    services: ['Paid social'],
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

type FetchCall = { url: string; body: any };

function makeFetchMock(calls: FetchCall[]) {
  return vi.fn(async (url: string, init?: any) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
    if (url.includes('/api/loadDraft')) return { ok: true, json: async () => ({}) } as any;
    if (url.includes('/strategy')) {
      const data = url.includes('/product/') ? PRODUCT_STRATEGY : SERVICE_STRATEGY;
      return { ok: true, json: async () => ({ success: true, data }) } as any;
    }
    if (url.includes('/generate-copy')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          sections: { hero: { elements: { headline: 'H' } }, footer: { elements: {} } },
        }),
      } as any;
    }
    if (url.includes('/api/saveDraft')) return { ok: true, json: async () => ({}) } as any;
    return { ok: false, status: 500, json: async () => ({ error: 'unexpected' }) } as any;
  });
}

const copyCalls = (calls: FetchCall[], audience: 'product' | 'service') =>
  calls.filter((c) => c.url.includes(`/api/audience/${audience}/generate-copy`));
const strategyCalls = (calls: FetchCall[], audience: 'product' | 'service') =>
  calls.filter((c) => c.url.includes(`/api/audience/${audience}/strategy`));
const saveCalls = (calls: FetchCall[]) => calls.filter((c) => c.url.includes('/api/saveDraft'));

// A collections fact set — makes the (mocked) collection bridge fire so the
// INLINE item-copy bodies are actually built.
const COLLECTIONS = { works: [{ name: 'Item One', slug: 'item-one' }] } as any;

// ─── Call sites #1–#4: THING ───────────────────────────────────────────────

describe('language on payloads — THING (product) call sites', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('#1 strategy body carries the picked ISO code', async () => {
    await runStrategy(thingInput({ siteLanguage: 'nl' }));
    expect(strategyCalls(calls, 'product')).toHaveLength(1);
    expect(strategyCalls(calls, 'product')[0].body.language).toBe('nl');
  });

  it('#1 strategy body carries "en" when no language was picked (always present)', async () => {
    await runStrategy(thingInput());
    expect(strategyCalls(calls, 'product')[0].body).toHaveProperty('language', 'en');
  });

  it('#2 single-page copy body carries the picked ISO code', async () => {
    const res = await runThingGeneration(
      thingInput({ siteLanguage: 'nl', strategy: PRODUCT_STRATEGY })
    );
    expect(res.status).toBe('done');
    const copies = copyCalls(calls, 'product');
    expect(copies).toHaveLength(1);
    expect(copies[0].body.language).toBe('nl');
  });

  it('#3 MULTI-PAGE FAN-OUT: every per-page copy body carries the code (inline body)', async () => {
    const res = await runThingGeneration(
      thingInput({
        siteLanguage: 'nl',
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        strategy: PRODUCT_STRATEGY,
        sitemap: [
          { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
          { archetypeKey: 'about', title: 'About', pathSlug: '/about', sections: ['hero'] },
        ] as any,
      })
    );
    expect(res.status).toBe('done');
    const copies = copyCalls(calls, 'product');
    // One per sitemap page (2) + one collection item (the mocked bridge).
    expect(copies.length).toBeGreaterThanOrEqual(2);
    for (const c of copies) expect(c.body.language).toBe('nl');
  });

  it('#4 COLLECTION-ITEM FAN-OUT: the inline item body carries the code', async () => {
    const res = await runThingGeneration(
      thingInput({
        siteLanguage: 'nl',
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        strategy: PRODUCT_STRATEGY,
        collections: COLLECTIONS,
        sitemap: [
          { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
        ] as any,
      })
    );
    expect(res.status).toBe('done');
    const itemCopy = copyCalls(calls, 'product').find((c) => c.body.collectionKey === 'works');
    expect(itemCopy, 'the collection-item copy call must have fired').toBeTruthy();
    expect(itemCopy!.body.language).toBe('nl');
  });

  it('every product request body of a full multipage run carries language (no silent omission)', async () => {
    await runThingGeneration(
      thingInput({
        siteLanguage: 'nl',
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        collections: COLLECTIONS,
        sitemap: [
          { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
        ] as any,
      })
    );
    const audienceCalls = calls.filter((c) => c.url.includes('/api/audience/product/'));
    expect(audienceCalls.length).toBeGreaterThan(1);
    for (const c of audienceCalls) expect(c.body).toHaveProperty('language', 'nl');
  });
});

// ─── Call sites #5–#7: TRUST ───────────────────────────────────────────────

describe('language on payloads — TRUST (service) call sites', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('#5 strategy body carries the picked ISO code', async () => {
    await runTrustStrategy(trustInput({ siteLanguage: 'nl' }));
    expect(strategyCalls(calls, 'service')[0].body.language).toBe('nl');
  });

  it('#5 strategy body carries "en" when no language was picked', async () => {
    await runTrustStrategy(trustInput());
    expect(strategyCalls(calls, 'service')[0].body).toHaveProperty('language', 'en');
  });

  it('#6 copy body carries the picked ISO code', async () => {
    const res = await runTrustGeneration(
      trustInput({ siteLanguage: 'nl', strategy: SERVICE_STRATEGY })
    );
    expect(res.status).toBe('done');
    expect(copyCalls(calls, 'service')[0].body.language).toBe('nl');
  });

  it('#7 COLLECTION-ITEM FAN-OUT: the inline item body carries the code', async () => {
    const res = await runTrustGeneration(
      trustInput({ siteLanguage: 'nl', strategy: SERVICE_STRATEGY, collections: COLLECTIONS })
    );
    expect(res.status).toBe('done');
    const itemCopy = copyCalls(calls, 'service').find((c) => c.body.collectionKey === 'works');
    expect(itemCopy, 'the collection-item copy call must have fired').toBeTruthy();
    expect(itemCopy!.body.language).toBe('nl');
  });

  it('every service request body of a full run carries language (no silent omission)', async () => {
    await runTrustGeneration(trustInput({ siteLanguage: 'nl', collections: COLLECTIONS }));
    const audienceCalls = calls.filter((c) => c.url.includes('/api/audience/service/'));
    expect(audienceCalls.length).toBeGreaterThan(1);
    for (const c of audienceCalls) expect(c.body).toHaveProperty('language', 'nl');
  });
});

// ─── The ISO-code contract (the exonym mapping is server-side, phase 4) ────

describe('language payload value is the ISO CODE, never an exonym', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends "nl", not "Dutch" / "Nederlands"', async () => {
    await runStrategy(thingInput({ siteLanguage: 'nl' }));
    const body = strategyCalls(calls, 'product')[0].body;
    expect(body.language).toBe('nl');
    expect(JSON.stringify(body)).not.toContain('Dutch');
    expect(JSON.stringify(body)).not.toContain('Nederlands');
  });
});

// ─── Persistence: the localeConfig declaration + the zero-diff contract ────

describe('localeConfig declaration on the save bodies', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', makeFetchMock(calls));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ZERO-DIFF: an English thing run writes NO localeConfig key on ANY save body', async () => {
    await runThingGeneration(thingInput({ strategy: PRODUCT_STRATEGY }));
    const saves = saveCalls(calls);
    expect(saves.length).toBeGreaterThan(0);
    for (const s of saves) expect(s.body).not.toHaveProperty('localeConfig');
  });

  it('ZERO-DIFF: an English trust run writes NO localeConfig key on ANY save body', async () => {
    await runTrustGeneration(trustInput({ strategy: SERVICE_STRATEGY, collections: COLLECTIONS }));
    for (const s of saveCalls(calls)) expect(s.body).not.toHaveProperty('localeConfig');
  });

  it('a Dutch thing run declares the language on EVERY save body (single page)', async () => {
    await runThingGeneration(thingInput({ siteLanguage: 'nl', strategy: PRODUCT_STRATEGY }));
    const saves = saveCalls(calls);
    expect(saves.length).toBeGreaterThan(0);
    for (const s of saves) {
      expect(s.body.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
    }
  });

  it('a Dutch thing run declares the language on the multipage saveFC bodies too', async () => {
    await runThingGeneration(
      thingInput({
        siteLanguage: 'nl',
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        strategy: PRODUCT_STRATEGY,
        sitemap: [
          { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
        ] as any,
      })
    );
    const saves = saveCalls(calls);
    expect(saves.length).toBeGreaterThan(1); // skeleton + per-page + final
    for (const s of saves) {
      expect(s.body.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
    }
  });

  it('the TECHPREMIUM deterministic thing path also declares the language', async () => {
    await runThingGeneration(thingInput({ siteLanguage: 'nl', templateId: 'techpremium' }));
    const saves = saveCalls(calls);
    expect(saves).toHaveLength(1);
    expect(saves[0].body.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
  });

  it('a Dutch trust run declares the language on BOTH save sites', async () => {
    await runTrustGeneration(
      trustInput({ siteLanguage: 'nl', strategy: SERVICE_STRATEGY, collections: COLLECTIONS })
    );
    const saves = saveCalls(calls);
    expect(saves.length).toBeGreaterThan(0);
    for (const s of saves) {
      expect(s.body.localeConfig).toEqual({ locales: ['nl'], defaultLocale: 'nl' });
    }
  });

  it('an UNSUPPORTED code is never persisted (closed vocabulary) but still rides the payload', async () => {
    await runThingGeneration(thingInput({ siteLanguage: 'xx', strategy: PRODUCT_STRATEGY }));
    for (const s of saveCalls(calls)) expect(s.body).not.toHaveProperty('localeConfig');
    // The route validates the payload value server-side (phase 4) and falls back
    // to English — the client stays lenient and never 400s over language.
    expect(copyCalls(calls, 'product')[0].body.language).toBe('xx');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// language-settings phase 4 — THE RELOAD GAP (owed from phase 3)
//
// `siteLanguage` lives ONLY in the in-memory wizard store: `useWizardStore` has
// no `persist` middleware and `hydrate()` seeds from the Brief, which carries no
// locale. Identity is slot 1 of 8, so a reload — or a dashboard "Continue" —
// between picking Dutch and generating silently reset the field to `'en'` while
// `content.localeConfig` still said `nl`. That was INERT until phase 4 made the
// directive live; now it would generate an ENGLISH page on a project that
// DECLARES Dutch, and regen (which reads `defaultLocale` from the DB) would
// disagree with first-gen forever.
//
// TWO DOORS, both closed here, both driven through a SIMULATED RELOAD (a fresh
// store / a fresh `input`, plus the persisted content) rather than through a
// hand-set field:
//   (a) the store: `hydrate()` re-seeds `siteLanguage` from the persisted
//       `localeConfig` → every request body of the run carries it again;
//   (b) the multipage RESUME branch in thing.ts, which rebuilt every sibling
//       field from the persisted `ob` but took the language from the live
//       `input` — so an interrupted Dutch run finished half-translated.
// ═══════════════════════════════════════════════════════════════════════════

/** finalContent shaped so `isResumableGeneration` returns true. */
const RESUMABLE_FC = {
  pages: {},
  meta: { title: 'Acme Deploy', lastUpdated: 0 },
  generationProgress: { completedPageKeys: ['home'] },
  onboardingData: {
    sitemap: [
      { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
      { archetypeKey: 'about', title: 'About', pathSlug: '/about', sections: ['hero'] },
    ],
    strategy: PRODUCT_STRATEGY,
    productName: 'Acme Deploy',
    oneLiner: 'Ship your app without babysitting the pipeline.',
    offer: 'Start free',
    landingGoal: 'signup',
    businessTypeKey: 'manufacturer',
    understanding: { features: ['Auto deploys'] },
  },
};

/** As `makeFetchMock`, but loadDraft answers like a project that DECLARES nl. */
function makeReloadFetchMock(calls: FetchCall[], loadDraftBody: Record<string, unknown>) {
  const base = makeFetchMock(calls);
  return vi.fn(async (url: string, init?: any) => {
    if (url.includes('/api/loadDraft')) {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
      return { ok: true, json: async () => loadDraftBody } as any;
    }
    return base(url, init);
  });
}

const thingBrief = { copyEngine: 'thing', businessType: 'saas' } as any;

describe('reload gap (a) — the wizard store re-seeds siteLanguage from the DB', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
    useWizardStore.getState().reset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useWizardStore.getState().reset();
  });

  it('a FRESH store hydrated on a project that declares nl recovers siteLanguage', async () => {
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, { localeConfig: { locales: ['nl'], defaultLocale: 'nl' } })
    );
    // Simulated reload: brand-new store, no picker interaction, only the DB.
    expect(useWizardStore.getState().siteLanguage).toBe('en');
    useWizardStore.getState().hydrate({ tokenId: 'tok123', brief: thingBrief });
    await vi.waitFor(() => expect(useWizardStore.getState().siteLanguage).toBe('nl'));

    // …and it reaches the projection the thing adapter builds its payloads from.
    expect(buildThingInput(useWizardStore.getState()).siteLanguage).toBe('nl');
    expect(buildTrustInput(useWizardStore.getState()).siteLanguage).toBe('nl');
  });

  it('the recovered language reaches EVERY request body of the run (end to end)', async () => {
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, { localeConfig: { locales: ['nl'], defaultLocale: 'nl' } })
    );
    useWizardStore.getState().hydrate({ tokenId: 'tok123', brief: thingBrief });
    await vi.waitFor(() => expect(useWizardStore.getState().siteLanguage).toBe('nl'));

    const input = {
      ...thingInput({ strategy: PRODUCT_STRATEGY }),
      siteLanguage: buildThingInput(useWizardStore.getState()).siteLanguage,
    };
    calls.length = 0;
    await runThingGeneration(input);
    const audienceCalls = calls.filter((c) => c.url.includes('/api/audience/product/'));
    expect(audienceCalls.length).toBeGreaterThan(0);
    for (const c of audienceCalls) expect(c.body.language).toBe('nl');
  });

  it('an ENGLISH / legacy project is untouched — no clobbering, no false declaration', async () => {
    vi.stubGlobal('fetch', makeReloadFetchMock(calls, { localeConfig: null }));
    useWizardStore.getState().hydrate({ tokenId: 'tok123', brief: thingBrief });
    await vi.waitFor(() =>
      expect(calls.some((c) => c.url.includes('/api/loadDraft'))).toBe(true)
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(useWizardStore.getState().siteLanguage).toBe('en');
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(false);
  });

  it('a WORK project issues NO read at all — it has no siteLanguage to rehydrate', async () => {
    // Deliberate narrowing (not an oversight): the picker is thing/trust-only,
    // `buildWorkInput` carries no `siteLanguage`, and the work adapters derive
    // their language from the `languages` question. A work hydrate must stay
    // request-free — `useWizardStore.test.ts` pins the chargeless work seed as
    // literally zero fetches.
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, { localeConfig: { locales: ['nl'], defaultLocale: 'nl' } })
    );
    useWizardStore.getState().hydrate({
      tokenId: 'tok123',
      brief: { copyEngine: 'work', businessType: 'photographer' } as any,
      audienceType: 'service',
      templateId: 'atelier',
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(calls).toHaveLength(0);
    expect(useWizardStore.getState().siteLanguage).toBe('en');
  });

  it('a LIVE pick always beats the in-flight DB seed (no race clobber)', async () => {
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, { localeConfig: { locales: ['nl'], defaultLocale: 'nl' } })
    );
    useWizardStore.getState().hydrate({ tokenId: 'tok123', brief: thingBrief });
    // The user picks German before the loadDraft response resolves.
    useWizardStore.getState().setSiteLanguage('de');
    await new Promise((r) => setTimeout(r, 0));
    expect(useWizardStore.getState().siteLanguage).toBe('de');
  });
});

describe('reload gap (b) — the multipage RESUME branch uses the persisted declaration', () => {
  let calls: FetchCall[];
  beforeEach(() => {
    calls = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a resumed Dutch run does NOT half-translate: every remaining page body says nl', async () => {
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, {
        finalContent: RESUMABLE_FC,
        localeConfig: { locales: ['nl'], defaultLocale: 'nl' },
      })
    );
    // The reload reset the wizard store, so the LIVE input says English…
    const res = await runThingGeneration(
      thingInput({
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        strategy: PRODUCT_STRATEGY,
        // no siteLanguage — exactly what a fresh post-reload store produces
      })
    );
    expect(res.status).toBe('done');
    const copies = copyCalls(calls, 'product');
    expect(copies.length).toBeGreaterThan(0);
    // …but the persisted declaration wins, so the run finishes in Dutch.
    for (const c of copies) expect(c.body.language).toBe('nl');
  });

  it('a resumed run on a project with NO declaration keeps using the live input', async () => {
    vi.stubGlobal(
      'fetch',
      makeReloadFetchMock(calls, { finalContent: RESUMABLE_FC, localeConfig: null })
    );
    const res = await runThingGeneration(
      thingInput({
        templateId: 'vestria',
        businessTypeKey: 'manufacturer',
        strategy: PRODUCT_STRATEGY,
        siteLanguage: 'de',
      })
    );
    expect(res.status).toBe('done');
    const copies = copyCalls(calls, 'product');
    expect(copies.length).toBeGreaterThan(0);
    for (const c of copies) expect(c.body.language).toBe('de');
  });
});
