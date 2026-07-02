// Deterministic section routing. The 'search-aware-comparing' order is
// REGRESSION-LOCKED to the Phase 6 pilot-validated sequence (see sectionSelection.ts
// header) — if this snapshot changes, it's a deliberate decision, not a drift.

import { selectServiceSections } from '@/modules/audience/service/sectionSelection';
import type { ServiceAssetInput } from '@/types/service';

const allAssets: ServiceAssetInput = {
  hasTestimonials: true,
  hasClientLogos: true,
  hasOutcomes: true,
  hasCaseStudies: true,
  hasTeamPhotos: true,
  hasFounderPhoto: true,
  testimonialType: 'text',
};

describe('selectServiceSections', () => {
  it('LOCKED baseline: search-aware-comparing, full assets', () => {
    expect(
      selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets: allAssets })
    ).toEqual(['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer']);
  });

  it('always brackets with header first and footer last', () => {
    const out = selectServiceSections({ awareness: 'referral-driven', goal: 'book-call', assets: allAssets });
    expect(out[0]).toBe('header');
    expect(out[out.length - 1]).toBe('footer');
  });

  it('drops testimonials when none available', () => {
    const out = selectServiceSections({
      awareness: 'search-aware-comparing',
      goal: 'book-call',
      assets: { ...allAssets, hasTestimonials: false },
    });
    expect(out).not.toContain('testimonials');
    expect(out).toEqual(['header', 'hero', 'services', 'packages', 'cta', 'footer']);
  });

  it('drops packages when format is quote-only', () => {
    const out = selectServiceSections({
      awareness: 'search-aware-comparing',
      goal: 'request-quote',
      assets: allAssets,
      format: 'quote-only',
    });
    expect(out).not.toContain('packages');
  });

  it('each awareness state yields its own middle order', () => {
    const orders = (['search-aware-cold', 'referral-driven', 'relationship-warming'] as const).map((a) =>
      selectServiceSections({ awareness: a, goal: 'book-call', assets: allAssets })
    );
    expect(orders[0]).toEqual(['header', 'hero', 'testimonials', 'services', 'packages', 'cta', 'footer']);
    expect(orders[1]).toEqual(['header', 'hero', 'services', 'packages', 'testimonials', 'cta', 'footer']);
    expect(orders[2]).toEqual(['header', 'hero', 'packages', 'services', 'testimonials', 'cta', 'footer']);
  });

  it('never emits duplicate sections', () => {
    const out = selectServiceSections({ awareness: 'relationship-warming', goal: 'apply', assets: allAssets });
    expect(new Set(out).size).toBe(out.length);
  });
});

describe('selectServiceSections — Surge (template-aware)', () => {
  it('non-surge templates are unchanged by templateId', () => {
    const base = selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets: allAssets });
    const hearth = selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets: allAssets, templateId: 'hearth' });
    expect(hearth).toEqual(base);
    expect(hearth).not.toContain('casestudies');
    expect(hearth).not.toContain('stats');
  });

  it('surge adds the delta sections (logos/about/casestudies/stats) when proof exists', () => {
    const out = selectServiceSections({ awareness: 'search-aware-comparing', goal: 'book-call', assets: allAssets, templateId: 'surge' });
    expect(out[0]).toBe('header');
    expect(out[out.length - 1]).toBe('footer');
    for (const s of ['logos', 'about', 'casestudies', 'stats']) expect(out).toContain(s);
    expect(new Set(out).size).toBe(out.length);
  });

  it('surge always renders hero first after header (every awareness state)', () => {
    for (const a of ['search-aware-comparing', 'search-aware-cold', 'referral-driven', 'relationship-warming'] as const) {
      const out = selectServiceSections({ awareness: a, goal: 'book-call', assets: allAssets, templateId: 'surge' });
      expect(out[0]).toBe('header');
      expect(out[1]).toBe('hero');
    }
  });

  it('surge gates logos on hasClientLogos and casestudies on hasCaseStudies', () => {
    const out = selectServiceSections({
      awareness: 'search-aware-comparing',
      goal: 'book-call',
      assets: { ...allAssets, hasClientLogos: false, hasCaseStudies: false },
      templateId: 'surge',
    });
    expect(out).not.toContain('logos');
    expect(out).not.toContain('casestudies');
    // about + stats are identity-core → always present for Surge.
    expect(out).toContain('about');
    expect(out).toContain('stats');
  });
});
