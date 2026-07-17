# work-onboarding-plan (E4) — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-onboarding-plan`
- **Branch:** `feature/work-onboarding-plan`
- **Tier:** **standard** — plan-review loop SKIPPED; per-phase impl-review SKIPPED; ONE whole-diff impl-review at the end. Auto-escalate to full ONLY if a phase is forced to modify the generation/credit path (spec rule).
- **Spec:** `docs/task/work-onboarding-plan.spec.md` (binding). Layout sketch + buyer words: `docs/tracks/workEndtoEnd.md` step 4 + § "The words users see".
- **Posture:** dev-only + flag-gated (`NEXT_PUBLIC_WORK_COPY_ENGINE`, allow-list `['atelier']`), merges ZERO prod-reachable behavior, rides the big-bang batch (unpushed).

## Overview

E4 builds STEP 04 of the work journey: a visual site-plan screen showing the proposed site (one column per page, real ingested photos, plain-word section rows + one-line descriptions, a plain-language goal badge per page) with a deliberately small set of tap-powers (add/remove page from the designed set, rename, reorder, change a page's goal, swap which work leads). On approve it persists the edited plan to `Brief.structure` (via the existing sitemap→structure projection) BEFORE advancing to the EXISTING build step (STEP 05) which fires the EXISTING work generation, landing on E1's EXISTING reveal (STEP 06). E4 touches no generation, credit, rate-limit, or reveal code — the removed-page ⇒ not-generated invariant falls out of the existing `input.pages` fan-out contract.

## Progress log

- phase 1 goal contract + structure carry: pending
- phase 2 seam widening + rich read-only PlanStep: pending
- phase 3 tap-powers through the one write door: pending
- phase 4 approve→structure→fire + e2e invariant + whole-feature green: pending

## Key design decisions (made here, flagged at end)

1. **Page goal = closed enum `WorkPageGoalKey = 'whatsapp' | 'booking' | 'form'`** (mirrors the existing `contactMethod` rail enum), defined in `workPages.ts`. Default per page = `facts.work.contactMethod`, except the contact page defaults to `'form'` (matches the workEndtoEnd sketch). Plain badge wording lives ONLY in `workVocabulary.ts` (single-source rename law). Goal is carried + persisted (`WorkSitemapPage.goal`, `Brief.structure.pageDetails[].goal`) as a forward contract; generation does NOT consume it yet (consuming it would modify the copy path → escalation; existing copy already keys CTA off the `contactMethod` fact).
2. **Sitemap is the edited object; structure is its persisted projection.** Plan edits mutate `WizardState.sitemap` (what `buildWorkInput` feeds generation) and persist via the existing `buildStructurePatch` mirror — two projections of one list, exactly as E1 left it.
3. **One write door preserved:** structure-touching taps go through a NEW pure validator `applyPlanEdit()` (the plan-side analogue of `applyRailEdit`) and persist via the EXISTING `commitRail` serialization chain — `WizardRailCommit` gains an optional `sitemap` field so commitRail's optimistic-set + wholesale-revert also covers the sitemap. No second persistence path, no new API route. The one facts-touching tap (swap lead work = reorder `facts.work.groups`) uses the existing `applyRailEdit({field:'groups'}) → commitRail` door unchanged.
4. **Seam:** widen `steps.plan` to ALSO carry `JourneyStepConfig` (i.e. the founder-signed `loadStep?` field, types.ts:346/356) — FIELD REUSE per the seam doc comment (L332-344 explicitly reserves loadStep for STEP 04), not a third mechanism. `questions()` untouched.
5. **Addable designed set** = non-parametric `workPageTypeKeys` not currently in the sitemap (excludes `work-group` — parametric, needs a group; includes `blog`/`project-story` as explicit adds since only auto-proposal excludes them). `home` is `required` → non-removable, non-reorder-away-from-first.
6. **No second strategy fetch:** `plan.prepare` (work.ts:649) already seeds the sitemap chargeless with idempotency guard — E4 edits that seeded list only.

---

## Phase 1 — Goal contract + structure carries title/goal

Vocabulary + type/schema groundwork; zero UI. Everything optional/additive so existing paths stay green.

**Files touched**
- `src/modules/engines/workPages.ts` — add `WorkPageGoalKey` type + `WORK_PAGE_GOAL_KEYS` const; `defaultGoalForPage(pageKey, contactMethod)`; `addableWorkPages(currentKeys: string[])` helper returning the designed add-menu set (per decision 5).
- `src/modules/engines/workVocabulary.ts` — add `workPageGoalWords: Record<WorkPageGoalKey, {userLabel: string; description?: string}>` (e.g. whatsapp→"Message on WhatsApp", booking→"Book a time", form→"Send the form") + the badge prefix string ("asks visitors to:"). NO internal words.
- `src/modules/audience/work/strategy/parseStrategyWork.ts` — `WorkSitemapPage` gains optional `goal?: WorkPageGoalKey` (title/pathSlug/sections already exist). No behavior change to assembly.
- `src/lib/schemas/brief.schema.ts` — `structure.pageDetails[]` entries gain optional `title` + `goal` (Zod only; brief is JSON — NO prisma migration; mind the shallow-partial trap noted at L61-68).
- `src/hooks/useWizardStore.ts` — `buildStructurePatch` (L621-637) maps `title` + `goal` onto pageDetails; rehydration from persisted pageDetails (~L1001) maps them back onto the sitemap.
- `src/modules/engines/workContract.test.ts` — extend: every `WorkPageGoalKey` has a vocab entry; `defaultGoalForPage` matrix (incl. contact→form); `addableWorkPages` excludes `work-group` + present pages, never removes `home`.

**Steps**
1. Add goal enum + default + addable helpers to `workPages.ts`.
2. Add goal wording to `workVocabulary.ts` (single source).
3. Widen `WorkSitemapPage`, `brief.schema.ts` pageDetails, and both store projections (patch out + rehydrate in) symmetrically.
4. Extend contract tests.

**Verification**
- `npx tsc --noEmit` green.
- `npm run test:run` green (existing structure/round-trip tests unaffected; new contract assertions pass).

---

## Phase 2 — Seam widening + rich read-only PlanStep

STEP 04 renders the real plan (photos, rows, badges) via the reused `loadStep?` injection. No editing yet.

**Files touched**
- `src/components/onboarding/journey/engines/types.ts` — widen `steps.plan` (L387-390) from `{prepare; items}` to also carry `JourneyStepConfig` (`loadStep?`). Update the doc comment to record this is the reserved STEP-04 reuse. NOTHING else on the seam changes.
- `src/components/onboarding/journey/steps/StepPlan.tsx` — mirror `StepShowWork.tsx:35-89`: when `seam.steps.plan.loadStep` present → `lazy(loadStep)` in `<Suspense>`, render `<LazyBody seam onBuildingChange onBlockedChange/>`; keep the current read-only items projection as the stub fallback when `loadStep` absent (other engines).
- `src/components/onboarding/journey/engines/work.ts` — register `steps.plan.loadStep = () => import('./work/PlanStep')` (copy the E2 pattern at L584-589). `plan.prepare`/`items` untouched.
- `src/components/onboarding/journey/engines/work/PlanStep.tsx` — NEW injected component (`JourneyStepProps`): reads `sitemap` + committed facts (`getWorkFacts(briefFacts)`) via `useWizardStore` selectors; renders one column per page: page title, real group photos (`facts.work.groups[].photos[].url`/`blurDataUrl`, no-photo path degrades gracefully — Kundius facts fixture has no URLs), plain-word section rows from `workVocabulary` (userLabel + description; ZERO internal keys), goal badge = `workPageGoalWords[page.goal ?? defaultGoalForPage(...)]`. Visible hierarchy per sketch (photos big, rows small, badge distinct). Keeps the existing "Build my site" advance (`setJourneyStep(5)`) working read-only so the journey never dead-ends mid-feature. Rail stays (journey-wide rule — shell owns it; PlanStep must not hide it).
- `src/components/onboarding/journey/engines/work.test.ts` — assert `steps.plan.loadStep` registered.
- `src/components/onboarding/journey/journeyAgnostic.test.ts` — extend if it asserts the seam/step-frame shape (stub fallback still renders when loadStep absent).

**Steps**
1. Widen `steps.plan` type; fix any structural-typing fallout.
2. Convert `StepPlan.tsx` to the lazy frame with stub fallback.
3. Register the loader in `work.ts`.
4. Build read-only `PlanStep.tsx` from vocabulary + facts + sitemap.
5. Extend registration/agnostic tests.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- Manual (dev, flag on): seed/drive a work journey to STEP 04 → columns render with real content, zero internal vocabulary visible, rail present, Build advances to STEP 05.

---

## Phase 3 — Tap-powers through the one write door

Add/remove/rename/reorder/change-goal + swap-lead-work, all persisted through `commitRail`.

**Files touched**
- `src/modules/wizard/work/plan.ts` — NEW pure module: `PlanEdit` union (`addPage` | `removePage` | `renamePage` | `movePage` | `setGoal`) + `applyPlanEdit(edit, sitemap): {ok: true; next: WorkSitemapPage[]} | {ok: false; error}`. Validation: pages only from the designed set (`workPageTypes`), no duplicates, added page gets its `defaultSections`/slug/title from `workPageTypes` + default goal, `home` non-removable + stays first, rename = non-empty trimmed title (slug unchanged — slugs are fixed in code), setGoal only from `WORK_PAGE_GOAL_KEYS`. Also `buildPlanCommit(nextSitemap, briefFacts)` helper composing the `WizardRailCommit` (unchanged facts + `patch: {structure: …}` reusing the same mapping as `buildStructurePatch` + `sitemap: next`).
- `src/modules/wizard/work/plan.test.ts` — NEW: every edit kind happy-path + every rejection rule; removed page absent from result; add-from-menu gets defaultSections + default goal.
- `src/hooks/useWizardStore.ts` — `WizardRailCommit` gains optional `sitemap?: unknown[]`; `commitRail` (L1328-1407): include it in the pre-edit snapshot, the one optimistic `set`, and the wholesale `revert`. No other store changes; serialization chain untouched.
- `src/components/onboarding/journey/engines/work/PlanStep.tsx` — wire the taps: structure edits → `applyPlanEdit` → `commitRail(buildPlanCommit(...))`; **swap which work leads** → reorder `facts.work.groups` (chosen group first) via the EXISTING `applyRailEdit({field:'groups'}) → commitRail` door (E2 pattern, ShowWorkStep L135-144). Add-page menu from `addableWorkPages`. Surface commit failure (result `{ok:false}`) as an inline retryable error; optimistic UI comes free from the store set/revert. NO section-level rearranging UI.

**Steps**
1. Write `applyPlanEdit` + `buildPlanCommit` + tests.
2. Widen `WizardRailCommit` + commitRail snapshot/set/revert.
3. Wire all five tap-powers in PlanStep (structure taps via plan door; lead-work via groups rail door).

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green (plan mutator suite + existing rail/store tests).
- Manual (dev, flag on): each tap updates the columns instantly, fires ONE `/api/saveDraft` with a `structure` (or groups-facts) patch, survives reload (rehydration round-trip from phase 1); failed save reverts the UI.

---

## Phase 4 — Approve→structure→fire handoff + e2e invariant + whole-feature green

**Files touched**
- `src/components/onboarding/journey/engines/work/PlanStep.tsx` — approve ("Build my site"): run one FINAL awaited `commitRail(buildPlanCommit(currentSitemap, facts))` (idempotent; guarantees `Brief.structure` persisted even if an earlier tap-commit failed), and ONLY on `{ok: true}` → `setJourneyStep(5)`; on failure show error, do not advance. No generation wiring — STEP 05 (`StepBuilding` → `seam.runGeneration` → `buildWorkInput(state).pages = sitemap`) is reused untouched, as are credits/rate-limit (server-side in the work routes) and STEP 06 reveal.
- `src/components/onboarding/journey/steps/StepPlan.tsx` — ensure a SINGLE advance path (the stub-fallback button must not double-offer advance when loadStep is injected; small guard only).
- `e2e/workPlan.spec.ts` — NEW deterministic invariant spec: seed the Kundius work brief (reuse `e2e/helpers/seedWorkBrief.ts` + `workBriefFixture.ts`; flag already 'true' in `playwright.config.ts:112`), drive to STEP 04, assert plain-word rows + goal badges (and zero internal vocab strings like "Hero"/"CTA" in the step body), REMOVE a page (e.g. prices), rename another, approve → assert (a) the persisted `Brief.structure.pages`/`pageDetails` (via `/api/loadDraft` or the saveDraft request body) lacks the removed page + carries the rename, and (b) NO `/api/audience/work/generate-copy` request is made for the removed page's slug during the build (route interception; mock-LLM mode).
- `e2e/helpers/seedWorkBrief.ts` / `e2e/helpers/workBriefFixture.ts` — ONLY if a seeding gap forces it (e.g. journey must land resumable at STEP 04); otherwise untouched.
- `docs/tracks/workEndtoEnd.md` — one-line status mark on step 4 (built, dev-gated).

**Steps**
1. Approve handoff (final commit → gate advance on ok).
2. Single-advance guard in the agnostic frame.
3. Write + stabilize the Playwright invariant spec.
4. Whole-feature re-green.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- `npm run test:e2e` — `workPlan.spec.ts` passes (mock mode).
- `npm run build` + `npm run lint` green (whole-feature gate).

**HUMAN GATE (founder pilot, end of phase 4):** on a FUNDED dev account with the flag on — see Kundius's plan rendered from real content → edit (incl. remove a page + swap lead work) → approve → real generation fires (spends credits; known FREE-tier 429 fan-out risk, backlog #32/#33 — not E4's to fix) → E1 reveal shows a real generated site. Taste + correctness sign-off before whole-diff impl-review/merge prep.

