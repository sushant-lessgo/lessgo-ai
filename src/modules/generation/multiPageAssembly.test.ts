// Invariant + behavior tests for the AI multi-page assembler (Phase 3).
// PO review blocker 2 (HARD INVARIANT): the assembler must never trip the
// Products-panel materialization machinery — no materializeIntoPages /
// materializeHomeTeasers calls, no collectionKey, never kind:'collectionItem'.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildMultiPageSkeleton,
  mergePageIntoFinalContent,
  finalizeMultiPageGeneration,
  isResumableGeneration,
  assembleCollectionPages,
  firingCollectionKeys,
  mergeCollectionItemCopy,
  runCollectionFanOut,
  type MultiPageOnboardingData,
  type CollectionItemPagePlan,
} from './multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import type { CollectionsFacts } from '@/modules/brief/collections';
import { slugify } from '@/lib/normalize';

const SITEMAP: SitemapPage[] = [
  { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'catalog', 'contact'] },
  { archetypeKey: 'about', title: 'About', pathSlug: '/about', sections: ['about', 'process'] },
  { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
];

const OB: MultiPageOnboardingData = {
  oneLiner: 'x',
  productName: 'Vestria',
  understanding: { features: ['f1'] },
  landingGoal: 'demo',
  offer: 'Free quote',
  sitemap: SITEMAP,
  strategy: { sections: [], uiblocks: {} },
};

const FORM_SPEC = {
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
  submitButtonText: 'Send',
  successMessage: 'ok',
};

const copyFor = (types: string[]): Record<string, SectionCopy> =>
  Object.fromEntries(types.map((t) => [t, { elements: { headline: `${t} headline` } } as any]));

function buildFull() {
  const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'Vestria', onboardingData: OB });
  SITEMAP.forEach((page, i) => {
    const types = page.pathSlug === '/' ? ['header', ...page.sections, 'footer'] : page.sections;
    mergePageIntoFinalContent({
      fc,
      page,
      order: i,
      copy: copyFor(types),
      templateId: 'vestria',
      formSpec: FORM_SPEC,
    });
  });
  return fc;
}

describe('multiPageAssembly — HARD INVARIANT (no materialization, PO blocker 2)', () => {
  it('source never references the materialization machinery', () => {
    const src = fs.readFileSync(path.join(__dirname, 'multiPageAssembly.ts'), 'utf8');
    // Scan CODE lines only — the module's doc comment names the forbidden
    // functions on purpose (that's the invariant being documented).
    const code = src
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toContain('materializeIntoPages');
    expect(code).not.toContain('materializeHomeTeasers');
  });

  it('no page carries collectionKey or kind:collectionItem', () => {
    const fc = buildFull();
    for (const page of Object.values<any>(fc.pages)) {
      expect(page.collectionKey).toBeUndefined();
      expect(page.kind === 'collectionItem').toBe(false);
    }
  });

  it('vestria registers no CollectionDef (catalog items stay plain ai_generated)', async () => {
    const { COLLECTIONS } = await import('@/modules/collections/registry');
    const defs = Object.values(COLLECTIONS).map((d) => d.key);
    // scale-10: the collection FAMILY is registered, but vestria's flat-grid
    // `catalog` is NOT a registered CollectionDef (never a CollectionKey).
    expect(defs).not.toContain('catalog');
    expect(defs).toEqual(['products', 'services', 'case-studies', 'works']);
  });
});

