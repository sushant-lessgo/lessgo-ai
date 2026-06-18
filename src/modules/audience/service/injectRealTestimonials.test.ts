import { describe, it, expect } from 'vitest';
import { injectRealTestimonials } from './parseCopy';
import type { SectionCopy } from '@/types/generation';

const mkSections = (): Record<string, SectionCopy> => ({
  testimonials: {
    id: 'testimonials-1',
    layout: 'PullQuoteWithMark',
    elements: {
      quote: 'AI-generated placeholder quote',
      author_name: 'AI Name',
      author_role: 'AI Role',
      author_company: 'AI Co',
    },
  } as unknown as SectionCopy,
});

describe('injectRealTestimonials (service, single flat block)', () => {
  it('overwrites the flat block with the imported quote and clears author_company', () => {
    const sections = mkSections();
    const out = injectRealTestimonials(sections, [
      { quote: 'They tripled our booked calls in a month.', author_name: 'Priya', author_role: 'Founder' },
    ]);
    const el = out.testimonials.elements as Record<string, unknown>;
    expect(el.quote).toBe('They tripled our booked calls in a month.');
    expect(el.author_name).toBe('Priya');
    expect(el.author_role).toBe('Founder');
    expect(el.author_company).toBe(''); // cleared — no fabricated company on a real quote
  });

  it('picks the best (attributed + substantial) quote, not the first', () => {
    const sections = mkSections();
    const out = injectRealTestimonials(sections, [
      { quote: 'Great.', author_name: '', author_role: '' }, // anonymous + thin (first)
      { quote: 'They rebuilt our funnel and conversions doubled within six weeks.', author_name: 'Sam', author_role: 'CMO' },
    ]);
    expect((out.testimonials.elements as Record<string, unknown>).author_name).toBe('Sam');
  });

  it('no-ops when there is no testimonials section', () => {
    const sections: Record<string, SectionCopy> = {
      hero: { id: 'hero-1', layout: 'X', elements: { headline: 'Hi' } } as unknown as SectionCopy,
    };
    const out = injectRealTestimonials(sections, [
      { quote: 'q', author_name: 'a', author_role: 'r' },
    ]);
    expect(out.hero).toBe(sections.hero);
    expect(out.testimonials).toBeUndefined();
  });

  it('returns sections unchanged when no real testimonials', () => {
    const sections = mkSections();
    const out = injectRealTestimonials(sections, []);
    expect((out.testimonials.elements as Record<string, unknown>).quote).toBe(
      'AI-generated placeholder quote'
    );
  });
});
