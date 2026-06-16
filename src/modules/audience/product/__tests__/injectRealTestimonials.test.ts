// Verbatim testimonial injection for the website-import path. Real testimonials
// must override AI-invented quotes EXACTLY; an empty list must leave AI output
// untouched; a missing testimonials section must no-op (never crash).

import { injectRealTestimonials } from '@/modules/audience/product/parseCopy';
import type { SectionCopy } from '@/types/generation';

const aiSections = (): Record<string, SectionCopy> => ({
  testimonials: {
    elements: {
      eyebrow: 'PROOF',
      headline: 'Loved by fast teams',
      testimonials: [
        { id: 'ai-1', quote: 'Invented quote', author_name: 'AI', author_role: 'bot' },
      ],
      logos: [{ id: 'logo-1', name: 'Acme' }],
    },
  } as unknown as SectionCopy,
});

const real = [
  {
    quote: 'Naayom AWS has significantly boosted my Cordyceps crop yield by 50%.',
    author_name: 'Mycoforest',
    author_role: 'Gwalior',
  },
];

describe('injectRealTestimonials', () => {
  it('overwrites AI testimonials with verbatim real quotes', () => {
    const out = injectRealTestimonials(aiSections(), real);
    const items = (out.testimonials.elements as any).testimonials;
    expect(items).toHaveLength(1);
    expect(items[0].quote).toBe(real[0].quote); // exact wording preserved
    expect(items[0].author_name).toBe('Mycoforest');
  });

  it('keeps AI-generated eyebrow/headline and logos untouched', () => {
    const out = injectRealTestimonials(aiSections(), real);
    const els = out.testimonials.elements as any;
    expect(els.eyebrow).toBe('PROOF');
    expect(els.headline).toBe('Loved by fast teams');
    expect(els.logos).toEqual([{ id: 'logo-1', name: 'Acme' }]);
  });

  it('leaves AI output intact when there are no real testimonials', () => {
    const sections = aiSections();
    const out = injectRealTestimonials(sections, []);
    expect((out.testimonials.elements as any).testimonials[0].quote).toBe('Invented quote');
  });

  it('caps at 3 testimonials', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      quote: `q${i}`,
      author_name: `a${i}`,
      author_role: 'r',
    }));
    const out = injectRealTestimonials(aiSections(), five);
    expect((out.testimonials.elements as any).testimonials).toHaveLength(3);
  });

  it('no-ops when there is no testimonials section', () => {
    const sections = { hero: { elements: { headline: 'Hi' } } } as unknown as Record<
      string,
      SectionCopy
    >;
    const out = injectRealTestimonials(sections, real);
    expect(out).toBe(sections);
    expect((out as any).testimonials).toBeUndefined();
  });
});
