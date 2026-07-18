// src/components/toolbars/buttonCtaAdapter.test.ts
// toolbar-beta-followup phase 2 — pins the fragile GOAL_REF goal-following CTA
// through the LinkPicker consolidation, plus the adapter round-trips.
//
// The load-bearing assertion: no picker-set url/pathSlug residue can leak into a
// goal-following CTA. `buildCtaButton(config, 'primary', followGoal=true)` must
// return GOAL_REF regardless of what the picker left in `config`, AND that
// GOAL_REF must still resolve to a real href through the render normalization pass
// (normalizeCtas → goalToDestination). F23-adjacent — a goal-following CTA must
// not regress.

import { describe, it, expect } from 'vitest';
import {
  type ButtonConfig,
  buildCtaButton,
  configFromCta,
  configToPickerValue,
  applyPickerLink,
} from './buttonCtaAdapter';
import { normalizeCtas } from '@/utils/normalizeCtas';
import { resolveCtaHref } from '@/utils/resolveCtaHref';
import type { Link, CTAButton } from '@/types/destination';
import type { Brief } from '@/types/brief';

const base: ButtonConfig = { type: 'link', text: 'Book a call', ctaType: 'primary' };

describe('buttonCtaAdapter — GOAL_REF preservation (F23-adjacent)', () => {
  it('primary + followGoal ⇒ GOAL_REF regardless of picker-set url', () => {
    const withUrl: ButtonConfig = { ...base, type: 'link', url: 'https://cal.com/acme' };
    expect(buildCtaButton(withUrl, 'primary', true)).toEqual({
      role: 'primary',
      dest: 'GOAL_REF',
    });
  });

  it('primary + followGoal ⇒ GOAL_REF regardless of picker-set pathSlug', () => {
    const withPage: ButtonConfig = { ...base, type: 'page', pathSlug: '/contact' };
    expect(buildCtaButton(withPage, 'primary', true)).toEqual({
      role: 'primary',
      dest: 'GOAL_REF',
    });
  });

  it('GOAL_REF still resolves to a real href through the render pass', () => {
    // A GOAL_REF cta down-converts (normalizeCtas → goalToDestination) to a
    // concrete buttonConfig whose href is non-empty for a representative goal.
    const goal = {
      mechanism: 'M3',
      destination: 'https://calendly.com/demo',
    } as unknown as Brief['goal'];

    const cta = buildCtaButton(base, 'primary', true)!; // { role:'primary', dest:'GOAL_REF' }
    const content = {
      'hero-1': {
        elements: {},
        elementMetadata: { cta_text: { cta } },
      },
    };

    const out = normalizeCtas(content, { goal }) as typeof content;
    const buttonConfig = (out['hero-1'].elementMetadata as any).cta_text.buttonConfig;
    expect(buttonConfig).toBeDefined();
    const href = resolveCtaHref(buttonConfig, undefined, '');
    expect(href).toBe('https://calendly.com/demo');
    expect(href).not.toBe('');
  });

  it('detach → picker sets a dest → re-attach ⇒ save is GOAL_REF (no residue leak)', () => {
    // 1. detach: user picks an external URL via the picker.
    const link: Link = { dest: { kind: 'external', url: 'https://cal.com/acme' }, source: 'manual' };
    const detached = applyPickerLink(base, link);
    expect(detached).toMatchObject({ type: 'link', url: 'https://cal.com/acme' });

    // 2. re-attach: followGoal true again — the picker residue must not leak.
    expect(buildCtaButton(detached, 'primary', true)).toEqual({
      role: 'primary',
      dest: 'GOAL_REF',
    });
  });
});

describe('buttonCtaAdapter — LinkPicker round-trips', () => {
  it('external URL → {type:"link", url}; source never persisted', () => {
    const link: Link = { dest: { kind: 'external', url: 'https://cal.com/acme' }, source: 'manual' };
    const cfg = applyPickerLink(base, link);
    expect(cfg.type).toBe('link');
    expect(cfg.url).toBe('https://cal.com/acme');
    expect('source' in cfg).toBe(false);

    const cta = buildCtaButton(cfg, 'secondary', false);
    expect(cta).toEqual({ role: 'secondary', dest: { kind: 'external', url: 'https://cal.com/acme' } });
    expect('source' in (cta as any)).toBe(false);
  });

  it('page pick → {type:"page", pathSlug}; source never persisted', () => {
    const link: Link = { dest: { kind: 'page', pathSlug: '/contact' }, source: 'derived' };
    const cfg = applyPickerLink(base, link);
    expect(cfg).toMatchObject({ type: 'page', pathSlug: '/contact' });
    expect('source' in cfg).toBe(false);

    const cta = buildCtaButton(cfg, 'secondary', false);
    expect(cta).toEqual({ role: 'secondary', dest: { kind: 'page', pathSlug: '/contact' } });
  });

  it('section anchor → {type:"link", url:"#pricing"} → section CTAButton', () => {
    const link: Link = { dest: { kind: 'section', anchor: 'pricing' }, source: 'manual' };
    const cfg = applyPickerLink(base, link);
    expect(cfg).toMatchObject({ type: 'link', url: '#pricing' });

    const cta = buildCtaButton(cfg, 'secondary', false);
    expect(cta).toEqual({ role: 'secondary', dest: { kind: 'section', anchor: 'pricing' } });
  });
});

describe('buttonCtaAdapter — configToPickerValue (dual-read seed)', () => {
  it('page config → pathSlug', () => {
    expect(configToPickerValue({ ...base, type: 'page', pathSlug: '/about' })).toBe('/about');
  });
  it('link config → url', () => {
    expect(configToPickerValue({ ...base, type: 'link', url: '#faq' })).toBe('#faq');
  });
  it('form config → empty string', () => {
    expect(configToPickerValue({ ...base, type: 'form', formId: 'f1' })).toBe('');
  });
  it('empty link config → empty string', () => {
    expect(configToPickerValue({ ...base, type: 'link' })).toBe('');
  });
});

describe('buttonCtaAdapter — configFromCta reopen round-trip', () => {
  it('a page CTAButton reopens as a page config the picker can seed', () => {
    const cta: CTAButton = { role: 'secondary', dest: { kind: 'page', pathSlug: '/contact' } };
    const cfg = configFromCta(cta, 'Contact us', 'secondary', undefined);
    expect(cfg).toMatchObject({ type: 'page', pathSlug: '/contact', text: 'Contact us' });
    expect(configToPickerValue(cfg)).toBe('/contact');
  });

  it('an external CTAButton reopens as a link config with the resolved url', () => {
    const cta: CTAButton = { role: 'secondary', dest: { kind: 'external', url: 'https://cal.com/x' } };
    const cfg = configFromCta(cta, 'Book', 'secondary', undefined);
    expect(cfg).toMatchObject({ type: 'link', url: 'https://cal.com/x' });
    expect(configToPickerValue(cfg)).toBe('https://cal.com/x');
  });
});
