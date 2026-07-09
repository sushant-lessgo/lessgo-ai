// src/lib/schemas/extraction/extraction.test.ts
// scale-06 phase 7 — extraction registry: businessType-keyed schema selection,
// manufacturer enrichment fold, differentiator-stays-ASK guard.

import { describe, it, expect } from 'vitest';
import {
  extractionRegistry,
  extractionSchemaKeys,
  getExtraction,
  extractionForBusinessType,
  hasEntryEnrichment,
  isExtractionSchemaKey,
} from './index';
import { businessTypes, businessTypeKeys } from '@/modules/businessTypes/config';
import { EntryScrapeSchema } from '../entryClassify.schema';
import type { EntrySignals } from '@/modules/brief/classify';

const baseSignals: EntrySignals = {
  businessTypeGuess: 'manufacturer',
  businessTypeConfidence: 0.9,
  category: 'Workwear',
  goalIntentGuess: 'enquiry',
  tiebreaker: 'none',
  structureHint: 'single',
  designStyleHint: null,
  platformNeeds: 'none',
  summary: '',
  businessName: 'Golden Shadow',
  offerings: ['Custom uniforms'],
  audiences: ['Hotels'],
  categories: ['Workwear'],
  outcomes: [],
  deliveryModel: null,
  offer: 'Request a quote',
  oneLiner: 'Custom workwear manufacturer',
  proofAvailable: [],
  socialProfiles: [],
  testimonials: [],
};

describe('extraction registry', () => {
  it('has an entry for every registry key, key field matches', () => {
    for (const key of extractionSchemaKeys) {
      expect(extractionRegistry[key]).toBeDefined();
      expect(getExtraction(key).key).toBe(key);
    }
  });

  it('isExtractionSchemaKey narrows only real keys', () => {
    expect(isExtractionSchemaKey('thing')).toBe(true);
    expect(isExtractionSchemaKey('manufacturer')).toBe(true);
    expect(isExtractionSchemaKey('saas-v0')).toBe(false);
    expect(isExtractionSchemaKey('nope')).toBe(false);
  });
});

describe('businessType → extraction schema key mapping', () => {
  it('every businessType.extractionSchemaKey is a valid registry key', () => {
    for (const bt of businessTypeKeys) {
      expect(isExtractionSchemaKey(businessTypes[bt].extractionSchemaKey)).toBe(true);
    }
  });

  it('maps engines by businessType (saas→thing, agency/consultant/coach→trust, writer→work, manufacturer→manufacturer)', () => {
    expect(extractionForBusinessType('saas').key).toBe('thing');
    expect(extractionForBusinessType('agency').key).toBe('trust');
    expect(extractionForBusinessType('consultant').key).toBe('trust');
    expect(extractionForBusinessType('coach').key).toBe('trust');
    expect(extractionForBusinessType('writer').key).toBe('work');
    expect(extractionForBusinessType('manufacturer').key).toBe('manufacturer');
  });

  it('extractionSchemaKey aligns with the businessType copyEngine (manufacturer is a thing variant)', () => {
    for (const bt of businessTypeKeys) {
      const ex = extractionForBusinessType(bt);
      const engine = businessTypes[bt].copyEngine;
      const expected = bt === 'manufacturer' ? 'manufacturer' : engine;
      expect(ex.key).toBe(expected);
    }
  });
});

describe('entry enrichment', () => {
  it('thing/trust/work carry NO entry enrichment (base prefill suffices)', () => {
    for (const key of ['thing', 'trust', 'work'] as const) {
      expect(hasEntryEnrichment(getExtraction(key))).toBe(false);
      expect(getExtraction(key).entryEnrichmentPrompt()).toBe('');
    }
  });

  it('manufacturer carries the 4 trade-supplier enrichment fields', () => {
    const ex = getExtraction('manufacturer');
    expect(hasEntryEnrichment(ex)).toBe(true);
    expect(Object.keys(ex.entryEnrichmentFields).sort()).toEqual(
      ['industriesServed', 'productCategories', 'valueAdds', 'whatYouMake'].sort()
    );
    expect(ex.entryEnrichmentPrompt().length).toBeGreaterThan(0);
  });

  it('manufacturer entry schema extends the entry base and parses the delta', () => {
    const ex = getExtraction('manufacturer');
    const schema = EntryScrapeSchema.extend(ex.entryEnrichmentFields);
    // Only assert the enrichment keys are accepted (base parsing is covered by
    // entryClassify.schema.test.ts); pick() keeps this focused.
    const enrichmentOnly = schema.pick({
      whatYouMake: true,
      industriesServed: true,
      productCategories: true,
      valueAdds: true,
    });
    const parsed = enrichmentOnly.parse({
      whatYouMake: 'We make chef coats',
      industriesServed: ['Hospitality'],
      productCategories: ['Chef coats', 'Scrubs'],
      valueAdds: ['Low MOQ'],
    });
    expect(parsed.productCategories).toEqual(['Chef coats', 'Scrubs']);
  });
});

describe('enrichSignals', () => {
  it('thing/trust/work fold is identity', () => {
    for (const key of ['thing', 'trust', 'work'] as const) {
      const out = getExtraction(key).enrichSignals({}, baseSignals);
      expect(out).toBe(baseSignals);
    }
  });

  it('manufacturer folds specifics additively, base values lead, dedup', () => {
    const out = getExtraction('manufacturer').enrichSignals(
      {
        whatYouMake: 'We manufacture custom uniforms',
        industriesServed: ['Hotels', 'Healthcare'], // "Hotels" dups base audience
        productCategories: ['Chef coats', 'Custom uniforms'], // dups base offering
        valueAdds: ['Low MOQ'],
      },
      baseSignals
    );
    // offerings: base first, then new categories/valueAdds, deduped
    expect(out.offerings).toEqual(['Custom uniforms', 'Chef coats', 'Low MOQ']);
    // audiences: base first, then new industries, deduped
    expect(out.audiences).toEqual(['Hotels', 'Healthcare']);
    // summary was empty → filled from whatYouMake
    expect(out.summary).toBe('We manufacture custom uniforms');
    // untouched fields preserved
    expect(out.oneLiner).toBe(baseSignals.oneLiner);
    expect(out.offer).toBe(baseSignals.offer);
  });

  it('manufacturer fold keeps a non-empty base summary (never overwrites)', () => {
    const out = getExtraction('manufacturer').enrichSignals(
      { whatYouMake: 'overwrite attempt' },
      { ...baseSignals, summary: 'existing summary' }
    );
    expect(out.summary).toBe('existing summary');
  });
});

describe('differentiator stays an ASK (never extracted)', () => {
  it('no extraction schema or enrichment exposes a differentiator field', () => {
    for (const key of extractionSchemaKeys) {
      const ex = getExtraction(key);
      expect(Object.keys(ex.entryEnrichmentFields)).not.toContain('differentiator');
      // Standalone schemas: differentiator is not a key either.
      for (const schema of [ex.understandSchema, ex.scrapeSchema]) {
        const shape = (schema as { shape?: Record<string, unknown> }).shape ?? {};
        expect(Object.keys(shape)).not.toContain('differentiator');
      }
    }
  });
});
