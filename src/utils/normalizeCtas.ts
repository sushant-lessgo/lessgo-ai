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
import { resolveDestination, resolveCtaHref, type CtaButtonConfig } from '@/utils/resolveCtaHref';

// goal-ref-cta phase 3.5 — FLAT-HREF RENDER BRIDGE.
// Some templates (vestria hero/header, granth hero) render a FLAT `elements.cta_href`
// and do NOT read `elementMetadata[key].buttonConfig` (published `Link` takes the
// href prop verbatim). The GOAL_REF stamp + resolution therefore never reach them —
// dead wiring. This map wires each ALLOWLISTED primary metadata key (matches
// stampGoalRefCtas' allowlist) to the sibling flat href ELEMENT key it must also
// populate, so a resolved goal destination lands where those blocks actually read.
const GOAL_REF_FLAT_HREF_KEYS: Record<string, string> = { cta_text: 'cta_href' };

// Known schema-default `cta_href` values across templates (vestria `#contact`,
// granth `#books`, techpremium `/contact`, plus the generic inert `#`). The bridge
// overwrites a flat `cta_href` ONLY when it is absent/empty OR EXACTLY one of these
// — i.e. never a value a human typed via the editor's LinkTargetPopover
// (editPrimitives.tsx writes `elements.cta_href` directly). A flat href present AND
// not in this set = user-set → left untouched.
//
// TRADEOFF (ratified): kept as a LOCAL constant rather than derived from the
// per-audience `elementSchema` modules. normalizeCtas is a plain firewall-safe util
// with no per-section template/block context (it sees generic `sectionId`s), and
// importing the audience schemas to reverse-map a default would add coupling and
// import surface for no render benefit. If a template ever adds a new default
// `cta_href` value, add it here (see audit).
const SCHEMA_DEFAULT_CTA_HREFS = new Set(['#contact', '#books', '/contact', '#']);

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
 * Normalize ONE section: down-convert its `elementMetadata[*].cta` entries into
 * legacy `buttonConfig`s and bridge resolved GOAL_REF hrefs into the sibling flat
 * `cta_href`. Returns the SAME `section` reference when nothing resolves (old
 * pages / null-goal / non-object), else a shallow clone with the changed
 * `elementMetadata`/`elements` sub-objects replaced.
 *
 * Single source of truth for the per-section pass: BOTH the pure `normalizeCtas`
 * and the editor-only memo (`createNormalizeCtasMemo`) call it, so their output is
 * structurally identical by construction (the memo parity test pins this).
 */
function normalizeSection(section: any, ctx: NormalizeCtasContext): any {
  if (!section || typeof section !== 'object') return section;
  const meta = section.elementMetadata;
  if (!meta || typeof meta !== 'object') return section;

  let metaClone: Record<string, any> | null = null;
  let elementsClone: Record<string, any> | null = null;

  for (const elKey of Object.keys(meta)) {
    const entry = meta[elKey];
    const cta: CTAButton | undefined = entry?.cta;
    if (!cta) continue; // no cta → untouched

    const buttonConfig = ctaToButtonConfig(cta, ctx);
    if (buttonConfig === undefined) continue; // unresolvable → leave untouched

    if (!metaClone) metaClone = { ...meta };
    metaClone![elKey] = { ...entry, buttonConfig };

    // goal-ref-cta phase 3.5 — bridge the resolved href into the sibling flat
    // `cta_href` for templates that render it directly. GOAL_REF-ONLY: an
    // explicit/detached Destination (concrete `cta.dest`) and a user-set flat
    // href both win over the bridge (spec criterion 5). Legacy metadata-less
    // buttons never reach here (`if (!cta) continue;` above).
    const hrefKey = GOAL_REF_FLAT_HREF_KEYS[elKey];
    if (hrefKey && cta.dest === 'GOAL_REF') {
      // Same resolution the wired blocks get, minus a fallback (empty = could
      // not resolve → do NOT touch the flat href).
      const resolvedHref = resolveCtaHref(
        buttonConfig,
        ctx.forms as Record<string, any> | undefined,
        '',
      );
      const existing = section.elements?.[hrefKey];
      const isDefaultOrEmpty =
        existing === undefined ||
        existing === null ||
        existing === '' ||
        (typeof existing === 'string' && SCHEMA_DEFAULT_CTA_HREFS.has(existing));
      if (resolvedHref && isDefaultOrEmpty && existing !== resolvedHref) {
        if (!elementsClone) elementsClone = { ...(section.elements ?? {}) };
        elementsClone![hrefKey] = resolvedHref;
      }
    }
  }

  if (metaClone || elementsClone) {
    const nextSection: Record<string, any> = { ...section };
    if (metaClone) nextSection.elementMetadata = metaClone;
    if (elementsClone) nextSection.elements = elementsClone;
    return nextSection;
  }
  return section;
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
    const nextSection = normalizeSection(section, ctx);
    if (nextSection !== section) {
      if (!contentClone) contentClone = { ...(content as Record<string, any>) };
      contentClone[sectionKey] = nextSection;
    }
  }

  return (contentClone as T) ?? content;
}

