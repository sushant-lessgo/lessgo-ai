// src/modules/wizard/work/questionGating.test.ts
// ============================================================================
// WORK QUESTION GATING — deterministic resolver coverage (E3 phase 1).
//
// The load-bearing assertion: the SAME facts always produce the SAME plan, the
// Kundius fixture yields EXACTLY 5 questions (never asks what the seed knows),
// and the D-C price answered-detection + D-F ceiling behave as specified.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { buildQuestionPlan, resolveQuestionProfession } from './questionGating';
import { getWorkFacts, type WorkFacts } from '@/lib/schemas/workFacts.schema';
import { workSlotIds } from '@/modules/engines/workSlots';
import type { EntryFacts } from '@/modules/brief/classify';
import { WORK_BRIEF_FIXTURE } from '../../../../e2e/helpers/workBriefFixture';

const bySlot = (plan: ReturnType<typeof buildQuestionPlan>) =>
  Object.fromEntries(plan.map((p) => [p.slot, p]));

describe('buildQuestionPlan — Kundius fixture', () => {
  const work = getWorkFacts(WORK_BRIEF_FIXTURE.facts as Record<string, unknown>);
  const entry = WORK_BRIEF_FIXTURE.facts.entry as Partial<EntryFacts>;
  const plan = buildQuestionPlan({ work, entry, sessionAnswered: [] });

  it('the fixture facts parse (guards against a null-facts false green)', () => {
    expect(work).not.toBeNull();
  });

  it('yields EXACTLY the 5 expected questions in slot order', () => {
    expect(plan.map((p) => p.slot)).toEqual([
      'price',
      'establishment',
      'dreamClient',
      'contactMethod',
      'languages',
    ]);
  });

  it('never asks what the seed already knows (identity + groups absent)', () => {
    const slots = plan.map((p) => p.slot);
    expect(slots).not.toContain('identity');
    expect(slots).not.toContain('groups');
    // praise: testimonials empty ⇒ SILENT, not an open ask (D-F).
    expect(slots).not.toContain('praise');
  });

  it('assigns the expected postures / required / answered / suggestions', () => {
    const m = bySlot(plan);
    expect(m['price']).toEqual({
      slot: 'price',
      posture: 'ask',
      required: true,
      answered: false,
      suggested: ['on-request'],
    });
    expect(m['establishment']).toEqual({
      slot: 'establishment',
      posture: 'ask',
      required: false,
      answered: false,
    });
    expect(m['dreamClient']).toEqual({
      slot: 'dreamClient',
      posture: 'confirm',
      required: false,
      answered: false,
      suggested: ['Couples getting married'],
    });
    // deliveryModel 'in-person' ⇒ whatsapp default (neverSilent confirm).
    expect(m['contactMethod']).toEqual({
      slot: 'contactMethod',
      posture: 'confirm',
      required: false,
      answered: false,
      suggested: ['whatsapp'],
    });
    expect(m['languages']).toEqual({
      slot: 'languages',
      posture: 'ask',
      required: true,
      answered: false,
      suggested: ['English'],
    });
  });

  it('is deterministic — same input, identical plan', () => {
    const again = buildQuestionPlan({ work, entry, sessionAnswered: [] });
    expect(again).toEqual(plan);
  });
});

describe('buildQuestionPlan — rich facts (fewer questions for richer signal, AC 3)', () => {
  const rich: WorkFacts = {
    identity: { name: 'Kundius Studio' },
    groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 2000 } }],
    establishment: 'established',
    dreamClient: 'discerning couples',
    contactMethod: 'whatsapp',
    languages: ['English'],
  };
  const entry: Partial<EntryFacts> = { audiences: ['couples'], testimonials: [] };

  it('all slots present + price answered ⇒ NO questions', () => {
    const plan = buildQuestionPlan({ work: rich, entry, sessionAnswered: [] });
    expect(plan).toEqual([]);
  });

  it('same facts but price default on-request ⇒ ONLY the unanswered required price', () => {
    const plan = buildQuestionPlan({
      work: { ...rich, groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' } }] },
      entry,
      sessionAnswered: [],
    });
    expect(plan.map((p) => p.slot)).toEqual(['price']);
    expect(plan[0].required).toBe(true);
    expect(plan[0].answered).toBe(false);
  });
});

describe('buildQuestionPlan — empty facts (degenerate no-seed, D-F cap at 5)', () => {
  it('caps at 5 by priority rank (identity, groups, price, contactMethod, languages)', () => {
    const plan = buildQuestionPlan({ work: null, entry: null, sessionAnswered: [] });
    expect(plan).toHaveLength(5);
    expect(plan.map((p) => p.slot)).toEqual([
      'identity',
      'groups',
      'price',
      'contactMethod',
      'languages',
    ]);
    // establishment + dreamClient are the two dropped by the ceiling.
    expect(plan.map((p) => p.slot)).not.toContain('establishment');
    expect(plan.map((p) => p.slot)).not.toContain('dreamClient');
  });

  it('price has NO on-request suggestion when there are no groups yet', () => {
    const plan = buildQuestionPlan({ work: null, entry: null, sessionAnswered: [] });
    const price = plan.find((p) => p.slot === 'price')!;
    expect(price.suggested).toBeUndefined();
    // contactMethod default is form when deliveryModel is absent.
    const contact = plan.find((p) => p.slot === 'contactMethod')!;
    expect(contact.suggested).toEqual(['form']);
  });
});

