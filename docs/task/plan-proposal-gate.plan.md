---
tier: full
tier-why: auto-escalated from standard — the single-page caveat is real (scout-confirmed gap): the live work journey never seeds a one-pager, so Single-page requires a sitemap-seed change (`useWizardStore.ts:1219-1239`) that folds about/prices/contact sections onto Home. Load-bearing data correctness: get it wrong and Single-page silently drops content from generation.
spec: docs/task/plan-proposal-gate.spec.md
workdir: C:\Users\susha\lessgo-ai\.claude\worktrees\plan-proposal-gate
branch: feature/plan-proposal-gate  (verify `git branch --show-current`; hard-stop on mismatch — never checkout/switch)
---

# plan-proposal-gate — implementation plan

## Overview

Replace the overloaded STEP 04 "Here's your site" gate with the reconceived design: a SITE SHAPE choice (Single-page vs Multi-page, pre-selected to the deterministic `proposeWorkSiteStructure()` guess) plus PAGES tiles from the closed `workPageTypes` master list (Home locked), **pre-selected to the proposal's page subset per archetype** (compact → home/work/contact; standard → all 5), then "Build my site". Photos, per-page goal selector, section rows, rename, reorder and lead-swap all leave the gate (editor's job). The plan still persists to `Brief.structure` through the ONE existing write door (`applyPlanEdit`/pure helpers → `buildPlanCommit` → `commitRail`), and the approve-before-advance invariant is preserved byte-for-byte. The load-bearing new machinery: a Single-page fold that stacks the FULL multi-page section set onto one Home page so nothing is silently dropped, and a proposal-filtered multi seed so the tile preselection matches the archetype.

## Progress log

- phase 1 shape/seed machinery + unit tests: pending
- phase 2 PlanStep UI rework + e2e rewrite: pending

## Ground-truth constraints (scout-confirmed — bind both phases)

- Live seed (`src/hooks/useWizardStore.ts:1219-1239`) builds the sitemap from the TEMPLATE archetype menu (`getPageArchetypesForTemplate('atelier')` → Home/Work/**Experiences**/About/Contact, keys `home|work|experiences|about|contact`), NOT from `workPageTypes`. Atelier has **no `prices` page — `experiences` (slug `/experiences`, sections `packages`+`proof`) plays that role** (`src/modules/audience/product/pageArchetypes.ts:133-190`). The tile layer must bridge the two vocabularies **in both directions** (menu→canonical alias `experiences → prices`, and canonical→menu reverse alias `prices → experiences` for proposal-driven filtering).
- Proposal page subsets (`src/modules/engines/workPages.ts:247-251`): `one-pager` = `[home]`, `compact` = `[home, work, contact]`, `standard` = `[home, work, prices, about, contact]`. `proposeWorkSiteStructure` (`workPages.ts:310-342`) may also splice `work-group` into `pages` when `promotedGroupCount > 0` — the seed must NOT auto-create that page (ruling: work-group stays user-attached via its tile).
- `Brief.structure` shape unchanged: ALWAYS `mode:'multi'`, even for a one-page site (`plan.ts:191-213`). Setting `'single'` would break `isMultipage()` (`pageArchetypes.ts:243-255`) and the resume/seed path — do NOT.
- Approve invariant (`PlanStep.tsx:187-201`): live-state read, ONE awaited idempotent `commitRail(buildPlanCommit(...))`, advance to step 5 ONLY on `ok`, inline `plan-error` alert on failure, `approving` re-entrancy guard. Preserve verbatim. Keep testids `step-plan`, `plan-build`, `plan-error`.
- One write door: no new API route / saveDraft call / store action. All edits flow `pure validator → buildPlanCommit → commitRail`.
- Proof hard rule (F22): any newly constructed page's sections pass `filterSectionsByProof` (`src/modules/audience/product/strategy/parseStrategyProduct.ts`, already imported by the seed) — an unpromised `proof` section is never seeded/added.
- Firewall: `deriveStructureSignals` must NOT be exported out of `src/modules/audience/work/slimStrategy.ts` for store use — that would drag `workElementContract`/`professionWording`/`./voice` into the pre-confirm bundle. It is RELOCATED to `src/modules/engines/workPages.ts` (already home to `WorkStructureSignals` + `proposeWorkSiteStructure`; deps type-only) and re-imported by `slimStrategy.ts`.
- Shell contract: `JourneyShell.tsx:196-212` owns top bar + rail; PlanStep renders body only (shape + tiles + CTA), never a rail.
- App-chrome only: Tailwind `app.*` classes (`tailwind.config.js:677-751`), `font-app-sans`, `<AppIcon>`; no hardcoded hexes. Copy = the design's plain language; internal keys (hero/proof/archetype) never on screen. Product name "Lessgo AI".
- This is pure app-chrome onboarding UI + pure modules — no template blocks touched, so the dual-renderer parity rule is not in play (note for reviewers).

