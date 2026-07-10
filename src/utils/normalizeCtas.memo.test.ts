// src/utils/normalizeCtas.memo.test.ts
// perf-01 phase 4 (B1) — the editor-only per-section memoizing wrapper
// (`createNormalizeCtasMemo`) must be a drop-in for the pure `normalizeCtas`:
//
//   PARITY  — memoized output DEEP-EQUALS pure output across representative
//             fixtures (single-page + GOAL_REF flat-href bridge + real-assembly
//             multipage). This is the guard that the memo never diverges from the
//             published path (which keeps using the pure export).
//   REF-STABILITY — the reason the memo exists:
//             (i)   an untouched section keeps its OUTPUT identity across a 2nd call;
//             (ii)  a section whose raw ref changed gets a FRESH output identity;
//             (iii) a goal / forms / form-location change (ctx signature) invalidates
//                   the affected sections' cached output.
//
// FALSE-GREEN GUARD: every GOAL_REF fixture is produced by the REAL
// `stampGoalRefCtas` / real multipage assembly, never by hand-authoring
// `dest:'GOAL_REF'`.

import { describe, it, expect } from 'vitest';
import {
  normalizeCtas,
  createNormalizeCtasMemo,
  buildNormalizeCtasContext,
  type CtaPageInput,
} from './normalizeCtas';
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

type BriefGoal = NonNullable<Brief['goal']>;

const M1_GOAL: BriefGoal = { intent: 'book-call', mechanism: 'M1' };
const M3_GOAL: BriefGoal = {
  intent: 'buy-via-link',
  mechanism: 'M3',
  destination: 'https://cal.com/acme/intro',
};
const FORMS = { 'form-1': { id: 'form-1', name: 'Contact', fields: [] } } as Record<string, unknown>;

/** Single-page-ish content: two GOAL_REF-stampable sections + a no-cta footer. */
function buildContent(goal: BriefGoal = M1_GOAL): Record<string, any> {
  const content: Record<string, any> = {
    'hero-abc12345': {
      layout: 'MeridianHero',
      elements: { headline: 'Hi', cta_text: 'Go', cta_href: '#contact' },
    },
    'cta-def67890': {
      layout: 'MeridianCTA',
      elements: { headline: 'Ready?', cta_text: 'Book', cta_href: '#contact' },
    },
    'footer-ghi00000': {
      layout: 'HairlineFooter',
      elements: { copyright: '© Acme' }, // no cta_text → never cloned
    },
  };
  stampGoalRefCtas(content, { goal, formId: 'form-1' });
  return content;
}

// --- real multipage assembly (mirrors normalizeCtas.parity.test.ts) ----------

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
const PARITY_COPY: Record<string, SectionCopy> = {
  header: { elements: { cta_text: 'Contact', signin_text: 'Sign in' } } as any,
  hero: { elements: { headline: 'Hi', cta_text: 'Get started' } } as any,
  cta: { elements: { headline: 'Ready?', cta_text: 'Book a call' } } as any,
  contact: { elements: { headline: 'Reach us' } } as any,
  footer: { elements: {} } as any,
};
const copyFor = (types: string[]): Record<string, SectionCopy> =>
  Object.fromEntries(types.map((t) => [t, PARITY_COPY[t] ?? ({ elements: {} } as any)]));

function buildStampedMultipage() {
  const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'Acme', onboardingData: PARITY_OB });
  PARITY_SITEMAP.forEach((page, i) => {
    const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
    mergePageIntoFinalContent({ fc, page, order: i, copy: copyFor(types), templateId: 'meridian', formSpec: FORM_SPEC });
  });
  finalizeMultiPageGeneration(fc, M1_GOAL);
  const headerId = fc.chrome.header.id;
  const homeContent: Record<string, any> = { ...fc.pages['home'].content, [headerId]: fc.chrome.header.data };
  const editPages: CtaPageInput[] = [
    { path: '/', content: homeContent },
    { path: '/contact', content: fc.pages['contact'].content },
  ];
  return { homeContent, editPages, forms: fc.forms as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// PARITY
// ---------------------------------------------------------------------------

describe('createNormalizeCtasMemo — parity with pure normalizeCtas', () => {
  it('single-page GOAL_REF content: memoized deep-equals pure', () => {
    const content = buildContent();
    const ctx = buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS });
    const memo = createNormalizeCtasMemo();
    expect(memo(content, ctx)).toEqual(normalizeCtas(content, ctx));
  });

  it('GOAL_REF flat-href bridge (M3 external): memoized deep-equals pure', () => {
    const content = buildContent(M3_GOAL);
    const ctx = buildNormalizeCtasContext({ goal: M3_GOAL, forms: FORMS });
    const memo = createNormalizeCtasMemo();
    const memoed = memo(content, ctx);
    const pure = normalizeCtas(content, ctx);
    expect(memoed).toEqual(pure);
    // Bridge actually fired (flat cta_href re-pointed) — proves parity is non-trivial.
    expect((memoed as any)['hero-abc12345'].elements.cta_href).toBe('https://cal.com/acme/intro');
  });

  it('real-assembly multipage (cross-page page dest): memoized deep-equals pure', () => {
    const { homeContent, editPages } = buildStampedMultipage();
    const ctx = buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS, currentPagePath: '/', pages: editPages });
    const memo = createNormalizeCtasMemo();
    expect(memo(homeContent, ctx)).toEqual(normalizeCtas(homeContent, ctx));
  });

  it('null-goal content passes through the SAME ref (matches pure)', () => {
    const content = buildContent();
    const ctx = buildNormalizeCtasContext({ goal: null, forms: {} });
    const memo = createNormalizeCtasMemo();
    const out = memo(content, ctx);
    expect(out).toBe(content); // no section resolves → no clone, byte-identical
    expect(out).toBe(normalizeCtas(content, ctx));
  });
});

