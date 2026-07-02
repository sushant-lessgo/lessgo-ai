// Lumen (bespoke §13) block registration smoke test.
// Guards the SILENT casing trap (section-id prefix = resolveLumenBlock key =
// sectionRules key = schema sectionType) AND the layout-name collision trap
// (PO #2: product wins ties in the merged schema, so Lumen layouts MUST be
// globally-unique and resolve to the Lumen entry — esp. LumenContactForm vs the
// product ContactForm). Plus the twin-field contract for bilingual.

import { describe, it, expect } from 'vitest';
import { resolveLumenBlock } from './resolveLumenBlock';
import { LumenPlaceholderBlock } from './LumenPlaceholderBlock';
import { lumenSectionSurfaces } from './sectionRules';
import { langKey, bilingualAttrs } from './i18nKeys';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { layoutElementSchema, getSchemaDefaults } from '@/modules/sections/layoutElementSchema';

// Every section type Lumen renders (all clean lowercase single tokens — §3g).
const TYPES = ['header', 'hero', 'logos', 'services', 'process', 'portfolio', 'about', 'contact', 'footer'];

// section type → expected Lumen layout name (globally-unique).
const TYPE_TO_LAYOUT: Record<string, string> = {
  header: 'LumenNav',
  hero: 'LumenHero',
  logos: 'LumenLogos',
  services: 'LumenPricedServiceCards',
  process: 'LumenShootProcess',
  portfolio: 'LumenCategoryGallery',
  about: 'LumenPhotographerAbout',
  contact: 'LumenContactForm',
  footer: 'LumenFooter',
};

describe('Lumen block registration', () => {
  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveLumenBlock(t, 'edit');
      const published = resolveLumenBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(LumenPlaceholderBlock);
      expect(published).not.toBe(LumenPlaceholderBlock);
    });

    it(`${t}: has an explicit surface band`, () => {
      expect(Object.prototype.hasOwnProperty.call(lumenSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }

  // PO #2: each Lumen layout must resolve to the LUMEN schema entry (not the
  // product entry with the same bare name) AND carry the right sectionType.
  describe('layout-name collision guard', () => {
    for (const [type, layout] of Object.entries(TYPE_TO_LAYOUT)) {
      it(`${layout} resolves to the Lumen schema entry (sectionType '${type}')`, () => {
        const defaults = getSchemaDefaults(layout);
        expect(defaults).not.toBeNull();
        expect((layoutElementSchema as any)[layout]?.sectionType).toBe(type);
      });
    }

    it('LumenContactForm is NOT shadowed by the product ContactForm', () => {
      // The product schema has a bare `ContactForm` (sectionType 'contact' too);
      // ours must be the distinct Lumen-named one.
      expect((layoutElementSchema as any).LumenContactForm).toBeTruthy();
      expect((layoutElementSchema as any).LumenContactForm.sectionType).toBe('contact');
    });
  });

  // Bilingual twin-field contract: representative layouts expose key + key_nl.
  describe('twin-field contract', () => {
    it('LumenHero has headline + headline_nl', () => {
      const d = getSchemaDefaults('LumenHero')!;
      expect(d).toHaveProperty('headline');
      expect(d).toHaveProperty('headline_nl');
    });
    it('LumenPricedServiceCards has dutch_tagline NOT as an _nl twin', () => {
      // dutch_tagline is an always-visible NL subtitle, so there is no
      // `dutch_tagline_nl` and no base `dutch` it twins.
      const schema: any = (layoutElementSchema as any).LumenPricedServiceCards;
      const svcFields = schema.collections.services.fields;
      expect(svcFields).toHaveProperty('dutch_tagline');
      expect(svcFields).not.toHaveProperty('dutch_tagline_nl');
    });
    it('langKey routes to the _nl twin in NL', () => {
      expect(langKey('headline', 'en')).toBe('headline');
      expect(langKey('headline', 'nl')).toBe('headline_nl');
    });
    it('bilingualAttrs falls back NL→EN when NL empty', () => {
      expect(bilingualAttrs('Hi', '')['data-nl']).toBe('Hi');
      expect(bilingualAttrs('Hi', 'Hoi')['data-nl']).toBe('Hoi');
    });
  });
});
