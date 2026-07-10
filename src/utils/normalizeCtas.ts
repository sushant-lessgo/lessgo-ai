// src/utils/normalizeCtas.ts
// scale-04 (phase 3) — the single new-shape→legacy bridge (D-E).
//
// PLAIN module (NO 'use client') so it's firewall-safe to import into the
// published renderer. Runs ONCE at each renderer entry, BEFORE dispatch.
//
// New CTA writes land as `elementMetadata[key].cta: CTAButton`, but all ~26
// published block readers consume `elementMetadata[key].buttonConfig`. Rather
// than teach every reader to dual-read (or thread goal context into every call
// site), this pre-pass clones the content and, for each `cta`:
//   1. `dest:'GOAL_REF'` → `goalToDestination(goal, {forms})` (widened
//      `{ dest, formId? }` return); `undefined` (unresolvable / no goal) →
//      leave the entry UNTOUCHED (keeps any legacy buttonConfig, or absent →
//      reader's `#cta`); `null` (D-C: goal present but required param missing)
//      → an inert `{ type:'link', url:'#' }` no-op (never a dead/broken href).
//   2. Concrete `cta.dest` → the Destination directly (`cta.formId` carried).
//   3. The resulting Destination(+formId) is down-converted into a legacy
//      `buttonConfig` written into the clone:
//        - form case  → { type:'form', formId }  (formId may be absent → the
//          legacy reader's own missing-form fallback fires — identical either way)
//        - page{slug} → { type:'page', pathSlug }
//        - everything else → { type:'link', url: resolveDestination(dest) }
//   4. Entries with no `cta` pass through untouched (old pages: zero diff).
//
// FORM-CASE DETECTION (carry-forward from the phase-2 review): a `section`
// Destination has no formId slot, so `goalToDestination`'s M1 on-site-form case
// uses a WIDENED return — it returns `{ dest: section{anchor:'form-section'},
// formId }` with the `formId` KEY PRESENT (value may be `undefined` when no form
// resolves); M2–M5 omit the key entirely. We detect the form case by that pair
// shape (`'formId' in gd`), NOT by string-matching the anchor. So a plain
// `section` anchor GOAL_REF (M5) or a concrete `section` anchor cta stays a
// normal anchor link. Only M1/goal-form and an explicit form dest+formId map to
// `{type:'form'}`.

import type { CTAButton, Destination } from '@/types/destination';
import type { Brief } from '@/types/brief';
import { goalToDestination } from '@/modules/goals/goalToDestination';
import { resolveDestination, type CtaButtonConfig } from '@/utils/resolveCtaHref';

export interface NormalizeCtasContext {
  goal?: Brief['goal'] | null;
  forms?: Record<string, unknown> | undefined;
  /** goal-ref-cta phase 3 (F23): path of the page being rendered ('/', '/contact').
   *  Multipage only; single-page omits it → M1 resolves to the same-page anchor. */
  currentPagePath?: string;
  /** goal-ref-cta phase 3 (F23): path of the page that holds the conversion form.
   *  When it differs from currentPagePath, M1 resolves cross-page (page dest). */
  formPagePath?: string;
}

/** One page's identity + section-content map, for the form-bearing-page scan.
 *  Template- and store-agnostic (the two callers hold sitemaps in different
 *  shapes; both normalize down to this before calling buildNormalizeCtasContext). */
export interface CtaPageInput {
  path: string;
  content: Record<string, any> | undefined;
}

/** True when a page's content map contains the conversion form section. Pinned
 *  predicate (structural, works on the published shape which has no archetypeKey):
 *  a section whose id starts with `leadForm-` (single-page seeded form), OR any
 *  section carrying a non-empty `elements.form_id` (multipage template-shipped
 *  contact form — set by mergePageIntoFinalContent on the `contact` section). */
function pageHasFormSection(content: Record<string, any> | undefined): boolean {
  if (!content || typeof content !== 'object') return false;
  for (const sectionId of Object.keys(content)) {
    if (sectionId.startsWith('leadForm-')) return true;
    const section = content[sectionId];
    const formId = section?.elements?.form_id;
    if (typeof formId === 'string' && formId.length > 0) return true;
  }
  return false;
}

/**
 * Find the path of the page that holds the conversion form. Prefers the CURRENT
 * page when it holds a form (→ same-page anchor); otherwise the first page that
 * does (→ cross-page page dest). `undefined` when no page holds a form (M1 then
 * degrades to the same-page anchor, matching single-page behavior).
 */
export function findFormPagePath(
  pages: CtaPageInput[],
  currentPagePath?: string,
): string | undefined {
  const current = pages.find((p) => p.path === currentPagePath);
  if (current && pageHasFormSection(current.content)) return current.path;
  const formPage = pages.find((p) => pageHasFormSection(p.content));
  return formPage?.path;
}

