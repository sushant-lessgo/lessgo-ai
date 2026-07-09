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
import type { EngineExtraction } from './index';

export const workExtraction: EngineExtraction = {
  key: 'work',
  understandSchema: UnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteExtendedSchema,
  // Base entry prefill suffices for the thin work path (phase 9 extends this).
  entryEnrichmentFields: {},
  entryEnrichmentPrompt: () => '',
  enrichSignals: (_data, base) => base,
};
