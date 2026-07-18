// src/modules/wizard/work/plan.ts
// ============================================================================
// WORK PLAN EDITS — the STEP 04 tap-power validator (work-onboarding-plan E4,
// phase 3). The plan-side analogue of `rail.ts`'s `applyRailEdit`.
//
// The plan screen edits the SITEMAP (`WizardState.sitemap`, the list
// `buildWorkInput` feeds generation). This module owns two things:
//   1. `applyPlanEdit(edit, sitemap)` — PURE validator: one edit → the next
//      sitemap, or `{ok:false, error}`. Never throws. The invariant guard —
//      a removed page is ABSENT from `next`, so it is eventually not generated.
//   2. `buildPlanCommit(nextSitemap, briefFacts)` — compose the
//      `WizardRailCommit` that persists that sitemap through the EXISTING
//      `commitRail` door. Facts are UNCHANGED (structure edits touch no facts);
//      the `patch.structure` reuses the SAME sitemap→structure mapping as
//      `buildStructurePatch` (useWizardStore.ts) so the two projections never
//      diverge.
//
// ── ONE WRITE DOOR ──────────────────────────────────────────────────────────
// Structure taps go `applyPlanEdit → commitRail(buildPlanCommit(...))`. No new
// saveDraft call, API route, or store action. The one facts-touching tap (swap
// which work leads = reorder `facts.work.groups`) uses the EXISTING
// `applyRailEdit({field:'groups'}) → commitRail` door (rail.ts) — NOT this
// module.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
// PURE: types + the pure-data `workPages` contract only. No react, no stores,
// no hooks, no network. `WizardRailCommit` / `ConfirmedStructure` are TYPE-ONLY
// imports (erased at compile — no runtime cycle with useWizardStore).
// ============================================================================

import {
  workPageTypes,
  workPageTypeKeys,
  addableWorkPages,
  defaultGoalForPage,
  WORK_PAGE_GOAL_KEYS,
  type WorkPageTypeKey,
  type WorkPageGoalKey,
} from '@/modules/engines/workPages';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import type { WizardRailCommit } from '@/hooks/useWizardStore';
import type { ConfirmedStructure } from '@/modules/templates/fit';

