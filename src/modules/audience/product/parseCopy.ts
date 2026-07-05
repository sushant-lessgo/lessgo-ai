// src/modules/audience/product/parseCopy.ts
// Post-LLM processing for Meridian copy generation. Mirror of
// audience/service/parseCopy.ts: applyAllSchemaDefaults (works on any V2 schema
// once meridianElementSchema is in the global registry) → backfill system ids →
// accent-<em> fallback.
//
// KEY DIFFERENCE vs service: the id backfill RECURSES. The service version only
// walks one collection level. Meridian's `footer_columns` collection has a
// nested `links[]` array (CollectionFieldDef type:'array') whose items also
// carry a system `id`. Without recursion those nested links render with key=""
// (duplicate React keys, collapsed inline-edit identity).

import type { SectionCopy } from '@/types/generation';
import { logger } from '@/lib/logger';
import { applyAllSchemaDefaults } from '@/modules/sections/layoutElementSchema';
// Combined product schema (meridian + vestria) so layout lookups cover ALL
// product templates — a meridian-only lookup silently skips vestria collections.
import { productElementSchema } from './elementSchema';
import { applyAccentEmFallback } from './accentFallback';

export interface ProductCopyValidationResult {
  complete: boolean;
  missingSections: string[];
}

/** Minimal shape we rely on — avoids coupling to the exact CollectionFieldDef export. */
interface FieldDefLike {
  type?: string;
  fillMode?: string;
  fields?: Record<string, FieldDefLike>;
}

/**
 * Backfill every `fillMode: 'system'` id in a list of collection items, then
 * recurse into any nested array fields (e.g. footer_columns → links). Idempotent
 * — only fills falsy ids, so re-processing preserves real ones.
 */
