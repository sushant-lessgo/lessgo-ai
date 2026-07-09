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
import type { EngineExtraction } from './index';

export const thingExtraction: EngineExtraction = {
  key: 'thing',
  understandSchema: UnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteExtendedSchema,
  // Base entry prefill already covers thing — no engine-specific delta.
  entryEnrichmentFields: {},
  entryEnrichmentPrompt: () => '',
  enrichSignals: (_data, base) => base,
};
