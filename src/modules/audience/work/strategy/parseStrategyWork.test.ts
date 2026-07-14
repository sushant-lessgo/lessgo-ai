// src/modules/audience/work/strategy/parseStrategyWork.test.ts
import { describe, it, expect } from 'vitest';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { WorkStrategyResponseSchema } from '@/lib/schemas/workStrategy.schema';
import { assembleWorkStrategy } from './parseStrategyWork';

// A standard-archetype, established premium studio fixture.
const facts: WorkFacts = {
  identity: { name: 'Studio Vero', location: 'Amsterdam' },
  establishment: 'established',
  dreamClient: 'discerning couples who want editorial, timeless work',
  praise: ['The photos still make us cry.', 'Worth every penny.'],
  contactMethod: 'form',
  languages: ['en'],
  groups: [
    { name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 4500 } },
    { name: 'Editorial', kind: 'category', price: { mode: 'on-request' } },
    { name: 'Portraits', kind: 'category', price: { mode: 'exact', amount: 900 } },
  ],
};

const professionRow = { key: 'photographer' };

const aiA = {
  positioningAngle: 'Angle A — the studio you book when it matters.',
  storyAngle: 'Story A — began behind the lens for friends.',
  voiceNotes: ['note a1', 'note a2'],
};
const aiB = {
  positioningAngle: 'Angle B — a completely different stance.',
  storyAngle: 'Story B — a different frame entirely.',
  voiceNotes: ['note b1'],
};

describe('assembleWorkStrategy — narrative half comes from the AI', () => {
  it('copies positioningAngle / storyAngle / voiceNotes verbatim', () => {
    const out = assembleWorkStrategy({ llmResponse: aiA, facts, professionRow });
    expect(out.positioningAngle).toBe(aiA.positioningAngle);
    expect(out.storyAngle).toBe(aiA.storyAngle);
    expect(out.voiceNotes).toEqual(aiA.voiceNotes);
  });
});

describe('assembleWorkStrategy — structure half is deterministic, NOT from the AI (AC-3)', () => {
  it('produces identical structure for two different AI responses (same facts)', () => {
    const a = assembleWorkStrategy({ llmResponse: aiA, facts, professionRow });
    const b = assembleWorkStrategy({ llmResponse: aiB, facts, professionRow });

    // Everything structural must match — only the narrative fields differ.
    expect(a.sections).toEqual(b.sections);
    expect(a.uiblocks).toEqual(b.uiblocks);
    expect(a.sitemap).toEqual(b.sitemap);
    expect(a.archetype).toBe(b.archetype);
    expect(a.leadGroups).toEqual(b.leadGroups);
    expect(a.storyBranch).toBe(b.storyBranch);
    expect(a.primaryLanguage).toBe(b.primaryLanguage);

    // Sanity: the narrative half DID differ between the two runs.
    expect(a.positioningAngle).not.toBe(b.positioningAngle);
  });

  it('home page leads the sitemap and structure tracks the facts', () => {
    const out = assembleWorkStrategy({ llmResponse: aiA, facts, professionRow });
    expect(out.sitemap[0].archetypeKey).toBe('home');
    expect(out.sitemap[0].pathSlug).toBe('/');
    expect(out.storyBranch).toBe('established');
    expect(out.primaryLanguage).toBe('en');
    // Lead groups are the facts' group names (curated order).
    expect(out.leadGroups.sort()).toEqual(['Editorial', 'Portraits', 'Weddings']);
  });

  it('applies the shared clampSectionList law: chrome at the edges, hero first', () => {
    const out = assembleWorkStrategy({ llmResponse: aiA, facts, professionRow });
    expect(out.sections[0]).toBe('header');
    expect(out.sections[out.sections.length - 1]).toBe('footer');
    // hero is the first BODY section.
    const body = out.sections.filter((s) => s !== 'header' && s !== 'footer');
    expect(body[0]).toBe('hero');
    // uiblocks cover every framed section (template-agnostic contract type).
    for (const s of out.sections) expect(out.uiblocks[s]).toBeTruthy();
  });
});

describe('WorkStrategyResponseSchema — the AI can contribute ONLY angle/story/voice (AC-3 second half)', () => {
  it('strips any structural fields the model tries to return', () => {
    const dirty = {
      positioningAngle: 'a',
      storyAngle: 's',
      voiceNotes: ['v'],
      // Structural contraband — must be dropped by the parse.
      sections: ['evil-section'],
      sitemap: [{ archetypeKey: 'evil' }],
      templateId: 'atelier',
      cardCounts: { work: 99 },
    };
    const parsed = WorkStrategyResponseSchema.parse(dirty);
    expect(Object.keys(parsed).sort()).toEqual([
      'positioningAngle',
      'storyAngle',
      'voiceNotes',
    ]);
    expect((parsed as any).sections).toBeUndefined();
    expect((parsed as any).templateId).toBeUndefined();
    expect((parsed as any).cardCounts).toBeUndefined();
  });

  it('rejects a response missing the required narrative fields', () => {
    expect(() =>
      WorkStrategyResponseSchema.parse({ positioningAngle: 'only one' })
    ).toThrow();
  });
});
