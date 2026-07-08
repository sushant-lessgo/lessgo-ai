import { describe, it, expect } from 'vitest';
import { expandImageSlots, type ImageFetchSpec } from './imageSlots';

// Realistic sectionId-keyed vestria content fixture: `${type}-abc12345` ids, each
// entry carrying its own `.layout` (design decision 5).
function vestriaContent() {
  return {
    'hero-abc12345': {
      layout: 'VestriaTailoredHero',
      elements: { hero_image: '' },
    },
    'about-def67890': {
      layout: 'VestriaAboutStats',
      elements: { about_image: '' },
    },
    'industries-1234abcd': {
      layout: 'VestriaIndustriesGrid',
      elements: {
        industries: [
          { id: 'ind-aaa111', title: 'Aerospace' },
          { id: 'ind-bbb222', title: 'Automotive' },
        ],
      },
    },
    'catalogue-5678efgh': {
      layout: 'VestriaCatalogueGrid',
      elements: {
        items: [{ id: 'item-ccc333', title: 'Chair' }],
      },
    },
  };
}

describe('expandImageSlots', () => {
  it('yields only stockable specs; promised slots excluded', () => {
    const specs = expandImageSlots(vestriaContent());

    // Only the industries collection is stockable → both items produce specs.
    expect(specs).toHaveLength(2);

    const paths = specs.map(s => s.elementPath);
    // Promised slots (hero_image, about_image, catalogue items) are excluded.
    expect(paths).not.toContain('hero_image');
    expect(paths).not.toContain('about_image');
    expect(paths.every(p => p.startsWith('industries.'))).toBe(true);
  });

  it('expands a collection to one spec per generated item with itemId + title in modifier', () => {
    const specs = expandImageSlots(vestriaContent());

    const first = specs.find(s => s.collectionWrite?.itemId === 'ind-aaa111') as ImageFetchSpec;
    expect(first).toBeDefined();
    expect(first.sectionId).toBe('industries-1234abcd');
    expect(first.elementPath).toBe('industries.ind-aaa111.image');
    expect(first.collectionWrite).toEqual({ key: 'industries', itemId: 'ind-aaa111', imageField: 'image' });
    expect(first.orientation).toBe('landscape');
    // perItemQueryField ('title') appended to the base modifier.
    expect(first.queryModifier).toBe('industry sector professional Aerospace');

    const second = specs.find(s => s.collectionWrite?.itemId === 'ind-bbb222') as ImageFetchSpec;
    expect(second.queryModifier).toBe('industry sector professional Automotive');
  });

  it('is keyed by sectionId, never sectionType', () => {
    const specs = expandImageSlots(vestriaContent());
    for (const spec of specs) {
      expect(spec.sectionId).toBe('industries-1234abcd');
      // Spec shape must not leak sectionType.
      expect(spec).not.toHaveProperty('sectionType');
    }
  });

  it('returns empty for meridian-layout content (zero stockable slots)', () => {
    const content = {
      'hero-meridian1': { layout: 'TerminalHero', elements: {} },
      'header-meridian2': { layout: 'MeridianNavHeader', elements: { logo_image: '' } },
    };
    expect(expandImageSlots(content)).toEqual([]);
  });

  it('returns empty for unknown/missing layouts', () => {
    const content = {
      'x-unknown01': { layout: 'SomeRetiredLayout', elements: { hero_image: '' } },
      'y-nolayout02': { elements: { hero_image: '' } },
    };
    expect(expandImageSlots(content)).toEqual([]);
  });

  it('returns empty when a stockable collection section has an empty items array', () => {
    const content = {
      'industries-empty01': {
        layout: 'VestriaIndustriesGrid',
        elements: { industries: [] },
      },
    };
    expect(expandImageSlots(content)).toEqual([]);
  });
});
