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
  type MultiPageOnboardingData,
} from './multiPageAssembly';
import type { SitemapPage } from '@/types/product';
import type { SectionCopy } from '@/types/generation';

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
