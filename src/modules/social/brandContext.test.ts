// Pure coverage for the read-only brand-context accessor. No DB — feeds plain
// Project-shaped objects covering both testimonial shapes + degenerate drafts.

import { describe, it, expect } from 'vitest';
import { buildBrandContext, summarizeBrandContext } from './brandContext';

// (a) Product project: testimonials stored as a COLLECTION array + features.
function productProject() {
  return {
    inputText: 'The fastest way to invoice clients',
    title: 'Untitled Project',
    content: {
      onboarding: {
        confirmedFields: {
          productName: { value: 'Billster', confidence: 0.9 },
          marketCategory: { value: 'Invoicing SaaS', confidence: 0.8 },
          targetAudience: { value: 'Freelancers', confidence: 0.8 },
          offer: { value: '14-day free trial', confidence: 0.7 },
        },
        featuresFromAI: [
          { feature: 'Auto-reminders', benefit: 'Get paid faster' },
          { feature: 'Multi-currency', benefit: 'Bill anyone anywhere' },
        ],
        hiddenInferredFields: { brandTone: 'confident, friendly' },
      },
      finalContent: {
        pages: {
          home: {
            pathSlug: '/',
            content: {
              'hero-abc12345': { layout: 'CenterStacked', elements: { headline: 'hi' } },
              'testimonials-def67890': {
                layout: 'ProofWithLogoRail',
                elements: {
                  eyebrow: 'PROOF',
                  testimonials: [
                    { id: 't1', quote: 'Saved me hours', author_name: 'Ada Lovelace', author_role: 'Founder' },
                    { id: 't2', quote: 'Best tool ever', author_name: 'Alan Turing', author_role: 'CTO' },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };
}

// (b) Service project: FLAT testimonial block, no products/services collection.
function serviceProject() {
  return {
    inputText: 'Brand identity that stays with you',
    content: {
      onboarding: {
        confirmedFields: {
          marketCategory: { value: 'Design Studio', confidence: 0.6 },
        },
        featuresFromAI: [],
        hiddenInferredFields: { brandTone: 'warm, editorial' },
      },
      finalContent: {
        content: {
          'testimonials-xyz00001': {
            layout: 'PullQuoteWithMark',
            elements: {
              eyebrow: 'WORDS',
              quote: 'They nailed our vibe',
              author_name: 'Grace Hopper',
              author_role: 'Marketing Lead',
              author_company: 'Acme Co',
            },
          },
        },
      },
    },
  };
}

// (c) Writer / bare project: brief ONLY, no content.finalContent.
function bareBriefProject() {
  return {
    brief: {
      category: 'Hindi poetry',
      goal: { intent: 'follow', mechanism: 'social' },
      socialProfiles: [{ platform: 'instagram', url: 'https://instagram.com/kavi' }],
    },
  };
}

// (d) Project with NEITHER testimonials NOR features.
function emptyProject() {
  return {
    inputText: 'Something new',
    content: {
      onboarding: {
        confirmedFields: { productName: { value: 'Nada', confidence: 0.5 } },
        featuresFromAI: [],
        hiddenInferredFields: {},
      },
      finalContent: {
        pages: { home: { pathSlug: '/', content: { 'hero-1': { elements: { headline: 'x' } } } } },
      },
    },
  };
}

// (e) Fallback branch: NO onboarding.featuresFromAI, but a service `services-*`
// content-section collection with the real `{title, description}` element keys.
// Exercises extractFeaturesFromSections (title→feature, description→benefit).
function sectionFeaturesFallbackProject() {
  return {
    inputText: 'Studio that ships brands',
    content: {
      onboarding: {
        confirmedFields: { businessName: { value: 'Northwind', confidence: 0.7 } },
        // featuresFromAI intentionally ABSENT so the section fallback fires.
        hiddenInferredFields: {},
      },
      finalContent: {
        pages: {
          home: {
            pathSlug: '/',
            content: {
              'services-svc00001': {
                layout: 'IconServiceCards',
                elements: {
                  services: [
                    { id: 's1', title: 'Brand Strategy', description: 'Position you to win' },
                    { id: 's2', title: 'Visual Identity', description: 'A look that lasts' },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };
}

describe('buildBrandContext', () => {
  it('(a) product: normalizes a testimonials COLLECTION + features', () => {
    const ctx = buildBrandContext(productProject());
    expect(ctx.businessName).toBe('Billster');
    expect(ctx.category).toBe('Invoicing SaaS');
    expect(ctx.audience).toBe('Freelancers');
    expect(ctx.offer).toBe('14-day free trial');
    expect(ctx.brandTone).toBe('confident, friendly');
    expect(ctx.features).toHaveLength(2);
    expect(ctx.features[0]).toEqual({ feature: 'Auto-reminders', benefit: 'Get paid faster' });
    // author_name → authorName mapping across the collection
    expect(ctx.testimonials).toHaveLength(2);
    expect(ctx.testimonials[0].authorName).toBe('Ada Lovelace');
    expect(ctx.testimonials[0].authorRole).toBe('Founder');
    expect(ctx.testimonials[0].quote).toBe('Saved me hours');
  });

  it('(b) service: normalizes a FLAT testimonial block; no features', () => {
    const ctx = buildBrandContext(serviceProject());
    expect(ctx.testimonials).toHaveLength(1);
    expect(ctx.testimonials[0]).toEqual({
      quote: 'They nailed our vibe',
      authorName: 'Grace Hopper',
      authorRole: 'Marketing Lead',
      authorCompany: 'Acme Co',
    });
    expect(ctx.features).toEqual([]);
    expect(Array.isArray(ctx.features)).toBe(true);
  });

  it('(c) bare brief only: no throw, arrays empty (not undefined), brief fields carried', () => {
    const ctx = buildBrandContext(bareBriefProject());
    expect(ctx.testimonials).toEqual([]);
    expect(ctx.features).toEqual([]);
    expect(ctx.category).toBe('Hindi poetry');
    expect(ctx.goal).toBe('follow · social');
    expect(ctx.socialProfiles).toEqual([{ platform: 'instagram', url: 'https://instagram.com/kavi' }]);
  });

  it('(d) neither testimonials nor features: empty arrays, still carries brand fields', () => {
    const ctx = buildBrandContext(emptyProject());
    expect(ctx.testimonials).toEqual([]);
    expect(ctx.features).toEqual([]);
    expect(ctx.businessName).toBe('Nada');
    expect(ctx.oneLiner).toBe('Something new');
  });

  it('(e) fallback: maps a `services-*` section collection (title→feature, description→benefit) when featuresFromAI is absent', () => {
    const ctx = buildBrandContext(sectionFeaturesFallbackProject());
    expect(ctx.features).toHaveLength(2);
    // title → feature, description → benefit (must go red if swapped/dropped).
    expect(ctx.features[0].feature).toBe('Brand Strategy');
    expect(ctx.features[0].benefit).toBe('Position you to win');
    expect(ctx.features[1].feature).toBe('Visual Identity');
    expect(ctx.features[1].benefit).toBe('A look that lasts');
  });

  it('does not throw on a fully empty object', () => {
    expect(() => buildBrandContext({})).not.toThrow();
    const ctx = buildBrandContext({});
    expect(ctx.features).toEqual([]);
    expect(ctx.testimonials).toEqual([]);
    expect(ctx.socialProfiles).toEqual([]);
  });
});

describe('summarizeBrandContext', () => {
  it('(c) sparsest case still produces a non-empty string', () => {
    const ctx = buildBrandContext(bareBriefProject());
    const summary = summarizeBrandContext(ctx);
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('Category: Hindi poetry');
  });

  it('omits absent sections rather than emitting empty headings', () => {
    const ctx = buildBrandContext(emptyProject());
    const summary = summarizeBrandContext(ctx);
    expect(summary).not.toContain('Testimonials:');
    expect(summary).not.toContain('Features:');
  });

  it('emits testimonial + feature sections when present', () => {
    const summary = summarizeBrandContext(buildBrandContext(productProject()));
    expect(summary).toContain('Features:');
    expect(summary).toContain('Testimonials:');
    expect(summary).toContain('Ada Lovelace');
  });
});
