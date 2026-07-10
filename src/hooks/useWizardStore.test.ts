// src/hooks/useWizardStore.test.ts
// scale-06 phase 2 — unified Brief-backed wizard store.
// Covers: slot-machine transitions per engine (skips honored), hydration from
// brief fixtures, review/fill mode derivation, (scale-07 phase 3) the
// structure-slot strategy fetch action + its charge-once idempotency guard,
// and (scale-07 phase 4) the universal 7b gate: single-page structure state
// (locked/toggle/reorder), the clamp law, step-0 Brief→capability-section
// plumbing, and the trust GA wiring (structure slot + charge-once + toggled-off
// section ⇒ no copy).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Brief } from '@/types/brief';
import {
  useWizardStore,
  deriveMode,
  buildThingInput,
  buildTrustInput,
} from './useWizardStore';
import {
  assembleProductStrategy,
  clampSectionList,
} from '@/modules/audience/product/strategy/parseStrategyProduct';
import { lockedSectionsForEngine } from '@/modules/engines/inputContracts';
import { runTrustGeneration } from '@/modules/wizard/generation/trust';

/** Build a Brief with a partial EntryFacts payload at facts.entry. */
function briefWithEntry(entry: Record<string, unknown>, extra: Partial<Brief> = {}): Brief {
  return { facts: { entry }, ...extra } as Brief;
}

// Rich URL-entry thing brief (scrape prefilled everything a crawler can know).
const richThing = briefWithEntry(
  {
    rawInput: 'https://acme.app',
    businessName: 'Acme Invoicing',
    oneLiner: 'Invoicing software for freelancers that auto-chases late payments',
    audiences: ['freelance designers', 'developers'],
    offerings: ['auto-chase', 'recurring invoices'],
    offer: 'Free 14-day trial',
    outcomes: ['gets paid 40% faster'],
    testimonials: ['"Saved me hours." — Jane'],
  },
  {
    businessType: 'saas',
    copyEngine: 'thing',
    confidence: 0.9,
    goal: { intent: 'free-trial', mechanism: 'M3', param: { url: 'https://acme.app/signup' } },
  },
);

// Bare manual one-liner thing brief.
const bareThing = briefWithEntry(
  { rawInput: 'invoicing software for freelancers', oneLiner: 'invoicing software for freelancers' },
  { copyEngine: 'thing' },
);

const trustBrief = briefWithEntry(
  { rawInput: 'https://studio.co', businessName: 'Studio Co', oneLiner: 'growth marketing agency' },
  { businessType: 'agency', copyEngine: 'trust', confidence: 0.9 },
);

const workBrief = briefWithEntry(
  { rawInput: 'author of hindi fiction', oneLiner: 'author of hindi fiction' },
  { businessType: 'writer', copyEngine: 'work' },
);

beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('useWizardStore — hydration resolves engine/audience/template from Brief + serveGate', () => {
  it('resolves engine, businessTypeKey, audienceType, templateId', () => {
    useWizardStore.getState().hydrate({
      tokenId: 'tok123',
      brief: richThing,
      audienceType: 'product',
      templateId: 'meridian',
    });
    const s = useWizardStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.tokenId).toBe('tok123');
    expect(s.engine).toBe('thing');
    expect(s.businessTypeKey).toBe('saas');
    expect(s.audienceType).toBe('product');
    expect(s.templateId).toBe('meridian');
  });

  it('populates per-field state from the waterfall (scraped values, ask empties)', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    const { fields } = useWizardStore.getState();

    expect(fields.name.state).toBe('scraped');
    expect(fields.name.source).toBe('scraped');
    expect(fields.name.value).toBe('Acme Invoicing');
    expect(fields.name.confirmed).toBe(false);

    expect(fields.audience.state).toBe('scraped');
    expect(fields.audience.value).toEqual(['freelance designers', 'developers']);

    // differentiator is never scrape-inferable ⇒ ask + empty value.
    expect(fields.differentiator.state).toBe('ask');
    expect(fields.differentiator.source).toBe('user');
    expect(fields.differentiator.value).toBe('');
  });

  it('hydrates goal intent/param from brief.goal', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    const s = useWizardStore.getState();
    expect(s.goalIntent).toBe('free-trial');
    expect(s.goalParam).toEqual({ url: 'https://acme.app/signup' });
    expect(s.fields.goal.state).toBe('scraped');
  });

  it('seeds hasTestimonials from scraped testimonials', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().proof.hasTestimonials).toBe(true);
  });

  it('no-ops (no throw) when brief has no schema engine', () => {
    const noEngine = briefWithEntry({ rawInput: 'something', oneLiner: 'something' });
    useWizardStore.getState().hydrate({ brief: noEngine });
    const s = useWizardStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.engine).toBeNull();
    expect(s.slots).toEqual([]);
  });
});

