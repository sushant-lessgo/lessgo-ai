// src/utils/normalizeCtas.parity.test.ts
// goal-ref-cta phase 4 (test-only) — locks THREE already-satisfied acceptance
// criteria at the ONE resolution chokepoint, `normalizeCtas`:
//
//   1. PARITY   (spec criterion 7 / decision D-B): edit and published renderers
//      produce identical hrefs. Both renderers build their ctx via
//      `buildNormalizeCtasContext` and call the SAME `normalizeCtas`. The edit
//      renderer passes `pages` (scanned via findFormPagePath inside the builder);
//      the published exporter passes a precomputed `formPagePath`. This test
//      builds BOTH ctx exactly as each renderer does and asserts the normalized
//      `buttonConfig`, the bridged flat `cta_href`, AND `resolveCtaHref` output
//      are identical.
//      WHAT THIS PROVES: the shared resolution layer (normalizeCtas +
//      buildNormalizeCtasContext + goalToDestination + the phase-3.5 flat bridge)
//      agrees for edit-shaped vs published-shaped ctx inputs.
//      WHAT IT DOES NOT PROVE: it does NOT exercise block-level rendering (the
//      `.tsx` / `.published.tsx` component pairs), nor the dead edit click path
//      (`src/utils/ctaHandler.ts`, zero importers). Per D-B the edit `.tsx`
//      blocks compute no href — they render editable text — so the only layer
//      where an href exists in BOTH worlds is normalizeCtas, and that is the
//      ratified parity layer.
//
//   2. RE-POINT (spec criterion 5, first half): the SAME GOAL_REF-stamped content,
//      resolved under two different `goal` values, produces different hrefs
//      (M1 single-page #form-section → M1 multipage cross-page bare /contact →
//      M3 external URL). Resolution is a render-time concern: nothing is persisted
//      between resolutions (source content asserted byte-identical after all calls).
//
//   3. DETACH   (spec criterion 5, second half): an element whose `cta.dest` is an
//      explicit `Destination` — the exact shape `ButtonConfigurationModal
//      .buildCtaButton` writes on detach — is UNTOUCHED by a goal change (its
//      buttonConfig AND its flat `cta_href` both survive; the phase-3.5 bridge
//      skips a non-GOAL_REF cta).
//
// FALSE-GREEN GUARD: every GOAL_REF fixture is produced by the REAL
// `stampGoalRefCtas` (or the real multipage assembly), never by hand-authoring
// `dest:'GOAL_REF'`. Each assertion would fail if the feature were reverted.

import { describe, it, expect } from 'vitest';
import {
  normalizeCtas,
  buildNormalizeCtasContext,
  type CtaPageInput,
} from './normalizeCtas';
import { resolveCtaHref } from './resolveCtaHref';
import { stampGoalRefCtas } from '@/modules/goals/stampGoalRefCtas';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  type MultiPageOnboardingData,
} from '@/modules/generation/multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import type { Brief } from '@/types/brief';
import type { Destination } from '@/types/destination';

type BriefGoal = NonNullable<Brief['goal']>;

const M1_GOAL: BriefGoal = { intent: 'book-call', mechanism: 'M1' };
const M3_GOAL: BriefGoal = {
  intent: 'buy-via-link',
  mechanism: 'M3',
  destination: 'https://cal.com/acme/intro',
};

const findId = (content: Record<string, any>, prefix: string) =>
  Object.keys(content).find((id) => id.startsWith(`${prefix}-`))!;

// ---------------------------------------------------------------------------
// 1. PARITY — edit-shaped ctx vs published-shaped ctx, over REAL-assembly content
// ---------------------------------------------------------------------------

// A multipage sitemap where the HOME page does NOT hold the conversion form
// (no `contact` section) — forcing the cross-page `page` dest that both
// renderers must resolve identically. The `contact` page holds the form.
const PARITY_SITEMAP: SitemapPage[] = [
  { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'cta'] },
  { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
];

const PARITY_OB: MultiPageOnboardingData = {
  oneLiner: 'x',
  productName: 'Acme',
  understanding: { features: ['f1'] },
  landingGoal: 'book-call',
  offer: 'Free quote',
  sitemap: PARITY_SITEMAP,
  strategy: { sections: [], uiblocks: {} },
};

const FORM_SPEC = {
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
  submitButtonText: 'Send',
  successMessage: 'ok',
};

// Raw AI-shaped copy — cta_text present (header/hero/cta), NO cta metadata. The
// fixtures enter the assembly UNSTAMPED; only finalizeMultiPageGeneration stamps.
const PARITY_COPY: Record<string, SectionCopy> = {
  header: { elements: { cta_text: 'Contact', signin_text: 'Sign in' } } as any,
  hero: { elements: { headline: 'Hi', cta_text: 'Get started' } } as any,
  cta: { elements: { headline: 'Ready?', cta_text: 'Book a call' } } as any,
  contact: { elements: { headline: 'Reach us' } } as any,
  footer: { elements: {} } as any,
};

