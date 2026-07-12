// Atelier block registration smoke test — the safety net: a missing elementSchema
// entry or block-registry entry does NOT fail build/tsc; it renders a silent
// placeholder. This test turns that silent failure red. Guards the casing trap
// (section-id prefix = resolveAtelierBlock key = sectionRules key = schema
// sectionType) AND the two-identifier discipline (lowercase type + PascalCase
// layout resolving to the Atelier schema entry).

import { describe, it, expect } from 'vitest';
import { resolveAtelierBlock } from './resolveAtelierBlock';
import { AtelierPlaceholderBlock } from './AtelierPlaceholderBlock';
import { atelierSectionSurfaces } from './sectionRules';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { layoutElementSchema, getSchemaDefaults } from '@/modules/sections/layoutElementSchema';

// section type (lowercase single token) → PascalCase layout name.
const ATELIER_LAYOUT_NAMES: Record<string, string> = {
  header:   'AtelierNavHeader',
  hero:     'AtelierHero',
  work:     'AtelierWorkGallery',
  packages: 'AtelierPackages',
  about:    'AtelierAbout',
  quote:    'AtelierQuoteBand',
  contact:  'AtelierContact',
  footer:   'AtelierFooter',
};

const TYPES = Object.keys(ATELIER_LAYOUT_NAMES);

describe('Atelier block registration', () => {
  it('covers all 8 section types', () => {
    expect(TYPES.length).toBe(8);
  });

  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveAtelierBlock(t, 'edit');
      const published = resolveAtelierBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(AtelierPlaceholderBlock);
      expect(published).not.toBe(AtelierPlaceholderBlock);
    });

    it(`${t}: edit and published are distinct wrappers`, () => {
      expect(resolveAtelierBlock(t, 'edit')).not.toBe(resolveAtelierBlock(t, 'published'));
    });

    it(`${t}: has an explicit surface band`, () => {
      expect(Object.prototype.hasOwnProperty.call(atelierSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id (hyphen-free type)`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }

  it('unknown / empty section types fall back to the placeholder (no crash)', () => {
    expect(resolveAtelierBlock('does-not-exist', 'edit')).toBe(AtelierPlaceholderBlock);
    expect(resolveAtelierBlock('', 'edit')).toBe(AtelierPlaceholderBlock);
  });

  it('is case-insensitive and defaults to edit mode', () => {
    expect(resolveAtelierBlock('HERO', 'edit')).toBe(resolveAtelierBlock('hero', 'edit'));
    expect(resolveAtelierBlock('hero')).toBe(resolveAtelierBlock('hero', 'edit'));
  });

  // Two-identifier discipline: each Atelier layout resolves to the Atelier schema
  // entry (globally-unique name → no product/service shadowing) with the right
  // sectionType.
  describe('layout-name → schema entry guard', () => {
    for (const [type, layout] of Object.entries(ATELIER_LAYOUT_NAMES)) {
      it(`${layout} resolves to the Atelier schema entry (sectionType '${type}')`, () => {
        const defaults = getSchemaDefaults(layout);
        expect(defaults).not.toBeNull();
        expect((layoutElementSchema as any)[layout]?.sectionType).toBe(type);
      });
    }
  });

  // Capability evidence smoke: the gallery + packages capabilitySections point at
  // section types that resolve to real blocks in both renderers.
  describe('capability evidence sections resolve real', () => {
    for (const sectionType of ['work', 'packages']) {
      it(`${sectionType}: real block (edit + published)`, () => {
        expect(resolveAtelierBlock(sectionType, 'edit')).not.toBe(AtelierPlaceholderBlock);
        expect(resolveAtelierBlock(sectionType, 'published')).not.toBe(AtelierPlaceholderBlock);
      });
    }
  });
});
