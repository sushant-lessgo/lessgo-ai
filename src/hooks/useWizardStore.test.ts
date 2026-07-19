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
  briefSignalFromState,
} from './useWizardStore';
import { isMultipage } from '@/modules/audience/product/pageArchetypes';
import {
  assembleProductStrategy,
  clampSectionList,
} from '@/modules/audience/product/strategy/parseStrategyProduct';
import { lockedSectionsForEngine } from '@/modules/engines/inputContracts';
import { emptyCollectionNodeAllowed } from '@/modules/collections/registry';
import { runTrustGeneration } from '@/modules/wizard/generation/trust';
import { buildBriefDraft, type EntrySignals } from '@/modules/brief/classify';
import { decideServe } from '@/modules/brief/serveGate';

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

// atelier phase 2 — a served WORK brief WITHOUT a businessType so `isMultipage`
// is decided by the picked template's capability alone. Paired with a multipage
// template (vestria, synthetic — atelier doesn't exist until phase 4) it stands
// in for a work+multipage combo; paired with granth it stays single-page.
const workNoBizBrief = briefWithEntry(
  { rawInput: 'kundius photography', oneLiner: 'portrait photographer' },
  { copyEngine: 'work' },
);

// atelier phase 5 — a REAL served photographer+atelier brief (businessType
// carries the multi structureDefault). This is the reachable served path now
// that atelier declares `multipage` (phase 4) + ships archetypes (phase 5).
const photographerAtelierBrief = briefWithEntry(
  { rawInput: 'kundius photography', oneLiner: 'editorial wedding photographer' },
  { businessType: 'photographer', copyEngine: 'work' },
);

// atelier phase 5 (fix-first) — the REACHABLE bug case: classify.ts stamps EVERY
// brief with a bare UNCONFIRMED `structure:{ mode, pages: [] }` hint (the raw AI
// guess). A served photographer the AI read as single-page carries mode:'single'
// with NO sections/pageDetails. hydrate must NOT let this suppress the structure
// slot (it is unconfirmed) — both derivations must still resolve multipage.
const photographerAtelierRawSingleHint = briefWithEntry(
  { rawInput: 'kundius photography', oneLiner: 'editorial wedding photographer' },
  {
    businessType: 'photographer',
    copyEngine: 'work',
    structure: { mode: 'single', pages: [] },
  } as Partial<Brief>,
);