/**
 * Build the render-time CTA-resolution context shared by BOTH renderers (edit +
 * published) and consumed by the parity test. Plain module — no client-store or
 * template imports — so the published exporter reaches it firewall-safely.
 *
 * `pages` (edit store) → the form-bearing page is scanned here via findFormPagePath.
 * `formPagePath` (published exporter) → precomputed by the exporter (which alone
 * holds every page) and passed straight through. Single-page callers pass neither
 * → ctx degrades to `{goal, forms}` and M1 resolves to the same-page anchor.
 */
export function buildNormalizeCtasContext(args: {
  goal?: Brief['goal'] | null;
  forms?: Record<string, unknown> | undefined;
  currentPagePath?: string;
  /** Precomputed (published exporter). Ignored when `pages` is provided. */
  formPagePath?: string;
  /** All pages (edit store) — scanned for the form-bearing page. */
  pages?: CtaPageInput[];
}): NormalizeCtasContext {
  const formPagePath = args.pages
    ? findFormPagePath(args.pages, args.currentPagePath)
    : args.formPagePath;
  return {
    goal: args.goal,
    forms: args.forms,
    currentPagePath: args.currentPagePath,
    formPagePath,
  };
}

/**
 * Down-convert a single `cta` into the legacy `buttonConfig` shape. Returns
 * `undefined` when the entry must be left UNTOUCHED (unresolvable GOAL_REF).
 */
function ctaToButtonConfig(
  cta: CTAButton,
  ctx: NormalizeCtasContext,
): CtaButtonConfig | undefined {
  let dest: Destination;
  let formId: string | undefined;
  let isForm: boolean;

  if (cta.dest === 'GOAL_REF') {
    const gd = goalToDestination(ctx.goal, {
      forms: ctx.forms,
      currentPagePath: ctx.currentPagePath,
      formPagePath: ctx.formPagePath,
    });
    // D-C: `null` = goal exists but its required param is missing (F14 "Skip for
    // now") → an inert `#` no-op, never a dead/broken href. `undefined` =
    // unresolvable / no goal → leave the entry untouched (template fallback).
    if (gd === null) return { type: 'link', url: '#' };
    if (!gd) return undefined;
    dest = gd.dest;
    formId = gd.formId;
    // M1 form case is marked by the WIDENED return carrying the formId KEY
    // (present even when its value is undefined). M2–M5 omit the key.
    isForm = 'formId' in gd;
  } else {
    dest = cta.dest;
    formId = cta.formId;
    // A concrete cta is a form ONLY when it explicitly carries a formId AND
    // points at the shared form-section anchor (an explicit form dest+formId).
    // A plain section anchor is a normal anchor link, not a form.
    isForm =
      formId !== undefined && dest.kind === 'section' && dest.anchor === 'form-section';
  }

  if (isForm) {
    // formId may be undefined (M1 with no resolvable form) → the legacy reader's
    // own missing-form fallback handles it, byte-identical to the pre-scale-04 path.
    return formId !== undefined ? { type: 'form', formId } : { type: 'form' };
  }
  if (dest.kind === 'page') {
    return { type: 'page', pathSlug: dest.pathSlug };
  }
  return { type: 'link', url: resolveDestination(dest) };
}

/**
 * Clone `content` and down-convert every `elementMetadata[*].cta` into a legacy
 * `buttonConfig`, so the untouched published readers consume the new shape.
 *
 * Never mutates the input. Sections/entries with no resolvable `cta` are left as
 * the SAME reference (old pages / null-goal projects → byte-identical output).
 */
export function normalizeCtas<T>(content: T, ctx: NormalizeCtasContext): T {
  if (!content || typeof content !== 'object') return content;

  let contentClone: Record<string, any> | null = null;

  for (const sectionKey of Object.keys(content as Record<string, any>)) {
    const section = (content as Record<string, any>)[sectionKey];
    if (!section || typeof section !== 'object') continue;
    const meta = section.elementMetadata;
    if (!meta || typeof meta !== 'object') continue;

    let metaClone: Record<string, any> | null = null;

    for (const elKey of Object.keys(meta)) {
      const entry = meta[elKey];
      const cta: CTAButton | undefined = entry?.cta;
      if (!cta) continue; // no cta → untouched

      const buttonConfig = ctaToButtonConfig(cta, ctx);
      if (buttonConfig === undefined) continue; // unresolvable → leave untouched

      if (!metaClone) metaClone = { ...meta };
      metaClone![elKey] = { ...entry, buttonConfig };
    }

    if (metaClone) {
      if (!contentClone) contentClone = { ...(content as Record<string, any>) };
      contentClone[sectionKey] = { ...section, elementMetadata: metaClone };
    }
  }

  return (contentClone as T) ?? content;
}
