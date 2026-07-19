// Tests for the entry-mode classification schemas (scale-02 phase 3).
// Also guards the phase invariant: the pre-existing non-entry schemas are
// UNTOUCHED (shape spot-checks below).

import { describe, it, expect } from 'vitest';
import {
  EntrySignalsSchema,
  EntryUnderstandSchema,
  EntryScrapeSchema,
} from './entryClassify.schema';
import { UnderstandingResponseSchema } from './understand.schema';
import { ScrapeWebsiteSchema, ScrapeWebsiteExtendedSchema } from './scrapeWebsite.schema';
import { buildBriefDraft } from '@/modules/brief/classify';

// Agency-shaped one-liner signals (serve-path shape).
const validUnderstandFixture = {
  businessTypeGuess: 'agency',
  businessTypeConfidence: 0.9,
  category: 'Growth marketing',
  goalIntentGuess: 'book-call',
  tiebreaker: 'expertise',
  structureHint: 'single',
  designStyleHint: 'bold-performance',
  platformNeeds: 'none',
  summary: 'A growth marketing agency for SaaS companies.',
  businessName: 'Scale Growth Co',
  offerings: ['Paid social', 'Landing page CRO'],
  audiences: ['B2B SaaS founders'],
  categories: ['Growth marketing'],
  outcomes: ['3.2x average ROAS'],
  deliveryModel: 'remote',
  offer: 'Free growth audit',
  oneLiner: 'Growth marketing agency for SaaS companies',
  proofAvailable: ['testimonials'],
  socialProfiles: [{ platform: 'linkedin', url: 'https://linkedin.com/company/x' }],
  testimonials: ['They doubled our demos.'],
};

// Photographer-shaped (unknown type, tiebreaker rung) with nullable guesses.
const validUnknownFixture = {
  ...validUnderstandFixture,
  businessTypeGuess: 'photographer',
  businessTypeConfidence: 0.5,
  category: null,
  goalIntentGuess: null,
  tiebreaker: 'portfolio-is-proof',
  designStyleHint: null,
  deliveryModel: null,
};

// URL-path fixture: EXTENDED scrape base fields + entry signal fields.
const validScrapeFixture = {
  oneLiner: 'Growth marketing agency for SaaS companies',
  productName: 'Scale Growth Co',
  categories: ['Growth marketing'],
  audiences: ['B2B SaaS founders'],
  whatItDoes: 'Runs paid acquisition for SaaS companies.',
  features: ['Paid social', 'Landing page CRO', 'Growth strategy'],
  offer: 'Free growth audit',
  landingGoal: 'demo',
  testimonials: [
    { quote: 'They doubled our demos.', author_name: 'Ana', author_role: 'CMO' },
  ],
  facts: [{ fact: 'Founded in 2019', topic: 'company', confidence: 'high' }],
  excerpts: [{ text: 'We turn traffic into booked demos.', kind: 'value-prop' }],
  businessTypeGuess: 'agency',
  businessTypeConfidence: 0.9,
  category: 'Growth marketing',
  goalIntentGuess: 'book-call',
  tiebreaker: 'expertise',
  structureHint: 'single',
  designStyleHint: 'bold-performance',
  platformNeeds: 'none',
  summary: 'A growth marketing agency for SaaS companies.',
  offerings: ['Paid social', 'Landing page CRO'],
  outcomes: ['3.2x average ROAS'],
  deliveryModel: 'remote',
  proofAvailable: ['testimonials'],
  socialProfiles: [],
};

