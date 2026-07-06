// Vestria (GA product template) block registration smoke test — THE safety net
// (PO review): a missing elementSchema entry or block-registry entry does NOT
// fail build/tsc — it renders a silent placeholder and copy prompts emit "No
// schema available". This test turns that silent failure red. Guards the casing
// trap (section-id prefix = resolveVestriaBlock key = sectionRules key = schema
// sectionType) AND the layout-name collision trap (§3g #3: product spread order
// means Vestria layouts MUST be globally-unique and resolve to the Vestria entry).

import { describe, it, expect } from 'vitest';
import { resolveVestriaBlock } from './resolveVestriaBlock';
import { VestriaPlaceholderBlock } from './VestriaPlaceholderBlock';
import { vestriaSectionSurfaces } from './sectionRules';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { layoutElementSchema, getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { VESTRIA_LAYOUT_NAMES } from '@/modules/audience/product/elementSchema';

// Every section type Vestria renders (clean lowercase single tokens — §3g).
const TYPES = Object.keys(VESTRIA_LAYOUT_NAMES);

describe('Vestria block registration', () => {
  it('covers all 12 section types', () => {
    expect(TYPES.length).toBe(12);
  });

  for (const t of TYPES) {
    it(`${t}: resolves a real block (edit + published), not the placeholder`, () => {
      const edit = resolveVestriaBlock(t, 'edit');
      const published = resolveVestriaBlock(t, 'published');
      expect(edit).toBeTruthy();
      expect(published).toBeTruthy();
      expect(edit).not.toBe(VestriaPlaceholderBlock);
      expect(published).not.toBe(VestriaPlaceholderBlock);
    });

    it(`${t}: edit and published are distinct wrappers`, () => {
      expect(resolveVestriaBlock(t, 'edit')).not.toBe(resolveVestriaBlock(t, 'published'));
    });

    it(`${t}: has an explicit surface band`, () => {
      expect(Object.prototype.hasOwnProperty.call(vestriaSectionSurfaces, t)).toBe(true);
    });

    it(`${t}: extractSectionType round-trips a '${t}-…' id`, () => {
      expect(extractSectionType(`${t}-abc123`)).toBe(t);
    });
  }

  it('unknown / empty section types fall back to the placeholder (no crash)', () => {
    expect(resolveVestriaBlock('does-not-exist', 'edit')).toBe(VestriaPlaceholderBlock);
    expect(resolveVestriaBlock('', 'edit')).toBe(VestriaPlaceholderBlock);
  });

  it('is case-insensitive and defaults to edit mode', () => {
    expect(resolveVestriaBlock('HERO', 'edit')).toBe(resolveVestriaBlock('hero', 'edit'));
    expect(resolveVestriaBlock('hero')).toBe(resolveVestriaBlock('hero', 'edit'));
  });

  // §3g #3: each Vestria layout must resolve to the VESTRIA schema entry (globally
  // unique name → no product/service tie-shadowing) AND carry the right sectionType.
  describe('layout-name collision guard', () => {
    for (const [type, layout] of Object.entries(VESTRIA_LAYOUT_NAMES)) {
      it(`${layout} resolves to the Vestria schema entry (sectionType '${type}')`, () => {
        const defaults = getSchemaDefaults(layout);
        expect(defaults).not.toBeNull();
        expect((layoutElementSchema as any)[layout]?.sectionType).toBe(type);
      });
    }
  });

  // Hero variant (NOT in VESTRIA_LAYOUT_NAMES — selected via content[heroId].layout).
  // Without this schema entry, getSchemaDefaults returns null → the editor renders
  // an EMPTY hero and the uploaded video keys are silently dropped from blockContent.
  describe('VestriaFullBleedHero variant schema', () => {
    it('has a schema entry (getSchemaDefaults !== null) with sectionType hero', () => {
      const defaults = getSchemaDefaults('VestriaFullBleedHero');
      expect(defaults).not.toBeNull();
      expect((layoutElementSchema as any).VestriaFullBleedHero?.sectionType).toBe('hero');
    });
    it('shares the tailored hero copy contract (variant swap is content-preserving)', () => {
      const d = getSchemaDefaults('VestriaFullBleedHero')!;
      for (const k of ['tag_text', 'headline', 'lede', 'cta_text', 'cta_href', 'secondary_cta_text', 'secondary_cta_href', 'hero_image', 'stamp_value', 'stamp_label', 'values']) {
        expect(d, `missing shared key ${k}`).toHaveProperty(k);
      }
    });
    it('media keys are manual_preferred (video URLs NEVER AI-generated — firewall)', () => {
      const schema: any = (layoutElementSchema as any).VestriaFullBleedHero;
      for (const k of ['hero_video_desktop', 'hero_video_mobile', 'hero_video_poster']) {
        expect(schema.elements[k]?.fillMode, k).toBe('manual_preferred');
      }
    });
  });

  // Contract sanity: representative collections + required fields exist.
  describe('content contract', () => {
    it('VestriaTailoredHero exposes headline + a values collection', () => {
      const d = getSchemaDefaults('VestriaTailoredHero')!;
      expect(d).toHaveProperty('headline');
      expect(d).toHaveProperty('values');
    });
    it('VestriaQuotes keeps the injectRealTestimonials contract (testimonials: quote/author_name/author_role)', () => {
      const schema: any = (layoutElementSchema as any).VestriaQuotes;
      expect(schema.collections).toHaveProperty('testimonials');
      expect(schema.collections.testimonials.fields).toHaveProperty('quote');
      expect(schema.collections.testimonials.fields).toHaveProperty('author_name');
      expect(schema.collections.testimonials.fields).toHaveProperty('author_role');
    });
    it('VestriaCatalogueGrid items are plain ai_generated fields (grid-only — NO materialization)', () => {
      const schema: any = (layoutElementSchema as any).VestriaCatalogueGrid;
      expect(schema.collections.items.fillMode).toBe('ai_generated');
    });
    it('VestriaLeadForm exposes a system form_id (form.v1.js pipeline)', () => {
      const schema: any = (layoutElementSchema as any).VestriaLeadForm;
      expect(schema.elements.form_id.fillMode).toBe('system');
    });
    it('phone/WhatsApp fields are manual_preferred (AI never authors numbers)', () => {
      const header: any = (layoutElementSchema as any).VestriaNavHeader;
      const footer: any = (layoutElementSchema as any).VestriaFooter;
      expect(header.elements.util_tel.fillMode).toBe('manual_preferred');
      expect(header.elements.util_whatsapp.fillMode).toBe('manual_preferred');
      expect(footer.elements.tel.fillMode).toBe('manual_preferred');
      expect(footer.elements.whatsapp.fillMode).toBe('manual_preferred');
      expect(footer.elements.whatsapp_number.fillMode).toBe('manual_preferred');
    });
  });
});