describe('useWizardStore — slot machine (keyed by slot IDs, skips honored)', () => {
  it('thing keeps the full slot skeleton including structure', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    const { slots } = useWizardStore.getState();
    expect(slots).toEqual([
      'identity',
      'understanding',
      'goal',
      'offer',
      'proof',
      'style',
      'structure',
      'generating',
    ]);
  });

  it('trust slot order now INCLUDES structure (scale-07 phase 4 — 7b GA)', () => {
    useWizardStore.getState().hydrate({ brief: trustBrief, audienceType: 'service', templateId: 'surge' });
    const { slots } = useWizardStore.getState();
    expect(slots).toEqual([
      'identity',
      'understanding',
      'goal',
      'offer',
      'proof',
      'style',
      'structure',
      'generating',
    ]);
  });

  it('work skips the structure slot', () => {
    useWizardStore.getState().hydrate({ brief: workBrief, audienceType: 'writer', templateId: 'granth' });
    expect(useWizardStore.getState().slots).not.toContain('structure');
  });

  it('nextSlot / prevSlot walk the slot IDs', () => {
    const api = useWizardStore.getState();
    api.hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().currentSlot).toBe('identity');

    useWizardStore.getState().nextSlot();
    expect(useWizardStore.getState().currentSlot).toBe('understanding');

    useWizardStore.getState().nextSlot();
    expect(useWizardStore.getState().currentSlot).toBe('goal');

    useWizardStore.getState().prevSlot();
    expect(useWizardStore.getState().currentSlot).toBe('understanding');
  });

  it('nextSlot clamps at the last slot; prevSlot clamps at the first', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    for (let i = 0; i < 20; i++) useWizardStore.getState().nextSlot();
    expect(useWizardStore.getState().currentSlot).toBe('generating');
    for (let i = 0; i < 20; i++) useWizardStore.getState().prevSlot();
    expect(useWizardStore.getState().currentSlot).toBe('identity');
  });

  it('goToSlot honors membership; a skipped slot is a no-op', () => {
    useWizardStore.getState().hydrate({ brief: workBrief, audienceType: 'writer', templateId: 'granth' });
    useWizardStore.getState().goToSlot('proof');
    expect(useWizardStore.getState().currentSlot).toBe('proof');
    // structure is skipped for WORK ⇒ goToSlot must NOT move there.
    useWizardStore.getState().goToSlot('structure');
    expect(useWizardStore.getState().currentSlot).toBe('proof');
  });
});

describe('useWizardStore — review/fill mode derivation', () => {
  it('URL entry ⇒ review mode', () => {
    expect(deriveMode(richThing)).toBe('review');
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().mode).toBe('review');
  });

  it('bare host without protocol still ⇒ review mode', () => {
    const hostOnly = briefWithEntry({ rawInput: 'studio.co', oneLiner: 'agency' }, { copyEngine: 'trust' });
    expect(deriveMode(hostOnly)).toBe('review');
  });

  it('manual one-liner ⇒ fill mode', () => {
    expect(deriveMode(bareThing)).toBe('fill');
    useWizardStore.getState().hydrate({ brief: bareThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().mode).toBe('fill');
  });

  it('no entry facts ⇒ fill mode', () => {
    expect(deriveMode({} as Brief)).toBe('fill');
    expect(deriveMode(null)).toBe('fill');
  });
});

