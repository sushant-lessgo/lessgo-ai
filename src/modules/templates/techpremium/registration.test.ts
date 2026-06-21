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

// Every section type TechPremium must render. Add 4b/4c types here as they ship.
const TYPES = [
  'header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer',
  'catalog', 'productdetail',
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
