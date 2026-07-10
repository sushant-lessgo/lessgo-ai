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

import { z } from 'zod';
import type { EntrySignals, CollectionEntryDraft } from '@/modules/brief/classify';
import { resolveEngine } from '@/modules/brief/classify';
import type { CollectionKey } from '@/modules/collections/registry';
import { getCollectionDef, allEntryCollectionKeys } from '@/modules/collections/registry';
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
   * Non-collection scalar enrichment fields (manufacturer's 4 trade-supplier
   * keys today; no other engine declares any). Split out from
   * `entryEnrichmentFields` so the entry UNION builder can merge scalar folds
   * across engines separately from the shared `collections` object. Absent when
   * the engine has no scalar enrichment (thing/trust/work).
   */
  entryScalarFields?: z.ZodRawShape;
  /**
   * Prompt block for `entryScalarFields`, VERBATIM (no conditional framing). The
   * entry-union builder wraps it with a "only if applicable; else empty"
   * conditional; the explicit-businessType path embeds it as-is. Absent when the
   * engine has no scalar enrichment.
   */
  entryScalarPrompt?: () => string;
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

// ===== Collection-entry extraction (scale-10 phase 2) =====
// Founder decision 2: the EXISTING single scrape call also extracts collection
// entries VERBATIM (names + one-liners only; imageUrl string iff the same crawl
// saw one). No extra scrape, no image processing here. The extracted entries
// ride an EngineExtraction's `entryEnrichmentFields`/`entryEnrichmentPrompt`/
// `enrichSignals` hooks (same wiring the routes already call — no route edit),
// fold onto `EntrySignals.collections`, and are written to `facts.collections`
// with CODE-DERIVED slugs by buildBriefDraft. Slugs are NEVER taken from AI.
//
// Which engine extracts which collection key(s) — the family lives in the
// collections registry (products · services · case-studies · works):
//   thing/manufacturer → products · trust → services + case-studies ·
//   work → services (photographer portfolio = services, decision 1) + works.
//
// NOTE: these helpers are exported FUNCTION DECLARATIONS (hoisted, so the
// engine modules can call them during the index⇄engine cyclic import) and build
// their zod shapes inline (no module-level const — a const would sit in the TDZ
// during that cycle). Strict-json-schema friendly: no min/max/regex; counts and
// the verbatim/no-invention rule are prompt-enforced.

/**
 * `entryEnrichmentFields` delta carrying one array per collection key:
 * `{ collections: { <key>: [{ name, oneLiner, imageUrl }] } }`. Required-shape
 * (OpenAI strict outputs); empty strings/arrays stand in for "none".
 */
export function collectionsEnrichmentFields(keys: readonly CollectionKey[]): z.ZodRawShape {
  const entry = z.object({
    name: z.string(),
    oneLiner: z.string(),
    imageUrl: z.string(),
  });
  const shape: z.ZodRawShape = {};
  for (const key of keys) shape[key] = z.array(entry);
  return { collections: z.object(shape) };
}

/** Prompt block instructing verbatim collection extraction for the given keys. */
export function collectionsEnrichmentPrompt(keys: readonly CollectionKey[]): string {
  const lines = keys.map((key) => {
    const label = getCollectionDef(key)?.label ?? key;
    return `- collections.${key}: the ${label} this business lists on the crawled pages. Return an array of { name, oneLiner, imageUrl }. Copy each item's name and one-line description WORD-FOR-WORD from the site — do NOT invent, merge, rename, or add items that are not actually listed. name = the item's exact name; oneLiner = its short description ("" if none is shown); imageUrl = the absolute image URL IF one clearly appears for that item on a page you saw, else "". Return an empty array when the site lists none.`;
  });
  return `COLLECTION ENTRIES (repeatable items — extract ONLY what the crawled pages actually list, verbatim):\n${lines.join('\n')}`;
}

/**
 * Fold extracted collection entries onto `EntrySignals.collections` additively
 * (existing carrier keys preserved). Tolerates missing/malformed data. Empty
 * names and empty per-key lists are dropped; returns `base` unchanged (same ref)
 * when nothing folds in. Slug derivation happens later in buildBriefDraft.
 */
