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
// scale-07 phase 8b: defaults + id backfill read the SAME per-engine contract
// schema the copy prompt was built from (thing-covered layouts), so union
// collections the prompt now asks for (e.g. hero values on a meridian page)
// get their system ids backfilled. Null (non-thing layouts) falls through to
// the layout-name schema unchanged.
import { resolveEngineSectionSchema } from '@/modules/engines/elementContracts';
import { flattenReviewSentinel } from '@/lib/schemas/copy.schema';
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
    // Engine contract first (thing layouts); layout-name lookup is the fallback.
    const schema = layoutName
      ? resolveEngineSectionSchema(layoutName) ?? productElementSchema[layoutName]
      : undefined;
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
 * - Sets `section.realProof = true` (proof-truth phase 4) — a post-parse
 *   provenance annotation carried into aiMetadata by multiPageAssembly and read
 *   by useReviewState to suppress needs-review markers. All-or-nothing per
 *   section: this overwrites the whole testimonials[] array with only real
 *   items, so the section is entirely real when the flag is set.
 *
 * KNOWN GAP (proof-truth unresolved Q3): `regenerate-element` on a single real
 * quote element overwrites it with a fresh AI invention and does NOT clear this
 * section-level flag, so provenance is inaccurate after element-level regen.
 * Acceptance criterion 4 is section-level (section-regen re-injects from the
 * table); element-level re-injection is deferred, not implemented here.
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
  section.realProof = true;

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

/** A site page the chrome may link to (multi-page fan-out — Phase 3). */
export interface SitePageLink {
  title: string;
  pathSlug: string;
}

const normLabel = (label: unknown): string =>
  typeof label === 'string' ? label.replace(/<[^>]*>/g, '').toLowerCase().trim() : '';

// A BARE on-page section anchor the renderer emits — "#pricing" or "#pricing-2"
// (first occurrence vs. repeats). Special anchors ("#form-section") and full
// section-id anchors carry a non-numeric suffix and do NOT match, so they are
// never mistaken for a dead section anchor.
const SECTION_ANCHOR_RE = /^#([a-z]+)(-\d+)?$/i;

/**
 * If `href` is a bare section anchor pointing at a section TYPE that is not on
 * the page, return that dead type; otherwise null. Common law: nav must derive
 * from what the page actually has — an anchor to a missing section scrolls
 * nowhere and must not ship (F7). AI-authored `#pricing`/`#about`/etc. on a page
 * without those sections are the dead anchors this catches.
 */
function deadAnchorType(href: unknown, presentTypes: Set<string>): string | null {
  if (typeof href !== 'string') return null;
  const m = SECTION_ANCHOR_RE.exec(href.trim());
  if (!m) return null;
  const base = m[1].toLowerCase();
  return presentTypes.has(base) ? null : base;
}

export function autoMapLinkHrefs(
  sections: Record<string, SectionCopy>,
  presentTypes: Set<string>,
  sitePages?: SitePageLink[]
): Record<string, SectionCopy> {
  // Resolve a nav/footer link to a live target. Returns false when the link is a
  // DEAD section anchor we could not re-map — the caller drops it (F7). A still-
  // unset ("#") link is kept (backward compatible; it renders as "#").
  const mapLink = (link: Record<string, any>): boolean => {
    if (!link || typeof link !== 'object') return true;
    const isUnset = !link.href || link.href === '#';
    const dead = !isUnset && deadAnchorType(link.href, presentTypes) !== null;
    // A real, live target (page path, external URL, valid on-page anchor,
    // "#form-section") — leave it exactly as the user/LLM set it.
    if (!isUnset && !dead) return true;
    // Unset OR dead → (re)derive from the link's label.
    // Multi-page: a label matching a sitemap page title maps to that page's
    // path FIRST (chrome is shared across pages, so links must be site-absolute
    // paths, not on-page anchors). Fallback: on-page section anchor.
    if (sitePages?.length) {
      const norm = normLabel(link.label);
      const page = norm
        ? sitePages.find((p) => {
            const t = p.title.toLowerCase().trim();
            return t && (norm === t || norm.includes(t) || t.includes(norm));
          })
        : undefined;
      if (page && page.pathSlug !== '/') {
        link.href = page.pathSlug;
        return true;
      }
    }
    const type = matchAnchorType(link.label);
    if (type && presentTypes.has(type)) {
      link.href = `#${type}`;
      return true;
    }
    // Could not resolve: a dead anchor now points nowhere → drop it. An unset
    // ("#") link is left untouched (it was never a promise to scroll somewhere).
    return !dead;
  };

  // F24: append a derived link (label = page title, href = pathSlug) for every
  // non-home sitemap page not already reachable from `links`. Keeps the footer's
  // site-nav column in sync with the sitemap the same way the header nav is —
  // pages added at the gate (which the AI never authored a link for) appear.
  // Idempotent by href.
  const appendMissingPages = (links: Record<string, any>[]) => {
    if (!sitePages?.length) return;
    const have = new Set(links.map((l) => l?.href));
    for (const p of sitePages) {
      if (p.pathSlug === '/' || have.has(p.pathSlug)) continue;
      links.push({ id: '', label: p.title, href: p.pathSlug });
      have.add(p.pathSlug);
    }
  };

  const pagePaths = new Set((sitePages || []).map((p) => p.pathSlug));
  const mapColumns = (columns: unknown) => {
    if (!Array.isArray(columns)) return;
    for (const col of columns) {
      const links = (col as Record<string, any>)?.links;
      if (!Array.isArray(links)) continue;
      const kept = links.filter((l) => mapLink(l as Record<string, any>));
      // A column that functions as site navigation (holds ≥1 page-path link) is
      // synced to the full sitemap; other columns (Product, Company…) are left.
      if (kept.some((l) => pagePaths.has((l as Record<string, any>)?.href))) {
        appendMissingPages(kept);
      }
      (col as Record<string, any>).links = kept;
    }
  };

  for (const sectionCopy of Object.values(sections)) {
    const elements = sectionCopy?.elements as Record<string, unknown> | undefined;
    if (!elements) continue;

    const navItems = elements.nav_items;
    if (Array.isArray(navItems)) {
      elements.nav_items = navItems.filter((it) => mapLink(it as Record<string, any>));
    }

    // Meridian footer columns + Vestria footer link columns (same nested shape).
    mapColumns(elements.footer_columns);
    mapColumns(elements.link_columns);
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
  // Sentinel hardening: flatten any {value, needsReview} object BEFORE assembly
  // so no object-shaped value can survive into content (→ no [object Object]).
  flattenReviewSentinel(sections);
  // Contract-aware defaults (phase 8b): thing layouts read the engine contract,
  // everything else the layout registry — same gate as prompt build + backfill.
  const withDefaults = applyAllSchemaDefaults(
    sections,
    uiblocks,
    resolveEngineSectionSchema
  ) as Record<string, SectionCopy>;
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