---

## Phase 1 — shape/seed machinery (pure) + unit tests

The risky, data-correctness half. **Additive only** — the existing `PlanEdit` variants (`renamePage`/`movePage`/`setGoal`) stay in this phase so `PlanStep.tsx` (untouched until phase 2) keeps compiling; they are deleted in phase 2 with the UI that used them.

### Files touched

1. `src/modules/wizard/work/shape.ts` — **NEW** pure module (sibling of `plan.ts`; same firewall rules: pure data + types only, no react/stores).
2. `src/modules/wizard/work/shape.test.ts` — **NEW** unit suite.
3. `src/modules/wizard/work/plan.ts` — extend (tile toggle + work-group add); existing edits untouched this phase (`plan.ts:54-59` vocab grows, nothing removed yet). New import: `slugify` from `@/lib/normalize`.
4. `src/modules/wizard/work/plan.test.ts` — add suites for the new pure functions (existing suites untouched this phase).
5. `src/hooks/useWizardStore.ts` — the work+multipage seed branch ONLY (`useWizardStore.ts:1219-1239`). New imports: `getWorkFacts` from `@/lib/schemas/workFacts.schema` (not currently imported by the store), plus `deriveStructureSignals`/`proposeWorkSiteStructure` from `@/modules/engines/workPages` and the `shape.ts` helpers.
6. `src/hooks/useWizardStore.test.ts` — extend the seed tests (file already covers this branch; it references `experiences`).
7. `src/modules/engines/workPages.ts` — RELOCATE `deriveStructureSignals` (+ its private helper `countWorkItems`) here from `slimStrategy.ts:92-106`, verbatim logic (signals: groupCount / workItemCount / `pricesPresent` = any `group.price.amount` / `established` = `facts.establishment === 'established'`). Type imports (`WorkFacts`, `WorkGroup`) type-only. Export it.
8. `src/modules/audience/work/slimStrategy.ts` — delete the moved lines; import `deriveStructureSignals` back from `@/modules/engines/workPages` and re-export it so existing callers/tests are untouched. No logic change.

### Steps