const copyFor = (types: string[]): Record<string, SectionCopy> =>
  Object.fromEntries(types.map((t) => [t, PARITY_COPY[t] ?? ({ elements: {} } as any)]));

/** Build a fully-assembled, GOAL_REF-stamped multipage fc via the REAL path. */
function buildStampedFc() {
  const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'Acme', onboardingData: PARITY_OB });
  PARITY_SITEMAP.forEach((page, i) => {
    const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
    mergePageIntoFinalContent({
      fc,
      page,
      order: i,
      copy: copyFor(types),
      templateId: 'meridian', // buttonConfig-wired — resolveCtaHref assertions are real
      formSpec: FORM_SPEC,
    });
  });
  finalizeMultiPageGeneration(fc, M1_GOAL); // REAL stamp — dest:'GOAL_REF' out
  return fc;
}

describe('normalizeCtas parity — edit vs published ctx agree (spec 7 / D-B)', () => {
  it('multipage M1 (home, form on /contact): identical output for both ctx shapes', () => {
    const fc = buildStampedFc();

    // Guard: the assembled content really entered stamped-by-machinery, not hand-authored.
    const homeHeroId = findId(fc.pages['home'].content, 'hero');
    expect(fc.pages['home'].content[homeHeroId].elementMetadata.cta_text.cta.dest).toBe('GOAL_REF');

    // Both renderers see the home BODY with the chrome header merged in (edit via
    // withChrome, published via injectChromeIntoPage). Reproduce that merged content.
    const headerId = fc.chrome.header.id;
    const homeContent: Record<string, any> = {
      ...fc.pages['home'].content,
      [headerId]: fc.chrome.header.data,
    };
    const contactContent = fc.pages['contact'].content;
    const forms = fc.forms as Record<string, unknown>;

    // EDIT renderer ctx (LandingPageRenderer.tsx:142-152): passes `pages`; the
    // form-bearing page is scanned INSIDE buildNormalizeCtasContext.
    const editPages: CtaPageInput[] = [
      { path: '/', content: homeContent },
      { path: '/contact', content: contactContent },
    ];
    const editCtx = buildNormalizeCtasContext({
      goal: M1_GOAL,
      forms,
      currentPagePath: '/',
      pages: editPages,
    });

    // PUBLISHED exporter ctx (renderPublishedExport.ts:156-157 →
    // LandingPagePublishedRenderer.tsx:85-88): passes a PRECOMPUTED formPagePath.
    const publishedCtx = buildNormalizeCtasContext({
      goal: M1_GOAL,
      forms,
      currentPagePath: '/',
      formPagePath: '/contact',
    });

    const editOut = normalizeCtas(homeContent, editCtx);
    const publishedOut = normalizeCtas(homeContent, publishedCtx);

    // Whole-tree structural parity: every buttonConfig + every bridged cta_href.
    expect(editOut).toEqual(publishedOut);

    // Explicit per-primary parity: buttonConfig, bridged flat href, resolveCtaHref.
    const ctaId = findId(homeContent, 'cta');
    for (const [sid, label] of [
      [homeHeroId, 'hero'],
      [ctaId, 'cta'],
      [headerId, 'header'],
    ] as const) {
      const editBc = editOut[sid].elementMetadata.cta_text.buttonConfig;
      const pubBc = publishedOut[sid].elementMetadata.cta_text.buttonConfig;
      expect(editBc, `${label} buttonConfig`).toEqual(pubBc);
      expect(editBc, `${label} is cross-page dest`).toEqual({ type: 'page', pathSlug: '/contact' });

      const editHref = resolveCtaHref(editBc, forms as Record<string, any>);
      const pubHref = resolveCtaHref(pubBc, forms as Record<string, any>);
      expect(editHref, `${label} resolveCtaHref`).toBe(pubHref);
      expect(editHref, `${label} bare pathSlug`).toBe('/contact');
      expect(editHref).not.toContain('/p/'); // never the SSR /p/<slug>/ prefix
    }
  });
});

// ---------------------------------------------------------------------------
// 2. RE-POINT — same content, different goal → href changes (spec 5, first half)
// ---------------------------------------------------------------------------

/** A meridian-style hero with a stamp-able `cta_text` + a flat `cta_href` schema
 *  default. Stamped by the REAL stampGoalRefCtas — never hand-authored. */
function stampedHero(goal: BriefGoal, formId?: string): Record<string, any> {
  const content: Record<string, any> = {
    'hero-abc12345': {
      layout: 'MeridianHero',
      elements: { headline: 'Hi', cta_text: 'Go', cta_href: '#contact' },
    },
  };
  stampGoalRefCtas(content, { goal, formId });
  return content;
}

const heroBc = (out: Record<string, any>) =>
  out['hero-abc12345'].elementMetadata.cta_text.buttonConfig;
const heroFlatHref = (out: Record<string, any>) => out['hero-abc12345'].elements.cta_href;

