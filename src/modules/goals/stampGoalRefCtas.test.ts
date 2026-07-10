// src/modules/goals/stampGoalRefCtas.test.ts
// goal-ref-cta phase 1 — the mechanism-agnostic GOAL_REF stamp.

import { describe, it, expect } from 'vitest';
import {
  stampGoalRefCtas,
  stampSectionGoalRefCtas,
  resolveGoalFormId,
} from './stampGoalRefCtas';
import type { Brief } from '@/types/brief';

type BriefGoal = NonNullable<Brief['goal']>;

/** A content tree with hero + cta primaries, a features section (no CTA), and a
 *  section carrying an excluded key. `cta_text` is present on hero/cta; the hero
 *  starts WITH NO elementMetadata (the F5 case). */
function makeContent(): Record<string, any> {
  return {
    'hero-aaaa1111': {
      id: 'hero-aaaa1111',
      elements: { headline: 'Hi', cta_text: 'Get started', secondary_cta_text: 'Learn more' },
    },
    'features-bbbb2222': {
      id: 'features-bbbb2222',
      elements: { headline: 'What we do' },
    },
    'cta-cccc3333': {
      id: 'cta-cccc3333',
      elements: { headline: 'Ready?', cta_text: 'Book a call' },
      // Pre-existing form buttonConfig (as seedGoalForm leaves it) — must survive.
      elementMetadata: { cta_text: { buttonConfig: { type: 'form', formId: 'form-1' } } },
    },
    'header-dddd4444': {
      id: 'header-dddd4444',
      elements: { cta_text: 'Contact', signin_text: 'Sign in' },
    },
  };
}

const m1: BriefGoal = { intent: 'book-call', mechanism: 'M1' };
const m2: BriefGoal = { intent: 'enquiry', mechanism: 'M2', destination: 'https://wa.me/1555' };
const m3: BriefGoal = { intent: 'buy-via-link', mechanism: 'M3', destination: 'https://x.com' };
const m4: BriefGoal = { intent: 'follow-social', mechanism: 'M4', destination: 'https://instagram.com/a' };
const m5: BriefGoal = { intent: 'rsvp', mechanism: 'M5', destination: '#pricing' };

