// Offline validator: does a generated content map produce a renderable page?
// Pure + schema-driven — no network, no React. Used by the generation-contract
// test against both mock-derived and real-LLM golden fixtures.
//
// The three P0 checks (a broken/empty page is the founder's #1 fear):
//   1. every REQUIRED element is present and non-empty
//   2. every REQUIRED collection is an array within its [min,max] constraints
//   3. every collection item has its system-filled id populated (the parseCopy
//      backfill guarantee — empty ids = duplicate React keys = broken inline edit)

import type {
  UIBlockSchemaV2,
} from '@/modules/sections/layoutElementSchema';
import type { SectionCopy } from '@/types/generation';

export interface ContentValidationError {
  section: string;
  layout: string;
  field: string;
  problem: string;
}

function isEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim() === '';
}

/**
 * Validate a generated sections map against a layout→schema registry.
 * @param sections  sectionType → SectionCopy ({ elements })
 * @param uiblocks  sectionType → layoutName (PascalCase schema key)
 * @param schema    layoutName → UIBlockSchemaV2
 * @returns flat list of violations (empty = valid)
 */
export function validateGeneratedContent(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>,
  schema: Record<string, UIBlockSchemaV2>
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  for (const [sectionType, layout] of Object.entries(uiblocks)) {
    const blockSchema = schema[layout];
    if (!blockSchema) {
      errors.push({ section: sectionType, layout, field: '*', problem: 'no schema for layout' });
      continue;
    }
    const copy = sections[sectionType];
    if (!copy || !copy.elements) {
      errors.push({ section: sectionType, layout, field: '*', problem: 'section missing from output' });
      continue;
    }
    const el = copy.elements as Record<string, any>;

    // 1. required scalar elements present + non-empty
    for (const [name, def] of Object.entries(blockSchema.elements)) {
      if (def.requirement !== 'required') continue;
      const v = el[name];
      if (v === undefined || v === null || isEmptyString(v)) {
        errors.push({ section: sectionType, layout, field: name, problem: 'required element empty/missing' });
      }
    }

    // 2 + 3. required collections: shape, count, and id backfill
    for (const [collKey, collDef] of Object.entries(blockSchema.collections ?? {})) {
      const items = el[collKey];
      if (!Array.isArray(items)) {
        if (collDef.requirement === 'required') {
          errors.push({ section: sectionType, layout, field: collKey, problem: 'required collection not an array' });
        }
        continue;
      }
      const { min, max } = collDef.constraints;
      if (items.length < min || items.length > max) {
        errors.push({
          section: sectionType,
          layout,
          field: collKey,
          problem: `collection length ${items.length} outside [${min},${max}]`,
        });
      }
      const systemFields = Object.entries(collDef.fields)
        .filter(([, f]) => f.fillMode === 'system')
        .map(([n]) => n);
      items.forEach((item, i) => {
        for (const sf of systemFields) {
          if (!item || typeof item !== 'object' || isEmptyString(item[sf]) || item[sf] == null) {
            errors.push({
              section: sectionType,
              layout,
              field: `${collKey}[${i}].${sf}`,
              problem: 'system field (id) not backfilled',
            });
          }
        }
      });
    }
  }

  return errors;
}
