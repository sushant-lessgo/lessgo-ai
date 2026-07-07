import { describe, it, expect } from 'vitest';
import { sanitizeContentForPublish } from './layoutElementSchema';

/**
 * Publish-side coercion guards (React #31 defense). Sections use layouts NOT in
 * layoutElementSchema (TechPremium-style) so the schema gate is skipped — the
 * coercion must still run.
 */
describe('sanitizeContentForPublish — object→string coercion', () => {
  const spreadCorruption = {
    0: 'H', 1: 'e', 2: 'l', 3: 'l', 4: 'o',
    type: 'headline',
    content: undefined,
  };

  function makeContent(elements: Record<string, any>) {
    return {
      layout: { sections: ['hero-abc12345'] },
      content: {
        'hero-abc12345': { layout: 'TPHeroSplit', elements },
      },
    } as Record<string, any>;
  }

  it('coerces legacy { type, content } element objects to their content string', () => {
    const c = makeContent({ headline: { type: 'headline', content: 'Ship fast' } });
    sanitizeContentForPublish(c);
    expect(c.content['hero-abc12345'].elements.headline).toBe('Ship fast');
  });

  it('reassembles a string spread into an object ({0:..,1:..,type,content})', () => {
    const c = makeContent({ headline: spreadCorruption });
    sanitizeContentForPublish(c);
    expect(c.content['hero-abc12345'].elements.headline).toBe('Hello');
  });

  it('coerces corrupted fields inside collection item arrays', () => {
    const c = makeContent({
      faq_items: [
        { question: 'Q1?', answer: { type: 'text', content: 'A1' } },
        { question: 'Q2?', answer: 'A2' },
      ],
    });
    sanitizeContentForPublish(c);
    const items = c.content['hero-abc12345'].elements.faq_items;
    expect(items[0].answer).toBe('A1');
    expect(items[1].answer).toBe('A2');
  });

  it('leaves plain strings, numbers, booleans, and structured objects alone', () => {
    const structured = { label: 'CTA', url: '/contact' };
    const c = makeContent({
      headline: 'Plain',
      count: 3,
      show_badge: true,
      link_config: structured,
    });
    sanitizeContentForPublish(c);
    const els = c.content['hero-abc12345'].elements;
    expect(els.headline).toBe('Plain');
    expect(els.count).toBe(3);
    expect(els.show_badge).toBe(true);
    expect(els.link_config).toEqual(structured);
  });

  it('runs for sections whose layout has NO schema entry (TechPremium path)', () => {
    const c = makeContent({ headline: { type: 'h', content: 'Guarded' } });
    // 'TPHeroSplit' is not in layoutElementSchema — the old code skipped the section entirely.
    sanitizeContentForPublish(c);
    expect(c.content['hero-abc12345'].elements.headline).toBe('Guarded');
  });

  it('strips excluded elements for schema-less layouts (editor Delete parity)', () => {
    const c = makeContent({ cta_text: 'Get started', secondary_cta_text: 'Talk to us' });
    c.content['hero-abc12345'].aiMetadata = { excludedElements: ['secondary_cta_text'] };
    sanitizeContentForPublish(c);
    const els = c.content['hero-abc12345'].elements;
    expect(els.cta_text).toBe('Get started');
    expect(els.secondary_cta_text).toBeUndefined();
  });

  it('coerces subpage sections too (multi-page publish)', () => {
    const c = {
      layout: { sections: [] },
      content: {},
      subpages: {
        '/about': {
          layout: { sections: ['hero-sub1'] },
          content: {
            'hero-sub1': { layout: 'TPHeroSplit', elements: { headline: { type: 'h', content: 'Sub' } } },
          },
        },
      },
    } as Record<string, any>;
    sanitizeContentForPublish(c);
    expect(c.subpages['/about'].content['hero-sub1'].elements.headline).toBe('Sub');
  });
});
