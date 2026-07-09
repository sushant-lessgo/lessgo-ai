// src/lib/schemas/extraction/index.ts
// Extraction-schema registry, keyed by a businessType's `extractionSchemaKey`
// (scale-06 phase 7). ONE place owns "which structured-output schema does this
// engine / businessType extract with" — replacing the pre-scale-06 scatter of
// `audienceType` + per-template manufacturer branches in the v2 routes.
//
// Keys are ENGINE families (thing/trust/work) plus the `manufacturer` variant
// (a thing business type that needs 4 extra trade-supplier fields — the ONLY
// key that carries an enrichment delta today). businessTypes.config maps each
// businessType key → one of these registry keys via `extractionSchemaKey`.
//
// Firewall: pure zod + type modules only; no template/registry/renderer
// imports. Consumed server-side by /api/v2/{understand,scrape-website}.

import type { z } from 'zod';
import type { EntrySignals } from '@/modules/brief/classify';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { thingExtraction } from './thing';
import { trustExtraction } from './trust';
import { workExtraction } from './work';
import { manufacturerExtraction } from './manufacturer';

/** The registry keys — the real values that replace the `<key>-v0` placeholders. */
export const extractionSchemaKeys = ['thing', 'trust', 'work', 'manufacturer'] as const;
export type ExtractionSchemaKey = (typeof extractionSchemaKeys)[number];

export interface EngineExtraction {
  key: ExtractionSchemaKey;
  /** Standalone one-liner (understand) extraction schema for this engine. */
  understandSchema: z.ZodTypeAny;
  /** Standalone URL (scrape) extraction schema for this engine. */
  scrapeSchema: z.ZodTypeAny;
  /**
   * Engine-specific fields to `.extend()` onto the convergent ENTRY base
   * (EntryUnderstand/EntryScrape). Empty `{}` when the neutral prefill already
   * covers the engine (thing/trust/work today).
   */
  entryEnrichmentFields: z.ZodRawShape;
  /** Prompt block describing the enrichment fields; '' when there are none. */
  entryEnrichmentPrompt: () => string;
  /**
   * Fold enrichment-field values into EntrySignals additively (base values
   * lead, never overwritten). Identity for engines with no enrichment.
   */
  enrichSignals: (data: Record<string, unknown>, base: EntrySignals) => EntrySignals;
}

export const extractionRegistry: Record<ExtractionSchemaKey, EngineExtraction> = {
  thing: thingExtraction,
  trust: trustExtraction,
  work: workExtraction,
  manufacturer: manufacturerExtraction,
};

export function isExtractionSchemaKey(v: string): v is ExtractionSchemaKey {
  return (extractionSchemaKeys as readonly string[]).includes(v);
}

/** Look up an engine's extraction by its registry key. */
export function getExtraction(key: ExtractionSchemaKey): EngineExtraction {
  return extractionRegistry[key];
}

/**
 * Resolve the extraction for a businessType via its `extractionSchemaKey`.
 * This is how the convergent wizard/entry path selects a schema — by
 * businessType, NOT by templateId.
 */
export function extractionForBusinessType(bt: BusinessTypeKey): EngineExtraction {
  const key = businessTypes[bt].extractionSchemaKey;
  if (!isExtractionSchemaKey(key)) {
    throw new Error(
      `businessTypes.${bt}.extractionSchemaKey="${key}" is not a registry key (${extractionSchemaKeys.join('|')})`
    );
  }
  return getExtraction(key);
}

/** True when the engine adds engine-specific fields to the entry base. */
export function hasEntryEnrichment(e: EngineExtraction): boolean {
  return Object.keys(e.entryEnrichmentFields).length > 0;
}
