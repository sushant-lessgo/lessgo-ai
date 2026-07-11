// src/utils/normalizeCtas.bridge.test.ts
// goal-ref-cta phase 3.5 — the FLAT-HREF RENDER BRIDGE.
//
// Flat-`cta_href` templates (vestria hero/header) render `content.cta_href`
// directly and never read `elementMetadata.cta_text.buttonConfig`, so the GOAL_REF
// stamp is dead wiring for them. The bridge (in normalizeCtas) writes the resolved
// goal href into the sibling `elements.cta_href` — but ONLY for a GOAL_REF cta whose
// existing flat href is absent/empty/schema-default (never a user-typed href, never
// a detached explicit Destination, never legacy metadata-less content).
//
// These tests drive the REAL normalizeCtas over vestria-shaped content and assert on
// the transient clone's `elements.cta_href` (exactly what the published/edit renderer
// flattens into the block's `cta_href` prop). No fixture pre-sets the resolved href.

import { describe, it, expect } from 'vitest';
import { normalizeCtas, buildNormalizeCtasContext } from './normalizeCtas';
import { LEGACY_CTA_CONTENT } from './__fixtures__/legacyCta.fixture';
import type { Brief } from '@/types/brief';
import type { Destination } from '@/types/destination';

type Goal = NonNullable<Brief['goal']>;
const M1: Goal = { intent: 'book-call', mechanism: 'M1' };

// A vestria-shaped section: a `cta_text` GOAL_REF stamp (what phase 1 writes) beside
// a flat `cta_href` element (what the block actually renders).
function vestriaHero(ctaHref: string | undefined) {
  return {
    'hero-abc12345': {
      layout: 'VestriaTailoredHero',
      elements: {
        headline: 'Hi',
        cta_text: 'Get started',
        ...(ctaHref === undefined ? {} : { cta_href: ctaHref }),
      },
      elementMetadata: {
        cta_text: { cta: { role: 'primary', dest: 'GOAL_REF', formId: 'form-1' } },
      },
    },
    forms: { 'form-1': { id: 'form-1', name: 'Contact', fields: [] } },
  } as Record<string, any>;
}

const heroHref = (c: Record<string, any>) => c['hero-abc12345'].elements.cta_href;

describe('normalizeCtas flat-href bridge (phase 3.5)', () => {
  it('multipage M1: bridges the schema-default #contact to the BARE cross-page /contact', () => {
    const content = vestriaHero('#contact');
    const ctx = buildNormalizeCtasContext({
      goal: M1,
      forms: content.forms,
      currentPagePath: '/',
      formPagePath: '/contact', // form lives on another page
    });
    const out = normalizeCtas(content, ctx);
    expect(heroHref(out)).toBe('/contact');
    expect(heroHref(out)).not.toContain('/p/'); // bare pathSlug, never the SSR prefix
  });

  it('single-page M1: bridges to the same-page #form-section anchor', () => {
    const content = vestriaHero('#contact');
    // No currentPagePath/formPagePath → single-page; the form exists in `forms`.
    const ctx = buildNormalizeCtasContext({ goal: M1, forms: content.forms });
    const out = normalizeCtas(content, ctx);
    expect(heroHref(out)).toBe('#form-section');
  });

  it('bridges when the flat href is absent entirely', () => {
    const content = vestriaHero(undefined);
    const ctx = buildNormalizeCtasContext({
      goal: M1,
      forms: content.forms,
      currentPagePath: '/',
      formPagePath: '/contact',
    });
    const out = normalizeCtas(content, ctx);
    expect(heroHref(out)).toBe('/contact');
  });

  it('leaves a USER-SET flat href untouched even though the cta is GOAL_REF', () => {
    const content = vestriaHero('/my-custom-target'); // not a schema default
    const ctx = buildNormalizeCtasContext({
      goal: M1,
      forms: content.forms,
      currentPagePath: '/',
      formPagePath: '/contact',
    });
    const out = normalizeCtas(content, ctx);
    expect(heroHref(out)).toBe('/my-custom-target');
  });

  it('leaves the flat href untouched for a DETACHED explicit Destination (not GOAL_REF)', () => {
    const explicit: Destination = { kind: 'section', anchor: 'features' };
    const content = {
      'hero-abc12345': {
        layout: 'VestriaTailoredHero',
        elements: { cta_text: 'Go', cta_href: '#contact' },
        elementMetadata: { cta_text: { cta: { role: 'primary', dest: explicit } } },
      },
      forms: {},
    } as Record<string, any>;
    const ctx = buildNormalizeCtasContext({
      goal: M1,
      forms: content.forms,
      currentPagePath: '/',
      formPagePath: '/contact',
    });
    const out = normalizeCtas(content, ctx);
    // The detached dest still down-converts to a buttonConfig, but the flat href
    // (which the block renders) is NOT clobbered by the goal.
    expect(heroHref(out)).toBe('#contact');
    expect(out['hero-abc12345'].elementMetadata.cta_text.buttonConfig).toEqual({
      type: 'link',
      url: '#features',
    });
  });

  it('does not mutate the input content (transient clone only)', () => {
    const content = vestriaHero('#contact');
    const before = JSON.stringify(content);
    const ctx = buildNormalizeCtasContext({
      goal: M1,
      forms: content.forms,
      currentPagePath: '/',
      formPagePath: '/contact',
    });
    const out = normalizeCtas(content, ctx);
    expect(JSON.stringify(content)).toBe(before); // source unchanged
    expect(out).not.toBe(content); // a new clone
    expect(heroHref(content)).toBe('#contact'); // original flat href intact
  });

  it('legacy metadata-less content is byte-identical (no bridge, same reference)', () => {
    const ctx = buildNormalizeCtasContext({ goal: M1, forms: LEGACY_CTA_CONTENT.forms });
    const before = JSON.stringify(LEGACY_CTA_CONTENT);
    const out = normalizeCtas(LEGACY_CTA_CONTENT, ctx);
    // No `cta` key anywhere → nothing cloned, nothing bridged → same reference.
    expect(out).toBe(LEGACY_CTA_CONTENT);
    expect(JSON.stringify(out)).toBe(before);
    expect(JSON.stringify(out)).not.toContain('form-section');
  });
});