describe('normalizeCtas re-point — goal change re-points every GOAL_REF primary (spec 5)', () => {
  it('one stamped content resolves differently under M1-single / M1-multipage / M3', () => {
    // Stamp ONCE with M1 (realistic generation output, carries a formId). The
    // stamped formId is inert at resolution — GOAL_REF resolution reads ctx.goal,
    // never the stamped formId — so the SAME content re-points as the goal changes.
    const content = stampedHero(M1_GOAL, 'form-1');
    expect(content['hero-abc12345'].elementMetadata.cta_text.cta).toEqual({
      role: 'primary',
      dest: 'GOAL_REF',
      formId: 'form-1',
    });
    const before = JSON.stringify(content);

    const forms = { 'form-1': { id: 'form-1', name: 'Contact', fields: [] } };

    // Goal A — M1, single page → same-page form anchor.
    const outA = normalizeCtas(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms }));
    expect(heroBc(outA)).toEqual({ type: 'form', formId: 'form-1' });
    expect(resolveCtaHref(heroBc(outA), forms)).toBe('#form-section');
    expect(heroFlatHref(outA)).toBe('#form-section'); // phase-3.5 bridge re-points too

    // Goal B — M1, multipage, form on /contact → cross-page BARE page dest.
    const outB = normalizeCtas(
      content,
      buildNormalizeCtasContext({
        goal: M1_GOAL,
        forms,
        currentPagePath: '/',
        formPagePath: '/contact',
      }),
    );
    expect(heroBc(outB)).toEqual({ type: 'page', pathSlug: '/contact' });
    expect(resolveCtaHref(heroBc(outB), forms)).toBe('/contact');
    expect(resolveCtaHref(heroBc(outB), forms)).not.toContain('/p/');
    expect(heroFlatHref(outB)).toBe('/contact');

    // Goal C — M3 external URL (Brief goal edited to a different mechanism).
    const outC = normalizeCtas(content, buildNormalizeCtasContext({ goal: M3_GOAL, forms }));
    expect(heroBc(outC)).toEqual({ type: 'link', url: 'https://cal.com/acme/intro' });
    expect(resolveCtaHref(heroBc(outC), forms)).toBe('https://cal.com/acme/intro');
    expect(heroFlatHref(outC)).toBe('https://cal.com/acme/intro');

    // The three hrefs genuinely differ — the goal re-points resolution.
    const hrefs = [outA, outB, outC].map((o) => heroFlatHref(o));
    expect(new Set(hrefs).size).toBe(3);

    // Render-time only: NOTHING persisted between resolutions.
    expect(JSON.stringify(content)).toBe(before);
    expect(outA).not.toBe(content);
  });
});

// ---------------------------------------------------------------------------
// 3. DETACH — explicit Destination is untouched by a goal change (spec 5)
// ---------------------------------------------------------------------------

// The exact shape ButtonConfigurationModal.buildCtaButton writes when the user
// DETACHES a primary and picks a page destination (verified against the source:
// `case 'page': return { role, dest: { kind:'page', pathSlug } }`). It is NOT a
// GOAL_REF stamp — so a Brief goal change must not affect it, and the phase-3.5
// bridge must not clobber its flat href.
const DETACHED_PAGE_DEST: Destination = { kind: 'page', pathSlug: '/pricing' };

describe('normalizeCtas detach — explicit Destination ignores goal change (spec 5)', () => {
  it('a detached primary keeps its buttonConfig and flat href while a GOAL_REF primary re-points', () => {
    // One page with BOTH a GOAL_REF primary (must re-point) and a DETACHED
    // primary (must NOT). The contrast is what locks the feature: it would fail
    // if goal resolution broke OR if the bridge wrongly clobbered a detached href.
    const goalContent = stampedHero(M1_GOAL, 'form-1'); // real GOAL_REF stamp
    const content: Record<string, any> = {
      ...goalContent,
      'cta-def67890': {
        layout: 'MeridianCTA',
        elements: { cta_text: 'See pricing', cta_href: '#contact' },
        elementMetadata: {
          cta_text: { cta: { role: 'primary', dest: DETACHED_PAGE_DEST } },
        },
      },
    };
    const forms = { 'form-1': { id: 'form-1', name: 'Contact', fields: [] } };
    const detachedBc = (o: Record<string, any>) =>
      o['cta-def67890'].elementMetadata.cta_text.buttonConfig;
    const detachedHref = (o: Record<string, any>) => o['cta-def67890'].elements.cta_href;

    // Resolve under goal A (M1 single) and goal B (M3 external).
    const outA = normalizeCtas(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms }));
    const outB = normalizeCtas(content, buildNormalizeCtasContext({ goal: M3_GOAL, forms }));

    // The GOAL_REF primary DID re-point between the two goals.
    expect(heroFlatHref(outA)).not.toBe(heroFlatHref(outB));

    // The DETACHED primary's buttonConfig is identical under both goals …
    expect(detachedBc(outA)).toEqual({ type: 'page', pathSlug: '/pricing' });
    expect(detachedBc(outA)).toEqual(detachedBc(outB));

    // … and its flat cta_href is UNTOUCHED by the bridge (GOAL_REF-only) under both.
    expect(detachedHref(outA)).toBe('#contact');
    expect(detachedHref(outB)).toBe('#contact');
  });
});
