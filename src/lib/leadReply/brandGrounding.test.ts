import { describe, it, expect } from 'vitest';
import { resolveReplyGrounding } from './brandGrounding';
import { buildLeadReplyPrompt } from './prompt';

const FALLBACK_SENTENCE = 'No specific brand facts were captured';

describe('resolveReplyGrounding', () => {
  it('rich valid Brief → mode:brief with offer/audience text in summary', () => {
    const brief = {
      facts: {
        entry: {
          offer: 'Free 30-minute strategy call',
          audiences: ['early-stage SaaS founders'],
          testimonials: ['They doubled our signups.'],
        },
      },
    };
    const g = resolveReplyGrounding(brief, 'Acme Studio');
    expect(g.mode).toBe('brief');
    expect(g.summary).toContain('Free 30-minute strategy call');
    expect(g.summary).toContain('early-stage SaaS founders');
    expect(g.summary).not.toContain(FALLBACK_SENTENCE);
  });

  it('empty object {} (parses OK, zero facts) → light', () => {
    const g = resolveReplyGrounding({}, 'Acme Studio');
    expect(g.mode).toBe('light');
    expect(g.summary).toContain('Acme Studio');
    expect(g.summary).not.toContain(FALLBACK_SENTENCE);
  });

  it('valid-shape Brief with no facts.entry → light', () => {
    const g = resolveReplyGrounding({ businessType: 'consultant' }, 'Acme Studio');
    expect(g.mode).toBe('light');
    expect(g.summary).toContain('Acme Studio');
    expect(g.summary).not.toContain(FALLBACK_SENTENCE);
  });

  it('null / undefined → light, never throws', () => {
    expect(resolveReplyGrounding(null, 'Acme Studio').mode).toBe('light');
    expect(resolveReplyGrounding(undefined, 'Acme Studio').mode).toBe('light');
  });

  it('non-object garbage (string / number) → light, never throws', () => {
    expect(() => resolveReplyGrounding('nonsense', 'Acme Studio')).not.toThrow();
    expect(resolveReplyGrounding('nonsense', 'Acme Studio').mode).toBe('light');
    expect(resolveReplyGrounding(42, 'Acme Studio').mode).toBe('light');
  });

  it('light summary contains site name and NOT the fallback sentence', () => {
    const g = resolveReplyGrounding(null, 'Naayom');
    expect(g.summary).toContain('Naayom');
    expect(g.summary).not.toContain(FALLBACK_SENTENCE);
  });

  it('light summary tolerates a null site name', () => {
    const g = resolveReplyGrounding(null, null);
    expect(g.mode).toBe('light');
    expect(g.summary.length).toBeGreaterThan(0);
    expect(g.summary).not.toContain(FALLBACK_SENTENCE);
  });
});

describe('buildLeadReplyPrompt', () => {
  it('embeds the lead message and the grounding summary', () => {
    const brief = { facts: { entry: { offer: 'Bespoke ceramics' } } };
    const g = resolveReplyGrounding(brief, 'Acme Studio');
    const prompt = buildLeadReplyPrompt(g, 'Do you take custom orders?', 'Priya');
    expect(prompt).toContain('Do you take custom orders?');
    expect(prompt).toContain('Bespoke ceramics');
    expect(prompt).toContain('Priya');
  });

  it('light-mode prompt embeds the message and carries no brief-only claims', () => {
    const g = resolveReplyGrounding(null, 'Acme Studio');
    const prompt = buildLeadReplyPrompt(g, 'What are your prices?');
    expect(prompt).toContain('What are your prices?');
    expect(prompt).toContain('Acme Studio');
    expect(prompt).not.toContain(FALLBACK_SENTENCE);
  });
});