describe('buildQuestionPlan — praise confirm-only (D-F)', () => {
  // Every other slot known so the ceiling does not drop praise.
  const work: WorkFacts = {
    identity: { name: 'A' },
    groups: [{ name: 'G', kind: 'category', price: { mode: 'from', amount: 900 } }],
    establishment: 'established',
    dreamClient: 'couples',
    contactMethod: 'form',
    languages: ['English'],
  };

  it('testimonials present ⇒ praise appears as a one-tap confirm with verbatim quotes', () => {
    const plan = buildQuestionPlan({
      work,
      entry: { testimonials: ['Best day ever', 'Stunning photos'] },
      sessionAnswered: [],
    });
    expect(plan.map((p) => p.slot)).toEqual(['praise']);
    expect(plan[0]).toEqual({
      slot: 'praise',
      posture: 'confirm',
      required: false,
      answered: false,
      suggested: ['Best day ever', 'Stunning photos'],
    });
  });

  it('no testimonials ⇒ praise stays SILENT (never an open ask)', () => {
    const plan = buildQuestionPlan({ work, entry: { testimonials: [] }, sessionAnswered: [] });
    expect(plan).toEqual([]);
  });
});

describe('buildQuestionPlan — price answered-detection (D-C)', () => {
  const base: WorkFacts = {
    identity: { name: 'A' },
    establishment: 'established',
    dreamClient: 'couples',
    contactMethod: 'form',
    languages: ['English'],
  };
  const onRequest: WorkFacts = { ...base, groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }] };

  it('default on-request + no session ⇒ price UNANSWERED (renders, answered false)', () => {
    const plan = buildQuestionPlan({ work: onRequest, entry: {}, sessionAnswered: [] });
    const price = plan.find((p) => p.slot === 'price');
    expect(price).toBeDefined();
    expect(price!.answered).toBe(false);
    expect(price!.suggested).toEqual(['on-request']);
  });

  it('a non-default (from) group price ⇒ price ANSWERED (known, not rendered)', () => {
    const plan = buildQuestionPlan({
      work: { ...base, groups: [{ name: 'G', kind: 'category', price: { mode: 'from', amount: 500 } }] },
      entry: {},
      sessionAnswered: [],
    });
    expect(plan.map((p) => p.slot)).not.toContain('price');
  });

  it('sessionAnswered includes price ⇒ price renders COMPACT (answered true), even on-request', () => {
    const plan = buildQuestionPlan({ work: onRequest, entry: {}, sessionAnswered: ['price'] });
    const price = plan.find((p) => p.slot === 'price');
    expect(price).toBeDefined();
    expect(price!.answered).toBe(true);
    expect(price!.suggested).toEqual(['on-request']);
  });
});

// ── Wave 2 packages quad — bullets ride the EXISTING `groups` slot ───────────
// Package `bullets` are sourced from `group.items` (WorkFactsSchema), so the
// wizard needs NO new slot for them. Category label folds into the groups
// question copy (no slot). These guard against a future accidental slot add.
describe('buildQuestionPlan — packages bullets ride the groups slot (no new slot)', () => {
  it('never emits a slot outside the frozen workSlotIds (no bullets/category question)', () => {
    const rich: WorkFacts = {
      identity: { name: 'Studio Co' },
      groups: [
        {
          name: 'Portrait sessions',
          kind: 'category',
          price: { mode: 'from', amount: 250 },
          items: [{ name: 'One focused hour', photos: [] }],
        },
      ],
    };
    const plan = buildQuestionPlan({ work: rich, entry: null, sessionAnswered: [] });
    for (const item of plan) {
      expect(workSlotIds as readonly string[]).toContain(item.slot);
    }
    expect(plan.map((p) => p.slot)).not.toContain('bullets');
    expect(plan.map((p) => p.slot)).not.toContain('category');
  });

  it('adding group items (the bullets source) does not change the emitted slot set', () => {
    const base: WorkFacts = {
      identity: { name: 'Studio Co' },
      groups: [{ name: 'Portrait sessions', kind: 'category', price: { mode: 'from', amount: 250 } }],
    };
    const withItems: WorkFacts = {
      ...base,
      groups: [{ ...base.groups![0], items: [{ name: 'Retouched selects', photos: [] }] }],
    };
    const slotsOf = (w: WorkFacts) =>
      buildQuestionPlan({ work: w, entry: null, sessionAnswered: [] }).map((p) => p.slot);
    expect(slotsOf(withItems)).toEqual(slotsOf(base));
  });
});

describe('resolveQuestionProfession', () => {
  it('re-exports the voice resolver (known keys map, unknown ⇒ photographer default)', () => {
    expect(resolveQuestionProfession('photographer')).toBe('photographer');
    expect(resolveQuestionProfession('designer')).toBe('designer');
    expect(resolveQuestionProfession('writer')).toBe('writer');
    expect(resolveQuestionProfession('agency')).toBe('agency');
    expect(resolveQuestionProfession('dentist')).toBe('photographer');
    expect(resolveQuestionProfession(null)).toBe('photographer');
  });
});