1. **`shape.ts` — the shape layer** (all pure, all taking data as params):
   - `siteShapeOf(pages: WorkSitemapPage[]): 'single' | 'multi'` — `single` iff exactly one page and it is home (`archetypeKey === workPageTypes.home.key`).
   - `foldToSinglePage(pages: WorkSitemapPage[]): WorkSitemapPage[]` — returns `[homePage]` where `sections` = **union of every input page's sections**, deduped, **ordered by `workPageTypes.home.allowedSections`** (`workPages.ts:83` → `hero, work, proof, packages, about, contact`) and clamped to that list (sections outside home's allowed set are dropped — emit a `console.warn` naming the dropped sections; surfaced again at the phase-2 human gate). Title/slug/goal from the input home page (or `workPageTypes.home` defaults if absent — defensive). Input pages are already proof-filtered, so the union inherits F22 correctness; still run the result through `filterSectionsByProof` for belt-and-braces (needs the proof input passed in — accept `{ hasTestimonials }` in an opts param mirroring the seed at `useWizardStore.ts:1231-1233`).
   - `expandToMultiPage(menu: PageArchetypeDef[], opts: { hasTestimonials?: boolean; pages?: WorkPageTypeKey[] }): WorkSitemapPage[]` — the menu-default multi seed as ONE reusable pure function: `menu.filter(defaultIncluded).map(...)` with `filterSectionsByProof([...a.defaultSections])`, exactly mirroring the current inline seed (`useWizardStore.ts:1222-1234`), **then filtered by `opts.pages` when provided**: keep a menu def iff its canonical key (`TILE_ALIAS[def.key] ?? def.key`) ∈ `opts.pages`. Equivalently expressed via the reverse alias: menu key ∈ `opts.pages.map(p => MENU_KEY_FOR_TILE[p] ?? p)` — implementer picks one, same result. `pages` entries with no menu def (e.g. `work-group` from a promoted proposal) are silently skipped — that page is user-attached via its tile, never auto-seeded. Menu order preserved. No `opts.pages` → full menu (used by the phase-2 single→multi no-stash restore). This is the ONLY page-construction path for seed AND shape toggle — no drift.
   - `TILE_ALIAS: Record<string, WorkPageTypeKey>` — sitemap `archetypeKey` → canonical tile key: identity for `home/work/prices/about/contact/blog` + `work-detail → 'project-story'` (reuse `ARCHETYPE_TO_PAGE_KEY` semantics from `plan.ts:74-78`) + **`experiences → 'prices'`** (the atelier packages page IS the prices tile).
   - `MENU_KEY_FOR_TILE: Partial<Record<WorkPageTypeKey, string>>` — the REVERSE alias (canonical → menu key): `prices → 'experiences'` (derive mechanically by inverting `TILE_ALIAS`'s non-identity entries so the two can't drift). Used by the proposal filter and by `applyTileToggle`'s menu-def lookup.
   - `canPromoteWorkGroup(groupCount: number): boolean` — `groupCount >= PROMOTE_GROUP_MIN` (`workPages.ts:275`). The Work-Group tile gate the journey never had (scout finding 3b: `addableWorkPages` deliberately excludes `work-group`).
2. **`plan.ts` — two new pure entry points** (keep `applyPlanEdit` + `PlanEditResult` as-is):
   - `applyTileToggle(tile: WorkPageTypeKey, on: boolean, sitemap: WorkSitemapPage[], ctx: { menu: PageArchetypeDef[] | null; contactMethod?: WorkPageGoalKey; hasTestimonials?: boolean }): PlanEditResult`
     - `on === false`: resolve the sitemap index whose `TILE_ALIAS[archetypeKey] === tile`; delegate to `applyPlanEdit({type:'removePage', index})` (inherits the home guard `plan.ts:132-137` + absence invariant).
     - `on === true`: reject if already present (via alias) or `tile` ∉ closed vocab or `tile === 'home'`/`'work-group'` (work-group has its own door below). Page construction: if the template `menu` carries the def for `MENU_KEY_FOR_TILE[tile] ?? tile` (e.g. `prices` → atelier `experiences` def), build from the MENU def (title/slug/`defaultSections` proof-filtered) and **insert at the menu-order position** (so re-adding restores Home/Work/Experiences/About/Contact order); otherwise build from `workPageTypes[tile]` (`project-story`, `blog`, and any non-menu page) with `defaultGoalForPage(key, contactMethod)` and append last (home stays first — same law as `plan.ts:102-105`).
   - `applyWorkGroupToggle(on: boolean, groupName: string, groupCount: number, sitemap): PlanEditResult` — `on`: reject unless `canPromoteWorkGroup(groupCount)` and no `work-group` page present; build from `workPageTypes['work-group']` (sections `['work']`), slug = `/work/<slug>` derived from `groupName` via **`slugify` imported from `@/lib/normalize`** (the pure helper that `makeCollectionEntry` wraps — import the pure lib function directly, NOT the store-layer helper), title = the group name; insert after the `work` page if present else append. `off`: remove by archetype key `work-group`.
