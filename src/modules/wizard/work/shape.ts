// src/modules/wizard/work/shape.ts
// ============================================================================
// WORK SITE-SHAPE LAYER — the STEP 04 shape/tiles machinery (plan-proposal-gate
// phase 1). Sibling of `plan.ts`; same firewall rules.
//
// The plan gate lets the seller pick the SITE SHAPE (single-page vs multi-page)
// and the PAGE SET (tiles from the closed `workPageTypes` vocabulary). This
// module owns the PURE data helpers behind that:
//   • `siteShapeOf`      — read the current shape off a sitemap.
//   • `foldToSinglePage` — collapse a multi-page sitemap onto ONE Home page,
//                          stacking every section (union) so nothing is dropped.
//   • `expandToMultiPage`— the ONE menu→sitemap construction path (seed AND the
//                          phase-2 shape toggle share it), with an optional
//                          `pages` subset filter for proposal-driven preselection.
//   • `TILE_ALIAS` / `MENU_KEY_FOR_TILE` — bridge the atelier menu vocabulary
//                          (`experiences`) to the canonical tile vocabulary
//                          (`prices`) in BOTH directions.
//   • `canPromoteWorkGroup` — the Work-Group tile gate.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
// PURE: types + the pure-data `workPages` contract + the pure `filterSectionsByProof`
// helper only. No react, no stores, no hooks, no network. `WorkSitemapPage` /
// `PageArchetypeDef` are TYPE-ONLY imports (erased at compile).
// ============================================================================

import {
  workPageTypes,
  workPageTypeKeys,
  PROMOTE_GROUP_MIN,
  type WorkPageTypeKey,
} from '@/modules/engines/workPages';
import { filterSectionsByProof } from '@/modules/audience/product/strategy/parseStrategyProduct';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { PageArchetypeDef } from '@/modules/audience/product/pageArchetypes';

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulary bridge — sitemap `archetypeKey` ↔ canonical tile key.
// ─────────────────────────────────────────────────────────────────────────────
//
// The seed builds the sitemap from the TEMPLATE menu, whose keys are the menu
// keys (atelier: `home|work|experiences|about|contact`). The tiles + the proposal
// speak the CANONICAL `workPageTypes` vocabulary (`prices`, not `experiences`).
// `TILE_ALIAS` maps an `archetypeKey` → its canonical tile key; identity for
// every page whose archetypeKey already equals a page-type key, plus the two
// non-identity bridges: `work-detail → project-story` (project-story reuses the
// works-collection item archetype) and `experiences → prices` (the atelier
// packages page IS the prices tile).

/** Sitemap `archetypeKey` → canonical `WorkPageTypeKey`. */
export const TILE_ALIAS: Record<string, WorkPageTypeKey> = (() => {
  const out: Record<string, WorkPageTypeKey> = {};
  // Identity for every page-type key + `work-detail → project-story` (that page
  // type's `.key` is `work-detail`).
  for (const key of workPageTypeKeys) out[workPageTypes[key].key] = key;
  // The atelier menu's `experiences` page plays the `prices` role.
  out['experiences'] = 'prices';
  return out;
})();

/**
 * REVERSE alias (canonical tile key → menu `archetypeKey`), derived MECHANICALLY
 * by inverting `TILE_ALIAS`'s non-identity entries so the two can never drift:
 * `project-story → work-detail`, `prices → experiences`. Used by the proposal
 * `pages` filter and by `applyTileToggle`'s menu-def lookup (phase 2).
 */
export const MENU_KEY_FOR_TILE: Partial<Record<WorkPageTypeKey, string>> = (() => {
  const out: Partial<Record<WorkPageTypeKey, string>> = {};
  for (const [archetypeKey, canonical] of Object.entries(TILE_ALIAS)) {
    if (archetypeKey !== canonical) out[canonical] = archetypeKey;
  }
  return out;
})();

// ─────────────────────────────────────────────────────────────────────────────
// siteShapeOf — read the shape off a sitemap.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The current site shape. `single` iff exactly ONE page and it is home; anything
 * else (including an empty list, defensively) is `multi`.
 */
export function siteShapeOf(pages: WorkSitemapPage[]): 'single' | 'multi' {
  return pages.length === 1 && pages[0].archetypeKey === workPageTypes.home.key
    ? 'single'
    : 'multi';
}

