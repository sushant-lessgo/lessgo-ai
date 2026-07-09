// src/app/edit/[token]/components/ui/clampSectionCards.test.ts
// scale-09 phase 5 — clamp helper: truncation (drop trailing), no-op, edges.

import { describe, it, expect } from 'vitest';
import { clampSectionCards, sectionCardCount, type ClampableSection } from './clampSectionCards';

const card = (id: string) => ({ id, quote: id });

describe('sectionCardCount', () => {
  it('returns the largest top-level collection length', () => {
    const section: ClampableSection = {
      elements: {
        headline: 'hi',
        testimonials: [card('a'), card('b'), card('c')],
        logos: [{ id: '1' }],
      },
    };
    expect(sectionCardCount(section)).toBe(3);
  });

  it('is 0 when there are no collections or no elements', () => {
    expect(sectionCardCount({ elements: { headline: 'x' } })).toBe(0);
    expect(sectionCardCount({})).toBe(0);
    expect(sectionCardCount(null)).toBe(0);
    expect(sectionCardCount(undefined)).toBe(0);
  });
});

describe('clampSectionCards — truncation', () => {
  it('drops trailing cards and keeps the first N', () => {
    const section: ClampableSection = {
      layout: 'PullQuoteWithMark',
      elements: {
        headline: 'Proof',
        testimonials: [card('a'), card('b'), card('c')],
      },
    };
    const { content, droppedCount } = clampSectionCards(section, 1);
    expect(droppedCount).toBe(2);
    expect((content.elements!.testimonials as unknown[])).toEqual([card('a')]);
    // non-array element untouched
    expect(content.elements!.headline).toBe('Proof');
    // original not mutated
    expect((section.elements!.testimonials as unknown[]).length).toBe(3);
  });

  it('truncates every top-level collection, reports the largest drop', () => {
    const section: ClampableSection = {
      elements: {
        testimonials: [card('a'), card('b'), card('c'), card('d')],
        stats: [{ id: '1' }, { id: '2' }],
      },
    };
    const { content, droppedCount } = clampSectionCards(section, 1);
    expect(droppedCount).toBe(3); // largest collection dropped 4→1
    expect((content.elements!.testimonials as unknown[]).length).toBe(1);
    expect((content.elements!.stats as unknown[]).length).toBe(1);
  });
});

describe('clampSectionCards — no-op & edges', () => {
  it('returns the SAME ref when already within capacity', () => {
    const section: ClampableSection = {
      elements: { testimonials: [card('a')] },
    };
    const result = clampSectionCards(section, 3);
    expect(result.droppedCount).toBe(0);
    expect(result.content).toBe(section);
  });

  it('is a no-op with no collections', () => {
    const section: ClampableSection = { elements: { headline: 'x' } };
    const result = clampSectionCards(section, 1);
    expect(result.droppedCount).toBe(0);
    expect(result.content).toBe(section);
  });

  it('is a no-op with empty / missing elements', () => {
    const empty: ClampableSection = { elements: {} };
    expect(clampSectionCards(empty, 1).content).toBe(empty);
    const none: ClampableSection = {};
    expect(clampSectionCards(none, 1).content).toBe(none);
  });

  it('maxCards 0 empties all collections', () => {
    const section: ClampableSection = {
      elements: { testimonials: [card('a'), card('b')] },
    };
    const { content, droppedCount } = clampSectionCards(section, 0);
    expect(droppedCount).toBe(2);
    expect((content.elements!.testimonials as unknown[])).toEqual([]);
  });

  it('ignores a negative maxCards (no-op)', () => {
    const section: ClampableSection = {
      elements: { testimonials: [card('a'), card('b')] },
    };
    const result = clampSectionCards(section, -1);
    expect(result.droppedCount).toBe(0);
    expect(result.content).toBe(section);
  });
});