describe('multiPageAssembly — shape + behavior', () => {
  it('emits the buildTechPremiumHomeFinalContent shape: flat home + chrome + body-only pages', () => {
    const fc = buildFull();
    expect(fc.homeId).toBe('home');
    expect(fc.currentPageId).toBe('home');

    // Chrome extracted from the home call.
    expect(fc.chrome.header.data.layout).toBe('VestriaNavHeader');
    expect(fc.chrome.footer.data.layout).toBe('VestriaFooter');

    // Flat top-level = home WITH chrome inline.
    expect(fc.layout.sections).toHaveLength(2 + SITEMAP[0].sections.length);
    expect(fc.layout.sections[0]).toMatch(/^header-/);
    expect(fc.layout.sections.at(-1)).toMatch(/^footer-/);

    // Pages are BODY-ONLY (no chrome ids).
    const home = fc.pages['home'];
    expect(home.sections).toHaveLength(SITEMAP[0].sections.length);
    expect(home.sections.some((id: string) => id.startsWith('header-') || id.startsWith('footer-'))).toBe(false);

    const about = fc.pages['about'];
    expect(about.pathSlug).toBe('/about');
    expect(about.kind).toBe('singleton');
    expect(about.sections.map((id: string) => id.split('-')[0])).toEqual(['about', 'process']);
    // Subpage layouts resolve to Vestria block layouts.
    expect(Object.values(about.sectionLayouts)).toContain('VestriaAboutStats');
  });

  it('provisions ONE shared Contact form; every contact section points at it', () => {
    const fc = buildFull();
    const formIds = Object.keys(fc.forms ?? {});
    expect(formIds).toHaveLength(1);
    const formId = formIds[0];

    const contactSections = Object.values<any>(fc.pages)
      .flatMap((p: any) => Object.values<any>(p.content))
      .filter((s: any) => s.id.startsWith('contact-'));
    expect(contactSections.length).toBe(2); // home strip + contact page
    for (const s of contactSections) expect(s.elements.form_id).toBe(formId);
  });

  it('tracks per-page progress; finalize drops the marker; resume detection matches', () => {
    const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'T', onboardingData: OB });
    expect(isResumableGeneration(fc)).toBe(true);
    expect(fc.generationProgress.completedPageKeys).toEqual([]);

    mergePageIntoFinalContent({
      fc, page: SITEMAP[0], order: 0,
      copy: copyFor(['header', ...SITEMAP[0].sections, 'footer']),
      templateId: 'vestria', formSpec: FORM_SPEC,
    });
    expect(fc.generationProgress.completedPageKeys).toEqual(['home']);

    // Idempotent — re-merging a completed page doesn't duplicate the key.
    mergePageIntoFinalContent({
      fc, page: SITEMAP[0], order: 0,
      copy: copyFor(['header', ...SITEMAP[0].sections, 'footer']),
      templateId: 'vestria', formSpec: FORM_SPEC,
    });
    expect(fc.generationProgress.completedPageKeys).toEqual(['home']);

    finalizeMultiPageGeneration(fc);
    expect(fc.generationProgress).toBeUndefined();
    expect(isResumableGeneration(fc)).toBe(false);
  });

  it('survives the JSON round-trip (per-page persistence): resume sees completed pages', () => {
    const fc = buildMultiPageSkeleton({ tokenId: 'tok1', title: 'T', onboardingData: OB });
    mergePageIntoFinalContent({
      fc, page: SITEMAP[0], order: 0,
      copy: copyFor(['header', ...SITEMAP[0].sections, 'footer']),
      templateId: 'vestria', formSpec: FORM_SPEC,
    });
    const reloaded = JSON.parse(JSON.stringify(fc));
    expect(isResumableGeneration(reloaded)).toBe(true);
    expect(reloaded.generationProgress.completedPageKeys).toEqual(['home']);

    // Resume merges the remaining pages into the reloaded object; the shared
    // form is FOUND again (not duplicated).
    mergePageIntoFinalContent({
      fc: reloaded, page: SITEMAP[2], order: 2,
      copy: copyFor(SITEMAP[2].sections),
      templateId: 'vestria', formSpec: FORM_SPEC,
    });
    expect(Object.keys(reloaded.forms)).toHaveLength(1);
    expect(reloaded.pages['contact'].content[reloaded.pages['contact'].sections[0]].elements.form_id)
      .toBe(Object.keys(reloaded.forms)[0]);
  });
});

// ─── scale-10 phase 5: collections bridge (registry-gated, ships DORMANT) ─────
// The bridge fires ONLY under the double gate — getCollectionDef(K) exists AND
// the template declares capability K. No live template declares a collection-
// family capability, so these tests exercise it via a FIXTURE capability list
// passed directly to the (meta-agnostic) bridge functions — no real template
// gains a capability. The invariant tests above still prove real-template paths
// stamp ZERO collectionKey/collectionItem.

