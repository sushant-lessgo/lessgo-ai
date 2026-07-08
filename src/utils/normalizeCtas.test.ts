// src/utils/normalizeCtas.test.ts
// scale-04 (phase 3) — the new-shape→legacy bridge. Proves GOAL_REF + concrete
// dest ctas down-convert to the legacy buttonConfig the ~26 readers consume, and
// that null-goal / legacy-only content passes through byte-identical.

import { describe, it, expect } from 'vitest';
import { normalizeCtas } from './normalizeCtas';
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