describe('useWizardStore — field + goal + brief-patch actions', () => {
  it('setFieldValue marks source user; confirmField flips confirmed', () => {
    useWizardStore.getState().hydrate({ brief: bareThing, audienceType: 'product', templateId: 'meridian' });
    useWizardStore.getState().setFieldValue('differentiator', 'set up in 2 minutes');
    let f = useWizardStore.getState().fields.differentiator;
    expect(f.value).toBe('set up in 2 minutes');
    expect(f.source).toBe('user');
    expect(f.confirmed).toBe(false);

    useWizardStore.getState().confirmField('differentiator');
    f = useWizardStore.getState().fields.differentiator;
    expect(f.confirmed).toBe(true);
  });

  it('buildBriefPatch composes brief.goal via intentToBriefGoal', () => {
    const api = useWizardStore.getState();
    api.setGoalIntent('book-call');
    api.setGoalParam({ phone: '+1 555 0100' });
    const patch = useWizardStore.getState().buildBriefPatch();
    expect(patch.goal?.intent).toBe('book-call');
    // M2 wa.me composition from a phone param (scale-05 bridge behavior).
    expect(patch.goal?.mechanism).toBe('M2');
    expect(patch.goal?.destination).toContain('wa.me');
  });

  it('reset clears state back to empty', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    useWizardStore.getState().reset();
    const s = useWizardStore.getState();
    expect(s.hydrated).toBe(false);
    expect(s.engine).toBeNull();
    expect(s.slots).toEqual([]);
    expect(s.fields).toEqual({});
    expect(s.goalIntent).toBeNull();
    expect(s.strategyStatus).toBe('idle');
    expect(s.strategy).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// scale-07 phase 3 — structure-slot strategy fetch (charge-once guard)
// ---------------------------------------------------------------------------

const MOCK_SITEMAP = [
  { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'contact'] },
  { archetypeKey: 'catalog', title: 'Products', pathSlug: '/products', sections: ['catalog'] },
];
const MOCK_STRATEGY = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: [], desire: [], objections: [] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [],
  sections: ['header', 'hero', 'footer'],
  uiblocks: { header: 'H', hero: 'He', footer: 'F' },
  sitemap: MOCK_SITEMAP,
};

/** fetch stub counting /strategy calls (the CHARGED route). */
function stubStrategyFetch(
  respond: () => Promise<any> = async () => ({
    ok: true,
    json: async () => ({ success: true, data: MOCK_STRATEGY }),
  })
) {
  const spy = vi.fn(async (url: string) => {
    if (url.includes('/api/audience/product/strategy')) return respond();
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', spy);
  const strategyCalls = () =>
    spy.mock.calls.filter(([u]) => String(u).includes('/api/audience/product/strategy')).length;
  return { spy, strategyCalls };
}

describe('useWizardStore — fetchStrategy (structure-slot strategy sourcing)', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok123', brief: richThing, audienceType: 'product', templateId: 'vestria' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('populates strategy + sitemap via one charged call; status → done', async () => {
    const { strategyCalls } = stubStrategyFetch();
    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();
    expect(strategyCalls()).toBe(1);
    expect(s.strategyStatus).toBe('done');
    expect(s.strategy).toEqual(MOCK_STRATEGY);
    expect(s.sitemap).toEqual(MOCK_SITEMAP);
    expect(s.strategyError).toBeNull();
  });

  it('IDEMPOTENT after done: a second call (back-navigation remount) never refetches — no double charge', async () => {
    const { strategyCalls } = stubStrategyFetch();
    await useWizardStore.getState().fetchStrategy();
    await useWizardStore.getState().fetchStrategy();
    await useWizardStore.getState().fetchStrategy();
    expect(strategyCalls()).toBe(1);
    expect(useWizardStore.getState().strategyStatus).toBe('done');
  });

  it('IDEMPOTENT while in flight: concurrent calls collapse to one charged fetch', async () => {
    const { strategyCalls } = stubStrategyFetch();
    await Promise.all([
      useWizardStore.getState().fetchStrategy(),
      useWizardStore.getState().fetchStrategy(),
    ]);
    expect(strategyCalls()).toBe(1);
  });

  it('pre-seeded strategy ⇒ marks done WITHOUT any network call', async () => {
    const { strategyCalls } = stubStrategyFetch();
    useWizardStore.getState().setStrategy(MOCK_STRATEGY);
    await useWizardStore.getState().fetchStrategy();
    expect(strategyCalls()).toBe(0);
    expect(useWizardStore.getState().strategyStatus).toBe('done');
  });

  it('never clobbers a user-edited sitemap already in the store', async () => {
    stubStrategyFetch();
    const edited = [{ archetypeKey: 'home', title: 'Edited', pathSlug: '/', sections: ['hero'] }];
    useWizardStore.getState().setSitemap(edited);
    await useWizardStore.getState().fetchStrategy();
    expect(useWizardStore.getState().sitemap).toEqual(edited);
  });

  it('402 ⇒ status error + strategyCreditsError; retry is allowed and refetches', async () => {
    const { strategyCalls } = stubStrategyFetch(async () => ({
      ok: false,
      status: 402,
      json: async () => ({ error: 'out of credits' }),
    }));
    await useWizardStore.getState().fetchStrategy();
    let s = useWizardStore.getState();
    expect(s.strategyStatus).toBe('error');
    expect(s.strategyCreditsError).toBe(true);
    expect(s.strategy).toBeNull();

    // Retry (error status re-arms the guard).
    await useWizardStore.getState().fetchStrategy();
    expect(strategyCalls()).toBe(2);
  });

  it('generic failure ⇒ status error with message; strategyCreditsError stays false', async () => {
    stubStrategyFetch(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'ai_error', message: 'AI generation failed' }),
    }));
    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();
    expect(s.strategyStatus).toBe('error');
    expect(s.strategyCreditsError).toBe(false);
    expect(s.strategyError).toBe('AI generation failed');
  });
});

