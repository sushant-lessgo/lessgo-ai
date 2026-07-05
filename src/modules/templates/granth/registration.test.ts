// Granth (bespoke §13, Writer vertical) block registration smoke test.
// Guards the SILENT casing trap (section-id prefix = resolveGranthBlock key =
// sectionRules key = schema sectionType) AND the layout-name collision trap
// (§3g #3: product wins ties in the merged schema, so Granth layouts MUST be
// globally-unique and resolve to the Granth entry). Granth is Hindi-only — NO
// bilingual twin-field assertions (unlike Lumen).

import { describe, it, expect } from 'vitest';
import { resolveGranthBlock } from './resolveGranthBlock';
import { GranthPlaceholderBlock } from './GranthPlaceholderBlock';
import { granthSectionSurfaces } from './sectionRules';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { layoutElementSchema, getSchemaDefaults } from '@/modules/sections/layoutElementSchema';

// Every section type Granth renders (clean lowercase single tokens — §3g).
const TYPES = ['hero', 'about', 'books', 'writing', 'praise', 'footer'];

// section type → expected Granth layout name (globally-unique).
const TYPE_TO_LAYOUT: Record<string, string> = {
  hero: 'GranthArchedHero',
  about: 'GranthParichay',
  books: 'GranthJacketShelf',
  writing: 'GranthFramedPage',
  praise: 'GranthCriticsGrid',
  footer: 'GranthFollowFooter',
};

describe('Granth block registration', () => {
  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveGranthBlock(t, 'edit');
      const published = resolveGranthBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(GranthPlaceholderBlock);
      expect(published).not.toBe(GranthPlaceholderBlock);
    });

    it(`${t}: edit and published are distinct wrappers`, () => {
      expect(resolveGranthBlock(t, 'edit')).not.toBe(resolveGranthBlock(t, 'published'));
    });

    it(`${t}: has an explicit surface band`, () => {
      expect(Object.prototype.hasOwnProperty.call(granthSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }

  it('unknown / empty section types fall back to the placeholder (no crash)', () => {
    expect(resolveGranthBlock('does-not-exist', 'edit')).toBe(GranthPlaceholderBlock);
    expect(resolveGranthBlock('', 'edit')).toBe(GranthPlaceholderBlock);
  });

  it('is case-insensitive and defaults to edit mode', () => {
    expect(resolveGranthBlock('HERO', 'edit')).toBe(resolveGranthBlock('hero', 'edit'));
    expect(resolveGranthBlock('hero')).toBe(resolveGranthBlock('hero', 'edit'));
  });

  // §3g #3: each Granth layout must resolve to the GRANTH schema entry (globally
  // unique name → no product/service tie-shadowing) AND carry the right sectionType.
  describe('layout-name collision guard', () => {
    for (const [type, layout] of Object.entries(TYPE_TO_LAYOUT)) {
      it(`${layout} resolves to the Granth schema entry (sectionType '${type}')`, () => {
        const defaults = getSchemaDefaults(layout);
        expect(defaults).not.toBeNull();
        expect((layoutElementSchema as any)[layout]?.sectionType).toBe(type);
      });
    }
  });

  // Contract sanity: representative collections + required fields exist.
  describe('content contract', () => {
    it('GranthArchedHero exposes name + a socials collection', () => {
      const d = getSchemaDefaults('GranthArchedHero')!;
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('socials');
    });
    it('GranthJacketShelf exposes an items collection (books)', () => {
      const schema: any = (layoutElementSchema as any).GranthJacketShelf;
      expect(schema.collections).toHaveProperty('items');
      expect(schema.collections.items.fields).toHaveProperty('buy_url');
    });
  });
});
