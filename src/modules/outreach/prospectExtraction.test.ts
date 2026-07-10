// Prospect-extraction regression tests (cold-outreach phase 2).

import { describe, it, expect } from 'vitest';
import {
  ProspectExtractSchema,
  buildProspectExtractionPrompt,
  summarizeProspect,
  mockProspectExtract,
  type ProspectExtract,
} from './prospectExtraction';

const validExtract: ProspectExtract = {
  name: 'Acme Robotics',
  whatTheyDo: 'Builds warehouse automation robots.',
  whoFor: 'Operations leads at 3PL warehouses.',
  specifics: ['Cart-X pick robot', 'Cold-storage expansion'],
};

describe('ProspectExtractSchema', () => {
  it('accepts a valid extract', () => {
    const r = ProspectExtractSchema.safeParse(validExtract);
    expect(r.success).toBe(true);
  });

  it('accepts a null name (nullable, not optional)', () => {
    const r = ProspectExtractSchema.safeParse({ ...validExtract, name: null });
    expect(r.success).toBe(true);
  });

  it('accepts an empty specifics array (no minItems constraint)', () => {
    const r = ProspectExtractSchema.safeParse({ ...validExtract, specifics: [] });
    expect(r.success).toBe(true);
  });

  it('rejects a wrong shape (missing whatTheyDo)', () => {
    const { whatTheyDo, ...rest } = validExtract;
    const r = ProspectExtractSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it('rejects a wrong type (specifics as string)', () => {
    const r = ProspectExtractSchema.safeParse({ ...validExtract, specifics: 'not-an-array' });
    expect(r.success).toBe(false);
  });

  it('the mock fixture passes the schema', () => {
    expect(ProspectExtractSchema.safeParse(mockProspectExtract).success).toBe(true);
  });
});

describe('buildProspectExtractionPrompt', () => {
  const combined = '## PAGE: https://acme.example\nWe build warehouse robots for 3PLs.';
  const prompt = buildProspectExtractionPrompt(combined);

  it('embeds the combined page text', () => {
    expect(prompt).toContain(combined);
  });

  it('contains the no-invention / proof-truth instruction', () => {
    expect(prompt).toMatch(/Do NOT infer, guess, generalize, or invent/i);
    expect(prompt).toMatch(/literally appear/i);
  });

  it('asks for 2–6 specifics and JSON-only output', () => {
    expect(prompt).toMatch(/2–6/);
    expect(prompt).toMatch(/ONLY a JSON object/i);
  });
});

describe('summarizeProspect', () => {
  it('renders the extract form as a PROSPECT FACTS block', () => {
    const out = summarizeProspect(validExtract);
    expect(out).toContain('PROSPECT FACTS');
    expect(out).toContain('Acme Robotics');
    expect(out).toContain('Cart-X pick robot');
    expect(out).toMatch(/never invent prospect details/i);
  });

  it('omits empty extract fields rather than fabricating', () => {
    const out = summarizeProspect({ name: null, whatTheyDo: '', whoFor: '', specifics: [] });
    expect(out).not.toContain('Name:');
    expect(out).not.toContain('What they do:');
  });

  it('renders the raw-text form verbatim', () => {
    const out = summarizeProspect({ rawText: 'Their About page says they do X for Y.' });
    expect(out).toContain('PROSPECT-PROVIDED TEXT');
    expect(out).toContain('Their About page says they do X for Y.');
  });
});
