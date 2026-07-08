// src/lib/schemas/extraction/trust.ts
// TRUST-engine extraction schema (scale-06 phase 7).
//
// TRUST covers agencies / consultants / coaches. The convergent entry prefill
// already carries everything the trust engine reads: whatYouDo←summary,
// services←offerings, targetClients←audiences, outcomes←outcomes,
// deliveryModel←deliveryModel. So trust, like thing, adds NO enrichment delta
// on the entry path. The standalone schemas below mirror the legacy service
// path and are owned here for the registry.
//
// CARRY-FORWARD (scale-06 phase 1/6b): the trust WHY-YOU field (`process`,
// askCandidate 'differentiator') is an always-ASK guided-chips field — never
// extracted here.

import {
  ServiceUnderstandingResponseSchema,
} from '../understandService.schema';
import { ScrapeWebsiteServiceSchema } from '../scrapeWebsiteService.schema';
import type { EngineExtraction } from './index';

export const trustExtraction: EngineExtraction = {
  key: 'trust',
  understandSchema: ServiceUnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteServiceSchema,
  // Base entry prefill already covers trust — no engine-specific delta.
  entryEnrichmentFields: {},
  entryEnrichmentPrompt: () => '',
  enrichSignals: (_data, base) => base,
};
