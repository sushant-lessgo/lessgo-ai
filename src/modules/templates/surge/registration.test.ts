// Surge block registration smoke test.
// Guards the SILENT casing trap: the section-id prefix, resolveServiceBlock key,
// sectionRules key, and schema sectionType must be the SAME lowercase token. Drift
// → placeholder render + wrong surface with NO TS/build error. This test is the
// only thing that catches it.

import { describe, it, expect } from 'vitest';
import { resolveServiceBlock } from './resolveServiceBlock';
import { SurgePlaceholderBlock } from './SurgePlaceholderBlock';
import { surgeSectionSurfaces } from './sectionRules';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { serviceElementSchema, PILOT_LAYOUT_NAMES } from '@/modules/audience/service/elementSchema';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';

// Every section type Surge must render: 7 shared service + 4 Surge-only delta.
const TYPES = [
  'header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer',
  'logos', 'about', 'casestudies', 'stats',
];

const schemaTypes = new Set(
  Object.values(serviceElementSchema).map((s: any) => s.sectionType),
);

describe('Surge block registration', () => {
  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveServiceBlock(t, 'edit');
      const published = resolveServiceBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(SurgePlaceholderBlock);
      expect(published).not.toBe(SurgePlaceholderBlock);
    });

    it(`${t}: has an explicit surface band`, () => {
      expect(Object.prototype.hasOwnProperty.call(surgeSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: has a schema with matching sectionType`, () => {
      expect(schemaTypes.has(t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }

  it('every PILOT_LAYOUT_NAMES layout has a resolvable schema (getSchemaDefaults ≠ null)', () => {
    for (const layout of Object.values(PILOT_LAYOUT_NAMES)) {
      expect(getSchemaDefaults(layout)).not.toBeNull();
    }
  });
});