describe('useWizardStore — buildThingInput projection (shared by fetchStrategy + GeneratingSlot)', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('projects fields + strategy/sitemap from state', () => {
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok123', brief: richThing, audienceType: 'product', templateId: 'meridian' });
    useWizardStore.getState().setStrategy(MOCK_STRATEGY);
    useWizardStore.getState().setSitemap(MOCK_SITEMAP);

    const input = buildThingInput(useWizardStore.getState());
    expect(input.tokenId).toBe('tok123');
    expect(input.templateId).toBe('meridian');
    expect(input.productName).toBe('Acme Invoicing');
    expect(input.audiences).toEqual(['freelance designers', 'developers']);
    expect(input.goalIntent).toBe('free-trial');
    expect(input.proof).toEqual({ hasTestimonials: true });
    expect(input.strategy).toEqual(MOCK_STRATEGY);
    expect(input.sitemap).toEqual(MOCK_SITEMAP);
  });
});

// ===========================================================================
// scale-07 phase 4 — universal 7b gate (single-page mode + clamp law + trust GA)
// ===========================================================================

// A SINGLE-PAGE thing strategy (meridian — no sitemap key).
const SP_STRATEGY = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: [], desire: [], objections: [] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [],
  sections: ['header', 'hero', 'features', 'testimonials', 'footer'],
  uiblocks: { header: 'H', hero: 'He', features: 'Fe', testimonials: 'Te', footer: 'Fo' },
};