// A CONFIRMED single structure (real 7b write — carries sections). This MUST
// still correctly stay single (both derivations honor an explicit confirmed
// single), proving the fix didn't break the legitimate single path.
const photographerAtelierConfirmedSingle = briefWithEntry(
  { rawInput: 'kundius photography', oneLiner: 'editorial wedding photographer' },
  {
    businessType: 'photographer',
    copyEngine: 'work',
    structure: { mode: 'single', sections: ['hero', 'work', 'footer'] },
  } as Partial<Brief>,
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

describe('useWizardStore — proof prefill numeric filter (phase 1)', () => {
  // thing `realNumbers` (field.id) is the ONLY field the numeric-or-empty rule
  // applies to. The shared `outcomes` prefillKey feeding trust/work stays raw.
  it('realNumbers prefill drops non-numeric entries, keeps numeric ones', () => {
    const brief = briefWithEntry(
      {
        rawInput: 'https://acme.app',
        businessName: 'Acme',
        oneLiner: 'invoicing software for freelancers',
        outcomes: ['cut churn by 30%', 'ISO 9001 certified', 'days to minutes', 'trusted by teams'],
      },
      { businessType: 'saas', copyEngine: 'thing', confidence: 0.9 },
    );
    useWizardStore.getState().hydrate({ brief, audienceType: 'product', templateId: 'meridian' });
    // Keeps entries containing a digit; drops purely qualitative ones.
    expect(useWizardStore.getState().fields.realNumbers.value).toEqual([
      'cut churn by 30%',
      'ISO 9001 certified',
    ]);
  });

  it('realNumbers prefill with empty outcomes → []', () => {
    const brief = briefWithEntry(
      {
        rawInput: 'https://acme.app',
        businessName: 'Acme',
        oneLiner: 'invoicing software for freelancers',
        outcomes: [],
      },
      { businessType: 'saas', copyEngine: 'thing', confidence: 0.9 },
    );
    useWizardStore.getState().hydrate({ brief, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().fields.realNumbers.value).toEqual([]);
  });

  it('trust `outcomes` prefill passes through UNFILTERED (shared field, qualitative)', () => {
    const brief = briefWithEntry(
      {
        rawInput: 'https://studio.co',
        businessName: 'Studio Co',
        oneLiner: 'growth marketing agency',
        outcomes: ['helped clients grow', 'award-winning creative team'],
      },
      { businessType: 'agency', copyEngine: 'trust', confidence: 0.9 },
    );
    useWizardStore.getState().hydrate({ brief, audienceType: 'service', templateId: 'surge' });
    // No digit in either entry, yet both survive — the filter is scoped to
    // field.id === 'realNumbers' (thing), never the shared prefillKey.
    expect(useWizardStore.getState().fields.outcomes.value).toEqual([
      'helped clients grow',
      'award-winning creative team',
    ]);
  });
});

describe('useWizardStore — slot machine (keyed by slot IDs, skips honored)', () => {
  // onboarding-fixes phase 2 — thing templates WITHOUT real style controls skip
  // the `style` slot (no dead step); vestria (real pickers) keeps it.
  it('thing + a non-vestria template (meridian) SKIPS the style slot', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    const { slots } = useWizardStore.getState();
    expect(slots).toEqual([
      'identity',
      'understanding',
      'goal',
      'offer',
      'proof',
      'structure',
      'generating',
    ]);
    expect(slots).not.toContain('style');
    expect(slots).toHaveLength(7);
  });

  it('thing + vestria INCLUDES the style slot (real pickers)', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'vestria' });
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
    expect(slots).toContain('style');
    expect(slots).toHaveLength(8);
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
    // onboarding-fixes phase 2 — trust keeps style (real pickers); count unchanged.
    expect(slots).toContain('style');
    expect(slots).toHaveLength(8);
  });

  it('work skips the structure slot but KEEPS style (thing-only style skip)', () => {
    useWizardStore.getState().hydrate({ brief: workBrief, audienceType: 'writer', templateId: 'granth' });
    const { slots } = useWizardStore.getState();
    expect(slots).not.toContain('structure');
    // onboarding-fixes phase 2 — the style skip is thing-only; work is unchanged.
    expect(slots).toContain('style');
    expect(slots).toHaveLength(7);
  });

  // atelier phase 2 — the structure skip is now TEMPLATE-aware for work.
  it('work + a NON-multipage template (granth) STILL skips structure — granth unchanged', () => {
    useWizardStore.getState().hydrate({ brief: workNoBizBrief, audienceType: 'writer', templateId: 'granth' });
    expect(useWizardStore.getState().slots).not.toContain('structure');
  });

  it('work + a multipage template (vestria, synthetic) INCLUDES structure', () => {
    // vestria declares the `multipage` capability; the brief has no businessType,
    // so capability alone decides ⇒ isMultipage true ⇒ the skip is dropped.
    useWizardStore.getState().hydrate({ brief: workNoBizBrief, audienceType: 'service', templateId: 'vestria' });
    expect(useWizardStore.getState().slots).toContain('structure');
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

describe('useWizardStore — enter-at-slot (engineDecider Phase 4)', () => {
  // (a) The reviewer flag: entering at `understanding` skips the `identity` slot
  // (name + one-liner already captured at D1) — but the businessName MUST still be
  // hydrated, else generation loses it. hydrate prefills EVERY contract field
  // regardless of the entry slot, so `fields['name']` carries the scraped value.
  it('enter-at-understanding hydrates businessName (identity skipped, name NOT lost)', () => {
    useWizardStore.getState().hydrate({
      brief: richThing,
      audienceType: 'product',
      templateId: 'meridian',
      initialSlot: 'understanding',
    });
    const s = useWizardStore.getState();
    expect(s.currentSlot).toBe('understanding');
    // identity IS in the slot list (skipped, not removed) — proving we jumped it.
    expect(s.slots[0]).toBe('identity');
    // The name captured at D1 is present even though identity is never shown.
    expect(s.fields['name'].value).toBe('Acme Invoicing');
    expect(s.fields['oneLiner'].value).toBeTruthy();
  });

  // (b) goToSlot / prevSlot are INDEX-based and clamped; entering at `understanding`
  // must FLOOR back-nav there so `identity` (the name/one-liner re-ask) is
  // unreachable. Basics stay reachable only via an explicit edit.
  it('prevSlot from the enter-at-understanding entry is floored — never re-enters identity', () => {
    useWizardStore.getState().hydrate({
      brief: richThing,
      audienceType: 'product',
      templateId: 'meridian',
      initialSlot: 'understanding',
    });
    expect(useWizardStore.getState().currentSlot).toBe('understanding');
    expect(useWizardStore.getState().slotFloorIndex).toBe(
      useWizardStore.getState().slots.indexOf('understanding')
    );
    // Hammer prevSlot: it clamps at the floor, never falling into identity.
    for (let i = 0; i < 5; i++) useWizardStore.getState().prevSlot();
    expect(useWizardStore.getState().currentSlot).toBe('understanding');
    expect(useWizardStore.getState().currentSlot).not.toBe('identity');
  });

  it('normal entry (no initialSlot) still starts at identity and prevSlot reaches it', () => {
    useWizardStore.getState().hydrate({ brief: richThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().currentSlot).toBe('identity');
    expect(useWizardStore.getState().slotFloorIndex).toBe(0);
    useWizardStore.getState().nextSlot();
    useWizardStore.getState().prevSlot();
    expect(useWizardStore.getState().currentSlot).toBe('identity');
  });

  it('initialSlot that is slot-0 or a non-member is a no-op (slot-0 entry preserved)', () => {
    // identity is slot 0 ⇒ no raise.
    useWizardStore.getState().hydrate({
      brief: richThing, audienceType: 'product', templateId: 'meridian', initialSlot: 'identity',
    });
    expect(useWizardStore.getState().currentSlot).toBe('identity');
    expect(useWizardStore.getState().slotFloorIndex).toBe(0);
    useWizardStore.getState().reset();
    // structure is SKIPPED for WORK ⇒ not a member ⇒ no-op, starts at identity.
    useWizardStore.getState().hydrate({
      brief: workBrief, audienceType: 'writer', templateId: 'granth', initialSlot: 'structure',
    });
    expect(useWizardStore.getState().currentSlot).toBe('identity');
    expect(useWizardStore.getState().slotFloorIndex).toBe(0);
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

  // proof-truth phase 5 — approximate testimonial count (manual path).
  it('defaults testimonialCount to null and omits it from the thing proof patch', () => {
    useWizardStore.getState().hydrate({ brief: bareThing, audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().proof.testimonialCount).toBeNull();
    const input = buildThingInput(useWizardStore.getState());
    expect('testimonialCount' in (input.proof ?? {})).toBe(false);
  });

  it('carries a set testimonialCount into the thing proof patch; clearing to null drops it', () => {
    useWizardStore.getState().hydrate({ brief: bareThing, audienceType: 'product', templateId: 'meridian' });
    useWizardStore.getState().setProof({ hasTestimonials: true, testimonialCount: 4 });
    expect(useWizardStore.getState().proof.testimonialCount).toBe(4);
    expect(buildThingInput(useWizardStore.getState()).proof).toEqual({
      hasTestimonials: true,
      testimonialCount: 4,
    });

    useWizardStore.getState().setProof({ testimonialCount: null });
    expect('testimonialCount' in (buildThingInput(useWizardStore.getState()).proof ?? {})).toBe(false);
  });

  it('carries testimonialCount into the trust proof projection (always present, null default)', () => {
    useWizardStore.getState().hydrate({ brief: bareThing, audienceType: 'service', templateId: 'hearth' });
    expect(buildTrustInput(useWizardStore.getState()).proof.testimonialCount).toBeNull();
    useWizardStore.getState().setProof({ testimonialCount: 8 });
    expect(buildTrustInput(useWizardStore.getState()).proof.testimonialCount).toBe(8);
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
  it('thing locks hero + features + cta; testimonials stays toggleable (dropTarget)', () => {
    // cta locked at the gate (F8) though it is not in the frozen thing engine-core.
    expect(lockedSectionsForEngine('thing')).toEqual(['hero', 'features', 'cta']);
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

  // collections-entry-capture phase 3 (P3) — the one-liner reachability round-trip.
  // A bare manual entry has NO site → NO extraction → empty `facts.collections`.
  // The 7b node still surfaces an empty engine-declared node (StructureSlot union),
  // so a hand `+ Add` (addCollectionEntry) must survive buildBriefPatch into
  // `facts.collections` with a code-derived slug — proving the manual add→Brief
  // path end-to-end without the human gate.
  it('P3 round-trip: manual add on an empty one-liner entry reaches facts.collections with a derived slug', () => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokP3', brief: bareThing, audienceType: 'product', templateId: 'meridian' });

    // Nothing seeded (no site → no extraction).
    expect(useWizardStore.getState().collections.products).toBeUndefined();

    // The manual `+ Add` the empty 7b node exposes.
    useWizardStore.getState().addCollectionEntry('products', 'Widget -- Co');

    const patch = useWizardStore.getState().buildBriefPatch();
    const products = (patch.facts as any)?.collections?.products;
    expect(products).toEqual([{ name: 'Widget -- Co', slug: 'widget-co' }]);
  });
});

// ===========================================================================
// atelier phase 2 — served work→multipage SKELETON path
// ===========================================================================
// The gate everywhere is `isMultipage(templateId, briefSignal)` — the PICKED
// template's multipage capability — NEVER `engine === 'work'` alone. Granth
// declares no `multipage`, so every new gate is false for it and its served
// writer flow (structure skip + fetchStrategy early-return) is byte-for-byte
// unchanged. These tests prove both sides of each gate.
describe('useWizardStore — served work→multipage skeleton path (atelier phase 2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('(gate) isMultipage is FALSE for granth and TRUE for a multipage template — the dispatch key', () => {
    // GeneratingSlot dispatch + slot inclusion + fetchStrategy all key on this.
    expect(isMultipage('granth', undefined)).toBe(false);
    expect(isMultipage('vestria', undefined)).toBe(true);
  });

  it('fetchStrategy (work + multipage) seeds the sitemap from archetype defaults with ZERO fetch/charge', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokW', brief: workNoBizBrief, audienceType: 'service', templateId: 'vestria' });

    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();

    expect(spy).not.toHaveBeenCalled(); // no LLM, no credit charge
    expect(s.strategyStatus).toBe('done');
    expect(s.strategy).toBeNull(); // copy-gen stays OUT — no strategy object
    expect(Array.isArray(s.sitemap)).toBe(true);
    expect((s.sitemap as unknown[]).length).toBeGreaterThan(0);
    expect((s.sitemap as any[])[0].archetypeKey).toBe('home');
  });

  it('fetchStrategy (work + multipage) is idempotent — a second call never re-seeds or charges', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokW', brief: workNoBizBrief, audienceType: 'service', templateId: 'vestria' });

    await useWizardStore.getState().fetchStrategy();
    const firstMap = useWizardStore.getState().sitemap;
    await useWizardStore.getState().fetchStrategy();

    expect(spy).not.toHaveBeenCalled();
    expect(useWizardStore.getState().sitemap).toBe(firstMap); // same reference
    expect(useWizardStore.getState().strategyStatus).toBe('done');
  });

  it('fetchStrategy (work + SINGLE-PAGE granth) still early-returns — no seed, no fetch, status stays idle', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokG', brief: workBrief, audienceType: 'writer', templateId: 'granth' });

    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();

    expect(spy).not.toHaveBeenCalled();
    expect(s.sitemap).toBeNull();
    expect(s.strategyStatus).toBe('idle'); // work single-page never reaches 'done' here
  });

  it('(dispatch) work + multipage ⇒ skeleton path; work + single-page ⇒ writer generator', () => {
    // Mirrors GeneratingSlot's `engine === 'work' && isWorkMultipage()` decision.
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokW', brief: workNoBizBrief, audienceType: 'service', templateId: 'vestria' });
    const multi = useWizardStore.getState();
    expect(isMultipage(multi.templateId ?? undefined, briefSignalFromState(multi))).toBe(true);

    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokG', brief: workBrief, audienceType: 'writer', templateId: 'granth' });
    const single = useWizardStore.getState();
    expect(isMultipage(single.templateId ?? undefined, briefSignalFromState(single))).toBe(false);
  });
});

// ===========================================================================
// atelier phase 5 — the REAL served photographer+atelier path
// ===========================================================================
// Now that atelier declares `multipage` + ships archetypes and photographers
// default to `multi`, prove the phase-2 machinery fires on a REAL template — and
// (phase-2 CARRY) that the TWO multipage derivations AGREE: slot inclusion keys
// off the full `brief` at hydrate, while fetchStrategy/dispatch key off
// `briefSignalFromState(store)`. For a photographer+atelier brief both must
// resolve TRUE (else the structure slot shows but the skeleton declines, or
// vice-versa).
describe('useWizardStore — served photographer+atelier path (atelier phase 5)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('(c) wizard slot list for work + atelier INCLUDES structure', () => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokA', brief: photographerAtelierBrief, audienceType: 'service', templateId: 'atelier' });
    expect(useWizardStore.getState().slots).toContain('structure');
  });

  it('(CARRY) both multipage derivations AGREE for photographer+atelier — full-brief slot inclusion AND briefSignalFromState dispatch gate both TRUE', () => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokA', brief: photographerAtelierBrief, audienceType: 'service', templateId: 'atelier' });
    const s = useWizardStore.getState();
    // Derivation 1 (slotsForEngine at hydrate keys off the full brief).
    expect(s.slots).toContain('structure');
    // Derivation 2 (fetchStrategy / GeneratingSlot dispatch keys off briefSignalFromState).
    expect(isMultipage(s.templateId ?? undefined, briefSignalFromState(s))).toBe(true);
    // The signal the store reconstructs must carry the photographer businessType.
    expect(briefSignalFromState(s)).toMatchObject({ businessType: 'photographer' });
  });

  it('(fix-first) a bare UNCONFIRMED classify single hint does NOT suppress the structure slot — both derivations AGREE multipage', () => {
    // This is the case the earlier no-structure proof missed: classify stamped
    // `structure:{ mode:'single', pages:[] }`. Pre-fix, slotsForEngine read the
    // RAW brief (→ single → skip), while the dispatch derivation went multipage
    // → zero-page skeleton. Post-fix both key off the confirmed-only signal.
    useWizardStore.getState().reset();
    useWizardStore.getState().hydrate({
      tokenId: 'tokRaw',
      brief: photographerAtelierRawSingleHint,
      audienceType: 'service',
      templateId: 'atelier',
    });
    const s = useWizardStore.getState();
    // Derivation 1 (slot inclusion) — the unconfirmed hint is ignored.
    expect(s.slots).toContain('structure');
    // Derivation 2 (dispatch/fetchStrategy) — confirmed-only signal, photographer→multi.
    expect(isMultipage(s.templateId ?? undefined, briefSignalFromState(s))).toBe(true);
    // The unconfirmed hint never reaches briefStructureMode.
    expect(s.briefStructureMode).toBeNull();
  });

  it('(fix-first) a CONFIRMED single structure DOES stay single — the legitimate single path is unbroken', () => {
    useWizardStore.getState().reset();
    useWizardStore.getState().hydrate({
      tokenId: 'tokConf',
      brief: photographerAtelierConfirmedSingle,
      audienceType: 'service',
      templateId: 'atelier',
    });
    const s = useWizardStore.getState();
    // Confirmed single ⇒ briefStructureMode set ⇒ both derivations resolve single.
    expect(s.briefStructureMode).toBe('single');
    expect(s.slots).not.toContain('structure');
    expect(isMultipage(s.templateId ?? undefined, briefSignalFromState(s))).toBe(false);
  });

  it('(d) fetchStrategy (work + atelier) seeds the 5 default pages with ZERO fetch/charge', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tokA', brief: photographerAtelierBrief, audienceType: 'service', templateId: 'atelier' });

    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();

    expect(spy).not.toHaveBeenCalled(); // no LLM, no credit charge
    expect(s.strategyStatus).toBe('done');
    expect(s.strategy).toBeNull(); // copy-gen stays OUT
    const map = s.sitemap as any[];
    expect(Array.isArray(map)).toBe(true);
    expect(map.map((p) => p.archetypeKey)).toEqual(['home', 'work', 'experiences', 'about', 'contact']);
  });
});

