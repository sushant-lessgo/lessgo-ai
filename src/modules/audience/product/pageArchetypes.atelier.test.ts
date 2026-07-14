// src/modules/audience/product/pageArchetypes.atelier.test.ts
// atelier phase 5 — the 5-page contract goes live via the vestria multipage
// machinery, and photographer briefs default to multi. These cover the
// REACHABLE served path: (a) the archetype menu is returned for atelier;
// (b) isMultipage('atelier', {businessType:'photographer'}) is TRUE using the
// same brief-signal shape the wizard builds; plus the phase-2 CARRY
// block-resolution proof — selectProductBlocks resolves atelier's REAL layout
// names via the manifest (not the 'default'/meridian fallback).

import { describe, it, expect } from 'vitest';
import {
  getPageArchetypesForTemplate,
  isMultipage,
  ATELIER_PAGE_ARCHETYPES,
} from './pageArchetypes';
import { resolveAtelierBlock } from '@/modules/templates/atelier/resolveAtelierBlock';
import { selectProductBlocks } from './selectBlocks';

// Body section types atelier actually RESOLVES (resolveAtelierBlock registry) —
// chrome (header/footer) excluded. Every archetype section must be one of these.
const ATELIER_BODY_TYPES = ['hero', 'work', 'packages', 'about', 'quote', 'contact'];

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

  it('every archetype section type resolves a REAL atelier block (no placeholder)', () => {
    for (const a of ATELIER_PAGE_ARCHETYPES) {
      const all = [...a.allowedSections, ...a.requiredSections, ...a.defaultSections];
      for (const type of all) {
        // Section type must be a resolvable atelier BODY type (never chrome).
        expect(ATELIER_BODY_TYPES).toContain(type);
        // And it must resolve a concrete block in BOTH modes.
        expect(resolveAtelierBlock(type, 'edit')).toBeTruthy();
        expect(resolveAtelierBlock(type, 'published')).toBeTruthy();
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

// phase-2 CARRY — block resolution. selectProductBlocks→selectEligibleBlock reads
// blockManifests['atelier'] (real, phase 4), so work/packages/quote resolve
// atelier's REAL layout names via manifestPick — NOT the meridian 'default'
// fallback that a manifest-less template would hit.
describe('selectProductBlocks — atelier resolves real layout names (manifest, not default)', () => {
  it('work/packages/quote pick the Atelier* layouts', () => {
    const { uiblocks } = selectProductBlocks({
      templateId: 'atelier',
      sections: ['hero', 'work', 'packages', 'quote', 'about', 'contact'],
    });
    expect(uiblocks.work).toBe('AtelierWorkGallery');
    expect(uiblocks.packages).toBe('AtelierPackages');
    expect(uiblocks.quote).toBe('AtelierQuoteBand');
    expect(uiblocks.hero).toBe('AtelierHero');
    expect(uiblocks.about).toBe('AtelierAbout');
    expect(uiblocks.contact).toBe('AtelierContact');
  });
});
