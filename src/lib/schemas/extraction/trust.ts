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
import type { CollectionKey } from '@/modules/collections/registry';
import type { EngineExtraction } from './index';
import {
  collectionsEnrichmentFields,
  collectionsEnrichmentPrompt,
  foldCollectionsIntoSignals,
} from './index';

// scale-10 phase 2: the trust engine (agencies / consultants / coaches) extracts
// two collections verbatim — `services` (service lines) and `case-studies`
// (owner-authored client stories, decision 4). Base prefill still covers every
// classification/prefill field — collections are the only delta.
const TRUST_COLLECTIONS: readonly CollectionKey[] = ['services', 'case-studies'];

export const trustExtraction: EngineExtraction = {
  key: 'trust',
  understandSchema: ServiceUnderstandingResponseSchema,
  scrapeSchema: ScrapeWebsiteServiceSchema,
  entryEnrichmentFields: collectionsEnrichmentFields(TRUST_COLLECTIONS),
  entryEnrichmentPrompt: () => collectionsEnrichmentPrompt(TRUST_COLLECTIONS),
  enrichSignals: (data, base) => foldCollectionsIntoSignals(data, base, TRUST_COLLECTIONS),
};
