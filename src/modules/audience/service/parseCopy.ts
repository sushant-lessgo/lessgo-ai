// src/modules/service/copy/parseCopyService.ts
// Validation helpers for service-route copy generation. Thin wrapper —
// applyAllSchemaDefaults from layoutElementSchema works on any V2 schema once
// serviceElementSchema is merged into the global registry, so we just compose
// it with the italic-em fallback and a completeness check.

import type { SectionCopy } from '@/types/generation';
import { applyAllSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { flattenReviewSentinel } from '@/lib/schemas/copy.schema';
import { serviceElementSchema } from './elementSchema';
import { applyItalicEmFallback } from './italicAccentFallback';
import { logger } from '@/lib/logger';
import type { ScrapedTestimonial } from '@/lib/schemas';

export interface ServiceCopyValidationResult {
  complete: boolean;
  missingSections: string[];
}

/**
 * Backfill system-generated collection-item ids.
 *
 * The copy prompt tells the LLM that `id` fields are system-generated and to
 * emit empty string / omit them. Nothing actually generated them — so every
 * collection item rendered with `key=""` (duplicate React keys) and collapsed
 * per-item `elementKey`s, breaking inline-edit identity. This is the missing
 * step: walk every collection the service schema declares with a `fillMode:
 * 'system'` field and assign a unique id to any item missing one.
 *
 * Schema-driven so it automatically covers all current collections (nav_items,
 * services, packages, social_links) and any added later. Idempotent — only
 * fills falsy ids, so re-processing preserves real ones. Collections live under
 * `section.elements[<collectionKey>]` (see useServiceBlock / handleCollectionUpdate).
 */
export function backfillCollectionIds(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  for (const [sectionName, sectionCopy] of Object.entries(sections)) {
    const layoutName = uiblocks[sectionName];
    const schema = layoutName ? serviceElementSchema[layoutName] : undefined;
    if (!schema?.collections || !sectionCopy?.elements) continue;

    for (const [collectionKey, collection] of Object.entries(schema.collections)) {
      const items = sectionCopy.elements[collectionKey];
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

/** The single collection key for a layout, or null if it has 0 or >1 collections. */
function singleCollectionKey(layout: string | undefined): string | null {
  const schema = layout ? serviceElementSchema[layout] : undefined;
  const keys = schema?.collections ? Object.keys(schema.collections) : [];
  return keys.length === 1 ? keys[0] : null;
}

/**
 * Tolerate the LLM collapsing a collection-only section. gpt-4o-mini sometimes
 * emits `"<section>": { "elements": [ …items ] }` (or `"<section>": [ …items ]`)
 * instead of `{ elements: { <collectionKey>: [ …items ] } }` — most likely when a
 * section has a single collection and no required scalar (e.g. Surge's stats/logos
 * bands). Rewrap such sections into the correct shape using the layout's single
 * collection key BEFORE strict CopyResponseSchema validation. Sections whose layout
 * has no single collection (scalar-only, or multi-collection like About) are passed
 * through untouched — they carry required scalars and don't collapse.
 */
export function normalizeServiceCopy(
  raw: Record<string, any>,
  uiblocks: Record<string, string>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [sectionType, value] of Object.entries(raw || {})) {
    const collKey = singleCollectionKey(uiblocks[sectionType]);
    if (Array.isArray(value)) {
      out[sectionType] = collKey ? { elements: { [collKey]: value } } : { elements: {} };
    } else if (value && typeof value === 'object' && Array.isArray((value as any).elements)) {
      out[sectionType] = collKey
        ? { elements: { [collKey]: (value as any).elements } }
        : { elements: {} };
    } else {
      out[sectionType] = value;
    }
  }
  return out;
}

/**
 * Replace the generated testimonial with a REAL (verbatim) one imported from the
 * user's website. Done AFTER the LLM and BEFORE processServiceCopy (so schema
 * defaults still apply) — guarantees exact wording with zero rewrite risk.
 *
 * UNLIKE product (a `testimonials` collection array), the service Hearth/Lex
 * testimonials block `PullQuoteWithMark` is a FLAT single block, so we overwrite
 * its `quote`/`author_name`/`author_role` directly with the single best import.
 * `author_company` is cleared — the scrape shape carries no company and the AI's
 * guess would falsely attribute a real quote.
 *
 * No-op (with a warn) if no testimonials section was produced — defensive guard;
 * import pre-checks `hasTestimonials` so the section is normally present.
 *
 * Sets `section.realProof = true` (proof-truth phase 4) when it injects — a
 * post-parse provenance annotation carried into aiMetadata by multiPageAssembly
 * and read by useReviewState to suppress needs-review markers. All-or-nothing
 * per section: the flat quote fields are overwritten wholesale with the single
 * best real quote.
 *
 * KNOWN GAP (proof-truth unresolved Q3): `regenerate-element` on the real quote
 * element overwrites it with a fresh AI invention and does NOT clear this
 * section-level flag, so provenance is inaccurate after element-level regen.
 * Acceptance criterion 4 is section-level (section-regen re-injects from the
 * table); element-level re-injection is deferred, not implemented here.
 */
function pickBestTestimonial(real: ScrapedTestimonial[]): ScrapedTestimonial {
  // Prefer an attributed, substantial quote over an anonymous/thin one.
  const score = (t: ScrapedTestimonial) =>
    (t.author_name?.trim() ? 2 : 0) + Math.min(t.quote?.length ?? 0, 280) / 280;
  return [...real].sort((a, b) => score(b) - score(a))[0];
}

export function injectRealTestimonials(
  sections: Record<string, SectionCopy>,
  real: ScrapedTestimonial[]
): Record<string, SectionCopy> {
  if (!real?.length) return sections;

  const section = sections['testimonials'];
  if (!section || !section.elements) {
    logger.warn(
      '[injectRealTestimonials/service] no testimonials section in copy; skipping injection'
    );
    return sections;
  }

  const best = pickBestTestimonial(real);
  const el = section.elements as Record<string, unknown>;
  el.quote = best.quote;
  el.author_name = best.author_name;
  el.author_role = best.author_role;
  // Clear AI-guessed company so a real quote isn't paired with a fabricated one.
  el.author_company = '';
  section.realProof = true;

  return sections;
}

/**
 * Apply schema defaults (manual_preferred fields, optional null filtering),
 * backfill system-generated collection ids, then run the italic-em fallback.
 * Order matters — defaults first so we don't accidentally wrap default
 * placeholder strings; id backfill before render/persist so collection
 * identity is stable.
 */
export function processServiceCopy(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  // Sentinel hardening: flatten any {value, needsReview} object BEFORE assembly
  // so no object-shaped value can survive into content (→ no [object Object]).
  flattenReviewSentinel(sections);
  const withDefaults = applyAllSchemaDefaults(sections, uiblocks) as Record<string, SectionCopy>;
  const withIds = backfillCollectionIds(withDefaults, uiblocks);
  return applyItalicEmFallback(withIds);
}

/**
 * Verify every requested section has copy output.
 */
export function validateServiceCopyCompleteness(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): ServiceCopyValidationResult {
  const missingSections: string[] = [];

  for (const sectionType of Object.keys(uiblocks)) {
    const copy = sections[sectionType];
    if (!copy || !copy.elements || Object.keys(copy.elements).length === 0) {
      missingSections.push(sectionType);
    }
  }

  return {
    complete: missingSections.length === 0,
    missingSections,
  };
}