// ─────────────────────────────────────────────────────────────────────────────
// expandToMultiPage — the ONE menu→sitemap construction path.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the multi-page sitemap from a template's page-archetype `menu`. This is
 * the SINGLE page-construction path shared by the seed, the proposal subset, and
 * the phase-2 shape toggle — so seed and UI can never drift.
 *
 * `menu.filter(defaultIncluded).map(...)` with `filterSectionsByProof` on each
 * page's `defaultSections` (F22 — an unpromised proof section is never seeded).
 * When `opts.pages` is given, keep a menu def iff its CANONICAL key
 * (`TILE_ALIAS[def.key] ?? def.key`) ∈ `opts.pages`; menu order is preserved.
 * `pages` entries with no menu def (e.g. `work-group` from a promoted proposal)
 * are silently skipped — that page is user-attached via its tile, never seeded.
 * No `opts.pages` → the full menu defaults.
 */
export function expandToMultiPage(
  menu: PageArchetypeDef[],
  opts: { hasTestimonials?: boolean; pages?: WorkPageTypeKey[] } = {}
): WorkSitemapPage[] {
  let defs = menu.filter((a) => a.defaultIncluded);

  if (opts.pages) {
    const wanted = new Set<WorkPageTypeKey>(opts.pages);
    defs = defs.filter((a) => {
      const canonical = TILE_ALIAS[a.key] ?? (a.key as WorkPageTypeKey);
      return wanted.has(canonical);
    });
  }

  return defs.map((a) => ({
    archetypeKey: a.key,
    title: a.title,
    pathSlug: a.pathSlug,
    sections: filterSectionsByProof([...a.defaultSections], {
      hasTestimonials: opts.hasTestimonials,
    }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// foldToSinglePage — collapse a multi-page sitemap onto ONE Home page.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fold a multi-page sitemap into a Home-only single page whose `sections` are the
 * UNION of every input page's sections — deduped, ORDERED by home's
 * `allowedSections` (`hero, work, proof, packages, about, contact`) and CLAMPED to
 * that set. Sections outside home's allowed set are dropped (a `console.warn`
 * names them — surfaced again at the phase-2 human gate). Title/slug/goal come
 * from the input home page (or `workPageTypes.home` defaults, defensive). The
 * result is re-run through `filterSectionsByProof` for belt-and-braces F22
 * correctness. Never mutates the input.
 */
export function foldToSinglePage(
  pages: WorkSitemapPage[],
  opts: { hasTestimonials?: boolean } = {}
): WorkSitemapPage[] {
  const allowed = workPageTypes.home.allowedSections as string[];
  const homeInput = pages.find((p) => p.archetypeKey === workPageTypes.home.key);

  // Union of every page's sections, first-seen order (dedupe).
  const union: string[] = [];
  for (const p of pages) {
    for (const s of p.sections) {
      if (!union.includes(s)) union.push(s);
    }
  }

  const dropped = union.filter((s) => !allowed.includes(s));
  if (dropped.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[foldToSinglePage] dropping section(s) outside home's allowed set: ${dropped.join(', ')}`
    );
  }

  // Ordered by home's allowedSections, clamped to it, then proof-filtered.
  const ordered = allowed.filter((s) => union.includes(s));
  const sections = filterSectionsByProof(ordered, {
    hasTestimonials: opts.hasTestimonials,
  });

  const home: WorkSitemapPage = {
    archetypeKey: homeInput?.archetypeKey ?? workPageTypes.home.key,
    title: homeInput?.title ?? workPageTypes.home.title,
    pathSlug: homeInput?.pathSlug ?? workPageTypes.home.pathSlug,
    sections,
    ...(homeInput?.goal ? { goal: homeInput.goal } : {}),
  };
  return [home];
}

// ─────────────────────────────────────────────────────────────────────────────
// canPromoteWorkGroup — the Work-Group tile gate.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether a promoted `work-group` page may be offered: a group must clear
 * `PROMOTE_GROUP_MIN`. The gate the journey never had (`addableWorkPages`
 * deliberately excludes the parametric `work-group`).
 */
export function canPromoteWorkGroup(groupCount: number): boolean {
  return groupCount >= PROMOTE_GROUP_MIN;
}
