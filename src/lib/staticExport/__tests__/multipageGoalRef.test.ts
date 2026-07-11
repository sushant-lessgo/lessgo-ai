// src/lib/staticExport/__tests__/multipageGoalRef.test.ts
// goal-ref-cta phase 3 (F23) — the multipage M1 cross-page `page` dest, proven at
// the EXPORTER level on the REAL generated/assembled content (NOT a hand-built
// fixture pre-carrying a resolved dest).
//
// The fc is assembled exactly as the multipage generation path builds it —
// buildMultiPageSkeleton + mergePageIntoFinalContent per page with raw AI-shaped
// copy that carries NO cta metadata — then finalizeMultiPageGeneration(fc, goal)
// stamps GOAL_REF (phase 1). This test then drives that fc through the EXPORTER's
// HTML producer (generateStaticHTML), passing the currentPagePath/formPagePath the
// exporter derives via the SAME findFormPagePath scan, and asserts on the rendered
// HTML string:
//   • home page hero + header + cta primaries → href="/contact" (BARE pathSlug —
//     NOT /p/<slug>/contact; middleware/KV serve it on the published host, per the
//     ratified Spec deviation),
//   • the contact page's own primary → href="#form-section" (same-page anchor,
//     because the contact page IS the form page),
//   • single-page (no pages/formPagePath) degrades to the same-page anchor — no
//     regression.
//
// Template note: this uses MERIDIAN, whose hero/header/cta published blocks consume
// `elementMetadata.cta_text.buttonConfig` via resolveCtaHref — the mechanism phase 1
// stamps and normalizeCtas resolves. (The F23 repro template `vestria` renders a FLAT
// `cta_href` element and does NOT consume buttonConfig, so it cannot exercise the
// resolution at the render layer — see the phase-3 audit's STOP-flag finding.)

import { vi, describe, it, expect } from 'vitest';
// htmlGenerator/renderPublishedExport are `import 'server-only'`; neutralize it so
// the exporter's real HTML producer runs under vitest (jsdom).
vi.mock('server-only', () => ({}));

import { generateStaticHTML } from '../htmlGenerator';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  type MultiPageOnboardingData,
} from '@/modules/generation/multiPageAssembly';
import { findFormPagePath, type CtaPageInput } from '@/utils/normalizeCtas';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import type { Brief } from '@/types/brief';

type BriefGoal = NonNullable<Brief['goal']>;
const M1_GOAL: BriefGoal = { intent: 'book-call', mechanism: 'M1' };

// F23 repro SHAPE: the conversion form lives on /contact only — home carries NO
// form section, so its primaries must reach across to the contact page.
const SITEMAP: SitemapPage[] = [
  { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'cta'] },
  { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact', 'cta'] },
];

const OB: MultiPageOnboardingData = {
  oneLiner: 'x',
  productName: 'Acme',
  understanding: { features: ['f1'] },
  landingGoal: 'book-call',
  offer: 'Free quote',
  sitemap: SITEMAP,
  strategy: { sections: [], uiblocks: {} },
};

const FORM_SPEC = {
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
  submitButtonText: 'Send',
  successMessage: 'ok',
};

// Raw AI copy — cta_text present on the primaries, NO cta metadata (enters unstamped).
const COPY_BY_TYPE: Record<string, SectionCopy> = {
  header: { elements: { cta_text: 'Contact', logo_text: 'Acme' } } as any,
  hero: { elements: { headline: 'Hi', cta_text: 'Get started' } } as any,
  cta: { elements: { headline: 'Ready?', cta_text: 'Book a call' } } as any,
  contact: { elements: { headline: 'Reach us' } } as any,
  footer: { elements: {} } as any,
};
const copyFor = (types: string[]): Record<string, SectionCopy> =>
  Object.fromEntries(types.map((t) => [t, COPY_BY_TYPE[t] ?? ({ elements: {} } as any)]));

function buildAssembledFc() {
  const fc = buildMultiPageSkeleton({ tokenId: 'tok', title: 'Acme', onboardingData: OB });
  SITEMAP.forEach((page, i) => {
    const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
    mergePageIntoFinalContent({ fc, page, order: i, copy: copyFor(types), templateId: 'meridian', formSpec: FORM_SPEC });
  });
  return fc;
}