export function foldCollectionsIntoSignals(
  data: Record<string, unknown>,
  base: EntrySignals,
  keys: readonly CollectionKey[]
): EntrySignals {
  const raw = data['collections'];
  if (!raw || typeof raw !== 'object') return base;
  const folded: Partial<Record<CollectionKey, CollectionEntryDraft[]>> = {};
  let any = false;
  for (const key of keys) {
    const list = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(list)) continue;
    const entries: CollectionEntryDraft[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      const name = typeof r['name'] === 'string' ? r['name'].trim() : '';
      if (!name) continue;
      const e: CollectionEntryDraft = { name };
      if (typeof r['oneLiner'] === 'string' && r['oneLiner'].trim()) e.oneLiner = r['oneLiner'];
      if (typeof r['imageUrl'] === 'string' && r['imageUrl'].trim()) e.imageUrl = r['imageUrl'];
      entries.push(e);
    }
    if (entries.length > 0) {
      folded[key] = entries;
      any = true;
    }
  }
  if (!any) return base;
  return { ...base, collections: { ...base.collections, ...folded } };
}

// ===== Entry UNION enrichment + post-call resolver (entry-capture phase 1) =====
// F19: on a REAL entry the single AI call both CLASSIFIES and EXTRACTS, so no
// businessType is known when the schema/prompt is built. To capture collections
// on that call we extend the entry schema/prompt with the UNION of every
// engine's enrichment declarations (built MECHANICALLY from the registry — never
// hand-listed, D9), then AFTER the call resolve the guessed engine in-code and
// fold ONLY its fields (foreign keys drop naturally in foldCollectionsIntoSignals
// / the engine's enrichSignals). The explicit-businessType path is untouched.
//
// TDZ/cycle note (see index:100-104): these are hoisted FUNCTION DECLARATIONS
// that read `extractionRegistry` / `allEntryCollectionKeys` LAZILY at call time.
// They must NEVER be module-level consts — a const would sit in the TDZ during
// the index⇄engine cyclic import.

/**
 * The UNION entry-enrichment delta for the no-businessType (real entry) path:
 *   fields = every engine's `entryScalarFields` merged + the shared
 *            `collections` object over ALL distinct entry collection keys;
 *   prompt = each engine's `entryScalarPrompt` (conditionally framed —
 *            "only if applicable; else empty") + the union collections block.
 * Built from the registry so a new engine's declarations flow in automatically.
 */
export function entryUnionEnrichment(): { fields: z.ZodRawShape; prompt: string } {
  const scalarFields: z.ZodRawShape = {};
  const scalarPromptBlocks: string[] = [];
  for (const key of extractionSchemaKeys) {
    const e = extractionRegistry[key];
    if (e.entryScalarFields) {
      for (const [k, v] of Object.entries(e.entryScalarFields)) scalarFields[k] = v;
    }
    if (e.entryScalarPrompt) {
      scalarPromptBlocks.push(
        `The following fields apply ONLY if this business makes or supplies physical goods; otherwise leave them empty ("" or []):\n${e.entryScalarPrompt()}`
      );
    }
  }
  const fields: z.ZodRawShape = {
    ...scalarFields,
    ...collectionsEnrichmentFields(allEntryCollectionKeys),
  };
  const prompt = [...scalarPromptBlocks, collectionsEnrichmentPrompt(allEntryCollectionKeys)].join(
    '\n\n'
  );
  return { fields, prompt };
}

/**
 * Resolve WHICH engine's enrichment to fold AFTER the entry call classifies.
 * - KNOWN `businessTypeGuess` ⇒ `extractionForBusinessType()` (via
 *   `extractionSchemaKey`, so manufacturer keeps its 4 scalar folds — resolving
 *   through `resolveEngine` would collapse it to the 'thing' copyEngine and DROP
 *   them).
 * - UNKNOWN guess (rung A) ⇒ the tiebreaker ladder's engine family
 *   (`expertise`→trust, `portfolio-is-proof`→work, `none`→thing). The ladder is
 *   shared with `resolveEngine` (single source). `browsing-place`→place and
 *   `offer-already-understood`→quick-yes have NO extraction ⇒ null (no fold).
 */
export function entryExtractionForSignals(
  signals: Pick<EntrySignals, 'businessTypeGuess' | 'tiebreaker'>
): EngineExtraction | null {
  const guess = signals.businessTypeGuess;
  if (guess && guess in businessTypes) {
    return extractionForBusinessType(guess as BusinessTypeKey);
  }
  const { engine } = resolveEngine(signals);
  if (engine === 'thing' || engine === 'trust' || engine === 'work') {
    return getExtraction(engine);
  }
  return null;
}
