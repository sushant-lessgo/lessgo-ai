// src/modules/audience/product/pageArchetypes.atelier.test.ts
// atelier phase 5 — the 5-page contract goes live via the vestria multipage
// machinery, and photographer briefs default to multi. These cover the
// REACHABLE served path: (a) the archetype menu is returned for atelier;
// (b) isMultipage('atelier', {businessType:'photographer'}) is TRUE using the
// same brief-signal shape the wizard builds; plus the CARRY block-resolution proof
// — selectProductBlocks resolves atelier's REAL layout names via the manifest.
//
// atelier-skeleton-cutover phase 1: atelier now rides the work-SKELETON, so the
// archetype body types resolve through resolveWorkBlock (NOT the retired
// resolveAtelierBlock) and selectProductBlocks picks the skeleton `Work*` layout
// names via workSkeletonManifest. The old skin's `quote` band is now `proof`.

import { describe, it, expect } from 'vitest';
import {
  getPageArchetypesForTemplate,
  isMultipage,
  ATELIER_PAGE_ARCHETYPES,
} from './pageArchetypes';
import { resolveWorkBlock } from '@/modules/skeletons/work/resolveWorkBlock';
import { WorkPlaceholderBlock } from '@/modules/skeletons/work/WorkPlaceholderBlock';
import { selectProductBlocks } from './selectBlocks';

// Body section types atelier actually RESOLVES (work-skeleton resolveWorkBlock) —
// chrome (header/footer) excluded. Every archetype section must be one of these.
const ATELIER_BODY_TYPES = ['hero', 'work', 'packages', 'about', 'proof', 'contact'];

describe('ATELIER_PAGE_ARCHETYPES — the 5-page contract', () => {
  it('(a) getPageArchetypesForTemplate("atelier") returns the 5-page menu', () => {
    const menu = getPageArchetypesForTemplate('atelier');
    expect(menu).not.toBeNull();
    expect(menu!.map((a) => a.key)).toEqual(['home', 'work', 'experiences', 'about', 'contact']);
  });

  it('Home + Work are required; all 5 are defaultIncluded (the served skeleton default)', () => {
    const byKey = Object.fromEntries(ATELIER_PAGE_ARCHETYPES.map((a) => [a.key, a]));
    expect(byKey.home.required).toBe(true);
    expect(byKey.work.required).toBe(true);
    expect(ATELIER_PAGE_ARCHETYPES.every((a) => a.defaultIncluded)).toBe(true);
    // Home is the chrome-carrying '/'.
    expect(byKey.home.pathSlug).toBe('/');
  });

  it('quote→proof: no archetype references the retired `quote` band', () => {
    for (const a of ATELIER_PAGE_ARCHETYPES) {
      const all = [...a.allowedSections, ...a.requiredSections, ...a.defaultSections];
      expect(all).not.toContain('quote');
    }
  });

  it('every archetype section type resolves a REAL skeleton block (no placeholder)', () => {
    for (const a of ATELIER_PAGE_ARCHETYPES) {
      const all = [...a.allowedSections, ...a.requiredSections, ...a.defaultSections];
      for (const type of all) {
        // Section type must be a resolvable work-skeleton BODY type (never chrome).
        expect(ATELIER_BODY_TYPES).toContain(type);
        // And it must resolve a concrete (non-placeholder) block in BOTH modes.
        expect(resolveWorkBlock(type, 'edit')).toBeTruthy();
        expect(resolveWorkBlock(type, 'edit')).not.toBe(WorkPlaceholderBlock);
        expect(resolveWorkBlock(type, 'published')).toBeTruthy();
        expect(resolveWorkBlock(type, 'published')).not.toBe(WorkPlaceholderBlock);
      }
      // requiredSections ⊆ allowedSections, defaultSections ⊆ allowedSections.
      const allowed = new Set(a.allowedSections);
      expect(a.requiredSections.every((s) => allowed.has(s))).toBe(true);
      expect(a.defaultSections.every((s) => allowed.has(s))).toBe(true);
    }
  });
});

describe('isMultipage — photographer + atelier defaults to multi', () => {
  it('(b) isMultipage("atelier", {businessType:"photographer"}) is TRUE', () => {
    expect(isMultipage('atelier', { businessType: 'photographer' } as any)).toBe(true);
  });

  it('an explicit single structure.mode still overrides the businessType default', () => {
    expect(
      isMultipage('atelier', { businessType: 'photographer', structure: { mode: 'single' } } as any),
    ).toBe(false);
  });
});

// CARRY — block resolution. selectProductBlocks→selectEligibleBlock reads
// blockManifests['atelier'] (= workSkeletonManifest), so work/packages/proof
// resolve the skeleton's REAL layout names via manifestPick — NOT the meridian
// 'default' fallback that a manifest-less template would hit. With no seed / no
// assetFacts the picker returns each section's manifest DEFAULT.
describe('selectProductBlocks — atelier resolves real SKELETON layout names (manifest, not default)', () => {
  it('work/packages/proof pick the Work* skeleton layouts', () => {
    const { uiblocks } = selectProductBlocks({
      templateId: 'atelier',
      sections: ['hero', 'work', 'packages', 'proof', 'about', 'contact'],
    });
    expect(uiblocks.work).toBe('WorkGalleryGrid');
    expect(uiblocks.packages).toBe('WorkPackages');
    expect(uiblocks.proof).toBe('WorkProofTestimonials');
    expect(uiblocks.hero).toBe('WorkHeroSlider');
    expect(uiblocks.about).toBe('WorkAbout');
    expect(uiblocks.contact).toBe('WorkContact');
  });
});