// ---------------------------------------------------------------------------
// REF-STABILITY
// ---------------------------------------------------------------------------

describe('createNormalizeCtasMemo — ref stability', () => {
  it('(i) untouched section keeps output identity across a 2nd call; (ii) a changed-ref section gets fresh identity', () => {
    const content = buildContent();
    const ctx = buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS });
    const memo = createNormalizeCtasMemo();

    const first = memo(content, ctx);
    // Both cta sections were cloned (resolvable GOAL_REF).
    expect(first['hero-abc12345']).not.toBe(content['hero-abc12345']);
    expect(first['cta-def67890']).not.toBe(content['cta-def67890']);

    // Edit ONLY the cta section → fresh ref for it; hero keeps its ref (Immer-style).
    const content2: Record<string, any> = {
      ...content,
      'cta-def67890': { ...content['cta-def67890'], elements: { ...content['cta-def67890'].elements, headline: 'Edited' } },
    };
    const second = memo(content2, ctx);

    // (i) hero untouched → SAME cached output object.
    expect(second['hero-abc12345']).toBe(first['hero-abc12345']);
    // (ii) cta ref changed → recomputed → fresh output object.
    expect(second['cta-def67890']).not.toBe(first['cta-def67890']);
    // Still correct (deep-equals pure for the edited tree).
    expect(second).toEqual(normalizeCtas(content2, ctx));
  });

  it('no-cta section returns the SAME input ref (no phantom clone)', () => {
    const content = buildContent();
    const ctx = buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS });
    const memo = createNormalizeCtasMemo();
    const out = memo(content, ctx);
    expect(out['footer-ghi00000']).toBe(content['footer-ghi00000']);
  });

  it('(iii) a goal change (ctx signature) invalidates cached output and re-points', () => {
    const content = buildContent();
    const memo = createNormalizeCtasMemo();

    const outM1 = memo(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS }));
    const heroM1 = outM1['hero-abc12345'];

    // Same content ref, DIFFERENT goal → ctx signature changes → recompute.
    const outM3 = memo(content, buildNormalizeCtasContext({ goal: M3_GOAL, forms: FORMS }));
    const heroM3 = outM3['hero-abc12345'];

    expect(heroM3).not.toBe(heroM1); // cache invalidated by ctx signature
    expect(heroM1.elementMetadata.cta_text.buttonConfig).toEqual({ type: 'form', formId: 'form-1' });
    expect(heroM3.elementMetadata.cta_text.buttonConfig).toEqual({ type: 'link', url: 'https://cal.com/acme/intro' });

    // A THIRD call under M1 again with the same content ref → cache re-warms and is
    // stable across a repeat call.
    const outM1b = memo(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS }));
    const outM1c = memo(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS }));
    expect(outM1c['hero-abc12345']).toBe(outM1b['hero-abc12345']);
  });

  it('(iii) a form-location change (formPagePath) invalidates cached output', () => {
    const content = buildContent();
    const memo = createNormalizeCtasMemo();

    // Same page anchor form vs cross-page form → different resolution, must invalidate.
    const outSame = memo(content, buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS }));
    const outCross = memo(
      content,
      buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS, currentPagePath: '/', formPagePath: '/contact' }),
    );
    expect(outCross['hero-abc12345']).not.toBe(outSame['hero-abc12345']);
    expect(outSame['hero-abc12345'].elementMetadata.cta_text.buttonConfig).toEqual({ type: 'form', formId: 'form-1' });
    expect(outCross['hero-abc12345'].elementMetadata.cta_text.buttonConfig).toEqual({ type: 'page', pathSlug: '/contact' });
  });

  it('prunes cache keys for sections no longer present', () => {
    const memo = createNormalizeCtasMemo();
    const ctx = buildNormalizeCtasContext({ goal: M1_GOAL, forms: FORMS });

    const content = buildContent();
    const first = memo(content, ctx);
    const heroOut = first['hero-abc12345'];

    // Drop the hero section entirely, then re-add the SAME hero ref later.
    const withoutHero: Record<string, any> = { ...content };
    delete withoutHero['hero-abc12345'];
    memo(withoutHero, ctx); // hero pruned from cache here

    // Re-add the same hero object ref: because the cache entry was pruned, the memo
    // recomputes → a NEW output object (proves the stale entry didn't linger).
    const readded = memo(content, ctx);
    expect(readded['hero-abc12345']).not.toBe(heroOut);
    // …and still correct.
    expect(readded).toEqual(normalizeCtas(content, ctx));
  });
});
