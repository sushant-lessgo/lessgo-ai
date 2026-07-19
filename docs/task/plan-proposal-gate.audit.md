# plan-proposal-gate — Phase 1 implementation audit

Phase 1 ONLY (shape/seed machinery, pure + unit tests). Additive-only; no PlanStep
UI, no e2e, no variant deletions.

## Files changed

1. `src/modules/wizard/work/shape.ts` — NEW pure module.
2. `src/modules/wizard/work/shape.test.ts` — NEW unit suite.
3. `src/modules/wizard/work/plan.ts` — extended (two new pure fns + imports).
4. `src/modules/wizard/work/plan.test.ts` — added tile/work-group suites.
5. `src/hooks/useWizardStore.ts` — work+multipage seed branch reworked (proposal-driven) + imports.
6. `src/hooks/useWizardStore.test.ts` — added proposal-driven seed suite.
7. `src/modules/engines/workPages.ts` — relocated `deriveStructureSignals` + `countWorkItems` here.
8. `src/modules/audience/work/slimStrategy.ts` — deleted moved lines; re-import + re-export.

## Per-file detail

### `src/modules/engines/workPages.ts`
- Added `import type { WorkFacts, WorkGroup }` (type-only, firewall-safe).
- Relocated `countWorkItems` (private) and `deriveStructureSignals` (exported) verbatim from `slimStrategy.ts`. Signals unchanged: groupCount / workItemCount (items or group-count fallback) / pricesPresent (any `group.price.amount`) / established (`facts.establishment === 'established'`).

### `src/modules/audience/work/slimStrategy.ts`
- Deleted the moved `countWorkItems` + `deriveStructureSignals` lines.
- Imports `deriveStructureSignals` back from `@/modules/engines/workPages` and re-exports it (`export { deriveStructureSignals };`) so existing callers/tests keep the same import surface. No logic change. `WorkFacts`/`WorkGroup`/`WorkStructureSignals` imports retained (still used by remaining code).

### `src/modules/wizard/work/shape.ts` (NEW)
- `siteShapeOf` — `single` iff exactly one page and it is home; else `multi` (empty/lone-non-home → multi, defensive).
- `foldToSinglePage(pages, {hasTestimonials})` — union of all sections, deduped, ordered by `workPageTypes.home.allowedSections`, clamped to it (`console.warn` names dropped sections), then `filterSectionsByProof`. Title/slug/goal from input home or `workPageTypes.home` defaults. Pure.
- `expandToMultiPage(menu, {hasTestimonials, pages?})` — the ONE menu→sitemap path: `menu.filter(defaultIncluded).map(...)` with `filterSectionsByProof`; when `pages` given, keep a menu def iff `TILE_ALIAS[def.key] ?? def.key ∈ pages` (menu order preserved; no-def entries like `work-group` silently skipped).
- `TILE_ALIAS` — built from `workPageTypes` (identity + `work-detail → project-story`) plus `experiences → prices`.
- `MENU_KEY_FOR_TILE` — mechanically inverted from `TILE_ALIAS`'s non-identity entries (`prices → experiences`, `project-story → work-detail`) so the two can't drift.
- `canPromoteWorkGroup(groupCount)` — `>= PROMOTE_GROUP_MIN`.

### `src/modules/wizard/work/plan.ts`
- New imports: `filterSectionsByProof`, `slugify` (from `@/lib/normalize`), `TILE_ALIAS`/`MENU_KEY_FOR_TILE`/`canPromoteWorkGroup` (from `./shape`), type `PageArchetypeDef`.
- `applyTileToggle(tile, on, sitemap, ctx)` — off: remove via `TILE_ALIAS` index → delegate `applyPlanEdit({removePage})`; on: reject dup/out-of-vocab/home/work-group, then build from the menu def (real slug, menu-order insert) when present, else from `workPageTypes[tile]` with a default goal (append last, home first). Pure.
- `applyWorkGroupToggle(on, groupName, groupCount, sitemap)` — gate via `canPromoteWorkGroup`; slug `/work/<slugify(name)>`; sections `['work']`; insert after `work` else append; off removes by `work-group` key. Pure.
- Existing `applyPlanEdit` / `PlanEdit` variants (`renamePage`/`movePage`/`setGoal`) + `buildPlanCommit` left untouched (additive-only per phase contract).

