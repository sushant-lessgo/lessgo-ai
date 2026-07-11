// src/lib/schemas/copy.schema.test.ts
// F27 — the copy-response element schema must tolerate a lone object where an
// array-of-objects (a collection) is required. The model occasionally emits
// `{ … }` instead of `[{ … }]` for footer collections like `legal_links` /
// `link_columns`; without coercion zod rejects every union branch and the whole
// generation dies. These tests lock in the narrow coercion.

import { describe, it, expect } from 'vitest';
import { CopyResponseSchema, flattenReviewSentinel } from './copy.schema';

describe('CopyResponseSchema — tolerant array coercion (F27)', () => {
  it('coerces a lone object in a collection element to a single-element array', () => {
    const raw = {
      footer: {
        elements: {
          // model emitted an OBJECT where an array is required
          legal_links: { id: '', label: 'Privacy Policy', href: '/privacy' },
        },
      },
    };

    const parsed = CopyResponseSchema.parse(raw);
    expect(Array.isArray(parsed.footer.elements.legal_links)).toBe(true);
    expect(parsed.footer.elements.legal_links).toEqual([
      { id: '', label: 'Privacy Policy', href: '/privacy' },
    ]);
  });

  it('coerces the drift case (link_columns as a lone object) rather than hard-failing', () => {
    const raw = {
      footer: {
        elements: {
          link_columns: {
            id: '',
            heading: 'Company',
            links: [{ id: '', label: 'About', href: '/about' }],
          },
        },
      },
    };

    expect(() => CopyResponseSchema.parse(raw)).not.toThrow();
    const parsed = CopyResponseSchema.parse(raw);
    expect(Array.isArray(parsed.footer.elements.link_columns)).toBe(true);
    expect((parsed.footer.elements.link_columns as unknown[]).length).toBe(1);
  });

  it('leaves a proper array of objects untouched', () => {
    const raw = {
      footer: {
        elements: {
          legal_links: [
            { id: '', label: 'Terms', href: '/terms' },
            { id: '', label: 'Privacy', href: '/privacy' },
          ],
        },
      },
    };

    const parsed = CopyResponseSchema.parse(raw);
    expect((parsed.footer.elements.legal_links as unknown[]).length).toBe(2);
  });

  it('does NOT wrap the { value, needsReview } review sentinel', () => {
    const raw = {
      hero: {
        elements: {
          headline: { value: 'Ship faster', needsReview: true as const },
        },
      },
    };

    const parsed = CopyResponseSchema.parse(raw);
    expect(parsed.hero.elements.headline).toEqual({
      value: 'Ship faster',
      needsReview: true,
    });
  });

  it('leaves strings and string arrays untouched', () => {
    const raw = {
      hero: {
        elements: {
          headline: 'Ship faster',
          bullets: ['a', 'b', 'c'],
          eyebrow: null,
        },
      },
    };

    const parsed = CopyResponseSchema.parse(raw);
    expect(parsed.hero.elements.headline).toBe('Ship faster');
    expect(parsed.hero.elements.bullets).toEqual(['a', 'b', 'c']);
    expect(parsed.hero.elements.eyebrow).toBeNull();
  });
});

// proof-truth phase 2 — the sentinel is DEAD but defended: if a model ever emits
// `{ value, needsReview: true }`, the flatten normalizer must reduce it to the
// plain string BEFORE content assembly so no object-shaped value reaches a block
// (→ no `[object Object]` on a published page).
describe('flattenReviewSentinel — object-shaped value in → plain string out', () => {
  it('flattens a top-level element sentinel to its plain string', () => {
    const sections = {
      hero: {
        elements: {
          headline: { value: 'Ship faster', needsReview: true as const },
          lede: 'A plain string',
          eyebrow: null,
        },
      },
    };

    const out = flattenReviewSentinel(sections);
    expect(out.hero.elements.headline).toBe('Ship faster');
    expect(out.hero.elements.lede).toBe('A plain string');
    expect(out.hero.elements.eyebrow).toBeNull();
  });

  it('flattens a sentinel nested inside a collection item field', () => {
    const sections = {
      testimonials: {
        elements: {
          testimonials: [
            { id: 't1', quote: { value: 'Loved it', needsReview: true as const }, author_name: 'Alex' },
          ],
        },
      },
    };

    const out = flattenReviewSentinel(sections);
    const item = (out.testimonials.elements.testimonials as any[])[0];
    expect(item.quote).toBe('Loved it');
    expect(item.author_name).toBe('Alex');
  });

  it('leaves plain strings, arrays and null untouched (idempotent)', () => {
    const sections = {
      hero: {
        elements: {
          headline: 'Ship faster',
          bullets: ['a', 'b'],
          eyebrow: null,
        },
      },
    };

    const out = flattenReviewSentinel(sections);
    expect(out.hero.elements.headline).toBe('Ship faster');
    expect(out.hero.elements.bullets).toEqual(['a', 'b']);
    expect(out.hero.elements.eyebrow).toBeNull();
    // Re-running changes nothing.
    expect(flattenReviewSentinel(out)).toEqual(sections);
  });

  it('guarantees no object-shaped value survives (the [object Object] guard)', () => {
    const sections = {
      cta: {
        elements: {
          headline: { value: 'Book now', needsReview: true as const },
        },
      },
    };

    const out = flattenReviewSentinel(sections);
    const v = out.cta.elements.headline;
    expect(typeof v).toBe('string');
    expect(String(v)).not.toBe('[object Object]');
  });
});