describe('EntryUnderstandSchema', () => {
  it('parses a valid agency-shaped fixture', () => {
    const parsed = EntryUnderstandSchema.parse(validUnderstandFixture);
    expect(parsed.businessTypeGuess).toBe('agency');
    expect(parsed.tiebreaker).toBe('expertise');
  });

  it('parses an unknown-type fixture with nullable guesses', () => {
    const parsed = EntryUnderstandSchema.parse(validUnknownFixture);
    expect(parsed.goalIntentGuess).toBeNull();
    expect(parsed.tiebreaker).toBe('portfolio-is-proof');
  });

  it('is the EntrySignals mirror (same schema object)', () => {
    expect(EntryUnderstandSchema).toBe(EntrySignalsSchema);
  });

  it('rejects a bad tiebreaker enum value', () => {
    expect(() =>
      EntryUnderstandSchema.parse({ ...validUnderstandFixture, tiebreaker: 'vibes' })
    ).toThrow();
  });

  it('rejects a bad goalIntentGuess enum value', () => {
    expect(() =>
      EntryUnderstandSchema.parse({ ...validUnderstandFixture, goalIntentGuess: 'buy-now' })
    ).toThrow();
  });

  it('ask-path: ambiguous agency fixture feeds buildBriefDraft as engine-undetermined (engineDecider R2)', () => {
    // agency flipped to AMBIGUOUS {candidateEngines:['trust','work'], prior:'trust'},
    // so the shared agency fixture now resolves to `ask` through the schema seam:
    // copyEngine unset, resolvedEngine null, engineStatus 'ambiguous'. This is the
    // new "feeds buildBriefDraft cleanly" — it exercises the null-engine invariant.
    const parsed = EntryUnderstandSchema.parse(validUnderstandFixture);
    const brief = buildBriefDraft(parsed, 'growth agency for SaaS');
    expect(brief.copyEngine).toBeUndefined();
    const entry = brief.facts?.entry as any;
    expect(entry.resolvedEngine).toBeNull();
    expect(entry.engineStatus).toBe('ambiguous');
  });

  it('committed-path: a still-committed trust type (consultant) resolves by lookup, not AI', () => {
    const parsed = EntryUnderstandSchema.parse({
      ...validUnderstandFixture,
      businessTypeGuess: 'consultant',
    });
    const brief = buildBriefDraft(parsed, 'B2B pricing consultant');
    expect(brief.copyEngine).toBe('trust'); // lookup, not AI
    expect((brief.facts?.entry as any).resolvedEngine).toBe('trust');
  });
});

describe('EntryScrapeSchema', () => {
  it('parses a valid fixture (base extended fields + signals)', () => {
    const parsed = EntryScrapeSchema.parse(validScrapeFixture);
    expect(parsed.testimonials[0].quote).toBe('They doubled our demos.'); // verbatim shape kept
    expect(parsed.facts).toHaveLength(1);
    expect(parsed.businessTypeGuess).toBe('agency');
  });

  it('rejects a bad platformNeeds enum value', () => {
    expect(() =>
      EntryScrapeSchema.parse({ ...validScrapeFixture, platformNeeds: 'pos-terminal' })
    ).toThrow();
  });

  it('rejects when a signal field is missing (nullable, not optional)', () => {
    const { businessTypeGuess, ...missing } = validScrapeFixture;
    expect(() => EntryScrapeSchema.parse(missing)).toThrow();
  });
});

describe('non-entry schemas untouched (phase invariant)', () => {
  it('UnderstandingResponseSchema keys unchanged', () => {
    expect(Object.keys(UnderstandingResponseSchema.shape).sort()).toEqual(
      ['audiences', 'categories', 'features', 'whatItDoes'].sort()
    );
  });

  it('ScrapeWebsiteExtendedSchema keys unchanged (no entry fields leaked in)', () => {
    const keys = Object.keys(ScrapeWebsiteExtendedSchema.shape);
    expect(keys.sort()).toEqual(
      [
        'oneLiner',
        'productName',
        'categories',
        'audiences',
        'whatItDoes',
        'features',
        'offer',
        'landingGoal',
        'testimonials',
        'facts',
        'excerpts',
      ].sort()
    );
    expect(keys).not.toContain('businessTypeGuess');
    expect(keys).not.toContain('tiebreaker');
  });

  it('EntryScrapeSchema extends (not mutates) the base', () => {
    expect(EntryScrapeSchema).not.toBe(ScrapeWebsiteExtendedSchema);
    // Base schema still rejects entry fields as unknown-shape additions only
    // via its own shape (spot-check: base parse of the plain shape works).
    const { facts, excerpts, ...plain } = validScrapeFixture;
    expect(() =>
      ScrapeWebsiteSchema.parse({
        oneLiner: plain.oneLiner,
        productName: plain.productName,
        categories: plain.categories,
        audiences: plain.audiences,
        whatItDoes: plain.whatItDoes,
        features: plain.features,
        offer: plain.offer,
        landingGoal: plain.landingGoal,
        testimonials: plain.testimonials,
      })
    ).not.toThrow();
  });
});
