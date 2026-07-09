// Regression: service UIBlock selection must be DETERMINISTIC (scale-09 phase 1).
// The surge testimonials pick used Math.random(); this asserts it no longer does.

import { describe, it, expect } from 'vitest';
import { selectServiceUIBlocks } from './selectUIBlocks';
import { PILOT_LAYOUT_NAMES } from './elementSchema';

describe('selectServiceUIBlocks — deterministic surge testimonials', () => {
  it('returns the SAME testimonials layout across N repeated calls', () => {
    const input = { sections: ['testimonials'], templateId: 'surge' as const };
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(selectServiceUIBlocks(input).uiblocks.testimonials);
    }
    expect(results.size).toBe(1);
    expect([...results][0]).toBe('ReviewGrid');
  });

  it('picks the fixed default ReviewGrid for surge testimonials', () => {
    const out = selectServiceUIBlocks({ sections: ['testimonials'], templateId: 'surge' });
    expect(out.uiblocks.testimonials).toBe('ReviewGrid');
  });

  it('leaves non-surge templates unchanged (uses PILOT_LAYOUT_NAMES)', () => {
    const out = selectServiceUIBlocks({ sections: ['testimonials'], templateId: 'hearth' });
    expect(out.uiblocks.testimonials).toBe(PILOT_LAYOUT_NAMES.testimonials);
    expect(out.uiblocks.testimonials).not.toBe('ReviewGrid');
  });

  it('leaves non-testimonials sections on a surge template unchanged', () => {
    const out = selectServiceUIBlocks({ sections: ['hero', 'services'], templateId: 'surge' });
    expect(out.uiblocks.hero).toBe(PILOT_LAYOUT_NAMES.hero);
    expect(out.uiblocks.services).toBe(PILOT_LAYOUT_NAMES.services);
  });

  it('skips unknown section types (the `if (layout)` guard)', () => {
    const out = selectServiceUIBlocks({ sections: ['totally-unknown-section'], templateId: 'hearth' });
    expect(out.uiblocks['totally-unknown-section']).toBeUndefined();
    expect(Object.keys(out.uiblocks)).toHaveLength(0);
  });
});

describe('selectServiceUIBlocks — optional phase-4 selection signals', () => {
  const ALL_ASSETS = {
    hasPhotos: true,
    hasLogos: true,
    hasTestimonials: true,
    hasTestimonialPhotos: true,
  };

  it('surge testimonials stays ReviewGrid regardless of cardCountHints', () => {
    for (const n of [0, 1, 2, 3, 10]) {
      const out = selectServiceUIBlocks({
        sections: ['testimonials'],
        templateId: 'surge',
        cardCountHints: { testimonials: n },
      });
      expect(out.uiblocks.testimonials).toBe('ReviewGrid');
    }
  });

  it('threading assetFacts does not change existing single-variant picks', () => {
    const out = selectServiceUIBlocks({
      sections: ['hero', 'services', 'testimonials'],
      templateId: 'hearth',
      assetFacts: ALL_ASSETS,
    });
    expect(out.uiblocks.hero).toBe(PILOT_LAYOUT_NAMES.hero);
    expect(out.uiblocks.services).toBe(PILOT_LAYOUT_NAMES.services);
    expect(out.uiblocks.testimonials).toBe(PILOT_LAYOUT_NAMES.testimonials);
  });

  it('hearth services capacity hint out-of-range still yields the default', () => {
    const out = selectServiceUIBlocks({
      sections: ['services'],
      templateId: 'hearth',
      cardCountHints: { services: 99 },
    });
    expect(out.uiblocks.services).toBe(PILOT_LAYOUT_NAMES.services);
  });
});
