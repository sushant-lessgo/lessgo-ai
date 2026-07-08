// src/modules/generatedLanding/legacyHrefShim.test.tsx
//
// scale-04 (phase 8) — LEGACY-SHIM GOLDEN. The load-bearing "old pages render
// identically" guarantee.
//
// An OLD-shaped saved page carries NO `cta` field — only raw string hrefs (nav
// links) and the ad-hoc `buttonConfig` (`link` / `form` / `link-with-input` /
// `page`). This test renders such a page through the PUBLISHED block readers
// (the untouched `.published.tsx` files) and asserts the resulting `<a href>`
// values are BYTE-IDENTICAL to the pre-scale-04 resolver output.
//
// Two invariants are pinned deliberately (regressions proven in phases 1 & 5):
//   1. A verbatim WhatsApp string (via a `link` buttonConfig OR a raw nav href)
//      round-trips UNCHANGED — never re-canonicalized.
//   2. A `type:'form'` with a MISSING/unknown formId falls back to `'#cta'`,
//      NOT to a `'#form-section'` anchor (the forms-existence check lives in the
//      resolveCtaHref wrapper, not a pure shim).
//
// If the shipped code regresses, these fail — do NOT weaken the golden to pass.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import { resolveMeridianBlock } from '@/modules/templates/meridian/resolveMeridianBlock';
import { normalizeCtas } from '@/utils/normalizeCtas';

const CtaPublished = resolveMeridianBlock('cta', 'published')!;
const HeaderPublished = resolveMeridianBlock('header', 'published')!;

const SECTION_ID = 'cta-legacy';
// The forms map the page was saved with — only `lead1` exists.
const FORMS: Record<string, any> = { lead1: { id: 'lead1', fields: [] } };

/** Collect { role → href } from a rendered block's CTA anchors. */
function ctaHrefs(html: string): Record<string, string> {
  const div = document.createElement('div');
  div.innerHTML = html;
  const out: Record<string, string> = {};
  div.querySelectorAll('a[data-lessgo-cta]').forEach((a) => {
    const role = a.getAttribute('data-lessgo-cta-role') || 'primary';
    out[role] = a.getAttribute('href') || '';
  });
  return out;
}

/** Render the ArcCTA published block with legacy buttonConfigs on both slots. */
function renderCta(primary: any, secondary: any): Record<string, string> {
  const content: Record<string, any> = {
    [SECTION_ID]: {
      elementMetadata: {
        cta_text: { buttonConfig: primary },
        secondary_cta_text: { buttonConfig: secondary },
      },
    },
    forms: FORMS,
  };
  return ctaHrefs(
    renderToStaticMarkup(
      <CtaPublished
        sectionId={SECTION_ID}
        cta_text="Primary"
        secondary_cta_text="Secondary"
        content={content}
      />
    )
  );
}

// GOLDEN TABLE — every legacy buttonConfig shape → its pre-scale-04 href.
// { primary, secondary } paired so each render exercises two rows.
const GOLDEN: Array<{
  name: string;
  primary: any;
  secondary: any;
  wantPrimary: string;
  wantSecondary: string;
}> = [
  {
    name: 'link (external) + form (present)',
    primary: { type: 'link', url: 'https://calendly.com/demo' },
    secondary: { type: 'form', formId: 'lead1' },
    wantPrimary: 'https://calendly.com/demo',
    wantSecondary: '#form-section',
  },
  {
    name: 'form (missing formId) + form (unknown formId) → fallback, NOT #form-section',
    primary: { type: 'form' },
    secondary: { type: 'form', formId: 'ghost' },
    wantPrimary: '#cta',
    wantSecondary: '#cta',
  },
  {
    name: 'page + link-with-input',
    primary: { type: 'page', pathSlug: '/contact' },
    secondary: { type: 'link-with-input', url: 'https://forms.gle/abc' },
    wantPrimary: '/contact',
    wantSecondary: 'https://forms.gle/abc',
  },
  {
    name: 'link (verbatim wa.me) + link (tel)',
    primary: { type: 'link', url: 'https://wa.me/15551234567?text=Hi%20there' },
    secondary: { type: 'link', url: 'tel:+15551234567' },
    // WhatsApp string is NEVER re-canonicalized — verbatim round-trip.
    wantPrimary: 'https://wa.me/15551234567?text=Hi%20there',
    wantSecondary: 'tel:+15551234567',
  },
];

describe('legacy buttonConfig → published href (byte-identical golden)', () => {
  it.each(GOLDEN)('$name', ({ primary, secondary, wantPrimary, wantSecondary }) => {
    const hrefs = renderCta(primary, secondary);
    expect(hrefs.primary).toBe(wantPrimary);
    expect(hrefs.secondary).toBe(wantSecondary);
  });
});

describe('legacy raw string nav hrefs → verbatim', () => {
  it('a raw wa.me string nav href renders unchanged', () => {
    const waStr = 'https://wa.me/15551234567?text=Hi%20there';
    const html = renderToStaticMarkup(
      <HeaderPublished
        sectionId="header-legacy"
        logo_text="brand"
        cta_text="Start"
        signin_text="Sign in"
        nav_items={[
          { id: 'n1', label: 'Chat', href: waStr },
          { id: 'n2', label: 'Pricing', href: '/pricing' },
          { id: 'n3', label: 'Docs', href: '#docs' },
        ]}
      />
    );
    const div = document.createElement('div');
    div.innerHTML = html;
    const navHrefs = Array.from(div.querySelectorAll('a.mrd-nav-link')).map(
      (a) => a.getAttribute('href') || ''
    );
    expect(navHrefs).toContain(waStr); // verbatim, not re-encoded
    expect(navHrefs).toContain('/pricing');
    expect(navHrefs).toContain('#docs');
  });
});

describe('normalizeCtas pre-pass leaves legacy-only pages untouched', () => {
  it('content with buttonConfig but no cta returns the SAME reference (zero diff)', () => {
    const content = {
      [SECTION_ID]: {
        elementMetadata: {
          cta_text: { buttonConfig: { type: 'link', url: 'https://calendly.com/demo' } },
        },
      },
      forms: FORMS,
    };
    // Null goal + no `cta` field → the pre-pass is a no-op; old pages get a
    // byte-identical (same-reference) content object back.
    const out = normalizeCtas(content, { goal: null, forms: FORMS });
    expect(out).toBe(content);
  });
});
