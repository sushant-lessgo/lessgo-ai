// src/modules/service/copy/parseCopyService.ts
// Validation helpers for service-route copy generation. Thin wrapper —
// applyAllSchemaDefaults from layoutElementSchema works on any V2 schema once
// serviceElementSchema is merged into the global registry, so we just compose
// it with the italic-em fallback and a completeness check.

import type { SectionCopy } from '@/types/generation';
import { applyAllSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { applyItalicEmFallback } from './italicAccentFallback';

export interface ServiceCopyValidationResult {
  complete: boolean;
  missingSections: string[];
}

/**
 * Apply schema defaults (manual_preferred fields, optional null filtering)
 * then run the italic-em fallback. Order matters — defaults first so we don't
 * accidentally wrap default placeholder strings.
 */
export function processServiceCopy(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  const withDefaults = applyAllSchemaDefaults(sections, uiblocks) as Record<string, SectionCopy>;
  return applyItalicEmFallback(withDefaults);
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
