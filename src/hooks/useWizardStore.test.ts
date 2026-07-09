// src/hooks/useWizardStore.test.ts
// scale-06 phase 2 — unified Brief-backed wizard store.
// Covers: slot-machine transitions per engine (skips honored), hydration from
// brief fixtures, review/fill mode derivation.

import { describe, it, expect, beforeEach } from 'vitest';
import type { Brief } from '@/types/brief';
import { useWizardStore, deriveMode } from './useWizardStore';

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

  it('trust skips the structure slot', () => {
    useWizardStore.getState().hydrate({ brief: trustBrief, audienceType: 'service', templateId: 'surge' });
    const { slots } = useWizardStore.getState();
    expect(slots).not.toContain('structure');
    expect(slots).toContain('style');
    expect(slots[0]).toBe('identity');
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
    useWizardStore.getState().hydrate({ brief: trustBrief, audienceType: 'service', templateId: 'surge' });
    useWizardStore.getState().goToSlot('proof');
    expect(useWizardStore.getState().currentSlot).toBe('proof');
    // structure is skipped for trust ⇒ goToSlot must NOT move there.
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
  });
});