describe('stampGoalRefCtas — stamps every primary cta_text for each mechanism', () => {
  it.each([
    ['M1', m1],
    ['M2', m2],
    ['M3', m3],
    ['M4', m4],
    ['M5', m5],
  ] as const)('stamps hero + cta + header primaries for %s', (_label, goal) => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal, formId: goal.mechanism === 'M1' ? 'form-1' : undefined });

    for (const id of ['hero-aaaa1111', 'cta-cccc3333', 'header-dddd4444']) {
      const cta = content[id].elementMetadata.cta_text.cta;
      expect(cta.role).toBe('primary');
      // dest is the LITERAL string, never a resolved snapshot object.
      expect(cta.dest).toBe('GOAL_REF');
      expect(typeof cta.dest).toBe('string');
    }
  });

  it('creates elementMetadata where missing (F5 hero case)', () => {
    const content = makeContent();
    expect(content['hero-aaaa1111'].elementMetadata).toBeUndefined();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    expect(content['hero-aaaa1111'].elementMetadata.cta_text.cta.dest).toBe('GOAL_REF');
  });

  it('preserves an existing buttonConfig on a stamped entry (cta section)', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    const entry = content['cta-cccc3333'].elementMetadata.cta_text;
    expect(entry.buttonConfig).toEqual({ type: 'form', formId: 'form-1' });
    expect(entry.cta.dest).toBe('GOAL_REF');
  });

  it('carries formId ONLY for M1', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    expect(content['hero-aaaa1111'].elementMetadata.cta_text.cta.formId).toBe('form-1');
  });

  it.each([
    ['M2', m2],
    ['M3', m3],
    ['M4', m4],
    ['M5', m5],
  ] as const)('carries NO formId for %s (even if a formId is passed)', (_label, goal) => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal, formId: 'form-should-be-ignored' });
    expect(content['hero-aaaa1111'].elementMetadata.cta_text.cta).not.toHaveProperty('formId');
  });

  it('leaves excluded keys (secondary_cta_text, signin_text) untouched', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    const heroMeta = content['hero-aaaa1111'].elementMetadata;
    expect(heroMeta.secondary_cta_text).toBeUndefined();
    const headerMeta = content['header-dddd4444'].elementMetadata;
    expect(headerMeta.signin_text).toBeUndefined();
  });

  it('never stamps a section without a cta_text element', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    // features has no cta_text → no elementMetadata created.
    expect(content['features-bbbb2222'].elementMetadata).toBeUndefined();
  });

  it('never writes a resolved Destination object anywhere', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    for (const section of Object.values<any>(content)) {
      const meta = section.elementMetadata;
      if (!meta) continue;
      for (const entry of Object.values<any>(meta)) {
        if (entry?.cta) expect(entry.cta.dest).toBe('GOAL_REF');
      }
    }
  });

  it('is a no-op when goal is null/undefined', () => {
    const content = makeContent();
    const snapshot = JSON.stringify(content);
    stampGoalRefCtas(content, { goal: null });
    stampGoalRefCtas(content, { goal: undefined });
    expect(JSON.stringify(content)).toBe(snapshot);
  });

  it('is idempotent — re-stamping writes the same value', () => {
    const content = makeContent();
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    const after1 = JSON.stringify(content);
    stampGoalRefCtas(content, { goal: m1, formId: 'form-1' });
    expect(JSON.stringify(content)).toBe(after1);
  });

  it('tolerates null / non-object trees', () => {
    expect(() => stampGoalRefCtas(null, { goal: m1 })).not.toThrow();
    expect(() => stampGoalRefCtas(undefined, { goal: m1 })).not.toThrow();
    expect(() => stampGoalRefCtas({} as any, { goal: m1 })).not.toThrow();
  });
});

describe('stampSectionGoalRefCtas — single-section helper (chrome header)', () => {
  it('stamps a lone section (header.data shape)', () => {
    const header = { id: 'header-1', elements: { cta_text: 'Contact' } };
    stampSectionGoalRefCtas(header as any, m1, 'form-1');
    expect((header as any).elementMetadata.cta_text.cta).toEqual({
      role: 'primary',
      dest: 'GOAL_REF',
      formId: 'form-1',
    });
  });

  it('no-ops on null goal / non-object section', () => {
    const header = { id: 'header-1', elements: { cta_text: 'Contact' } };
    stampSectionGoalRefCtas(header as any, null, 'form-1');
    expect((header as any).elementMetadata).toBeUndefined();
    expect(() => stampSectionGoalRefCtas(null, m1)).not.toThrow();
  });
});

describe('resolveGoalFormId — sole-form invariant', () => {
  it('returns the sole form id for M1', () => {
    expect(resolveGoalFormId({ 'form-x': { id: 'form-x' } }, m1)).toBe('form-x');
  });

  it('returns undefined for non-M1 mechanisms', () => {
    expect(resolveGoalFormId({ 'form-x': {} }, m2)).toBeUndefined();
    expect(resolveGoalFormId({ 'form-x': {} }, m5)).toBeUndefined();
  });

  it('treats subscribe-newsletter as M1 (override)', () => {
    const goal = { intent: 'subscribe-newsletter', mechanism: 'M4' } as any;
    expect(resolveGoalFormId({ 'form-news': {} }, goal)).toBe('form-news');
  });

  it('returns undefined when there are no forms', () => {
    expect(resolveGoalFormId({}, m1)).toBeUndefined();
    expect(resolveGoalFormId(undefined, m1)).toBeUndefined();
  });

  it('prefers the Contact-named form when several exist (future-proof guard)', () => {
    const forms = { 'form-a': { id: 'form-a', name: 'Other' }, 'form-b': { id: 'form-b', name: 'Contact' } };
    expect(resolveGoalFormId(forms, m1)).toBe('form-b');
  });
});
