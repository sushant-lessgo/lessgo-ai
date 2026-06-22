// TechPremium block registration smoke test (Phase 4).
// Guards the SILENT casing trap: the section-id prefix, resolveTechPremiumBlock key,
// sectionRules key, and schema sectionType must be the SAME lowercase token. Drift
// → placeholder render + wrong surface with NO TS/build error. This test is the only
// thing that catches it. Extend TYPES as new sections land (4b/4c).

import { describe, it, expect } from 'vitest';
import { resolveTechPremiumBlock } from './resolveTechPremiumBlock';
import { TechPremiumPlaceholderBlock } from './TechPremiumPlaceholderBlock';
import { techPremiumSectionSurfaces } from './sectionRules';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { meridianElementSchema } from '@/modules/audience/product/elementSchema';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { buildHomeSlice, buildGallerySlice, buildContactSlice } from '@/hooks/editStore/archetypes';

// Every section type TechPremium must render. Add 4b/4c types here as they ship.
const TYPES = [
  'header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer',
  'catalog', 'productdetail',
  // Phase 4b Home-page blocks.
  'trust', 'problem', 'process', 'explainer', 'lineup', 'gallerypreview', 'compatibility', 'faq',
  // Phase 4c standalone pages.
  'gallery', 'contact',
];

const schemaTypes = new Set(
  Object.values(meridianElementSchema).map((s: any) => s.sectionType),
);

describe('TechPremium block registration', () => {
  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveTechPremiumBlock(t, 'edit');
      const published = resolveTechPremiumBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(TechPremiumPlaceholderBlock);
      expect(published).not.toBe(TechPremiumPlaceholderBlock);
    });

    it(`${t}: has an explicit surface band`, () => {
      // Explicit key (not the getSurfaceForSection 'paper' default) → catches drift.
      expect(Object.prototype.hasOwnProperty.call(techPremiumSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: has a schema with matching sectionType`, () => {
      expect(schemaTypes.has(t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }
});

// Archetype guard (PO must-fix): the type-side smoke test above does NOT run the
// builder, so a wrong/lowercase PascalCase `layout` name in buildHomeSlice fails
// SILENTLY (block renders empty + console warn). This runs buildHomeSlice() and
// asserts, per emitted section, BOTH sides: type → real block, layout → real schema.
describe('TechPremium Home archetype (buildHomeSlice)', () => {
  const slice = buildHomeSlice();

  it('emits body-only sections (no header/footer chrome)', () => {
    for (const id of slice.sections) {
      const type = extractSectionType(id);
      expect(type).not.toBe('header');
      expect(type).not.toBe('footer');
    }
    expect(slice.sections.length).toBeGreaterThan(0);
  });

  for (let i = 0; i < buildHomeSlice().sections.length; i++) {
    it(`section #${i}: type resolves a real block AND layout has a schema`, () => {
      const s = buildHomeSlice();
      const id = s.sections[i];
      const type = extractSectionType(id);
      const layout = s.sectionLayouts[id];

      // type side — non-placeholder edit + published.
      const edit = resolveTechPremiumBlock(type, 'edit');
      const published = resolveTechPremiumBlock(type, 'published');
      expect(edit, `type '${type}' (id ${id}) edit`).not.toBe(TechPremiumPlaceholderBlock);
      expect(published, `type '${type}' (id ${id}) published`).not.toBe(TechPremiumPlaceholderBlock);

      // layout side — the PascalCase schema key must resolve (getSchemaDefaults ≠ null).
      expect(layout, `id ${id} must carry a layout`).toBeTruthy();
      expect(getSchemaDefaults(layout), `layout '${layout}' (id ${id}) schema`).not.toBeNull();
    });
  }
});

// Same guard for the Phase-4c standalone-page builders (gallery + contact). Each is
// a single body section; assert type → real block AND layout → real schema.
describe('TechPremium standalone-page archetypes (Phase 4c)', () => {
  const cases: Array<{ name: string; slice: ReturnType<typeof buildGallerySlice> }> = [
    { name: 'gallery', slice: buildGallerySlice() },
    { name: 'contact', slice: buildContactSlice('form-test') },
  ];
  for (const c of cases) {
    it(`${c.name}: body-only, type→block, layout→schema`, () => {
      expect(c.slice.sections.length).toBeGreaterThan(0);
      for (const id of c.slice.sections) {
        const type = extractSectionType(id);
        expect(type).not.toBe('header');
        expect(type).not.toBe('footer');
        const layout = c.slice.sectionLayouts[id];
        expect(resolveTechPremiumBlock(type, 'edit'), `${c.name} '${type}' edit`).not.toBe(TechPremiumPlaceholderBlock);
        expect(resolveTechPremiumBlock(type, 'published'), `${c.name} '${type}' published`).not.toBe(TechPremiumPlaceholderBlock);
        expect(layout, `${c.name} id ${id} layout`).toBeTruthy();
        expect(getSchemaDefaults(layout), `${c.name} layout '${layout}' schema`).not.toBeNull();
      }
    });
  }
});