### `src/hooks/useWizardStore.ts`
- New imports: `deriveStructureSignals`/`proposeWorkSiteStructure` (workPages), `expandToMultiPage`/`foldToSinglePage` (shape), `getWorkFacts` (workFacts.schema).
- Removed now-unused `filterSectionsByProof` import (its only use was the inline seed, now handled inside the shape helpers).
- Seed branch (inside `if (!state.sitemap)`): derive `facts = getWorkFacts(state.briefFacts ?? undefined)`; if facts → `proposeWorkSiteStructure(deriveStructureSignals(facts))`: `one-pager` → `foldToSinglePage(expandToMultiPage(menu, proofOpts), proofOpts)` (FULL stacked Home); else → `expandToMultiPage(menu, {...proofOpts, pages: proposal.pages})` (proposal subset). Null facts → `expandToMultiPage(menu, proofOpts)` (today's full-menu seed). `mode:'multi'` always (unchanged — the store maps sitemap → structure elsewhere).

## Deviations from the plan

1. **Proof-drop assertion adapted to the real filter (in-scope correctness fix).** The plan's test text expected the atelier fold to drop `proof` when `hasTestimonials` is false. `filterSectionsByProof` (verified in source) drops only the `testimonials` section key; the work/atelier vertical names its proof band `proof` (skeleton registry key), which the filter never touches. So `proof` is ALWAYS kept for atelier and the plan's "WITHOUT proof" assertion is factually impossible with the real filter. Adapted: `shape.test.ts` asserts atelier fold keeps `proof` regardless of `hasTestimonials`, and exercises the F22 proof wiring via a synthetic `testimonials` section instead. This matches the PRE-EXISTING seed behavior exactly (the old inline seed also ran `filterSectionsByProof` over atelier sections and kept `proof`), so no behavior change — only the test expectation was corrected. Logged here per the in-scope-ambiguity rule. No product code diverges from the plan.

No other deviations. `mode:'multi'` preserved; no 'single' mode introduced; variants kept; `deriveStructureSignals` not exported from slimStrategy into the store (relocated to workPages).

## Commands run + results

- `npx tsc --noEmit` — CLEAN for all phase-1 files. One PRE-EXISTING unrelated error remains: `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` — confirmed present on a `git stash` of my changes (it is not mine; a known stale image-type phantom).
- `npm run test:run` (full Vitest) — GREEN: **4089 passed | 15 skipped, 0 failed**. Includes the new `shape.test.ts`, extended `plan.test.ts`, extended `useWizardStore.test.ts`, and the regression pins `workContract.test.ts`, `proofFilter.test.ts`, and the slimStrategy suites (relocation invisible to them).
- Targeted run of the 5 named suites — GREEN: 5 files, 187 passed.
- `npm run lint` — CLEAN: no errors and no warnings on any phase-1 file (only pre-existing `<img>`/exhaustive-deps warnings in unrelated template/provider files).

## Fixture sanity check (phase-1 step 5 — blocks phase exit)

Kundius e2e fixture (`e2e/helpers/workBriefFixture.ts`): 2 groups, both `price.mode:'on-request'` (no amount), no `establishment`, no items. Derivation:
- groupCount = 2, workItemCount = 2 (item-count fallback), pricesPresent = false, established = false.
- one-pager gate needs `groupCount <= 1` → fails (2 > 1). standard gate needs `groupCount >= 3` OR priced OR established → all false. → **compact**.

Result: fixture derives **compact** (NON-one-pager) → the seeded e2e journey will see a 3-page seed. This is the EXPECTED phase-1 outcome; the un-rewritten `e2e/workPlan.spec.ts` is stale until phase 2 (not part of this phase's gate). No product behavior changed to accommodate the fixture.

## Open risks

- The e2e spec `e2e/workPlan.spec.ts` is now stale (compact 3-page seed) — phase-2 rewrites it in the same PR-train. Do not run the e2e gate between phases.
- `.next` was cleared during verification (`rm -rf .next`) to rule out the stale-types phantom; harmless (rebuilds on next dev/build).
