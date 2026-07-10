// src/lib/schemas/extraction/manufacturer.ts
// MANUFACTURER extraction schema (scale-06 phase 7).
//
// Manufacturer is a THING-engine business type that needs RICHER extraction
// than the base thing schema: the 4 trade-supplier keys (whatYouMake /
// industriesServed / productCategories / valueAdds). Pre-scale-06 this
// richness was reached by a per-template manufacturer branch — i.e. keyed on
// vestria/techpremium. That coupling DIES here: the richness is now reached by
// the businessType `extractionSchemaKey` ('manufacturer'), never by templateId.
//
// On the convergent ENTRY path these 4 keys are an enrichment DELTA appended
// to the neutral entry schema (base classification + prefill + facts/excerpts).
// `enrichSignals` folds them additively into the existing EntrySignals fields
// so brief prefill is strictly richer than the base — no EntrySignals shape
// change, no downstream (brief-module) edit needed.
//
// The standalone understand/scrape schemas mirror the legacy manufacturer path
// and are owned here for the registry.

import { z } from 'zod';
import { ManufacturerUnderstandingResponseSchema } from '../understand.schema';
import { ScrapeWebsiteManufacturerSchema } from '../scrapeWebsite.schema';
import type { EntrySignals } from '@/modules/brief/classify';
import { extractionCollections } from '@/modules/collections/registry';
import type { EngineExtraction } from './index';
import {
  collectionsEnrichmentFields,
  collectionsEnrichmentPrompt,
  foldCollectionsIntoSignals,
} from './index';

// scale-10 phase 2: manufacturer (a thing variant) ALSO extracts a `products`
// collection verbatim — layered on top of the 4 trade-supplier fields below.
// Keys sourced from the registry single-source (entry-capture phase 1).
const MANUFACTURER_COLLECTIONS = extractionCollections.manufacturer;

// Engine-specific entry-enrichment SCALAR fields (non-collection). Kept
// strict-json-schema friendly (no numeric min/max — ranges are prompt-enforced,
// like the entry base) so they can be `.extend()`-ed onto EntryScrape/
// EntryUnderstand for OpenAI structured outputs. These are the ONLY non-
// collection entry-enrichment fields any engine declares today; the entry-union
// builder (index.ts) merges them in via the `entryScalarFields` member.
const manufacturerEnrichmentFields = {
  whatYouMake: z.string(),
  industriesServed: z.array(z.string()),
  productCategories: z.array(z.string()),
  valueAdds: z.array(z.string()),
} as const;

// The trade-supplier scalar prompt block VERBATIM (no conditional framing). The
// explicit-businessType path (`entryEnrichmentPrompt` below) embeds this as-is,
// keeping that output BYTE-IDENTICAL to the pre-split version. The "only if this
// business makes/supplies physical goods; else empty" conditional wrapper is
// added by `entryUnionEnrichment()` in index.ts ONLY — never baked in here.
const manufacturerScalarPrompt = `MANUFACTURER / TRADE-SUPPLIER FIELDS (this business makes or supplies physical goods):
- whatYouMake: one clear sentence describing what this business manufactures or supplies (the physical goods, not the mission)
- industriesServed: 1-3 END-CUSTOMER verticals this business sells into (e.g., ["Hospitality", "Healthcare", "Security"]) — NEVER vague groups like "businesses" or "professionals"
- productCategories: 1-8 CONCRETE product types they make (e.g., ["Chef coats", "Scrubs", "Hi-vis jackets"]) — actual orderable products, NOT synonyms/restatements of the business
- valueAdds: 1-8 CONCRETE differentiators (e.g., ["Custom embroidery", "Low MOQ", "48h dispatch", "In-house dyeing"]) — NEVER quality-platitudes like "attention to detail" or "customer satisfaction"
- Extract only what is stated or strongly implied — do NOT invent.`;

function dedupe(items: (string | undefined | null)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const v = (raw ?? '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export const manufacturerExtraction: EngineExtraction = {
  key: 'manufacturer',
  understandSchema: ManufacturerUnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteManufacturerSchema,
  // Non-collection scalar entry-enrichment fields (consumed by the entry union).
  entryScalarFields: manufacturerEnrichmentFields,
  entryScalarPrompt: () => manufacturerScalarPrompt,
  // Trade-supplier fields + the scale-10 `products` collection delta.
  entryEnrichmentFields: {
    ...manufacturerEnrichmentFields,
    ...collectionsEnrichmentFields(MANUFACTURER_COLLECTIONS),
  },
  // Byte-identical to the pre-split explicit path: scalar block VERBATIM, then a
  // blank line, then the collections block. Do NOT reorder or reframe here.
  entryEnrichmentPrompt: () =>
    `${manufacturerScalarPrompt}\n\n${collectionsEnrichmentPrompt(MANUFACTURER_COLLECTIONS)}`,
  // Additive fold: manufacturer specifics enrich the neutral prefill, never
  // overwrite it. Existing base values are preserved and lead the merged lists.
  // Then the `products` collection is folded onto EntrySignals.collections.
  enrichSignals: (data: Record<string, unknown>, base: EntrySignals): EntrySignals => {
    const productCategories = asStringArray(data.productCategories);
    const valueAdds = asStringArray(data.valueAdds);
    const industriesServed = asStringArray(data.industriesServed);
    const whatYouMake = typeof data.whatYouMake === 'string' ? data.whatYouMake : '';
    const enriched: EntrySignals = {
      ...base,
      summary: base.summary || whatYouMake,
      offerings: dedupe([...base.offerings, ...productCategories, ...valueAdds]),
      audiences: dedupe([...base.audiences, ...industriesServed]),
    };
    return foldCollectionsIntoSignals(data, enriched, MANUFACTURER_COLLECTIONS);
  },
};