3. **Seed change** (`useWizardStore.ts:1219-1239`) — inside the existing `if (!state.sitemap)` guard:
   - Compute `signals = deriveStructureSignals(getWorkFacts(state.briefFacts))` (guard null facts → skip proposal, keep today's full-menu multi seed) and `proposal = proposeWorkSiteStructure(signals)` (`workPages.ts:310`).
   - `proposal.archetype === 'one-pager'` → seed `foldToSinglePage(expandToMultiPage(menu, proofOpts), proofOpts)` — Home-only, **FULL stacked section set** (fold the whole menu, NOT the one-pager `[home]` subset — the "every section stacked" caveat fix; ruling 6).
   - Otherwise → seed `expandToMultiPage(menu, { ...proofOpts, pages: proposal.pages })` — **the proposal's page subset, NOT the full menu** (ruling 6): `standard` → all 5 (byte-identical to today's seed); `compact` → home/work/contact only (prices + about start OFF, one-tap addable via their tiles). `work-group` in `proposal.pages` is dropped by the filter (no menu def) — not auto-seeded; the tile is the promotion door.
   - Import note: store → `shape.ts`/`workPages`/`workFacts.schema` are pure-data imports (`slimStrategy` is NOT imported by the store — firewall); `plan.ts`/`shape.ts` import from the store TYPE-ONLY (existing pattern, `plan.ts:41`) — no runtime cycle.
4. **Tests**:
   - `shape.test.ts`: fold = union/dedupe/canonical order/clamp-to-allowed (+ warn on drop); fold of atelier 5-page default = home with `hero, work, proof, packages, about, contact` (and WITHOUT `proof` when `hasTestimonials` is false); `siteShapeOf` both ways; `expandToMultiPage` no-filter mirrors the seed (5 atelier pages, proof-filtered); **`expandToMultiPage` with `pages: ['home','work','contact']` (compact) → exactly Home/Work/Contact in menu order, no `/experiences`, no `/about`; with `pages` incl. `prices` → the atelier `experiences` def is kept (reverse alias works); `pages` incl. `work-group` → skipped without error**; `MENU_KEY_FOR_TILE` is the inverse of `TILE_ALIAS`'s non-identity entries; `canPromoteWorkGroup` boundary at `PROMOTE_GROUP_MIN`.
   - `plan.test.ts` additions: toggle-off prices removes `/experiences` (alias) and it's ABSENT from `next`; toggle-off home rejected; toggle-on prices with atelier menu restores the MENU def (slug `/experiences`, menu-order position); toggle-on `project-story`/`blog` builds from `workPageTypes` and appends; toggle-on out-of-vocab key rejected (closed-vocab test — feed a bogus key via cast); duplicate add rejected; `applyWorkGroupToggle` gate + slug derivation (via `@/lib/normalize` `slugify`) + insert-after-work; purity (inputs unmutated).
   - `useWizardStore.test.ts`: one-pager signals (≤3 items, ≤1 group, no prices, not established) → seed is Home-only with the folded FULL stacked sections; **compact signals (e.g. 2 groups, on-request prices, not established) → 3-page seed home/work/contact (no `/experiences`, no `/about`)**; standard signals (≥3 groups OR priced OR established) → today's 5-page seed (regression pin).
   - Relocation pin: existing `slimStrategy` tests stay green untouched (the re-export preserves the import surface).
