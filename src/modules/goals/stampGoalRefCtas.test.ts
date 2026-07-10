// src/modules/goals/stampGoalRefCtas.test.ts
// goal-ref-cta phase 1 — the mechanism-agnostic GOAL_REF stamp.

import { describe, it, expect } from 'vitest';
import {
  stampGoalRefCtas,
  stampSectionGoalRefCtas,
  resolveGoalFormId,
} from './stampGoalRefCtas';
import { normalizeCtas } from '@/utils/normalizeCtas';
import { resolveCtaHref } from '@/utils/resolveCtaHref';
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

// ─── goal-ref-cta phase 5: end-to-end resolution through the REAL render
// pre-pass (spec acceptance criterion 4). Content is stamped by the REAL
// stampGoalRefCtas (never hand-authored dest:'GOAL_REF'), then run through the
// real normalizeCtas + resolveCtaHref, so this exercises the full generation →
// render path for M3 (with param and param-less) at the layer where an href
// actually exists. Uses a vestria-shaped hero (flat cta_href default `#contact`)
// so the phase-3.5 flat-href bridge is covered too. ───
describe('phase 5 — M3 resolves through normalizeCtas (spec criterion 4)', () => {
  const m3WithUrl: BriefGoal = {
    intent: 'buy-via-link',
    mechanism: 'M3',
    destination: 'https://store.example/product',
  };
  const m3ParamLess: BriefGoal = { intent: 'signup-free', mechanism: 'M3' };

  /** A single vestria-shaped hero: cta_text label + flat cta_href schema default. */
  function heroTree(): Record<string, any> {
    return {
      'hero-aaaa1111': {
        id: 'hero-aaaa1111',
        elements: { headline: 'Hi', cta_text: 'Buy now', cta_href: '#contact' },
      },
    };
  }

  it('M3 with param → external URL on both the buttonConfig and the bridged flat cta_href', () => {
    const content = heroTree();
    stampGoalRefCtas(content, { goal: m3WithUrl });
    const out = normalizeCtas(content, { goal: m3WithUrl, forms: {} }) as Record<string, any>;

    const meta = out['hero-aaaa1111'].elementMetadata.cta_text;
    // buttonConfig down-converts to a plain link carrying the external URL.
    expect(meta.buttonConfig).toEqual({ type: 'link', url: 'https://store.example/product' });
    expect(resolveCtaHref(meta.buttonConfig, {}, '#cta')).toBe('https://store.example/product');
    // phase-3.5 bridge writes the resolved href into the sibling flat cta_href
    // (vestria reads it directly) — the default `#contact` is replaced.
    expect(out['hero-aaaa1111'].elements.cta_href).toBe('https://store.example/product');
  });

  it('param-less M3 → inert `#` (no dead/broken href), and the bridge writes `#` not empty', () => {
    const content = heroTree();
    stampGoalRefCtas(content, { goal: m3ParamLess });
    const out = normalizeCtas(content, { goal: m3ParamLess, forms: {} }) as Record<string, any>;

    const meta = out['hero-aaaa1111'].elementMetadata.cta_text;
    // D-C: goal present but required url param missing → inert `#` no-op.
    expect(meta.buttonConfig).toEqual({ type: 'link', url: '#' });
    // The bridged flat cta_href is the inert `#` — NOT an empty string (an empty
    // href would be the defect the spec criterion guards against).
    expect(out['hero-aaaa1111'].elements.cta_href).toBe('#');
    expect(out['hero-aaaa1111'].elements.cta_href).not.toBe('');
  });
});

// ─── goal-ref-cta phase 5: service-shape stamping. seedGoalForm/stamp are
// shared across audiences; service pages use awareness-driven section ordering
// (header → hero → … → cta). Assert the stamp reaches every primary on a
// service-flavored tree. ───
describe('phase 5 — stamps a service (awareness-ordered) section list', () => {
  function serviceTree(): Record<string, any> {
    return {
      'header-svc0001': { id: 'header-svc0001', elements: { cta_text: 'Book a call' } },
      'hero-svc0002': { id: 'hero-svc0002', elements: { headline: 'We help', cta_text: 'Get a quote' } },
      'services-svc0003': { id: 'services-svc0003', elements: { headline: 'What we do' } },
      'testimonials-svc0004': { id: 'testimonials-svc0004', elements: { headline: 'Loved by' } },
      'cta-svc0005': { id: 'cta-svc0005', elements: { headline: 'Ready?', cta_text: 'Start now' } },
    };
  }

  it('stamps GOAL_REF on header + hero + cta primaries, leaves CTA-less sections untouched', () => {
    const content = serviceTree();
    const goal: BriefGoal = { intent: 'book-call', mechanism: 'M1' };
    stampGoalRefCtas(content, { goal, formId: 'form-svc' });

    for (const id of ['header-svc0001', 'hero-svc0002', 'cta-svc0005']) {
      expect(content[id].elementMetadata.cta_text.cta).toEqual({
        role: 'primary',
        dest: 'GOAL_REF',
        formId: 'form-svc',
      });
    }
    expect(content['services-svc0003'].elementMetadata).toBeUndefined();
    expect(content['testimonials-svc0004'].elementMetadata).toBeUndefined();
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
