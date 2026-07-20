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
import { injectPackages } from './injectPackages';
import type { WorkGroup } from '@/lib/schemas/workFacts.schema';

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
        // ONLY the item `id` gets a generated stable value. Other system fields
        // are MANUAL-lane slots (image / featured / slide fields) — they stay
        // EMPTY until the user fills them, and are cleared by `stripSystemKeys`.
        // Backfilling them with a uuid would resurrect the very keys the strip
        // drops (Wave 2: image/featured are now `fillMode:'system'`).
        if (fieldDef.fillMode !== 'system' || fieldName !== 'id') continue;
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
 * Strip any AI-emitted value for a contract field declared `fillMode:'system'`
 * (the MANUAL lane — image / featured / cta2_href / signature / logo_image /
 * slide fields as later phases declare them). This is the UNIFORM AI-exclusion
 * guard: `applyAllSchemaDefaults` keeps every non-null AI key, so without this a
 * confused LLM response (esp. the `regenerateSection` apply twin) would surface
 * manual-lane keys. It complements — never replaces — per-merge belts.
 *
 * `id` is the ONE system field intentionally PRESERVED: it is legitimately
 * system-owned and carries collection-item identity (React keys, regen merge).
 * `backfillWorkCollectionIds` assigns it downstream; stripping/reassigning it
 * would churn item identity. Every OTHER system field is a manual-lane slot that
 * must be empty after generation. Mutates + returns the same map.
 */
export function stripSystemKeys(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  for (const [sectionName, sectionCopy] of Object.entries(sections)) {
    const schema = resolveWorkSchema(uiblocks[sectionName] ?? sectionName);
    if (!schema || !sectionCopy?.elements) continue;
    const elements = sectionCopy.elements as Record<string, unknown>;

    // Scalar system-owned elements — drop any AI-emitted value.
    for (const [key, def] of Object.entries(schema.elements)) {
      if (def.fillMode === 'system') delete elements[key];
    }

    // Collection item system fields (except `id`) — drop from every item.
    if (schema.collections) {
      for (const [collKey, coll] of Object.entries(schema.collections)) {
        const items = elements[collKey];
        if (!Array.isArray(items)) continue;
        for (const [fieldName, fieldDef] of Object.entries(coll.fields)) {
          if (fieldDef.fillMode !== 'system' || fieldName === 'id') continue;
          for (const item of items) {
            if (item && typeof item === 'object') {
              delete (item as Record<string, unknown>)[fieldName];
            }
          }
        }
      }
    }
  }
  return sections;
}

/**
 * Parse + finalize per-page work copy. Applies contract defaults, strips AI
 * values for manual-lane (`fillMode:'system'`) fields, injects the seller's
 * verbatim praise into `proof.quotes` + verbatim group items into package
 * `bullets`, and backfills collection ids.
 *
 * @param raw       the raw LLM/mock section map (CopyResponseSchema shape)
 * @param uiblocks  section → contract section type (identity map from strategy)
 * @param praise    the seller's verbatim praise strings (facts.praise)
 * @param groups    the seller's stated work groups (facts.work.groups) — drives
 *                  the verbatim package-bullets injection; omit when the caller
 *                  has no facts in scope (bullets then stay AI-drafted).
 */
export function parseWorkCopy(
  raw: Record<string, SectionCopy>,
  uiblocks: Record<string, string>,
  praise: string[] | undefined,
  groups?: readonly WorkGroup[] | undefined
): Record<string, SectionCopy> {
  // 1. Sentinel hardening BEFORE anything reads content.
  flattenReviewSentinel(raw);

  // 2. Contract defaults (resolved against the frozen work contract).
  const withDefaults = applyAllSchemaDefaults(
    raw,
    uiblocks,
    resolveWorkSchema
  ) as Record<string, SectionCopy>;

  // 3. DEFINITE system-key strip — the uniform manual-lane AI-exclusion guard,
  //    covering first-gen + ALL regen routes.
  const stripped = stripSystemKeys(withDefaults, uiblocks);

  // 4. Praise — verbatim, facts law (work-LOCAL injector).
  const withPraise = injectPraise(stripped, praise);

  // 5. Package bullets — verbatim group items, facts law (work-LOCAL injector).
  const withPackages = injectPackages(withPraise, groups);

  // 6. Stable collection-item ids (incl. injected praise items).
  return backfillWorkCollectionIds(withPackages, uiblocks);
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
