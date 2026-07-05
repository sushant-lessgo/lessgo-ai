// Firewall / 3-tier-model invariants. These guard the render-gate and palette
// scoping that decide which renderer + token family a project gets — the
// highest-blast-radius pure logic in the template system.

import {
  usesTemplateModule,
  palettesForTemplate,
  personaToAudienceType,
  personaToServiceType,
  defaultVariantForTemplate,
  defaultTemplateForAudience,
  templateIds,
  userPersonas,
  hearthPalettes,
  lexPalettes,
} from '@/types/service';
import { meridianPalettes } from '@/types/product';

describe('usesTemplateModule (render gate)', () => {
  it('service always renders through a template module, regardless of templateId', () => {
    expect(usesTemplateModule('service', 'hearth')).toBe(true);
    expect(usesTemplateModule('service', 'lex')).toBe(true);
    expect(usesTemplateModule('service', null)).toBe(true);
    expect(usesTemplateModule('service', undefined)).toBe(true);
  });

  it('product renders through a template module ONLY when templateId is meridian', () => {
    expect(usesTemplateModule('product', 'meridian')).toBe(true);
    expect(usesTemplateModule('product', 'hearth')).toBe(false);
    expect(usesTemplateModule('product', null)).toBe(false); // legacy 47-block path
    expect(usesTemplateModule('product', undefined)).toBe(false);
  });

  it('writer always renders through a template module (Granth vertical, seeded)', () => {
    expect(usesTemplateModule('writer', 'granth')).toBe(true);
    expect(usesTemplateModule('writer', null)).toBe(true);
    expect(usesTemplateModule('writer', undefined)).toBe(true);
  });

  it('ecommerce and unknown/empty audiences never use a template module', () => {
    expect(usesTemplateModule('ecommerce', 'meridian')).toBe(false);
    expect(usesTemplateModule(null, 'meridian')).toBe(false);
    expect(usesTemplateModule(undefined, undefined)).toBe(false);
    expect(usesTemplateModule('garbage', 'meridian')).toBe(false);
  });
});

describe('palettesForTemplate (picker scoping)', () => {
  it('returns the template-scoped palette family', () => {
    expect(palettesForTemplate('hearth')).toBe(hearthPalettes);
    expect(palettesForTemplate('lex')).toBe(lexPalettes);
    expect(palettesForTemplate('meridian')).toBe(meridianPalettes);
  });

  it('every template has a non-empty, distinct-named family', () => {
    for (const id of templateIds) {
      const fam = palettesForTemplate(id);
      expect(fam.length).toBeGreaterThan(0);
      // no duplicate palette ids within a family
      expect(new Set(fam).size).toBe(fam.length);
    }
  });
});

describe('persona derivation', () => {
  it('saas/indie/hardware/manufacturer → product, writer → writer, all others → service', () => {
    const productPersonas = new Set(['saas-founder', 'indie-maker', 'hardware-founder', 'manufacturer']);
    for (const p of userPersonas) {
      const expected =
        productPersonas.has(p) ? 'product'
        : p === 'writer' ? 'writer'
        : 'service';
      expect(personaToAudienceType(p)).toBe(expected);
    }
  });

  it('service personas map to a service type; product personas map to null', () => {
    expect(personaToServiceType('agency')).toBe('agency');
    expect(personaToServiceType('coach')).toBe('coaching');
    expect(personaToServiceType('consultant')).toBe('consultancy');
    expect(personaToServiceType('freelancer')).toBe('freelance');
    expect(personaToServiceType('saas-founder')).toBeNull();
    expect(personaToServiceType('indie-maker')).toBeNull();
    expect(personaToServiceType('hardware-founder')).toBeNull();
  });
});

describe('template defaults completeness', () => {
  it('every templateId has a default variant', () => {
    for (const id of templateIds) {
      expect(typeof defaultVariantForTemplate[id]).toBe('string');
      expect(defaultVariantForTemplate[id].length).toBeGreaterThan(0);
    }
  });

  it('product defaults to meridian, service to hearth, writer to granth, ecommerce parked', () => {
    expect(defaultTemplateForAudience.product).toBe('meridian');
    expect(defaultTemplateForAudience.service).toBe('hearth');
    expect(defaultTemplateForAudience.writer).toBe('granth');
    expect(defaultTemplateForAudience.ecommerce).toBeNull();
  });
});
