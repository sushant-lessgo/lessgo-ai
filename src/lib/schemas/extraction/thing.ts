// src/lib/schemas/extraction/thing.ts
// THING-engine extraction schema (scale-06 phase 7).
//
// The convergent entry pipeline (EntryUnderstand/EntryScrape) already covers
// every field the THING engine needs (categories/audiences/whatItDoes maps
// from summary/offerings; features from offerings) via the neutral prefill —
// so thing adds NO enrichment delta on the entry path. The standalone
// understand/scrape schemas below are the same ones the legacy product path
// uses today; the registry re-exports them so a single place owns "which
// schema does the thing engine use".
//
// CARRY-FORWARD (scale-06 phase 1/6b): `differentiator` is an always-ASK
// guided-chips field — it is NEVER an extraction field here, on purpose.

import { UnderstandingResponseSchema } from '../understand.schema';
import { ScrapeWebsiteExtendedSchema } from '../scrapeWebsite.schema';
import type { CollectionKey } from '@/modules/collections/registry';
import type { EngineExtraction } from './index';
import {
  collectionsEnrichmentFields,
  collectionsEnrichmentPrompt,
  foldCollectionsIntoSignals,
} from './index';

// scale-10 phase 2: the thing engine (SaaS / generic product) extracts a
// `products` collection verbatim in the existing scrape call. Base prefill still
// covers every classification/prefill field — collections are the only delta.
const THING_COLLECTIONS: readonly CollectionKey[] = ['products'];

export const thingExtraction: EngineExtraction = {
  key: 'thing',
  understandSchema: UnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteExtendedSchema,
  entryEnrichmentFields: collectionsEnrichmentFields(THING_COLLECTIONS),
  entryEnrichmentPrompt: () => collectionsEnrichmentPrompt(THING_COLLECTIONS),
  enrichSignals: (data, base) => foldCollectionsIntoSignals(data, base, THING_COLLECTIONS),
};