/**
 * perf-01 phase 4 (B1) — editor-only per-section memoizing wrapper over the pure
 * `normalizeSection`. The edit renderer re-runs `normalizeCtas` on every keystroke
 * (its `content` memo depends on `rawContent`), and the pure pass RE-CLONES every
 * cta-bearing section each call → fresh props for header/footer/every cta section
 * → React.memo shallow-compare fails → they re-render. This factory caches each
 * section's normalized clone and reuses it while (a) the raw section object ref is
 * unchanged (Immer keeps unchanged sections' refs; only the edited section gets a
 * fresh ref) AND (b) the cta-resolution context is unchanged. Unchanged sections
 * therefore keep a STABLE output ref across keystrokes, so the spread `data` props
 * stay ref-equal and memo'd blocks don't re-render.
 *
 * Output is structurally identical to pure `normalizeCtas` — it calls the SAME
 * `normalizeSection` and assembles the top-level clone the same way. Plain module
 * (no 'use client'); the published renderer must keep using the pure export.
 */
export function createNormalizeCtasMemo() {
  // sectionKey → last {input ref, ctx signature, output section}. Bounded by the
  // project's section count via per-call pruning below.
  const cache = new Map<string, { inputSectionRef: any; ctxSignature: string; outputSection: any }>();

  return function normalizeCtasMemo<T>(content: T, ctx: NormalizeCtasContext): T {
    if (!content || typeof content !== 'object') return content;

    const ctxSignature = computeCtxSignature(ctx);
    const contentObj = content as Record<string, any>;
    const keys = Object.keys(contentObj);

    // Prune cache keys no longer present in the current section set (bounded
    // growth across a long editing session as sections are added/deleted).
    if (cache.size > keys.length) {
      const present = new Set(keys);
      for (const k of cache.keys()) {
        if (!present.has(k)) cache.delete(k);
      }
    }

    let contentClone: Record<string, any> | null = null;

    for (const sectionKey of keys) {
      const section = contentObj[sectionKey];
      const cached = cache.get(sectionKey);
      let outputSection: any;
      if (cached && cached.inputSectionRef === section && cached.ctxSignature === ctxSignature) {
        outputSection = cached.outputSection;
      } else {
        outputSection = normalizeSection(section, ctx);
        cache.set(sectionKey, { inputSectionRef: section, ctxSignature, outputSection });
      }
      if (outputSection !== section) {
        if (!contentClone) contentClone = { ...contentObj };
        contentClone[sectionKey] = outputSection;
      }
    }

    return (contentClone as T) ?? content;
  };
}

/**
 * Signature of the cta-resolution context, derived ONLY from what per-section
 * resolution consumes: `ctaToButtonConfig` reads `ctx.goal`, `ctx.forms`,
 * `ctx.currentPagePath`, `ctx.formPagePath` (via `goalToDestination`), and the
 * flat-href bridge reads `ctx.forms`. `buildNormalizeCtasContext` returns exactly
 * these four fields (its `pages` arg is consumed to compute `formPagePath`, then
 * discarded — no live page content is embedded), so the signature is content-free
 * and stays stable across keystrokes.
 */
function computeCtxSignature(ctx: NormalizeCtasContext): string {
  return JSON.stringify({
    goal: ctx.goal ?? null,
    forms: ctx.forms ?? null,
    currentPagePath: ctx.currentPagePath ?? null,
    formPagePath: ctx.formPagePath ?? null,
  });
}
