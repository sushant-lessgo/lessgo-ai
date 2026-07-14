// src/modules/audience/work/parseCopy.ts
// ============================================================================
// WORK COPY PARSER — validate + finalize per-page copy against the FROZEN work
// element contract (src/modules/engines/workSections.ts).
//
// Pipeline (order matters):
//   1. flattenReviewSentinel  — no object-shaped value survives into content.
//   2. applyAllSchemaDefaults  — resolved against `workElementContract` (via
//      resolveWorkSchema), so required manual_preferred fields get their default
//      and null optionals are dropped.
//   3. injectPraise (work-LOCAL) — every stated praise string VERBATIM into
//      `proof.quotes` (NOT the service `injectRealTestimonials`, which is wrong-
//      shaped for work — see injectPraise.ts). Facts law: verbatim, no drops, no
//      extras, clamped to the contract max.
//   4. backfillWorkCollectionIds — assign stable ids to system-fillMode fields
//      (including the injected praise items) so React keys / inline-edit identity
//      are stable.
//
// The work STORY section is `about` (donor GranthParichay) — a type name DISTINCT
// from `testimonials`/`proof`, so no service testimonials code path can touch it.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. Reads the pure-data work contract + shared schema helpers. No
//   templateId. No react / stores / hooks.
// ============================================================================

import type { SectionCopy } from '@/types/generation';
import {
  applyAllSchemaDefaults,
  type UIBlockSchemaV2,
} from '@/modules/sections/layoutElementSchema';
import { flattenReviewSentinel } from '@/lib/schemas/copy.schema';
import { workElementContract } from '@/modules/engines/workSections';
import { injectPraise } from './injectPraise';

export interface WorkCopyValidationResult {
  complete: boolean;
  missingSections: string[];
}

/**
 * Resolve a work section/uiblock name to its frozen contract schema. Work
 * uiblocks are the template-agnostic contract section types (identity map), so
 * the lookup key IS the contract key. Returns null for unknown sections.
 */
export function resolveWorkSchema(name: string): UIBlockSchemaV2 | null {
  return (workElementContract[name] as UIBlockSchemaV2 | undefined) ?? null;
}

/**
 * Backfill system-generated collection-item ids against the WORK contract.
 * Mirrors the service backfill, but schema-driven off `workElementContract`.
 * Idempotent — only fills falsy ids.
 */
export function backfillWorkCollectionIds(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  for (const [sectionName, sectionCopy] of Object.entries(sections)) {
    const schema = resolveWorkSchema(uiblocks[sectionName] ?? sectionName);
    if (!schema?.collections || !sectionCopy?.elements) continue;

    for (const [collectionKey, collection] of Object.entries(schema.collections)) {
      const items = (sectionCopy.elements as Record<string, unknown>)[collectionKey];
      if (!Array.isArray(items)) continue;

      for (const [fieldName, fieldDef] of Object.entries(collection.fields)) {
        if (fieldDef.fillMode !== 'system') continue;
        for (const item of items) {
          if (item && typeof item === 'object' && !(item as Record<string, any>)[fieldName]) {
            (item as Record<string, any>)[fieldName] =
              `${collectionKey}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
          }
        }
      }
    }
  }
  return sections;
}

/**
 * Parse + finalize per-page work copy. Applies contract defaults, injects the
 * seller's verbatim praise into `proof.quotes`, and backfills collection ids.
 *
 * @param raw       the raw LLM/mock section map (CopyResponseSchema shape)
 * @param uiblocks  section → contract section type (identity map from strategy)
 * @param praise    the seller's verbatim praise strings (facts.praise)
 */
export function parseWorkCopy(
  raw: Record<string, SectionCopy>,
  uiblocks: Record<string, string>,
  praise: string[] | undefined
): Record<string, SectionCopy> {
  // 1. Sentinel hardening BEFORE anything reads content.
  flattenReviewSentinel(raw);

  // 2. Contract defaults (resolved against the frozen work contract).
  const withDefaults = applyAllSchemaDefaults(
    raw,
    uiblocks,
    resolveWorkSchema
  ) as Record<string, SectionCopy>;

  // 3. Praise — verbatim, facts law (work-LOCAL injector).
  const withPraise = injectPraise(withDefaults, praise);

  // 4. Stable collection-item ids (incl. injected praise items).
  return backfillWorkCollectionIds(withPraise, uiblocks);
}

/** Verify every requested section produced a non-empty elements object. */
export function validateWorkCopyCompleteness(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): WorkCopyValidationResult {
  const missingSections: string[] = [];
  for (const sectionType of Object.keys(uiblocks)) {
    const copy = sections[sectionType];
    if (!copy || !copy.elements || Object.keys(copy.elements).length === 0) {
      missingSections.push(sectionType);
    }
  }
  return { complete: missingSections.length === 0, missingSections };
}