5. **Fixture note + e2e staleness window (required, blocks phase exit)**: the Kundius e2e fixture (`e2e/helpers/workBriefFixture.ts:72-75`) derives **compact** (2 groups, on-request prices only, no establishment → not one-pager since groupCount > 1; below `STANDARD_MIN_GROUPS=3`, no priced amounts, not established). So after this phase the seeded e2e journey sees a **3-page** seed — the un-rewritten `e2e/workPlan.spec.ts` is EXPECTED stale until phase 2 rewrites it. Do not run the e2e gate between phases; phase 1 verification is tsc + vitest only, and phase 2 lands the matching e2e in the same PR-train. If the fixture's derived archetype ever changes, re-derive this note rather than tweaking product behavior (ruling 4).

### Verification

- `npx tsc --noEmit` — clean.
- `npm run test:run` — full suite green; specifically `src/modules/wizard/work/plan.test.ts`, `src/modules/wizard/work/shape.test.ts`, `src/hooks/useWizardStore.test.ts`, plus regression pins `src/modules/engines/workContract.test.ts`, the slimStrategy suites (relocation must be invisible to them), and `src/modules/audience/product/strategy/proofFilter.test.ts`.
- `npm run lint` — clean.
- No UI change this phase; `PlanStep.tsx` compiles untouched (additive-only contract honored). Known: `e2e/workPlan.spec.ts` stale (step 5) — not part of this phase's gate.

---

## Phase 2 — PlanStep UI rework + e2e rewrite  ⛔ **HUMAN GATE at end**

### Files touched

