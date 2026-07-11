// Sequence engine regression tests (email-sequences phase 2).

import { describe, it, expect } from 'vitest';
import type { Brief } from '@/types/brief';
import { SHOW_UP_SEQUENCE } from './archetypes';
import { buildBrandContext } from './brandContext';
import {
  buildSequencePrompt,
  buildSingleEmailPrompt,
  sequenceOutputSchema,
  SingleEmailOutputSchema,
  validateSequence,
  validateSingleEmail,
  mockSequenceOutput,
  mockSingleEmailOutput,
  PROOF_TRUTH_FRAGMENT,
  SUBJECT_MAX_CHARS,
  BODY_MAX_CHARS,
} from './sequenceEngine';

// A Brief with rich facts.entry for prompt-content assertions.
const brief = {
  goal: { intent: 'book-call', mechanism: 'M1' },
  proofAvailable: ['5-star Google reviews'],
  facts: {
    entry: {
      offer: 'Free 30-minute strategy call',
      offerings: ['Growth audit', 'Fractional CMO'],
      audiences: ['B2B SaaS founders'],
      testimonials: ['They doubled our pipeline in a quarter.'],
    },
  },
} as unknown as Brief;

const ctx = buildBrandContext(brief);

describe('buildBrandContext', () => {
  it('extracts offer / offerings / audiences / testimonials / proofAvailable from facts.entry + top-level', () => {
    expect(ctx.offer).toBe('Free 30-minute strategy call');
    expect(ctx.offerings).toEqual(['Growth audit', 'Fractional CMO']);
    expect(ctx.audiences).toEqual(['B2B SaaS founders']);
    expect(ctx.testimonials).toEqual(['They doubled our pipeline in a quarter.']);
    expect(ctx.proofAvailable).toEqual(['5-star Google reviews']);
  });

  it('never throws on a missing / malformed brief and returns empty arrays', () => {
    for (const bad of [undefined, null, {}, { facts: 'nope' }, { facts: { entry: 5 } }]) {
      const c = buildBrandContext(bad as unknown as Brief);
      expect(c.offerings).toEqual([]);
      expect(c.audiences).toEqual([]);
      expect(c.testimonials).toEqual([]);
      expect(c.proofAvailable).toEqual([]);
      expect(c.offer).toBeUndefined();
    }
  });
});

describe('buildSequencePrompt', () => {
  const prompt = buildSequencePrompt({ def: SHOW_UP_SEQUENCE, brandContext: ctx, intent: 'book-call' });

  it('includes brand-context facts', () => {
    expect(prompt).toContain('Free 30-minute strategy call');
    expect(prompt).toContain('Growth audit');
    expect(prompt).toContain('B2B SaaS founders');
    expect(prompt).toContain('They doubled our pipeline in a quarter.');
  });

  it('includes the proof-truth fragment and JSON-object output instruction', () => {
    expect(prompt).toContain(PROOF_TRUTH_FRAGMENT);
    expect(prompt).toContain('JSON object');
    expect(prompt).toContain('"emails"');
  });

  it('references the intent and every email purpose', () => {
    expect(prompt).toContain('book-call');
    for (const email of SHOW_UP_SEQUENCE.emails) {
      expect(prompt).toContain(email.purpose);
      expect(prompt).toContain(email.timingLabel);
    }
  });
});

describe('buildSingleEmailPrompt', () => {
  const siblings = [
    { position: 0, subject: 'You are booked', body: 'Here is the agenda.' },
    { position: 2, subject: 'Tomorrow', body: 'See you soon.' },
  ];
  const prompt = buildSingleEmailPrompt({ def: SHOW_UP_SEQUENCE, position: 1, siblings, brandContext: ctx });

  it('references the target position and the sibling emails', () => {
    expect(prompt).toContain('email 2 of 4');
    expect(prompt).toContain('You are booked');
    expect(prompt).toContain('See you soon.');
  });

  it('includes the proof-truth fragment', () => {
    expect(prompt).toContain(PROOF_TRUTH_FRAGMENT);
  });
});

describe('validateSequence', () => {
  it('returns ok for a well-formed, within-cap output', () => {
    const raw = mockSequenceOutput(SHOW_UP_SEQUENCE);
    const result = validateSequence(raw, SHOW_UP_SEQUENCE);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.emails).toHaveLength(4);
  });

  it('returns invalid_shape when a bare array is passed instead of an {emails} object', () => {
    const raw = [{ subject: 's', body: 'b' }]; // bare array — not the {emails:[...]} object
    expect(validateSequence(raw, SHOW_UP_SEQUENCE).status).toBe('invalid_shape');
  });

  it('returns invalid_shape when the emails array length mismatches the def', () => {
    const raw = { emails: [{ subject: 's', body: 'b' }] }; // 1, not 4
    expect(validateSequence(raw, SHOW_UP_SEQUENCE).status).toBe('invalid_shape');
  });

  it('returns invalid_shape when an item is missing a field', () => {
    const raw = { emails: SHOW_UP_SEQUENCE.emails.map(() => ({ subject: 'only subject' })) };
    expect(validateSequence(raw, SHOW_UP_SEQUENCE).status).toBe('invalid_shape');
  });

  it('over-cap subject/body PASSES the SHAPE schema but validateSequence flags too_long (decision #10)', () => {
    const raw = {
      emails: SHOW_UP_SEQUENCE.emails.map((_, i) => ({
        subject: i === 0 ? 'x'.repeat(SUBJECT_MAX_CHARS + 5) : 'ok subject',
        body: i === 1 ? 'y'.repeat(BODY_MAX_CHARS + 5) : 'ok body',
      })),
    };

    // The cap-free SHAPE schema must accept the over-cap payload.
    expect(sequenceOutputSchema(SHOW_UP_SEQUENCE).safeParse(raw).success).toBe(true);

    // The validator (caps live here only) must flag too_long.
    const result = validateSequence(raw, SHOW_UP_SEQUENCE);
    expect(result.status).toBe('too_long');
    if (result.status === 'too_long') {
      expect(result.violations.some((v) => v.field === 'subject')).toBe(true);
      expect(result.violations.some((v) => v.field === 'body')).toBe(true);
    }
  });
});

describe('validateSingleEmail', () => {
  it('returns ok for a well-formed, within-cap email', () => {
    const raw = mockSingleEmailOutput(SHOW_UP_SEQUENCE, 1);
    expect(validateSingleEmail(raw).status).toBe('ok');
  });

  it('returns invalid_shape for a malformed email', () => {
    expect(validateSingleEmail({ subject: 'no body' }).status).toBe('invalid_shape');
  });

  it('over-cap PASSES the SHAPE schema but flags too_long', () => {
    const raw = { subject: 'x'.repeat(SUBJECT_MAX_CHARS + 1), body: 'ok body' };
    expect(SingleEmailOutputSchema.safeParse(raw).success).toBe(true);
    expect(validateSingleEmail(raw).status).toBe('too_long');
  });
});

describe('mock outputs', () => {
  it('mockSequenceOutput passes its own schema and validator', () => {
    const raw = mockSequenceOutput(SHOW_UP_SEQUENCE);
    expect(sequenceOutputSchema(SHOW_UP_SEQUENCE).safeParse(raw).success).toBe(true);
    expect(validateSequence(raw, SHOW_UP_SEQUENCE).status).toBe('ok');
  });

  it('mockSingleEmailOutput passes its own schema and validator', () => {
    const raw = mockSingleEmailOutput();
    expect(SingleEmailOutputSchema.safeParse(raw).success).toBe(true);
    expect(validateSingleEmail(raw).status).toBe('ok');
  });
});
