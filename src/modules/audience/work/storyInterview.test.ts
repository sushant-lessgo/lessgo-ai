// src/modules/audience/work/storyInterview.test.ts
// Prompt-shape + validation tests for the work story-interview (Sugarman) tier.
// No LLM — pure prompt construction + contract-shape validation.

import { describe, it, expect } from 'vitest';
import {
  buildStoryInterviewPrompt,
  validateStoryAbout,
  aboutRequiredKeys,
  MIN_STORY_BIO_CHARS,
  type StoryInterviewAnswers,
} from './storyInterview';
import { selectWorkVoice } from './voice';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

const ANSWERS: StoryInterviewAnswers = {
  origin: 'I started shooting weddings for friends who could not afford a studio.',
  moment: 'A groom cried when he saw the one frame of his late father in the crowd.',
  belief: 'The photo you keep is the one nobody posed for.',
};

const FACTS: WorkFacts = {
  identity: { name: 'Test Studio' },
  establishment: 'established',
  dreamClient: 'couples who value quiet, honest photographs',
  praise: ['She saw the moment before we did.', 'The album still makes us cry.'],
  contactMethod: 'form',
  languages: ['en'],
  groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 4500, currency: 'EUR' } }],
} as unknown as WorkFacts;

const VOICE = selectWorkVoice({
  professionRow: { key: 'photographer' },
  pricePosition: 'premium',
  establishment: 'established',
});

describe('buildStoryInterviewPrompt — Sugarman shape', () => {
  const prompt = buildStoryInterviewPrompt({ answers: ANSWERS, facts: FACTS, voice: VOICE });

  it('includes the HOOK-on-the-moment rule', () => {
    expect(prompt).toMatch(/HOOK on the moment/i);
    expect(prompt).toContain(ANSWERS.moment);
  });

  it('includes the BELIEF-as-spine rule', () => {
    expect(prompt).toMatch(/BELIEF is the spine/i);
    expect(prompt).toContain(ANSWERS.belief);
  });

  it('includes the praise-as-LANDING rule', () => {
    expect(prompt).toMatch(/Praise is the LANDING/i);
  });

  it('carries the anti-invention (facts are law) binding', () => {
    expect(prompt).toMatch(/Anti-invention/i);
    expect(prompt).toMatch(/facts are law/i);
    expect(prompt).toMatch(/NEVER fabricate a biography/i);
  });

  it('carries the primary-language directive from languages[0]', () => {
    expect(prompt).toMatch(/Write EVERY string in en/);
  });

  it('scopes the write to the about section ONLY (never proof/testimonials)', () => {
    expect(prompt).toMatch(/Write ONLY the `about` section/);
    expect(prompt).toMatch(/Do NOT write any other section/i);
  });

  it('emits the new-seller anti-history clause only for new sellers', () => {
    const newVoice = selectWorkVoice({
      professionRow: { key: 'photographer' },
      pricePosition: 'middle',
      establishment: 'new',
    });
    const newPrompt = buildStoryInterviewPrompt({ answers: ANSWERS, facts: FACTS, voice: newVoice });
    expect(newPrompt).toMatch(/This seller is NEW/);
    expect(prompt).not.toMatch(/This seller is NEW/);
  });
});

describe('validateStoryAbout — contract shape gate', () => {
  it('accepts a well-formed about', () => {
    const res = validateStoryAbout({
      about: {
        elements: {
          heading: 'The one nobody posed for',
          bio: 'It started with weddings for friends, and it never stopped being about the frame no one asked for.',
        },
      },
    } as never);
    expect(res.valid).toBe(true);
  });

  it('rejects a missing about section', () => {
    expect(validateStoryAbout({} as never).valid).toBe(false);
  });

  it('rejects a missing required element (bio)', () => {
    const res = validateStoryAbout({
      about: { elements: { heading: 'A headline' } },
    } as never);
    expect(res.valid).toBe(false);
  });

  it('rejects a too-short bio', () => {
    const res = validateStoryAbout({
      about: { elements: { heading: 'A headline', bio: 'short' } },
    } as never);
    expect(res.valid).toBe(false);
    expect('short'.length).toBeLessThan(MIN_STORY_BIO_CHARS);
  });
});

describe('aboutRequiredKeys — single source of truth', () => {
  it('derives heading + bio from the contract', () => {
    expect(aboutRequiredKeys()).toEqual(expect.arrayContaining(['heading', 'bio']));
  });
});