// An assembled TRUST strategy (hearth canonical 7).
const TRUST_STRATEGY = {
  awareness: 'search-aware-comparing',
  oneClient: { who: 'w', coreDesire: 'd', corePain: 'p', pains: [], desires: [], objections: [] },
  ourPosition: { promise: 'pr', approach: 'ap', credibility: 'cr' },
  servicePresentation: { format: 'packages', showProcess: true, showCaseStudies: false },
  sectionDecisions: {
    includeTransformation: false,
    includeProblem: false,
    includeApproach: false,
    isHighTouch: false,
  },
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

describe('lockedSectionsForEngine — required (non-toggleable) sections per engine', () => {
  it('thing locks hero + features; testimonials stays toggleable (dropTarget)', () => {
    expect(lockedSectionsForEngine('thing')).toEqual(['hero', 'features']);
  });

  it('trust locks hero + services + cta; testimonials/packages stay toggleable', () => {
    expect(lockedSectionsForEngine('trust')).toEqual(['hero', 'services', 'cta']);
  });
});

describe('clampSectionList — the single-page clamp law (clampSitemap generalized)', () => {
  const canonical = ['header', 'hero', 'features', 'testimonials', 'footer'];
  const locked = ['hero', 'features'];

  it('drops unknown sections (no adds beyond canonical)', () => {
    expect(clampSectionList(['hero', 'pirate', 'features'], canonical, locked)).toEqual([
      'header', 'hero', 'features', 'footer',
    ]);
  });

  it('dedupes duplicates (first wins)', () => {
    expect(
      clampSectionList(['hero', 'features', 'features', 'testimonials'], canonical, locked)
    ).toEqual(['header', 'hero', 'features', 'testimonials', 'footer']);
  });

  it('forces locked sections present at their canonical relative position', () => {
    expect(clampSectionList(['testimonials'], canonical, locked)).toEqual([
      'header', 'hero', 'features', 'testimonials', 'footer',
    ]);
  });

  it('forces hero first', () => {
    expect(clampSectionList(['features', 'testimonials', 'hero'], canonical, locked)).toEqual([
      'header', 'hero', 'features', 'testimonials', 'footer',
    ]);
  });

  it('chrome is law-forced from canonical, never user-controlled', () => {
    // Proposal tries to move footer first and drop header — both ignored.
    expect(clampSectionList(['footer', 'hero', 'features'], canonical, locked)).toEqual([
      'header', 'hero', 'features', 'footer',
    ]);
  });

  it('empty/absent proposal ⇒ canonical (default accept)', () => {
    expect(clampSectionList([], canonical, locked)).toEqual(canonical);
    expect(clampSectionList(null, canonical, locked)).toEqual(canonical);
  });

  it('honors user reorder of non-locked sections', () => {
    const canon7 = ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'];
    expect(
      clampSectionList(['hero', 'testimonials', 'services', 'packages', 'cta'], canon7, [
        'hero', 'services', 'cta',
      ])
    ).toEqual(['header', 'hero', 'testimonials', 'services', 'packages', 'cta', 'footer']);
  });
});

describe('assembleProductStrategy — step-0 Brief plumbing (meridian regains cta/pricing)', () => {
  const LLM = {
    awareness: 'solution-aware-skeptical',
    oneReader: { personaDescription: 'p', pain: [], desire: [], objections: [] },
    oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
    featureAnalysis: [],
  } as any;

  it('no brief ⇒ bare engine core (phase-2 interim behavior preserved)', () => {
    const out = assembleProductStrategy({ llmResponse: LLM, templateId: 'meridian' });
    expect(out.sections).toEqual(['header', 'hero', 'features', 'testimonials', 'footer']);
  });

  it('M1 Brief + packages capability ⇒ single-page list INCLUDES cta AND pricing', () => {
    const m1Brief = {
      businessType: 'saas',
      copyEngine: 'thing',
      goal: { intent: 'book-call', mechanism: 'M1' },
    } as unknown as Brief;
    const out = assembleProductStrategy({
      llmResponse: LLM,
      templateId: 'meridian',
      brief: m1Brief,
      requiredCapabilities: ['packages'],
    });
    expect(out.sections).toContain('cta'); // lead-form capability (M1) → cta
    expect(out.sections).toContain('pricing'); // packages capability → pricing
    // Capability sections get real block mappings too.
    expect(out.uiblocks.cta).toBeTruthy();
    expect(out.uiblocks.pricing).toBeTruthy();
  });
});

describe('useWizardStore — single-page 7b structure (thing/meridian)', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok123', brief: richThing, audienceType: 'product', templateId: 'meridian' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/api/audience/product/strategy')) {
          return { ok: true, json: async () => ({ success: true, data: SP_STRATEGY }) };
        }
        return { ok: true, json: async () => ({}) };
      })
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('single-page fetch seeds structureSections (body, chrome stripped); no sitemap', async () => {
    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();
    expect(s.strategyStatus).toBe('done');
    expect(s.sitemap).toBeNull();
    expect(s.structureSections).toEqual(['hero', 'features', 'testimonials']);
    expect(s.structureDisabled).toEqual([]);
  });

  it('locked sections (hero/features) can NOT be toggled off — state-level enforcement', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('hero');
    useWizardStore.getState().toggleStructureSection('features');
    expect(useWizardStore.getState().structureDisabled).toEqual([]);
  });

  it('toggling testimonials OFF removes it from the copy payload (sections AND uiblocks)', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('testimonials');
    expect(useWizardStore.getState().structureDisabled).toEqual(['testimonials']);

    const input = buildThingInput(useWizardStore.getState());
    expect(input.strategy?.sections).toEqual(['header', 'hero', 'features', 'footer']);
    expect(input.strategy?.uiblocks).not.toHaveProperty('testimonials');
    expect(input.sitemap).toBeNull();
  });

  it('toggle is reversible (re-enable a proposed section — never an add)', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('testimonials');
    useWizardStore.getState().toggleStructureSection('testimonials');
    expect(useWizardStore.getState().structureDisabled).toEqual([]);
    const input = buildThingInput(useWizardStore.getState());
    expect(input.strategy?.sections).toEqual(SP_STRATEGY.sections);
  });

  it('unknown section toggle is a no-op (membership fixed by the proposal)', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('pirate');
    expect(useWizardStore.getState().structureDisabled).toEqual([]);
  });

  it('reorder: hero pinned first; other sections swap; order reaches the payload', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().moveStructureSection(0, 1); // hero — refused
    expect(useWizardStore.getState().structureSections).toEqual(['hero', 'features', 'testimonials']);
    useWizardStore.getState().moveStructureSection(2, -1); // into hero slot? no — swaps 1↔2
    expect(useWizardStore.getState().structureSections).toEqual(['hero', 'testimonials', 'features']);
    useWizardStore.getState().moveStructureSection(1, -1); // would displace hero — refused
    expect(useWizardStore.getState().structureSections).toEqual(['hero', 'testimonials', 'features']);

    const input = buildThingInput(useWizardStore.getState());
    expect(input.strategy?.sections).toEqual(['header', 'hero', 'testimonials', 'features', 'footer']);
  });

  it('default accept (no edits) leaves the strategy byte-identical', async () => {
    await useWizardStore.getState().fetchStrategy();
    const input = buildThingInput(useWizardStore.getState());
    expect(input.strategy?.sections).toEqual(SP_STRATEGY.sections);
    expect(input.strategy?.uiblocks).toEqual(SP_STRATEGY.uiblocks);
  });
});

