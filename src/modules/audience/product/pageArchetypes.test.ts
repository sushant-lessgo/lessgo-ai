// src/modules/audience/product/pageArchetypes.test.ts
// scale-07 phase 5 — multipage keyed by CAPABILITY, not templateId.
//
// Re-key regression: `getPageArchetypesForTemplate` + `isMultipage` resolve
// off the template's declared `multipage` capability (templateMeta) + the
// Brief signal (structure.mode / businessType structureDefault) — behavior
// today is identical to the old `templateId === 'vestria'` hardcode (vestria
// is the only capability+menu holder), but a hypothetical multipage-capable
// template resolves without touching detection code.

import { describe, it, expect, vi } from 'vitest';

// Hypothetical multipage-capable template: augment templateMeta with a fake
// 'atlas' template that declares the capability (everything real passes
// through untouched via importOriginal).
vi.mock('@/modules/templates/templateMeta', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/modules/templates/templateMeta')>();
  return {
    ...orig,
    templateMeta: {
      ...orig.templateMeta,
      atlas: {
        copyEngines: ['thing'],
        designStyles: ['editorial-craft'],
        capabilities: ['multipage', 'lead-form'],
        capabilitySections: { 'lead-form': 'contact' },
      },
    },
  };
});

import {
  getPageArchetypesForTemplate,
  isMultipage,
  VESTRIA_PAGE_ARCHETYPES,
  type PageArchetypeDef,
} from './pageArchetypes';
import { businessTypes, businessTypeKeys } from '@/modules/businessTypes/config';

const ATLAS_MENU: PageArchetypeDef[] = [
  {
    key: 'home',
    title: 'Home',
    pathSlug: '/',
    required: true,
    defaultIncluded: true,
    allowedSections: ['hero', 'features', 'contact'],
    requiredSections: ['hero'],
    defaultSections: ['hero', 'features', 'contact'],
    description: 'Hypothetical home page.',
  },
];

describe('getPageArchetypesForTemplate — capability re-key (no vestria hardcode)', () => {
  it('vestria (multipage capability + registry entry) still resolves its menu', () => {
    expect(getPageArchetypesForTemplate('vestria')).toBe(VESTRIA_PAGE_ARCHETYPES);
  });

  it('meridian (no multipage capability) resolves null — single-page', () => {
    expect(getPageArchetypesForTemplate('meridian')).toBeNull();
  });

  it('techpremium (retired, empty capabilities) resolves null', () => {
    expect(getPageArchetypesForTemplate('techpremium')).toBeNull();
  });

  it('trust templates (hearth/lex/surge) resolve null', () => {
    for (const t of ['hearth', 'lex', 'surge']) {
      expect(getPageArchetypesForTemplate(t)).toBeNull();
    }
  });

  it('null/undefined/unknown templateId resolves null', () => {
    expect(getPageArchetypesForTemplate(null)).toBeNull();
    expect(getPageArchetypesForTemplate(undefined)).toBeNull();
    expect(getPageArchetypesForTemplate('nope')).toBeNull();
  });

  it('a hypothetical multipage-capable template resolves ITS archetypes (capability + registry, zero detection edits)', () => {
    expect(getPageArchetypesForTemplate('atlas', { atlas: ATLAS_MENU })).toBe(ATLAS_MENU);
    // Capability declared but no menu shipped ⇒ null (menu is the second gate).
    expect(getPageArchetypesForTemplate('atlas', {})).toBeNull();
    // Menu shipped but capability NOT declared ⇒ null (capability is a hard gate).
    expect(getPageArchetypesForTemplate('meridian', { meridian: ATLAS_MENU })).toBeNull();
  });
});

describe('isMultipage — capability ∧ (Brief structure.mode ∨ businessType structureDefault)', () => {
  it('vestria with no Brief signal is multi (capability alone — today’s behavior)', () => {
    expect(isMultipage('vestria')).toBe(true);
    expect(isMultipage('vestria', null)).toBe(true);
    expect(isMultipage('vestria', {})).toBe(true);
    // A brief with only a goal carries no structure signal either.
    expect(isMultipage('vestria', { businessType: undefined })).toBe(true);
  });

  it('meridian is single regardless of Brief (capability is a hard gate)', () => {
    expect(isMultipage('meridian')).toBe(false);
    expect(isMultipage('meridian', { structure: { mode: 'multi', pages: [] } })).toBe(false);
    expect(isMultipage('meridian', { businessType: 'manufacturer' })).toBe(false);
  });

  it('techpremium (retired) + trust templates + null are single', () => {
    expect(isMultipage('techpremium')).toBe(false);
    expect(isMultipage('hearth')).toBe(false);
    expect(isMultipage(null)).toBe(false);
    expect(isMultipage(undefined)).toBe(false);
  });

  it('explicit Brief structure.mode wins over everything else', () => {
    expect(isMultipage('vestria', { structure: { mode: 'multi', pages: [] } })).toBe(true);
    expect(isMultipage('vestria', { structure: { mode: 'single', pages: [] } })).toBe(false);
    // ... including the businessType default.
    expect(
      isMultipage('vestria', { structure: { mode: 'single', pages: [] }, businessType: 'manufacturer' })
    ).toBe(false);
  });

  it('businessType structureDefault decides when mode is absent (manufacturer ⇒ multi, saas ⇒ single)', () => {
    expect(isMultipage('vestria', { businessType: 'manufacturer' })).toBe(true);
    expect(isMultipage('vestria', { businessType: 'saas' })).toBe(false);
    // Unknown businessType key ⇒ no signal ⇒ capability decides.
    expect(isMultipage('vestria', { businessType: 'martian' })).toBe(true);
  });

  it('hypothetical multipage-capable template keys off the capability, not its id', () => {
    expect(isMultipage('atlas')).toBe(true);
    expect(isMultipage('atlas', { structure: { mode: 'single', pages: [] } })).toBe(false);
  });
});

describe('businessTypes structureDefault (scale-07 phase 5)', () => {
  // atelier phase 5 — photographer flips single→multi (work+multipage atelier).
  const MULTI_DEFAULTS = new Set(['manufacturer', 'photographer']);
  it('every entry declares structureDefault; manufacturer + photographer are multi', () => {
    for (const key of businessTypeKeys) {
      const entry = businessTypes[key];
      expect(['single', 'multi']).toContain(entry.structureDefault);
      expect(entry.structureDefault).toBe(MULTI_DEFAULTS.has(key) ? 'multi' : 'single');
    }
  });
});