describe('multiPageAssembly — collections bridge (dormant, fixture-driven)', () => {
  const PRODUCTS = ['NWC 1000', 'NWC 2000', 'NWB 3000', 'NWC 101', 'NWC 301', 'NWC 201', 'NWM 100', 'NWM 300'];
  const facts = (names: string[]): CollectionsFacts => ({
    products: names.map((n) => ({ name: n, slug: slugify(n) })),
  });

  it('fixture template declaring `products`: index + N item pages, code-derived slugs', () => {
    const fc: any = { pages: {} };
    const plans = assembleCollectionPages({ fc, collections: facts(PRODUCTS), declaredCapabilities: ['products'] });
    const pages = Object.values<any>(fc.pages);
    const catalog = pages.find((p) => p.kind === 'singleton' && p.collectionKey === 'products');
    const items = pages.filter((p) => p.kind === 'collectionItem' && p.collectionKey === 'products');
    expect(catalog).toBeTruthy();
    expect(catalog.pathSlug).toBe('/products');
    expect(items).toHaveLength(8);
    expect(plans).toHaveLength(8);
    // Slugs are ALWAYS code-derived: def.basePath + '/' + slugify(name).
    for (const p of items) expect(p.pathSlug).toBe(`/products/${slugify(p.title)}`);
    expect(items.map((p) => p.pathSlug)).toContain('/products/nwc-1000');
  });

  it('removed-at-gate entries produce no pages (8 remove 2 ⇒ 6 item pages)', () => {
    const fc: any = { pages: {} };
    assembleCollectionPages({ fc, collections: facts(PRODUCTS.slice(0, 6)), declaredCapabilities: ['products'] });
    const items = Object.values<any>(fc.pages).filter((p) => p.kind === 'collectionItem');
    expect(items).toHaveLength(6);
  });

  it('empty collection ⇒ index only (empty-state)', () => {
    const fc: any = { pages: {} };
    const plans = assembleCollectionPages({ fc, collections: { products: [] }, declaredCapabilities: ['products'] });
    const pages = Object.values<any>(fc.pages);
    expect(pages).toHaveLength(1);
    expect(pages[0].kind).toBe('singleton');
    expect(plans).toHaveLength(0);
  });

  it('facts present but capability ABSENT ⇒ no bridge (the vestria case)', () => {
    const fc: any = { pages: {} };
    const plans = assembleCollectionPages({
      fc,
      collections: facts(PRODUCTS),
      declaredCapabilities: ['catalog', 'lead-form', 'trust'], // vestria's flat-grid caps
    });
    expect(Object.keys(fc.pages)).toHaveLength(0);
    expect(plans).toHaveLength(0);
    expect(firingCollectionKeys(['catalog', 'lead-form', 'trust'])).toEqual([]);
  });

  it('registry def ABSENT for the declared cap ⇒ no bridge; present ⇒ fires', () => {
    expect(firingCollectionKeys(['catalog'])).toEqual([]); // flat-grid, no CollectionDef
    expect(firingCollectionKeys(['products'])).toEqual(['products']);
    expect(firingCollectionKeys([])).toEqual([]);
  });

  it('CLAMP: AI item outside Brief entries dropped; record fields stay verbatim', () => {
    const fc: any = { pages: {} };
    const f = facts(['NWC 1000']);
    const plans = assembleCollectionPages({ fc, collections: f, declaredCapabilities: ['products'] });
    const briefSlugs = new Set(f.products!.map((e) => e.slug));

    // Real plan: AI tries to overwrite the record `name` + adds connective `lede`.
    mergeCollectionItemCopy({
      fc,
      plan: plans[0],
      briefSlugs,
      copy: { productdetail: { elements: { name: 'HACKED', lede: 'connective copy' } } as any },
    });
    const page = fc.pages[plans[0].pageKey];
    const rec = page.content[page.sections[0]].elements;
    expect(rec.name).toBe('NWC 1000'); // VERBATIM — not 'HACKED'
    expect(rec.lede).toBe('connective copy'); // AI connective copy applied

    // Invented item (slug not in Brief) — dropped, no page mutated/created.
    const fake: CollectionItemPagePlan = { ...plans[0], slug: 'invented', pageKey: 'page-invented' };
    mergeCollectionItemCopy({ fc, plan: fake, briefSlugs, copy: { productdetail: { elements: { lede: 'x' } } as any } });
    expect(fc.pages['page-invented']).toBeUndefined();
  });

  it('runCollectionFanOut is DORMANT with no firing key: no pages, no copy calls', async () => {
    const fc: any = { pages: {} };
    let calls = 0;
    const r = await runCollectionFanOut({
      fc,
      collections: facts(PRODUCTS),
      declaredCapabilities: ['catalog', 'lead-form'], // no collection-family cap
      generateItemCopy: async () => { calls++; return { status: 'done', copy: {} }; },
      persist: async () => {},
    });
    expect(r.status).toBe('done');
    expect(calls).toBe(0);
    expect(Object.keys(fc.pages)).toHaveLength(0);
  });

  it('runCollectionFanOut fires on a fixture cap: item copy merged, per-page persistence tracked', async () => {
    const fc: any = { pages: {}, generationProgress: { completedPageKeys: [] } };
    const persistedAt: number[] = [];
    const r = await runCollectionFanOut({
      fc,
      collections: facts(['Alpha', 'Beta']),
      declaredCapabilities: ['products'],
      generateItemCopy: async (plan) => ({
        status: 'done',
        copy: { productdetail: { elements: { lede: `lede-${plan.slug}` } } as any },
      }),
      persist: async (f) => { persistedAt.push(f.generationProgress.completedPageKeys.length); },
    });
    expect(r.status).toBe('done');
    // Both item pages built + copied + tracked for resume.
    expect(fc.generationProgress.completedPageKeys).toEqual(['page-alpha', 'page-beta']);
    expect(fc.pages['page-alpha'].content[fc.pages['page-alpha'].sections[0]].elements.lede).toBe('lede-alpha');
    // Index persisted first (0 completed), then once per item (1, 2).
    expect(persistedAt).toEqual([0, 1, 2]);
  });

  it('runCollectionFanOut resume: already-completed item pages are skipped', async () => {
    const fc: any = { pages: {}, generationProgress: { completedPageKeys: ['page-alpha'] } };
    // Pre-build the alpha page so assembleCollectionPages won't recreate it.
    assembleCollectionPages({ fc, collections: facts(['Alpha', 'Beta']), declaredCapabilities: ['products'] });
    const copied: string[] = [];
    const r = await runCollectionFanOut({
      fc,
      collections: facts(['Alpha', 'Beta']),
      declaredCapabilities: ['products'],
      generateItemCopy: async (plan) => { copied.push(plan.slug); return { status: 'done', copy: {} }; },
      persist: async () => {},
    });
    expect(r.status).toBe('done');
    expect(copied).toEqual(['beta']); // alpha skipped (already completed)
  });
});