function backfillItems(
  items: unknown[],
  fields: Record<string, FieldDefLike>,
  keyPrefix: string
): void {
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (fieldDef.fillMode === 'system') {
      for (const item of items) {
        if (item && typeof item === 'object' && !(item as Record<string, any>)[fieldName]) {
          (item as Record<string, any>)[fieldName] =
            `${keyPrefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
        }
      }
    }
    // Recurse into nested array fields (the footer_columns → links case).
    if (fieldDef.type === 'array' && fieldDef.fields) {
      for (const item of items) {
        const nested = (item as Record<string, any>)?.[fieldName];
        if (Array.isArray(nested)) {
          backfillItems(nested, fieldDef.fields, fieldName);
        }
      }
    }
  }
}

/**
 * Walk every collection the Meridian schema declares and backfill
 * system-generated ids (top-level + nested arrays). Collections live under
 * `section.elements[<collectionKey>]` (see useMeridianBlock).
 */
export function backfillCollectionIds(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  for (const [sectionName, sectionCopy] of Object.entries(sections)) {
    const layoutName = uiblocks[sectionName];
    const schema = layoutName ? productElementSchema[layoutName] : undefined;
    if (!schema?.collections || !sectionCopy?.elements) continue;

    for (const [collectionKey, collection] of Object.entries(schema.collections)) {
      const items = (sectionCopy.elements as Record<string, unknown>)[collectionKey];
      if (!Array.isArray(items)) continue;
      backfillItems(items, collection.fields as Record<string, FieldDefLike>, collectionKey);
    }
  }

  return sections;
}

/** A real testimonial lifted verbatim from a user's existing website. */
export interface RealTestimonial {
  quote: string;
  author_name: string;
  author_role: string;
}

/**
 * Overwrite the generated `testimonials` section's testimonials collection with
 * REAL (verbatim) testimonials imported from the user's website. Done AFTER the
 * LLM (and before processProductCopy, so backfillCollectionIds assigns the
 * `system` ids) — guarantees exact wording with zero rewrite risk.
 *
 * - Keeps the AI-generated eyebrow/headline and `logos` untouched.
 * - Caps at the collection max (3).
 * - No-ops (with a warn) if no testimonials section was produced — the Meridian
 *   pilot set always includes one, so this is a defensive guard, not a path we
 *   expect to hit.
 */
export function injectRealTestimonials(
  sections: Record<string, SectionCopy>,
  real: RealTestimonial[]
): Record<string, SectionCopy> {
  if (!real?.length) return sections;

  const section = sections['testimonials'];
  if (!section || !section.elements) {
    logger.warn('[injectRealTestimonials] no testimonials section in copy; skipping injection');
    return sections;
  }

  (section.elements as Record<string, unknown>).testimonials = real.slice(0, 3).map((t) => ({
    quote: t.quote,
    author_name: t.author_name,
    author_role: t.author_role,
  }));

  return sections;
}

/**
 * Auto-map nav/footer link targets to on-page section anchors by label, so generated
 * links work out of the box (the user can override any in the editor — see
 * LinkTargetPopover). Only touches links whose href is still the unset default
 * (empty or '#'), and only sets a `#<type>` anchor when that section type actually
 * exists on the page (`presentTypes`). Anchors are bare types here (no timestamp) —
 * they match the wrapper id the renderer emits for the first occurrence of a type.
 * See src/utils/sectionAnchors.ts (the matching render side).
 */
const LABEL_ANCHOR_RULES: { type: string; keywords: string[] }[] = [
  { type: 'pricing', keywords: ['pricing', 'plans', 'price'] },
  { type: 'features', keywords: ['features', 'feature'] },
  { type: 'faq', keywords: ['faq', 'faqs', 'questions'] },
  { type: 'testimonials', keywords: ['testimonials', 'testimonial', 'reviews', 'review', 'customers'] },
  { type: 'contact', keywords: ['contact'] },
  { type: 'about', keywords: ['about'] },
];

function matchAnchorType(label: unknown): string | undefined {
  if (typeof label !== 'string') return undefined;
  const norm = label.replace(/<[^>]*>/g, '').toLowerCase().trim();
  if (!norm) return undefined;
  return LABEL_ANCHOR_RULES.find((r) => r.keywords.some((k) => norm === k || norm.includes(k)))?.type;
}

export function autoMapLinkHrefs(
  sections: Record<string, SectionCopy>,
  presentTypes: Set<string>
): Record<string, SectionCopy> {
  const mapLink = (link: Record<string, any>) => {
    if (!link || typeof link !== 'object') return;
    if (link.href && link.href !== '#') return; // user/LLM already set a real target
    const type = matchAnchorType(link.label);
    if (type && presentTypes.has(type)) link.href = `#${type}`;
  };

  for (const sectionCopy of Object.values(sections)) {
    const elements = sectionCopy?.elements as Record<string, unknown> | undefined;
    if (!elements) continue;

    const navItems = elements.nav_items;
    if (Array.isArray(navItems)) navItems.forEach((it) => mapLink(it as Record<string, any>));

    const footerColumns = elements.footer_columns;
    if (Array.isArray(footerColumns)) {
      for (const col of footerColumns) {
        const links = (col as Record<string, any>)?.links;
        if (Array.isArray(links)) links.forEach((l) => mapLink(l as Record<string, any>));
      }
    }
  }

  return sections;
}

/**
 * Apply schema defaults → backfill system ids (recursive) → accent-<em> fallback.
 * Order matters: defaults first so we don't wrap default placeholders; id
 * backfill before render/persist so collection identity is stable.
 */
export function processProductCopy(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): Record<string, SectionCopy> {
  const withDefaults = applyAllSchemaDefaults(sections, uiblocks) as Record<string, SectionCopy>;
  const withIds = backfillCollectionIds(withDefaults, uiblocks);
  return applyAccentEmFallback(withIds);
}

/**
 * Verify every requested section produced copy output.
 */
export function validateProductCopyCompleteness(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<string, string>
): ProductCopyValidationResult {
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
