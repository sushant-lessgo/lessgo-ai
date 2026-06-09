// src/modules/service/copy/parseCopyService.ts
// Validation helpers for service-route copy generation. Thin wrapper —
// applyAllSchemaDefaults from layoutElementSchema works on any V2 schema once
// serviceElementSchema is merged into the global registry, so we just compose
// it with the italic-em fallback and a completeness check.

import type { SectionCopy } from '@/types/generation';
import { applyAllSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { serviceElementSchema } from './elementSchema';
import { applyItalicEmFallback } from './italicAccentFallback';

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