const hrefsIn = (html: string) =>
  (html.match(/href="[^"]*"/g) ?? []).filter((h) => /contact|form-section|#cta/.test(h));

async function renderPage(opts: {
  sections: string[];
  content: Record<string, any>;
  currentPagePath?: string;
  formPagePath?: string;
  goal?: BriefGoal | null;
}) {
  const res = await generateStaticHTML({
    sections: opts.sections,
    content: opts.content,
    theme: {},
    publishedPageId: 'p',
    pageOwnerId: 'u',
    slug: 'acme',
    title: 'Acme',
    audienceType: 'product',
    templateId: 'meridian',
    paletteId: null,
    variantId: null,
    goal: opts.goal ?? M1_GOAL,
    currentPagePath: opts.currentPagePath,
    formPagePath: opts.formPagePath,
  });
  return res.html;
}

describe('multipage GOAL_REF export (real assembly, unstamped in)', () => {
  it('the assembled fc enters UNSTAMPED (no cta metadata before finalize) and home holds NO form', () => {
    const fc = buildAssembledFc();
    const heroId = Object.keys(fc.content).find((id) => id.startsWith('hero-'))!;
    expect(fc.content[heroId].elementMetadata).toBeUndefined();
    // Home carries no form section; the form is provisioned only on /contact.
    const homeInputs: CtaPageInput[] = [{ path: '/', content: fc.content }];
    expect(findFormPagePath(homeInputs, '/')).toBeUndefined();
  });

  it('home hero + header + cta primaries emit the BARE contact page path (/contact)', async () => {
    const fc = buildAssembledFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    const pageInputs: CtaPageInput[] = [
      { path: '/', content: fc.content },
      { path: '/contact', content: fc.pages['contact'].content },
    ];
    const formPagePath = findFormPagePath(pageInputs, '/');
    expect(formPagePath).toBe('/contact'); // the exporter's scan finds the form page

    const html = await renderPage({
      sections: fc.layout.sections, // [header, hero, cta, footer] — chrome inline in the flat home
      content: fc.content,
      currentPagePath: '/',
      formPagePath,
    });

    const hrefs = hrefsIn(html);
    // header + hero + cta = 3 primaries, all cross-page to the bare pathSlug.
    expect(hrefs.filter((h) => h === 'href="/contact"').length).toBeGreaterThanOrEqual(3);
    // Spec deviation guard: never the internal SSR-rewrite prefix.
    expect(html).not.toContain('/p/acme/contact');
  });

  it('the contact page (the form page) resolves its OWN primary to the same-page #form-section anchor', async () => {
    const fc = buildAssembledFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    const pageInputs: CtaPageInput[] = [
      { path: '/', content: fc.content },
      { path: '/contact', content: fc.pages['contact'].content },
    ];
    const formPagePath = findFormPagePath(pageInputs, '/contact');
    expect(formPagePath).toBe('/contact');

    const html = await renderPage({
      sections: fc.pages['contact'].sections,
      // forms must ride along so the {type:'form'} resolution finds the connected form.
      content: { ...fc.pages['contact'].content, forms: fc.forms },
      currentPagePath: '/contact',
      formPagePath,
    });

    expect(html).toContain('href="#form-section"');
    // Its own primary does NOT navigate away to /contact.
    expect(html).not.toContain('href="/contact"');
  });

  it('single-page (no pages/formPagePath) degrades to the same-page #form-section anchor — no regression', async () => {
    const fc = buildAssembledFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    // Render the flat home as a lone single page: no currentPagePath/formPagePath
    // AND make the home hold the form so M1's same-page anchor is the correct target.
    const heroId = Object.keys(fc.content).find((id) => id.startsWith('hero-'))!;
    const singlePageContent = {
      ...fc.content,
      [heroId]: { ...fc.content[heroId], elements: { ...fc.content[heroId].elements, form_id: Object.keys(fc.forms)[0] } },
      forms: fc.forms,
    };

    const html = await renderPage({
      sections: fc.layout.sections,
      content: singlePageContent,
      // no currentPagePath / formPagePath → single-page path
    });

    expect(html).toContain('href="#form-section"');
    expect(html).not.toContain('href="/contact"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// goal-ref-cta phase 3.5 — VESTRIA flat-href RENDER BRIDGE.
//
// Vestria's hero/header render a FLAT `content.cta_href` (published `Link` takes the
// href verbatim) and never read `buttonConfig`, so the GOAL_REF stamp is dead wiring
// for them WITHOUT the bridge. This proves, on REAL assembly through the REAL
// exporter, that normalizeCtas' bridge lands the resolved goal href where vestria
// actually reads it — the exact F23 repro template (`9knkYn8_QZpE`).
// ─────────────────────────────────────────────────────────────────────────────
describe('multipage GOAL_REF export — VESTRIA flat-href bridge (phase 3.5)', () => {
  const V_SITEMAP: SitemapPage[] = [
    { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
    { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
  ];
  const V_OB: MultiPageOnboardingData = { ...OB, sitemap: V_SITEMAP };
  // Raw copy: cta_text present + the schema-default flat cta_href ('#contact').
  // Enters UNSTAMPED; finalize stamps cta_text, the bridge overwrites the default.
  const V_COPY: Record<string, SectionCopy> = {
    header: { elements: { cta_text: 'Request a Quote', cta_href: '#contact', logo_text: 'Acme' } } as any,
    hero: { elements: { headline: 'Made for teams', cta_text: 'Request a Quote', cta_href: '#contact' } } as any,
    contact: { elements: { headline: 'Reach us' } } as any,
    footer: { elements: {} } as any,
  };
  const vCopyFor = (types: string[]): Record<string, SectionCopy> =>
    Object.fromEntries(types.map((t) => [t, V_COPY[t] ?? ({ elements: {} } as any)]));

  function buildVestriaFc() {
    const fc = buildMultiPageSkeleton({ tokenId: 'tok', title: 'Acme', onboardingData: V_OB });
    V_SITEMAP.forEach((page, i) => {
      const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
      mergePageIntoFinalContent({ fc, page, order: i, copy: vCopyFor(types), templateId: 'vestria', formSpec: FORM_SPEC });
    });
    return fc;
  }

  const renderVestria = async (opts: {
    sections: string[];
    content: Record<string, any>;
    currentPagePath?: string;
    formPagePath?: string;
  }) =>
    (
      await generateStaticHTML({
        sections: opts.sections,
        content: opts.content,
        theme: {},
        publishedPageId: 'p',
        pageOwnerId: 'u',
        slug: 'acme',
        title: 'Acme',
        audienceType: 'product',
        templateId: 'vestria',
        paletteId: null,
        variantId: null,
        goal: M1_GOAL,
        currentPagePath: opts.currentPagePath,
        formPagePath: opts.formPagePath,
      })
    ).html;

  it('enters UNSTAMPED with flat cta_href = the schema default #contact', () => {
    const fc = buildVestriaFc();
    const heroId = Object.keys(fc.content).find((id) => id.startsWith('hero-'))!;
    expect(fc.content[heroId].elementMetadata).toBeUndefined();
    expect(fc.content[heroId].elements.cta_href).toBe('#contact');
  });

  it('home hero + header flat cta_href are BRIDGED to the bare /contact', async () => {
    const fc = buildVestriaFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    const pageInputs: CtaPageInput[] = [
      { path: '/', content: fc.content },
      { path: '/contact', content: fc.pages['contact'].content },
    ];
    const formPagePath = findFormPagePath(pageInputs, '/');
    expect(formPagePath).toBe('/contact');

    const html = await renderVestria({
      sections: fc.layout.sections,
      content: fc.content,
      currentPagePath: '/',
      formPagePath,
    });

    const hrefs = hrefsIn(html);
    // hero + header = 2 flat-href primaries, both cross-page to the bare pathSlug.
    expect(hrefs.filter((h) => h === 'href="/contact"').length).toBeGreaterThanOrEqual(2);
    // The block's hardcoded default must NOT survive, and never the SSR prefix.
    expect(html).not.toContain('href="#contact"');
    expect(html).not.toContain('/p/acme/contact');
  });

  it('single-page vestria: flat cta_href bridges to the same-page #form-section anchor', async () => {
    const fc = buildVestriaFc();
    finalizeMultiPageGeneration(fc, M1_GOAL);

    const heroId = Object.keys(fc.content).find((id) => id.startsWith('hero-'))!;
    const singlePageContent = {
      ...fc.content,
      [heroId]: { ...fc.content[heroId], elements: { ...fc.content[heroId].elements, form_id: Object.keys(fc.forms)[0] } },
      forms: fc.forms,
    };

    const html = await renderVestria({
      sections: fc.layout.sections,
      content: singlePageContent,
      // no currentPagePath / formPagePath → single-page same-page anchor
    });

    expect(html).toContain('href="#form-section"');
    expect(html).not.toContain('href="/contact"');
    expect(html).not.toContain('href="#contact"');
  });
});
