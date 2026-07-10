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
  it('every engine now carries the scale-10 collections enrichment (prompt + field)', () => {
    for (const key of extractionSchemaKeys) {
      const ex = getExtraction(key);
      expect(hasEntryEnrichment(ex)).toBe(true);
      expect(Object.keys(ex.entryEnrichmentFields)).toContain('collections');
      expect(ex.entryEnrichmentPrompt()).toContain('COLLECTION ENTRIES');
    }
  });

  it('manufacturer carries the 4 trade-supplier fields PLUS collections', () => {
    const ex = getExtraction('manufacturer');
    expect(hasEntryEnrichment(ex)).toBe(true);
    expect(Object.keys(ex.entryEnrichmentFields).sort()).toEqual(
      ['collections', 'industriesServed', 'productCategories', 'valueAdds', 'whatYouMake'].sort()
    );
    // trade-supplier prompt survives alongside the collections block
    expect(ex.entryEnrichmentPrompt()).toContain('TRADE-SUPPLIER');
    expect(ex.entryEnrichmentPrompt()).toContain('COLLECTION ENTRIES');
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

describe('collection extraction (scale-10 phase 2)', () => {
  // Which engine extracts which collection key(s).
  const expectedKeys: Record<string, string[]> = {
    thing: ['products'],
    manufacturer: ['products'],
    trust: ['services', 'case-studies'],
    work: ['services', 'works'],
  };

  it('each engine declares its collections shape with the right keys', () => {
    for (const key of extractionSchemaKeys) {
      const ex = getExtraction(key);
      const collectionsField = ex.entryEnrichmentFields['collections'] as {
        shape: Record<string, unknown>;
      };
      expect(Object.keys(collectionsField.shape).sort()).toEqual(expectedKeys[key].sort());
    }
  });

  it('entry schema parses a fixture WITH collection entries (thing → products)', () => {
    const ex = getExtraction('thing');
    const schema = EntryScrapeSchema.extend(ex.entryEnrichmentFields).pick({ collections: true });
    const parsed = schema.parse({
      collections: {
        products: [
          { name: 'Widget A', oneLiner: 'A great widget', imageUrl: 'https://x/a.png' },
          { name: 'Widget B', oneLiner: 'Another widget', imageUrl: '' },
        ],
      },
    });
    expect((parsed.collections as { products: unknown[] }).products).toHaveLength(2);
  });

  it('entry schema parses a fixture WITHOUT collection entries (empty arrays)', () => {
    const ex = getExtraction('trust');
    const schema = EntryScrapeSchema.extend(ex.entryEnrichmentFields).pick({ collections: true });
    const parsed = schema.parse({ collections: { services: [], 'case-studies': [] } });
    expect((parsed.collections as { services: unknown[] }).services).toHaveLength(0);
  });

  it('enrichSignals folds extracted entries onto EntrySignals.collections (verbatim, empty names dropped)', () => {
    const out = getExtraction('thing').enrichSignals(
      {
        collections: {
          products: [
            { name: 'Widget A', oneLiner: 'A great widget', imageUrl: 'https://x/a.png' },
            { name: '  ', oneLiner: 'no name', imageUrl: '' }, // dropped
          ],
        },
      },
      baseSignals
    );
    const products = out.collections?.products ?? [];
    expect(products).toHaveLength(1);
    expect(products[0]).toEqual({
      name: 'Widget A',
      oneLiner: 'A great widget',
      imageUrl: 'https://x/a.png',
    });
    // no slug on the draft carrier — slugs are derived later in buildBriefDraft
    expect('slug' in products[0]).toBe(false);
  });

  it('enrichSignals returns base unchanged when the engine sees no collections', () => {
    const out = getExtraction('work').enrichSignals({}, baseSignals);
    expect(out).toBe(baseSignals);
  });

  it('trust folds services and case-studies independently', () => {
    const out = getExtraction('trust').enrichSignals(
      {
        collections: {
          services: [{ name: 'SEO Audit', oneLiner: '', imageUrl: '' }],
          'case-studies': [{ name: 'Acme turnaround', oneLiner: '3x pipeline', imageUrl: '' }],
        },
      },
      baseSignals
    );
    expect(out.collections?.services).toHaveLength(1);
    expect(out.collections?.['case-studies']).toHaveLength(1);
    expect(out.collections?.['case-studies']?.[0].oneLiner).toBe('3x pipeline');
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