// ===========================================================================
// atelier phase 7 — COMPOSED served-path proof (serveGate → wizard store)
// ===========================================================================
// The phase-2/5 store tests hand-fed audienceType/templateId. This block instead
// runs the REAL serve decision through decideServe (from a classify-produced
// brief, carrying the bare unconfirmed `structure.mode` hint buildBriefDraft
// stamps) and feeds that decision's audience/template into the store — proving
// the whole chain composes for the actual served brief, not an idealized one.
function makeEntrySignals(overrides: Partial<EntrySignals> = {}): EntrySignals {
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

describe('useWizardStore — COMPOSED served photographer path (atelier phase 7)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('photographer classify brief ⇒ serve(atelier/service) ⇒ slots include structure ⇒ chargeless 5-page seed ⇒ skeleton dispatch', async () => {
    // (1) REAL classify brief — buildBriefDraft stamps the bare unconfirmed
    //     structure:{mode:'single',pages:[]} hint (the phase-5 reachable case).
    const brief = buildBriefDraft(
      makeEntrySignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'editorial wedding photographer in Jaipur'
    );
    expect(brief.structure).toEqual({ mode: 'single', pages: [] });

    // (2) REAL serve decision (not hand-fed).
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome !== 'serve') return;
    expect(decision.templateId).toBe('atelier');
    expect(decision.audienceType).toBe('service');

    // (3) Hydrate the store with the decision's audience/template (as the confirm
    //     route does) + the same brief.
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);
    useWizardStore.getState().reset();
    useWizardStore.getState().hydrate({
      tokenId: 'tokCompose',
      brief,
      audienceType: decision.audienceType,
      templateId: decision.templateId,
    });
    const s0 = useWizardStore.getState();
    expect(s0.engine).toBe('work');
    expect(s0.businessTypeKey).toBe('photographer');
    // The unconfirmed single hint must NOT suppress the structure slot.
    expect(s0.briefStructureMode).toBeNull();
    expect(s0.slots).toContain('structure');

    // (4) chargeless archetype seed — the served skeleton path, zero LLM/credits.
    await useWizardStore.getState().fetchStrategy();
    const s1 = useWizardStore.getState();
    expect(spy).not.toHaveBeenCalled();
    expect(s1.strategyStatus).toBe('done');
    expect(s1.strategy).toBeNull(); // copy-gen stays OUT
    const map = s1.sitemap as any[];
    expect(Array.isArray(map)).toBe(true);
    expect(map.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);

    // (5) skeleton dispatch selected (GeneratingSlot keys on this exact predicate).
    expect(isMultipage(s1.templateId ?? undefined, briefSignalFromState(s1))).toBe(true);
  });

  it('REGRESSION: writer classify brief ⇒ serve(granth/writer) ⇒ structure SKIPPED ⇒ writer-generator dispatch (NOT skeleton)', () => {
    // The granth-unchanged proof composed across phases 1+2+4: a served writer
    // still routes to writer audience AND the store still skips structure and
    // declines the skeleton dispatch (isMultipage false ⇒ buildWorkInput path).
    const brief = buildBriefDraft(
      makeEntrySignals({ businessTypeGuess: 'writer', goalIntentGuess: 'follow-social' }),
      'Hindi literary fiction author'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome !== 'serve') return;
    expect(decision.templateId).toBe('granth');
    expect(decision.audienceType).toBe('writer');

    useWizardStore.getState().reset();
    useWizardStore.getState().hydrate({
      tokenId: 'tokGranth',
      brief,
      audienceType: decision.audienceType,
      templateId: decision.templateId,
    });
    const s = useWizardStore.getState();
    expect(s.engine).toBe('work');
    expect(s.businessTypeKey).toBe('writer');
    // granth is NOT multipage ⇒ structure slot skipped (writer flow unchanged).
    expect(s.slots).not.toContain('structure');
    // dispatch declines the skeleton ⇒ writer generator (buildWorkInput) path.
    expect(isMultipage(s.templateId ?? undefined, briefSignalFromState(s))).toBe(false);
  });
});