describe('useWizardStore + trust adapter — trust 7b GA (charge-once + toggled-off ⇒ no copy)', () => {
  let calls: Array<{ url: string; body: any }>;

  const stubTrustFetch = () => {
    calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: any) => {
        const body = init?.body ? JSON.parse(init.body) : undefined;
        calls.push({ url: String(url), body });
        if (String(url).includes('/api/audience/service/strategy')) {
          return { ok: true, json: async () => ({ success: true, data: TRUST_STRATEGY }) };
        }
        if (String(url).includes('/api/audience/service/generate-copy')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              sections: { hero: { elements: { headline: 'H' } } },
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      })
    );
  };
  const strategyCalls = () =>
    calls.filter((c) => c.url.includes('/api/audience/service/strategy')).length;

  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokTrust', brief: trustBrief, audienceType: 'service', templateId: 'hearth' });
    // The strategy/copy routes are stubbed, but keep the projection non-degenerate.
    useWizardStore.getState().setFieldValue('services', ['Paid social']);
    useWizardStore.getState().setFieldValue('whoProblem', ['D2C founders']);
    useWizardStore.getState().setFieldValue('offer', 'Book a free audit');
    stubTrustFetch();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchStrategy (trust) charges once, seeds the single-page gate list, and is idempotent', async () => {
    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();
    expect(strategyCalls()).toBe(1);
    expect(s.strategyStatus).toBe('done');
    expect(s.structureSections).toEqual(['hero', 'services', 'testimonials', 'packages', 'cta']);

    await useWizardStore.getState().fetchStrategy(); // back-navigation remount
    expect(strategyCalls()).toBe(1);
  });

  it('CHARGE-ONCE end-to-end: generation consumes the pre-gate strategy — zero refetch', async () => {
    await useWizardStore.getState().fetchStrategy();
    expect(strategyCalls()).toBe(1);

    // GeneratingSlot-equivalent projection: buildTrustInput forwards the
    // gate-fetched strategy (scale-07 phase 5 — the trust.ts bridge is gone).
    const result = await runTrustGeneration(buildTrustInput(useWizardStore.getState()));
    expect(result.status).toBe('done');
    expect(strategyCalls()).toBe(1); // still exactly one charged strategy call
  });

  it('ACCEPTANCE: testimonials toggled off ⇒ ZERO testimonial copy (absent from the copy payload)', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('testimonials');

    const result = await runTrustGeneration(buildTrustInput(useWizardStore.getState()));
    expect(result.status).toBe('done');
    expect(strategyCalls()).toBe(1);

    const copyCall = calls.find((c) => c.url.includes('/api/audience/service/generate-copy'));
    expect(copyCall).toBeTruthy();
    expect(copyCall!.body.strategy.sections).toEqual([
      'header', 'hero', 'services', 'packages', 'cta', 'footer',
    ]);
    expect(copyCall!.body.strategy.uiblocks).not.toHaveProperty('testimonials');
    expect(copyCall!.body.uiblocks).not.toHaveProperty('testimonials');
  });

  it('locked trust sections (hero/services/cta) can never be toggled off', async () => {
    await useWizardStore.getState().fetchStrategy();
    useWizardStore.getState().toggleStructureSection('hero');
    useWizardStore.getState().toggleStructureSection('services');
    useWizardStore.getState().toggleStructureSection('cta');
    expect(useWizardStore.getState().structureDisabled).toEqual([]);
  });

  it('structure-skipping fallback: no pre-gate strategy ⇒ generation self-fetches ONCE', async () => {
    // No fetchStrategy call (e.g. a resumed/legacy flow) — store strategy null,
    // so the projection forwards nothing and the adapter self-fetches once.
    const result = await runTrustGeneration(buildTrustInput(useWizardStore.getState()));
    expect(result.status).toBe('done');
    expect(strategyCalls()).toBe(1);
  });
});