**HUMAN GATE (standing):** if ANY phase discovers it must MODIFY (not just call) the generation/credit path → STOP, escalate tier to full (spec rule).

---

## Invariants honored (checklist for reviewers)

- Seam: `loadStep?` field reuse on `steps.plan`; no new seam mechanism; `questions()` untouched.
- One write door: `applyPlanEdit`/`applyRailEdit` → `commitRail`; no new persistence route.
- `Brief.structure` written + awaited BEFORE `setJourneyStep(5)`; removed page ⇒ absent from `input.pages` ⇒ no copy call.
- No second strategy fetch (edit the `plan.prepare`-seeded sitemap only).
- Zero internal vocabulary in UI — all words from `workVocabulary.ts`.
- Honest wait: `StepBuilding` reused as-is; no look-picker, no fake spinner.
- No dual-renderer/published surface touched; no prisma migration; dev-only flag posture unchanged.

## Open questions / decisions (flagging)

1. Goal enum = 3 contact methods only ('whatsapp'|'booking'|'form') — ok, or want non-contact goals (e.g. "see prices") now?
2. Goal persisted but NOT fed into copy prompts (would modify generation path → escalation). Defer consumption?
3. Addable set includes `blog` + `project-story` (explicit add), excludes parametric `work-group`. Ok?
4. Rename changes `title` only; `pathSlug` stays code-fixed. Ok?
5. Swap-lead-work = reorder `facts.work.groups` (group-order = lead), no new `leadWork` field. Ok?
6. Per-tap persistence (each tap = one saveDraft via commitRail chain) vs batch-on-approve — plan picks per-tap + final idempotent approve commit. Ok?