// ===========================================================================
// plan-proposal-gate phase 1 — PROPOSAL-DRIVEN work+multipage seed
// ===========================================================================
// The seed no longer always emits the full atelier menu: it derives the site
// shape from `facts.work` (deriveStructureSignals → proposeWorkSiteStructure) and
// seeds the proposal's page subset — one-pager folds the FULL stack onto Home,
// compact seeds home/work/contact, standard seeds all 5 (today's behavior). A
// null-facts brief keeps the full-menu multi seed (pinned by the phase-5/7 tests
// above, whose fixtures carry no `facts.work`).
function workBriefWithFacts(work: Record<string, unknown>): Brief {
  return {
    businessType: 'photographer',
    copyEngine: 'work',
    facts: {
      entry: { rawInput: 'kundius photography', oneLiner: 'editorial photographer' },
      work,
    },
  } as Brief;
}

describe('useWizardStore — proposal-driven work+multipage seed (plan-proposal-gate phase 1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('one-pager signals ⇒ Home-only seed with the FULL folded stacked sections', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    // 1 group, on-request price, not established ⇒ one-pager.
    const brief = workBriefWithFacts({
      identity: { name: 'Kundius' },
      groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }],
    });
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok1', brief, audienceType: 'service', templateId: 'atelier' });

    await useWizardStore.getState().fetchStrategy();
    const s = useWizardStore.getState();

    expect(spy).not.toHaveBeenCalled();
    expect(s.strategyStatus).toBe('done');
    const map = s.sitemap as any[];
    expect(map).toHaveLength(1);
    expect(map[0].archetypeKey).toBe('home');
    // The FULL stacked set (union of all 5 atelier pages), in home.allowedSections
    // order — deliberately richer than the one-pager `[home]` subset.
    expect(map[0].sections).toEqual([
      'hero', 'work', 'proof', 'packages', 'about', 'contact',
    ]);
  });

  it('compact signals ⇒ 3-page seed home/work/contact (no /experiences, no /about)', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    // 2 groups, on-request prices, not established ⇒ compact (matches the Kundius
    // e2e fixture derivation).
    const brief = workBriefWithFacts({
      identity: { name: 'Kundius' },
      groups: [
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' } },
        { name: 'Engagements', kind: 'category', price: { mode: 'on-request' } },
      ],
    });
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok2', brief, audienceType: 'service', templateId: 'atelier' });

    await useWizardStore.getState().fetchStrategy();
    const map = useWizardStore.getState().sitemap as any[];

    expect(spy).not.toHaveBeenCalled();
    expect(map.map((p) => p.archetypeKey)).toEqual(['home', 'work', 'contact']);
    expect(map.some((p) => p.pathSlug === '/experiences')).toBe(false);
    expect(map.some((p) => p.pathSlug === '/about')).toBe(false);
  });

  it('standard signals (established) ⇒ today’s 5-page seed (regression pin)', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    // established ⇒ standard, regardless of group count.
    const brief = workBriefWithFacts({
      identity: { name: 'Kundius' },
      establishment: 'established',
      groups: [
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' } },
        { name: 'Engagements', kind: 'category', price: { mode: 'on-request' } },
      ],
    });
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok3', brief, audienceType: 'service', templateId: 'atelier' });

    await useWizardStore.getState().fetchStrategy();
    const map = useWizardStore.getState().sitemap as any[];

    expect(spy).not.toHaveBeenCalled();
    expect(map.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);
  });

  it('null work facts ⇒ full-menu multi seed (unchanged)', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', spy);

    // photographerAtelierBrief carries NO facts.work ⇒ getWorkFacts null.
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok4', brief: photographerAtelierBrief, audienceType: 'service', templateId: 'atelier' });

    await useWizardStore.getState().fetchStrategy();
    const map = useWizardStore.getState().sitemap as any[];

    expect(map.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);
  });
});

// onboarding-fixes phase 4 — the 7b empty-collection-node predicate. Gates
// whether a 0-item collection surfaces at the structure gate: catalog-shaped
// (manufacturer / future requiredCollections) YES, SaaS `thing` family NO.
// Keys WITH items are never gated by this predicate (asserted structurally in
// StructureSlot's CollectionNodes filter, not here).
describe('emptyCollectionNodeAllowed (7b phantom-node gate)', () => {
  it('manufacturer → allowed (catalog-shaped, keeps empty Products node)', () => {
    expect(emptyCollectionNodeAllowed('manufacturer')).toBe(true);
  });

  it('saas (thing family) → NOT allowed (no phantom "Products · 0 items")', () => {
    expect(emptyCollectionNodeAllowed('saas')).toBe(false);
  });

  it('app (thing family) → NOT allowed', () => {
    expect(emptyCollectionNodeAllowed('app')).toBe(false);
  });

  it('unclassified (null / undefined / unknown) → NOT allowed', () => {
    expect(emptyCollectionNodeAllowed(null)).toBe(false);
    expect(emptyCollectionNodeAllowed(undefined)).toBe(false);
    expect(emptyCollectionNodeAllowed('not-a-real-type')).toBe(false);
  });
});
