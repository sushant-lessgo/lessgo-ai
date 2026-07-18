// src/modules/audience/work/injectPraise.test.ts
import { describe, it, expect } from 'vitest';
import { injectPraise, proofQuotesMax } from './injectPraise';
import type { SectionCopy } from '@/types/generation';

function pageWithProof(): Record<string, SectionCopy> {
  return {
    hero: { elements: { heading: 'Work' } },
    proof: { elements: { heading: 'What clients say' } },
  };
}

describe('injectPraise (work-LOCAL praise → proof.quotes)', () => {
  it('maps EVERY praise string verbatim, in facts order, no extras, no drops', () => {
    const praise = ['The photos still make us cry.', 'Worth every penny.'];
    const out = injectPraise(pageWithProof(), praise);
    const quotes = out.proof.elements.quotes as Array<{ text: string }>;

    expect(quotes).toHaveLength(2);
    expect(quotes.map((q) => q.text)).toEqual(praise); // verbatim + order
  });

  it('never invents a source (attribution omitted, not fabricated)', () => {
    const out = injectPraise(pageWithProof(), ['A real line.']);
    const quotes = out.proof.elements.quotes as Array<Record<string, unknown>>;
    expect(quotes[0].source).toBeUndefined();
  });

  it('clamps deterministically to the contract max (first N)', () => {
    const max = proofQuotesMax();
    expect(max).toBe(3);
    const praise = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const out = injectPraise(pageWithProof(), praise);
    const quotes = out.proof.elements.quotes as Array<{ text: string }>;

    expect(quotes).toHaveLength(max);
    expect(quotes.map((q) => q.text)).toEqual(['q1', 'q2', 'q3']); // first N, verbatim
  });

  it('is a no-op when the page has no proof section', () => {
    const page: Record<string, SectionCopy> = { hero: { elements: { heading: 'Work' } } };
    const out = injectPraise(page, ['orphan praise']);
    expect(out).toEqual({ hero: { elements: { heading: 'Work' } } });
  });

  it('strips quotes to [] when there is no praise (proof section present)', () => {
    const before = pageWithProof();
    const out = injectPraise(before, []);
    expect(out.proof.elements.quotes).toEqual([]);
  });

  it('strips a model-written quote to [] when praise is empty (fabrication guard)', () => {
    const page: Record<string, SectionCopy> = {
      hero: { elements: { heading: 'Work' } },
      proof: {
        elements: {
          heading: 'What clients say',
          // A misbehaving LLM invented a testimonial — facts-law must strip it.
          quotes: [{ id: 'q1', text: 'Best studio ever!', source: 'Fabricated Client' }],
        },
      },
    };
    const out = injectPraise(page, undefined);
    expect(out.proof.elements.quotes).toEqual([]);
  });
});
