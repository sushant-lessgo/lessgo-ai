// Guards the round-3 hotfix: gpt-4o-mini collapses a collection-only section into
// `{ elements: [ …items ] }` (the exact 500 from debugLogs.md). normalizeServiceCopy
// must rewrap it under the layout's single collection key so CopyResponseSchema passes.

import { describe, it, expect } from 'vitest';
import { normalizeServiceCopy } from '@/modules/audience/service/parseCopy';
import { CopyResponseSchema } from '@/lib/schemas';

const uiblocks = {
  stats: 'StatsBand',          // single collection: metrics
  logos: 'LogoStrip',          // single collection: brands
  testimonials: 'ReviewGrid',  // single collection: reviews
  hero: 'PetalFramedHero',     // scalar-only (no collection)
  about: 'AboutWithStats',     // multi-collection (tags + stats) → not auto-wrapped
};

describe('normalizeServiceCopy', () => {
  it('rewraps a section whose `elements` is an array (the failing shape) under the collection key', () => {
    const raw = {
      stats: { elements: [ { value: '9.2<em>M</em>', label: 'Impressions' }, { value: '3.4×', label: 'Pipeline' } ] },
    };
    const out = normalizeServiceCopy(raw, uiblocks);
    expect(out.stats.elements.metrics).toHaveLength(2);
    expect(Array.isArray(out.stats.elements)).toBe(false);
    // …and the rewrapped shape passes strict validation.
    expect(() => CopyResponseSchema.parse(out)).not.toThrow();
  });

  it('rewraps a section whose value is a bare array', () => {
    const raw = { logos: [ { name: 'Saral' }, { name: 'Finly' } ] };
    const out = normalizeServiceCopy(raw, uiblocks);
    expect(out.logos.elements.brands).toHaveLength(2);
    expect(() => CopyResponseSchema.parse(out)).not.toThrow();
  });

  it('passes a correctly-shaped section through untouched', () => {
    const raw = {
      hero: { elements: { headline: 'We turn attention into <em>pipeline</em>', cta_text: 'Book' } },
    };
    const out = normalizeServiceCopy(raw, uiblocks);
    expect(out.hero.elements.headline).toContain('pipeline');
  });

  it('does NOT invent a collection for a multi-collection or scalar-only section', () => {
    // about has two collections → ambiguous → wrap to empty elements (it never collapses anyway).
    const out = normalizeServiceCopy({ about: [{ x: 1 }] }, uiblocks);
    expect(out.about.elements).toEqual({});
  });
});
