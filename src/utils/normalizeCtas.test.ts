// src/utils/normalizeCtas.test.ts
// scale-04 (phase 3) — the new-shape→legacy bridge. Proves GOAL_REF + concrete
// dest ctas down-convert to the legacy buttonConfig the ~26 readers consume, and
// that null-goal / legacy-only content passes through byte-identical.

import { describe, it, expect } from 'vitest';
import { normalizeCtas } from './normalizeCtas';
import { intentToBriefGoal, composeWhatsappDestination } from '@/modules/brief/bridge';
import type { CTAButton } from '@/types/destination';
import type { Brief } from '@/types/brief';

type Goal = NonNullable<Brief['goal']>;

/** Minimal content shape: one section carrying one cta elementMetadata entry. */
function withCta(elKey: string, cta: CTAButton, extraMeta?: Record<string, any>) {
  return {
    'hero-1': {
      layout: 'x',
      elements: {},
      elementMetadata: { [elKey]: { cta, ...(extraMeta || {}) } },
    },
    forms: {},
  } as Record<string, any>;
}

describe('normalizeCtas', () => {
  it('GOAL_REF + on-site form goal → {type:"form", formId}', () => {
    const content = withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const goal: Goal = { intent: 'enquiry', mechanism: 'M1' };
    const out = normalizeCtas(content, { goal, forms: { 'form-abc': {} } });
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'form',
      formId: 'form-abc',
    });
  });

  it('GOAL_REF + WhatsApp goal → {type:"link", url:"https://wa.me/…"}', () => {
    const content = withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const goal: Goal = { intent: 'enquiry', mechanism: 'M2', destination: 'https://wa.me/15551234' };
    const out = normalizeCtas(content, { goal, forms: {} });
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'link',
      url: 'https://wa.me/15551234',
    });
  });

  it('concrete-dest primary (external) → {type:"link", url}', () => {
    const content = withCta('cta_primary', {
      role: 'primary',
      dest: { kind: 'external', url: 'https://calendly.com/x' },
    });
    const out = normalizeCtas(content, { goal: null, forms: {} });
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'link',
      url: 'https://calendly.com/x',
    });
  });

  it('concrete-dest secondary (section anchor) → normal anchor link, NOT a form', () => {
    const content = withCta('secondary_cta_1', {
      role: 'secondary',
      dest: { kind: 'section', anchor: 'pricing' },
    });
    const out = normalizeCtas(content, { goal: null, forms: {} });
    expect(out['hero-1'].elementMetadata.secondary_cta_1.buttonConfig).toEqual({
      type: 'link',
      url: '#pricing',
    });
  });

  it('concrete-dest page → {type:"page", pathSlug}', () => {
    const content = withCta('cta_primary', {
      role: 'primary',
      dest: { kind: 'page', pathSlug: '/contact' },
    });
    const out = normalizeCtas(content, { goal: null, forms: {} });
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'page',
      pathSlug: '/contact',
    });
  });

  it('null goal with a GOAL_REF cta → content byte-identical (same reference)', () => {
    const content = withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const out = normalizeCtas(content, { goal: null, forms: {} });
    expect(out).toBe(content); // untouched — no clone
  });

  it('legacy-only entry (no cta) → content byte-identical (same reference)', () => {
    const content: Record<string, any> = {
      'hero-1': {
        layout: 'x',
        elements: {},
        elementMetadata: { cta_primary: { buttonConfig: { type: 'link', url: '#cta' } } },
      },
      forms: {},
    };
    const out = normalizeCtas(content, { goal: { intent: 'enquiry', mechanism: 'M1' }, forms: {} });
    expect(out).toBe(content);
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'link',
      url: '#cta',
    });
  });

  it('missing-form M1 (formId undefined) → {type:"form"} passthrough, NOT a link', () => {
    const content = withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const goal: Goal = { intent: 'apply', mechanism: 'M1' };
    const out = normalizeCtas(content, { goal, forms: {} });
    const bc = out['hero-1'].elementMetadata.cta_primary.buttonConfig;
    expect(bc).toEqual({ type: 'form' });
    expect(bc).not.toHaveProperty('formId');
    expect(bc).not.toHaveProperty('url');
  });

  it('does not mutate the input content', () => {
    const content = withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const goal: Goal = { intent: 'enquiry', mechanism: 'M2', destination: 'tel:+1555' };
    normalizeCtas(content, { goal, forms: {} });
    // Original entry still carries only the cta, no injected buttonConfig.
    expect(content['hero-1'].elementMetadata.cta_primary).not.toHaveProperty('buttonConfig');
  });

  // ── scale-05 phase 10 — GOAL_REF over param-composed destinations (M1–M4).
  // These compose the goal through the REAL writeback composer (intentToBriefGoal),
  // then prove the GOAL_REF hero CTA down-converts to the right legacy buttonConfig
  // — exercising the true generation→publish path, not hand-built destinations.
  describe('GOAL_REF over param-composed destinations (M1–M4)', () => {
    const goalRef = () => withCta('cta_primary', { role: 'primary', dest: 'GOAL_REF' });
    const bc = (content: Record<string, any>, goal: Goal, forms: Record<string, unknown> = {}) =>
      normalizeCtas(content, { goal, forms })['hero-1'].elementMetadata.cta_primary.buttonConfig;

    it('M1 book-call (composed) + a project form → {type:"form", formId}', () => {
      // book-call primary mechanism is M1 (on-site form).
      const goal = intentToBriefGoal('book-call', {});
      expect(goal.mechanism).toBe('M1');
      expect(bc(goalRef(), goal, { 'form-xyz': {} })).toEqual({ type: 'form', formId: 'form-xyz' });
    });

    it('M2 whatsapp (composed w/ deterministic prefill) → {type:"link", url:wa.me?text}', () => {
      const facts = { businessName: 'Acme', offer: 'a quote' };
      const goal = intentToBriefGoal('enquiry', { phone: '+1 (555) 123-4567' }, facts);
      expect(goal.mechanism).toBe('M2');
      const expectedUrl = composeWhatsappDestination('15551234567', goal.param!.message!);
      expect(bc(goalRef(), goal)).toEqual({ type: 'link', url: expectedUrl });
    });

    it('M3 free-trial (composed external redirect) → {type:"link", url}', () => {
      const goal = intentToBriefGoal('free-trial', { url: 'https://app.example.com/signup' });
      expect(goal.mechanism).toBe('M3');
      expect(bc(goalRef(), goal)).toEqual({ type: 'link', url: 'https://app.example.com/signup' });
    });

    it('M3 download-app (composed, both stores) → {type:"link", url: first store link}', () => {
      const play = 'https://play.google.com/store/apps/details?id=com.x';
      const store = 'https://apps.apple.com/us/app/x/id123';
      const goal = intentToBriefGoal('download-app', { links: [play, store] });
      expect(goal.mechanism).toBe('M3');
      expect(bc(goalRef(), goal)).toEqual({ type: 'link', url: play });
    });

    it('M4 follow-social (composed social) → {type:"link", url: profile}', () => {
      const ig = 'https://instagram.com/some.writer';
      const goal = intentToBriefGoal('follow-social', { links: [ig] });
      expect(goal.mechanism).toBe('M4');
      expect(bc(goalRef(), goal)).toEqual({ type: 'link', url: ig });
    });
  });

  it('preserves other elementMetadata entries when one cta resolves', () => {
    const content: Record<string, any> = {
      'hero-1': {
        layout: 'x',
        elements: {},
        elementMetadata: {
          cta_primary: { cta: { role: 'primary', dest: { kind: 'external', url: 'https://a.com' } } },
          other: { buttonConfig: { type: 'link', url: '#keep' } },
        },
      },
    };
    const out = normalizeCtas(content, { goal: null, forms: {} });
    expect(out['hero-1'].elementMetadata.other.buttonConfig).toEqual({ type: 'link', url: '#keep' });
    expect(out['hero-1'].elementMetadata.cta_primary.buttonConfig).toEqual({
      type: 'link',
      url: 'https://a.com',
    });
  });
});