1. `src/components/onboarding/journey/engines/work/PlanStep.tsx` — full body rework (`PlanStep.tsx:112-458`).
2. `src/modules/wizard/work/plan.ts` — DELETE now-dead `PlanEdit` variants `renamePage` / `movePage` / `setGoal` (`plan.ts:57-59`, `139-173`) — the gate no longer offers them and no other consumer exists (rename/reorder/goal = editor's job per spec Scope OUT). `addPage`/`removePage` + phase-1 functions stay.
3. `src/modules/wizard/work/plan.test.ts` — delete the three matching describes (`plan.test.ts:105-197`); keep add/remove/toggle/purity/`buildPlanCommit` suites (goal-key omission asserts in `buildPlanCommit` tests stay — goals still ride on pages via `defaultGoalForPage`).
4. `e2e/workPlan.spec.ts` — rewrite (details below).

### Steps — UI (design = `Plan Gate Screen (standalone).html`; recreate with app-chrome tokens, never ship the HTML)

1. **Keep unchanged**: component export shape + seam loading (`engines/work.ts:671-716` untouched), `data-testid="step-plan"` root, `approve()` verbatim (`PlanStep.tsx:187-201`), `runPlanEdit`-style live-state commit pattern (`PlanStep.tsx:143-154`, generalized to accept the phase-1 pure results), the `plan-error` inline alert (`PlanStep.tsx:215-223`), `data-testid="plan-build"` CTA wired to `approve()`.
2. **DELETE**: photo strip + `photosWithUrl` (`PlanStep.tsx:88-99, 347-362`), section rows + `sectionRow`/`workVocabulary` usage (`PlanStep.tsx:101-106, 364-380`), goal badge + goal select + `workPageGoalWords` imports (`PlanStep.tsx:382-412`), rename UI (`285-311`), move buttons (`313-332`), add-select dropdown (`225-259`), lead-group swap + `makeLead` + `applyRailEdit` import (`156-173, 419-444`). `rail.ts` itself untouched (ShowWorkStep still uses it).
3. **SITE SHAPE block** — two selectable cards (radio semantics, `role="radio"`/`aria-checked`), testids `plan-shape-single` / `plan-shape-multi`:
   - Multi-page: "A home page plus separate pages for your work, prices and more."
   - Single-page: "One long home page — every section stacked on a single scroll."
   - Selected state derived: `siteShapeOf(sitemap)` — no local shape state as source of truth.
   - Switching multi→single: stash the current multi list in a `useRef`, then `commitRail(buildPlanCommit(foldToSinglePage(liveSitemap, proofOpts), liveFacts))`. Switching single→multi: commit the stashed list if present, else `expandToMultiPage(menu, proofOpts)` full-menu defaults (menu = `getPageArchetypesForTemplate(templateId)` read from the store — pure-data import, firewall-safe: `StructureSlot.tsx:45` precedent). Same optimistic set / failure-revert semantics as every commit; on failure the derived shape simply doesn't change and `plan-error` shows.
4. **PAGES tiles** — rendered ONLY in multi shape (design: tiles belong to Multi). One tile per canonical key with the design's plain descriptions (fixed strings in the component — never internal keys):
   - Home — locked on, no toggle affordance, lock icon: "Your promise, best work and how to reach you."
   - Work: "Your portfolio — every photo, best first." · Prices: "Packages and prices, so buyers pre-qualify." · About: "Your story — who you are and how you shoot." · Contact (own plain line).
   - Optionals: Work Group: "Promote one collection to its own page." (rendered ONLY when `canPromoteWorkGroup(groups.length)`; when shown-but-unqualified is desired instead, greyed + why-tooltip — see gate question 3) · Project Story: "One project, told start to finish." · Blog.
   - Selected state = present-in-sitemap via `TILE_ALIAS` — which means the tiles come up **pre-selected to the proposal's subset** for free (compact seed → prices/about tiles start OFF; unselected pages stay one-tap addable). Tile label = design's fixed strings (ruling 1 — "Prices", never "Experiences").
   - Testids: `plan-tile-<canonicalKey>` (e.g. `plan-tile-prices`), `aria-pressed` for state.
   - Toggle handlers → `applyTileToggle` / `applyWorkGroupToggle` (lead group = `groups[0]?.name`) → on `ok` → `commitRail(buildPlanCommit(res.next, liveFacts))`; on reject → `setError`.
   - Closed vocab: the tile list IS the closed list — no free-form add control of any kind.
5. **CTA + footer**: "Build my site" (`variant="cta"`, `plan-build`) + footer note "You can change the pages anytime after — nothing's locked in." (testid `plan-footnote`). Headline/copy per the design (plain, no "Lessgo" — "Lessgo AI" if the name appears at all).
6. Styling: app-chrome only — `bg-app-surface`/`border-app-hairline`/`text-app-ink`/`text-app-muted`, selected accents `text-app-primary`/`bg-app-tint`, CTA orange via the existing `cta` button variant. Onest inherited; `font-app-sans` on text nodes as the current file does. Icons via `<AppIcon>`.

### Steps — e2e rewrite (`e2e/workPlan.spec.ts`, deterministic-QA rule)

Keep: seeded-resume harness (`seedWorkBrief`, `authedApi`, `answerRequiredQuestions`), serial mode, request interception of `/api/audience/work/generate-copy` slugs + `/api/saveDraft` structure commits, the rate-limit-only retry loop, `loadDraft` DB round-trip. The Kundius fixture derives **compact** (phase-1 step 5) — the tests below are designed around that.

- **Test 1 — compact preselection + closed-vocab add + removal invariant** (evolves the existing test): STEP 04 visible → assert `plan-shape-multi` selected; **assert per-archetype preselection: `plan-tile-home`/`-work`/`-contact` selected (`aria-pressed=true` / home locked), `plan-tile-prices` + `plan-tile-about` UNSELECTED (`aria-pressed=false`)**; assert the rendered tile set ⊆ the closed list and NO other add mechanism exists (`plan-add-select` gone) — **(d) closed-vocab**; **toggle ON `plan-tile-about`** → selected (closed-vocab one-tap add of an unproposed page — leave it on); **toggle OFF `plan-tile-contact`** (a genuinely PRESELECTED page) → deselects — the removal invariant now exercises a page the proposal actually chose; keep the internal-vocab leak probe (adapted forbidden list — descriptions are plain, so `hero/quote/proof/workdetail/cta/collection/testimonial` still must not appear); `plan-build` → step-building → reveal; assert LAST structure commit + DB: `pages` lacks `contact`, includes `about`; `pageDetails` lacks `/contact`, includes `/about`; kept slugs present — **(b)+(c) multi-page separate pages + removed-page-never-generated** (`generatedSlugs` non-empty, lacks `/contact`, contains `/about` and `/work`).
- **Test 2 — single-page fold**: fresh seed → STEP 04 → click `plan-shape-single` → tiles hidden → `plan-build` → reveal; assert LAST structure commit + DB: `structure.mode === 'multi'` (shape contract), `pages === ['home']`, `pageDetails[0].sections` includes `hero`, `work`, `packages`, `about`, `contact` (folded FULL menu — **the caveat assert (a)**, deliberately more than the compact subset; include `proof` iff the fixture promises testimonials); `generatedSlugs` deduped `=== ['/']` — nothing else generated.
- **Test 3 — approve failure does not advance** (deterministic guard for the load-bearing invariant): fresh seed → STEP 04 → intercept `/api/saveDraft` to return 500 ONCE for the structure-commit fired by the `plan-build` click (route handler un-registers after one hit) → click `plan-build` → assert `plan-error` alert visible AND `step-plan` still present (no advance to reveal/step 5); then let the route pass through and optionally re-click to confirm recovery. No LLM call reached — cheap.
- Runtime note: three serial tests, two with real-flow rate-limit retries ≈ 2× this spec's previous wall time — accepted (invariant tests, not smoke).

### Verification

- `npx tsc --noEmit` · `npm run test:run` (plan/shape/useWizardStore suites green after the variant deletion) · `npm run lint` · `npm run build` (full — not just next build).
- `npm run test:e2e -- workPlan` (authed Clerk session; dev server per `e2e/README.md`) — all three tests green.
- Manual dev pass (`npm run dev`): shape cards render per design, tiles toggle optimistically and come up preselected per archetype, commit failure shows `plan-error` without advancing, rail untouched on the left.

### ⛔ HUMAN GATE — founder sign-off before merge

1. **Visual eyeball** vs `Plan Gate Screen (standalone).html` — the O12 fix: gate reads clearly, nothing editor-level on it.
2. **Single-page + Multi-page correctness end-to-end on the QA preview**: Single → one-page site, all sections stacked, nothing silently dropped; Multi → separate pages; both generate + reveal. **Confirm the one-page stack order** — it is `home.allowedSections` order (`hero, work, proof, packages, about, contact`, i.e. prices-before-about) — sign off that this reads right on a real page.
3. **Work Group ruling**: confirm a promoted `/work/<group>` page actually generates + reveals; if downstream chokes on the parametric page, flip the tile to greyed-with-why-tooltip (founder's standing rule) and log a follow-up.
4. **Fold-drop check**: a project-story/work-group page folded into Single drops sections outside `home.allowedSections` (logged via the fold's `console.warn`) — confirm the logged drops (if any appear in QA) are acceptable, or rule a follow-up.
5. **Compact preselection sanity**: a compact-archetype seller (the common new-seller case) lands with prices/about OFF — confirm this default feels right on the real gate (one tap adds them back).

---

## Decisions made (and why)

1. **Prices tile ↔ atelier `experiences` alias, both directions** — the closed master list says "Prices" but atelier's real page is Experiences (`pageArchetypes.ts:159-168`). Tiles key on canonical vocab; `TILE_ALIAS` (menu→canonical) drives selected-state + removal, `MENU_KEY_FOR_TILE` (canonical→menu, mechanically inverted so they can't drift) drives the proposal filter + toggle-on menu-def lookup; toggle-on restores the MENU def (real slug `/experiences`), never a phantom `/prices` page the template's nav was not designed around.
2. **Seed-time proposal, not mount-time** — the shape + tile pre-selection runs inside the existing `if (!state.sitemap)` seed guard, so PlanStep stays derive-only (no auto-commit on mount) and resume/idempotency semantics are untouched. Tiles reflect the proposal purely because the seeded sitemap IS the proposal subset.
3. **`mode:'multi'` always** — a single-page site = a multi-shaped structure with one Home page; keeps `isMultipage()`/fan-out/resume honest (guidance-mandated).
4. **Delete `renamePage`/`movePage`/`setGoal` in phase 2, not phase 1** — phase 1 stays additive so the untouched `PlanStep.tsx` compiles; the dead variants leave with the UI that used them.
5. **Lead-group swap ("which work leads") removed from the gate** — not in the design's shape+tiles+CTA scope; group order is set at STEP 02 (ShowWork) and editable in the editor. Flagged below.
6. **One page-construction implementation** — `expandToMultiPage` (with its optional `pages` filter) is the single path used by the seed, the proposal subset, AND the phase-2 shape toggle; the fold consumes its output. Seed and UI can never drift.
7. **`deriveStructureSignals` relocated to `workPages.ts`, not exported from `slimStrategy`** — exporting from the generation tree would drag `workElementContract`/`professionWording`/`./voice` into the pre-confirm store bundle; `workPages.ts` already hosts `WorkStructureSignals` + the proposer with type-only deps. `slimStrategy` re-imports/re-exports it so its callers and tests are untouched.

## Orchestrator rulings on open questions (BINDING — implementer follows these)

1. **Prices tile label = "Prices"** (the design's closed-vocab copy), NOT "Experiences". Spec: design is the visual source of truth and its tile copy is "Prices" / "Packages and prices, so buyers pre-qualify." The atelier `/experiences` slug stays as the real plumbing (unchanged), but the on-screen tile label + description are the design's fixed strings, decoupled from the live page title. Do not surface "Experiences" on the gate.
2. **Lead-swap removed from the gate — confirmed.** Spec Scope OUT strips everything editor-level; group lead/order is set at STEP 02 (ShowWork) and editable in the editor. Not re-homed on the gate.
3. **Work Group tile: HIDDEN when unqualified** (`<PROMOTE_GROUP_MIN` groups) — the spec says "only when a group qualifies," and this is a data condition, not a missing capability (the greyed-placeholder rule is for capabilities that don't exist yet). SEPARATELY: if the promoted `/work/<group>` page's downstream **generation** is unproven, that's the missing-functionality case → ship the qualified tile greyed + why-tooltip and log a follow-up. That correctness check is the phase-2 HUMAN GATE item #3 — implement the tile as enabled-when-qualified; the founder rules greyed-vs-enabled at the gate.
4. **Single-page-by-default for one-pager proposals — intended, per spec.** The spec mandates pre-selection to `proposeWorkSiteStructure()` (one-pager → Single). It's a pre-selected DEFAULT the user can flip to Multi (footer: "change anytime"), not a lock. Proceed. The fixture note (phase-1 step 5) records the derived archetype — a fixture-vs-proposal mismatch is a test-fixture concern to raise, NOT a reason to change product behavior.
5. **Single→Multi restores stashed selection — confirmed** (least-surprising; no loss of the user's prior tile choices). Fresh/no-stash → full-menu defaults, as planned.
6. **Multi seed = the proposal's page subset, NOT the full menu.** `compact` → home/work/contact only (prices + about start OFF, one-tap addable via their tiles); `standard` → all 5 (byte-identical to today). **`one-pager` keeps folding the FULL menu onto Home** (the rich single-page stack per spec "every section stacked" — unchanged). Unselected pages remain addable through the closed-vocab tiles. Implementation = the `expandToMultiPage` `pages` filter bridged by the canonical→menu reverse alias; ONE construction path, pure.
