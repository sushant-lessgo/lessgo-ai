// src/lib/schemas/extraction/work.ts
// WORK-engine extraction schema (scale-06 phase 7).
//
// WORK is the writer / portfolio self-serve engine. The self-serve generation
// path lands in phase 9 (writerFlownTemplate track); until then the work
// extraction reuses the neutral base — the convergent entry prefill
// (summary/offerings/audiences) is enough for the thin bio+work framing. No
// enrichment delta on the entry path yet; phase 9 adds work-specific fields
// (notable-works framing) alongside the work generation adapter.
//
// CARRY-FORWARD (scale-06 phase 1/6b): the work WHY-YOU field (`bioStory`,
// askCandidate 'differentiator') is an always-ASK guided-chips field — never
// extracted here.

import { UnderstandingResponseSchema } from '../understand.schema';
import { ScrapeWebsiteExtendedSchema } from '../scrapeWebsite.schema';
import { extractionCollections } from '@/modules/collections/registry';
import type { EngineExtraction } from './index';
import {
  collectionsEnrichmentFields,
  collectionsEnrichmentPrompt,
  foldCollectionsIntoSignals,
} from './index';

// scale-10 phase 2: the work engine covers portfolios AND writers. Per founder
// decision 1 a photographer's portfolio genres ARE `services` (proof = images);
// writers' books are `works` (books ≠ services). The engine extracts both keys
// verbatim — whichever the site actually lists fills; the other stays empty and
// is dropped. Base prefill still covers every classification/prefill field.
// Keys sourced from the registry single-source (entry-capture phase 1).
const WORK_COLLECTIONS = extractionCollections.work;

export const workExtraction: EngineExtraction = {
  key: 'work',
  understandSchema: UnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteExtendedSchema,
  entryEnrichmentFields: collectionsEnrichmentFields(WORK_COLLECTIONS),
  entryEnrichmentPrompt: () => collectionsEnrichmentPrompt(WORK_COLLECTIONS),
  enrichSignals: (data, base) => foldCollectionsIntoSignals(data, base, WORK_COLLECTIONS),
};
