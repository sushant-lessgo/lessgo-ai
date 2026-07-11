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
  entryUnionEnrichment,
  entryExtractionForSignals,
} from './index';
import { businessTypes, businessTypeKeys } from '@/modules/businessTypes/config';
import { allEntryCollectionKeys } from '@/modules/collections/registry';
import { EntryScrapeSchema } from '../entryClassify.schema';
import type { EntrySignals } from '@/modules/brief/classify';

// Exact trade-supplier scalar block — mirrors manufacturer.ts. A byte-drift into
// the EXPLICIT businessType prompt path fails the assertion below (stronger than
// the existing `.toContain('TRADE-SUPPLIER')` substring check).
const EXPECTED_MANUFACTURER_SCALAR = `MANUFACTURER / TRADE-SUPPLIER FIELDS (this business makes or supplies physical goods):
- whatYouMake: one clear sentence describing what this business manufactures or supplies (the physical goods, not the mission)
- industriesServed: 1-3 END-CUSTOMER verticals this business sells into (e.g., ["Hospitality", "Healthcare", "Security"]) — NEVER vague groups like "businesses" or "professionals"
- productCategories: 1-8 CONCRETE product types they make (e.g., ["Chef coats", "Scrubs", "Hi-vis jackets"]) — actual orderable products, NOT synonyms/restatements of the business
- valueAdds: 1-8 CONCRETE differentiators (e.g., ["Custom embroidery", "Low MOQ", "48h dispatch", "In-house dyeing"]) — NEVER quality-platitudes like "attention to detail" or "customer satisfaction"
- Extract only what is stated or strongly implied — do NOT invent.`;

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

describe('entry UNION enrichment (entry-capture phase 1)', () => {
  it('allEntryCollectionKeys is the 4 distinct keys, no duplicate services', () => {
    expect([...allEntryCollectionKeys].sort()).toEqual(
      ['case-studies', 'products', 'services', 'works'].sort()
    );
    expect(allEntryCollectionKeys).toHaveLength(4);
  });

  it('union fields = the 4 distinct collection keys + manufacturer scalars', () => {
    const { fields } = entryUnionEnrichment();
    expect(Object.keys(fields).sort()).toEqual(
      ['collections', 'industriesServed', 'productCategories', 'valueAdds', 'whatYouMake'].sort()
    );
    const collShape = (fields['collections'] as { shape: Record<string, unknown> }).shape;
    expect(Object.keys(collShape).sort()).toEqual(
      ['case-studies', 'products', 'services', 'works'].sort()
    );
    // `services` (shared by trust+work) appears exactly once — deduped.
    expect(Object.keys(collShape).filter((k) => k === 'services')).toHaveLength(1);
  });

  it('scalar-key collision guard: non-collections union keys are unique across engines', () => {
    const seen = new Map<string, string>();
    for (const key of extractionSchemaKeys) {
      const sf = getExtraction(key).entryScalarFields;
      if (!sf) continue;
      for (const k of Object.keys(sf)) {
        // Fails loudly if a future engine declares a colliding scalar key.
        expect(seen.has(k)).toBe(false);
        seen.set(k, key);
      }
    }
  });

  it('union prompt frames scalar fields conditionally + carries the collections block', () => {
    const { prompt } = entryUnionEnrichment();
    expect(prompt).toContain('apply ONLY if this business makes or supplies physical goods');
    expect(prompt).toContain('TRADE-SUPPLIER');
    expect(prompt).toContain('COLLECTION ENTRIES');
  });

  it('EntryScrapeSchema.extend(union.fields) parses a fully-populated fixture', () => {
    const { fields } = entryUnionEnrichment();
    const schema = EntryScrapeSchema.extend(fields).pick({
      whatYouMake: true,
      industriesServed: true,
      productCategories: true,
      valueAdds: true,
      collections: true,
    });
    const parsed = schema.parse({
      whatYouMake: 'We make brass hardware',
      industriesServed: ['Furniture'],
      productCategories: ['Handles'],
      valueAdds: ['Low MOQ'],
      collections: {
        products: [{ name: 'Handle A', oneLiner: 'brass', imageUrl: '' }],
        services: [{ name: 'Custom finishing', oneLiner: '', imageUrl: '' }],
        'case-studies': [{ name: 'Acme fit-out', oneLiner: '', imageUrl: '' }],
        works: [{ name: 'Portfolio 1', oneLiner: '', imageUrl: '' }],
      },
    });
    expect((parsed.collections as { products: unknown[] }).products).toHaveLength(1);
    expect(parsed.productCategories).toEqual(['Handles']);
  });
});

describe('entryExtractionForSignals resolver (entry-capture phase 1)', () => {
  it('known businessType routes through extractionForBusinessType (manufacturer keeps scalars)', () => {
    const ex = entryExtractionForSignals({ businessTypeGuess: 'manufacturer', tiebreaker: 'none' });
    expect(ex?.key).toBe('manufacturer');
    expect(ex?.entryScalarFields).toBeDefined();
    expect(entryExtractionForSignals({ businessTypeGuess: 'saas', tiebreaker: 'none' })?.key).toBe(
      'thing'
    );
    expect(entryExtractionForSignals({ businessTypeGuess: 'agency', tiebreaker: 'none' })?.key).toBe(
      'trust'
    );
  });

  it('unknown guess falls to the tiebreaker engine family', () => {
    expect(
      entryExtractionForSignals({ businessTypeGuess: 'restaurant', tiebreaker: 'expertise' })?.key
    ).toBe('trust');
    expect(
      entryExtractionForSignals({ businessTypeGuess: null, tiebreaker: 'portfolio-is-proof' })?.key
    ).toBe('work');
    expect(entryExtractionForSignals({ businessTypeGuess: null, tiebreaker: 'none' })?.key).toBe(
      'thing'
    );
  });

  it('browsing-place / offer-already-understood rungs fold nothing (null)', () => {
    expect(
      entryExtractionForSignals({ businessTypeGuess: null, tiebreaker: 'browsing-place' })
    ).toBeNull();
    expect(
      entryExtractionForSignals({
        businessTypeGuess: 'venue',
        tiebreaker: 'offer-already-understood',
      })
    ).toBeNull();
  });
});

describe('explicit-path manufacturer prompt stays byte-identical (no conditional framing)', () => {
  it('begins with the exact trade-supplier block; no union framing leaked in', () => {
    const p = getExtraction('manufacturer').entryEnrichmentPrompt();
    expect(p.startsWith(EXPECTED_MANUFACTURER_SCALAR + '\n\n')).toBe(true);
    expect(p).not.toContain('apply ONLY if this business');
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