// ─────────────────────────────────────────────────────────────────────────────
// Edit vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One plan edit. `index` targets the sitemap position (unambiguous — the UI has
 * it from the column map). `addPage` names a page TYPE key from the designed set;
 * the new page inherits its slug/title/defaultSections from `workPageTypes` and a
 * default goal (the seller's `contactMethod`, when passed, else `'form'`).
 */
export type PlanEdit =
  | { type: 'addPage'; pageKey: WorkPageTypeKey; contactMethod?: WorkPageGoalKey }
  | { type: 'removePage'; index: number }
  | { type: 'renamePage'; index: number; title: string }
  | { type: 'movePage'; index: number; dir: -1 | 1 }
  | { type: 'setGoal'; index: number; goal: WorkPageGoalKey };

export type PlanEditResult =
  | { ok: true; next: WorkSitemapPage[] }
  | { ok: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// archetypeKey → page-type key (reverse of workPageTypes[k].key)
// ─────────────────────────────────────────────────────────────────────────────
//
// The sitemap identifies pages by `archetypeKey`, which equals the page-type key
// for every page EXCEPT `project-story` (whose archetypeKey is `work-detail`,
// reusing the works-collection item archetype). `addableWorkPages` speaks in
// page-type keys, so the present-page set must be mapped back.

const ARCHETYPE_TO_PAGE_KEY: Record<string, WorkPageTypeKey> = (() => {
  const out: Record<string, WorkPageTypeKey> = {};
  for (const key of workPageTypeKeys) out[workPageTypes[key].key] = key;
  return out;
})();

/** The archetypeKey of the non-removable, always-first home page. */
const HOME_ARCHETYPE_KEY = workPageTypes.home.key; // 'home'

function isHome(page: WorkSitemapPage): boolean {
  return page.archetypeKey === HOME_ARCHETYPE_KEY;
}

function currentPageKeys(sitemap: WorkSitemapPage[]): WorkPageTypeKey[] {
  return sitemap
    .map((p) => ARCHETYPE_TO_PAGE_KEY[p.archetypeKey])
    .filter((k): k is WorkPageTypeKey => k !== undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// applyPlanEdit — the pure validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply one plan edit to the sitemap. Pure — returns the NEXT sitemap or an
 * error, never mutating the input and never throwing.
 *
 * Rules:
 *  - addPage    only a page in `addableWorkPages(currentKeys)` (designed set,
 *               not `home`/`work-group`, not already present). Appended last so
 *               `home` stays first. Gets its `defaultSections`/slug/title from
 *               `workPageTypes` + `defaultGoalForPage(pageKey, contactMethod)`.
 *  - removePage index valid; `home` is non-removable.
 *  - renamePage index valid; title trimmed non-empty; slug UNCHANGED (code-fixed).
 *  - movePage   index valid; `home` cannot move and cannot be displaced from
 *               first (a move into position 0 is refused).
 *  - setGoal    index valid; goal ∈ `WORK_PAGE_GOAL_KEYS`.
 */
export function applyPlanEdit(edit: PlanEdit, sitemap: WorkSitemapPage[]): PlanEditResult {
  const pages = [...sitemap];

  switch (edit.type) {
    case 'addPage': {
      const addable = addableWorkPages(currentPageKeys(pages));
      if (!addable.includes(edit.pageKey)) {
        return { ok: false, error: `That page can't be added.` };
      }
      const def = workPageTypes[edit.pageKey];
      const newPage: WorkSitemapPage = {
        archetypeKey: def.key,
        title: def.title,
        pathSlug: def.pathSlug,
        sections: [...def.defaultSections],
        goal: defaultGoalForPage(def.key, edit.contactMethod),
      };
      return { ok: true, next: [...pages, newPage] };
    }

    case 'removePage': {
      const target = pages[edit.index];
      if (!target) return { ok: false, error: 'No such page.' };
      if (isHome(target)) return { ok: false, error: `The home page can't be removed.` };
      return { ok: true, next: pages.filter((_, i) => i !== edit.index) };
    }

    case 'renamePage': {
      const target = pages[edit.index];
      if (!target) return { ok: false, error: 'No such page.' };
      const title = edit.title.trim();
      if (!title) return { ok: false, error: 'A page needs a name.' };
      // slug is code-fixed — rename touches the title only.
      const next = pages.map((p, i) => (i === edit.index ? { ...p, title } : p));
      return { ok: true, next };
    }

    case 'movePage': {
      const target = pages[edit.index];
      if (!target) return { ok: false, error: 'No such page.' };
      if (isHome(target)) return { ok: false, error: `The home page stays first.` };
      const dest = edit.index + edit.dir;
      if (dest < 0 || dest >= pages.length) {
        return { ok: false, error: `That page can't move any further.` };
      }
      if (dest === 0) return { ok: false, error: `The home page stays first.` };
      const next = [...pages];
      const [moved] = next.splice(edit.index, 1);
      next.splice(dest, 0, moved);
      return { ok: true, next };
    }

    case 'setGoal': {
      const target = pages[edit.index];
      if (!target) return { ok: false, error: 'No such page.' };
      if (!WORK_PAGE_GOAL_KEYS.includes(edit.goal)) {
        return { ok: false, error: 'Unknown goal.' };
      }
      const next = pages.map((p, i) => (i === edit.index ? { ...p, goal: edit.goal } : p));
      return { ok: true, next };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildPlanCommit — compose the WizardRailCommit for the one write door
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compose the `WizardRailCommit` that persists an edited sitemap.
 *
 * Facts are UNCHANGED (structure taps touch no facts) — the live bag is re-emitted
 * verbatim so `commitRail`'s one optimistic `set` leaves `briefFacts` intact. The
 * `patch.structure` is built with the SAME sitemap→structure mapping as
 * `buildStructurePatch` (useWizardStore.ts): `mode:'multi'`, `pages` = the
 * archetypeKeys, `pageDetails` = per-page `{archetypeKey, slug, sections, title,
 * goal?}`. `sitemap` carries the edited list so `commitRail` snapshots/sets/reverts
 * it alongside the facts.
 */
export function buildPlanCommit(
  nextSitemap: WorkSitemapPage[],
  briefFacts: Record<string, unknown> | null | undefined
): WizardRailCommit {
  const structure: ConfirmedStructure = {
    mode: 'multi',
    pages: nextSitemap.map((p) => p.archetypeKey),
    pageDetails: nextSitemap.map((p) => ({
      archetypeKey: p.archetypeKey,
      slug: p.pathSlug,
      sections: [...p.sections],
      title: p.title,
      ...(p.goal ? { goal: p.goal } : {}),
    })),
  };

  return {
    patch: { structure },
    // FULL-facts re-emit — unchanged (no fact edit here). Same bag the rail reads.
    facts: { ...(briefFacts ?? {}) },
    sitemap: nextSitemap,
  };
}