// ===========================================================================
// scale-10 phase 4 — 7b collection channel (rename / remove / add + patch)
// ===========================================================================

// A thing brief carrying BOTH a sibling fact (facts.entry) AND a scraped
// products collection (facts.collections.products). Eight verbatim entries.
const PRODUCT_NAMES = [
  'Alpha Sensor',
  'Beta Sensor',
  'Gamma Hub',
  'Delta Relay',
  'Epsilon Node',
  'Zeta Gateway',
  'Eta Bridge',
  'Theta Module',
];
function collectionsThing(): Brief {
  return {
    facts: {
      entry: {
        rawInput: 'https://hw.io',
        businessName: 'HW Co',
        oneLiner: 'industrial IoT sensors',
      },
      collections: {
        products: PRODUCT_NAMES.map((name) => ({ name })),
      },
    },
    businessType: 'manufacturer',
    copyEngine: 'thing',
    confidence: 0.9,
  } as unknown as Brief;
}

describe('useWizardStore — 7b collection channel', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokC', brief: collectionsThing(), audienceType: 'product', templateId: 'meridian' });
  });

  it('seeds collections from facts.collections verbatim, slugs code-derived', () => {
    const { collections } = useWizardStore.getState();
    expect(collections.products).toHaveLength(8);
    expect(collections.products?.[0]).toEqual({ name: 'Alpha Sensor', slug: 'alpha-sensor' });
  });

  it('removeCollectionEntry: removing 2 of 8 leaves 6', () => {
    const api = useWizardStore.getState();
    api.removeCollectionEntry('products', 0);
    api.removeCollectionEntry('products', 0);
    expect(useWizardStore.getState().collections.products).toHaveLength(6);
    expect(useWizardStore.getState().collections.products?.[0].name).toBe('Gamma Hub');
  });

  it('renameCollectionEntry re-derives the slug from the new name', () => {
    useWizardStore.getState().renameCollectionEntry('products', 0, 'Omega Sensor Pro');
    const e = useWizardStore.getState().collections.products?.[0];
    expect(e).toEqual({ name: 'Omega Sensor Pro', slug: 'omega-sensor-pro' });
  });

  it('addCollectionEntry appends a name-only entry with a derived slug', () => {
    useWizardStore.getState().addCollectionEntry('products', 'New Widget');
    const list = useWizardStore.getState().collections.products!;
    expect(list).toHaveLength(9);
    expect(list[8]).toEqual({ name: 'New Widget', slug: 'new-widget' });
  });

  it('addCollectionEntry initializes an absent (empty required) collection', () => {
    useWizardStore.getState().addCollectionEntry('services', 'Consulting');
    expect(useWizardStore.getState().collections.services).toEqual([
      { name: 'Consulting', slug: 'consulting' },
    ]);
  });

  it('empty/whitespace add + rename are no-ops', () => {
    const api = useWizardStore.getState();
    api.addCollectionEntry('products', '   ');
    expect(useWizardStore.getState().collections.products).toHaveLength(8);
    api.renameCollectionEntry('products', 0, '  ');
    expect(useWizardStore.getState().collections.products?.[0].name).toBe('Alpha Sensor');
  });

  it('buildBriefPatch carries edited collections AND preserves sibling facts.entry', () => {
    const api = useWizardStore.getState();
    api.removeCollectionEntry('products', 0);
    api.renameCollectionEntry('products', 0, 'Beta Sensor v2');
    api.addCollectionEntry('products', 'New Widget');

    const patch = useWizardStore.getState().buildBriefPatch();
    // Sibling fact survives the shallow BriefSchema.partial() saveDraft merge.
    expect(patch.facts).toBeDefined();
    expect((patch.facts as any).entry).toEqual({
      rawInput: 'https://hw.io',
      businessName: 'HW Co',
      oneLiner: 'industrial IoT sensors',
    });
    // Edited collections ride the same facts object.
    const products = (patch.facts as any).collections.products;
    expect(products).toHaveLength(8); // 8 − 1 removed + 1 added
    expect(products[0]).toEqual({ name: 'Beta Sensor v2', slug: 'beta-sensor-v2' });
    expect(products[7]).toEqual({ name: 'New Widget', slug: 'new-widget' });
  });

  it('buildBriefPatch omits facts when there are no collections (siblings untouched)', () => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokB', brief: bareThing, audienceType: 'product', templateId: 'meridian' });
    const patch = useWizardStore.getState().buildBriefPatch();
    expect(patch.facts).toBeUndefined();
  });
});
