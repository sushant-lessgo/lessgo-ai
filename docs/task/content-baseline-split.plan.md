# content-baseline-split — implementation plan

- **TIER:** full (auto-escalated from standard — touches editor-store internals + save path)
- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\content-baseline-split`
- **Branch:** `feature/content-baseline-split`
- **Spec:** `docs/task/content-baseline-split.spec.md`
- **Plan-review round 1:** REVISE → folded in (two-deploy rollout + 3 notes; see "Rollout" section)

## Overview

`Project.content.baseline` (~68 KB header-Reset snapshot) currently ships in every loadDraft response and sits in the editor store from hydration onward, doubling the working payload for the editor AND `/preview/[token]` (same EditProvider path). This plan moves baseline to on-demand delivery: loadDraft stops returning it (returns a cheap `hasBaseline` flag instead), and a lazy `ensureBaseline()` store action fetches it only when a consumer needs it — Reset (user click) and the needs-review auto-clear diff (edit mode only, background, marker-gated). Preview never fetches baseline. Server blob, saveDraft write path, and all behavior (Reset, section/element regen, needs-review markers, Regen-Copy recapture) stay identical.

**Design decision (the crux):** option (b) — deferred lazy fetch into the store.
- (a) slim resident baseline rejected: the review diff compares arbitrary element values per page — a "slim" projection is still most of the copy payload, defeating the goal.
- (c) precomputing markers rejected: markers must re-evaluate live per keystroke against the immutable original; precomputation changes behavior (and Regen-Copy recapture invalidates any precomputed set).
- (b) wins: baseline leaves loadDraft's critical path entirely (biggest preview win), the editor background-fetches it only when needs-review markers actually exist, Reset awaits the same fetch, and behavior is byte-identical once loaded. Store-resident copy after lazy fetch is safe: partialize/undo/export already exclude baseline.

**Acceptance-criteria note (intended interpretation, per orchestrator ruling):** the spec's literal "editor store no longer holds baseline" is softened by design (b): a marker-bearing editor session background-fetches the full ~68 KB back via `ensureBaseline()` after first paint (naayom plausibly has markers). What the design DOES deliver: the loadDraft RESPONSE is ~halved for every load (the measurable criterion), and PREVIEW — the actual driving complaint — fully wins (`prefetchBaselineForReview=false` → preview never ships baseline at all). The editor's reacquisition is deferred off the critical path (one background round-trip, post-paint) rather than eliminated. This is the intended design; do not "fix" it during implementation or review.

**Critical landmine driving phase order:** `persistenceActions.loadFromDraft` calls `captureBaseline()` when the response carries no baseline (legacy backfill). If the server flipped first, every existing project's next load would recapture the *edited* state as baseline (`baselineDirty=true`) and the next save would overwrite the true AI original — silent data corruption on naayom. Phase 1 is server-**additive**, Phase 2–3 teach the client, Phase 4 flips the server default. **No intermediate SERVER state is destructive — but that claim covers server states ONLY.** The remaining hazard is the **stale-client-vs-new-server window**: a browser still running the old prod client JS (guard `if (!storedBaseline)` at `persistenceActions.ts:551`) hitting a baseline-less server response — e.g. App-Router soft-nav or re-entering `/edit/[token]` without a hard reload after a deploy — would mis-capture the edited state as baseline and autosave it over naayom's true AI original (`autoSaveDraft.ts:189`). Phase-5 dev QA cannot catch this (it's a prod rollout race, not a code defect). **That hazard is eliminated by the mandatory two-deploy rollout below — Phase 4 must NOT ship in the same deploy as Phases 1–3.**

**Not conflated:** `Project.aiBaseline` (separate Prisma column, data-capture edit-delta, `queueAiBaselinePatch`) is untouched. Publish and all regen routes never read `content.baseline` (verified) — no server-side regen work needed.

**Slice-2 note (saveDraft round-trip):** already effectively done in prod code — `saveDraft/route.ts:212` only writes `content.baseline` when `body.baseline !== undefined` (spread at `:178` preserves it otherwise), and the client only ships baseline when `baselineDirty` (`persistenceActions.save():333,360`; `autoSaveDraft.ts:189-191`). Phase 4 adds a regression test locking this in; no write-path code change planned.

**perf-01/02 dependency note:** resolved — branch base is current main; `persistenceActions.ts` / `autoSaveDraft.ts` are present and match this plan's line refs (editor-phase-4 store finish already merged to main). No unlanded save-path work blocks this. Phase 2–3 implementer should still re-confirm the cited line numbers before editing (they may have drifted).

## Progress log

- phase 1 server-additive hasBaseline flag + part=baseline fetch: done (commit bab59628, review loops 1, ship)
- phase 2 store ensureBaseline + hydration honors hasBaseline: done (commit 01f49a9f, review loops 1, ship)
- phase 3 consumers — async Reset + review-diff lazy fetch + preview opt-out: done (review loops 1, ship) — DEPLOY-A BOUNDARY (this commit = Deploy A tip)
- phase 4 server flip (DEPLOY B ONLY) — drop baseline from default loadDraft response + save-path regression test: pending
- phase 5 prod-copy round-trip QA gate (naayom): pending
- deploy A (phases 1–3) merge + prod deploy + bake: pending
- deploy B (phase 4) merge + prod deploy: pending

---

## Rollout — MANDATORY two-deploy sequence (HUMAN GATE at each merge)

The server default-response flip (Phase 4) and the new client guard (Phase 2) must NOT reach prod in one deploy: a cached browser running old client JS against the new baseline-less server response mis-captures the edited state as baseline and autosaves over the true AI original (see landmine paragraph above). Rollout is therefore:

1. **Phase 5 QA gate first** — naayom prod-copy round-trip QA in dev on the FULL branch (all phases built) → user sign-off. Gates ANY merge.
2. **Deploy A = Phases 1–3 only.** Merge the Phase-3 commit (not branch tip) to main → deploy. Server STILL ships `baseline` in the default loadDraft response (Phase 1 is purely additive: adds `hasBaseline` + `?part=baseline`; does NOT remove `baseline`). New client tolerates both shapes; its guard is `!storedBaseline && !apiResponse.hasBaseline`, so it never mis-captures. Safe in BOTH directions: new-client/old-server → server still sends baseline; old-client/new-server → server still sends baseline.
3. **Bake.** Wait until cached clients have cycled to the new JS (open question: duration/signal — see unresolved questions). Only then is the old-client guard extinct in the wild.
4. **Deploy B = Phase 4.** Separate merge (branch tip) + deploy: server drops `baseline` from the default response (keeps `?part=baseline`). Only safe once all live clients run Deploy-A JS.

Merge to main is a human gate per repo rules — the gate here is called out TWICE: merge+deploy A, bake, then a separate merge+deploy for Phase 4. The orchestrator must not present these as one merge.

---

## Phase 1 — Server-additive: `hasBaseline` flag + `?part=baseline` fetch path

Purely additive; old clients unaffected (baseline still in the default response — and it STAYS there through Deploy A; removal is Phase 4 / Deploy B only).

**Files touched**
- `src/app/api/loadDraft/route.ts`
- `src/app/api/loadDraft/baseline.test.ts` (new)

**Steps**
1. In `loadDraft` GET, before building the response, read `?part` from searchParams.
2. `part=baseline` branch: after the existing auth/ownership block (Clerk auth → `verifyProjectAccess`, demo-token + admin carve-outs — reuse them EXACTLY, no new auth path), return `createSecureResponse({ baseline: content.baseline ?? null })` and nothing else. Rationale for extending loadDraft instead of a new `assertProjectOwner` route: the baseline blob today ships through this exact route under this exact auth; reusing it keeps one auth surface, keeps demo/admin semantics, and avoids drift. (Note in code comment.)
3. Default response: add `hasBaseline: Boolean(content.baseline)` alongside the existing `baseline` field (field itself removed in Phase 4 / Deploy B — leave a `// Phase 4 (Deploy B) removes this` comment).
4. New test (follow `src/app/api/saveDraft/i18n.test.ts` mocking pattern): (i) default response includes `hasBaseline: true/false` matching stored content; (ii) `?part=baseline` returns only `{ baseline }`; (iii) `?part=baseline` still 401s unauthenticated / 403s non-owner; (iv) legacy project (no `content.baseline`) → `hasBaseline: false`, part fetch returns `baseline: null`.

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run lint`.

---

## Phase 2 — Store: `ensureBaseline()` + hydration honors `hasBaseline`

Client learns the new contract while the old one still works (response still carries baseline until Phase 4 / Deploy B — hydration must tolerate BOTH shapes). Re-confirm cited line numbers against main before editing (perf-01/02 landed; refs may have drifted).

**Files touched**
- `src/hooks/editStore/persistenceActions.ts`
- `src/stores/editStore.ts`
- `src/types/store/state.ts`
- `src/types/store/actions.ts`

**Steps**
1. `src/types/store/state.ts`: add `baselineAvailable: boolean` next to `baseline`/`baselineDirty` — "server holds a stored baseline not yet fetched OR baseline is resident". Doc-comment the lifecycle.
2. `src/stores/editStore.ts`: seed `baselineAvailable: false` beside `baseline: null` (`:309-310`); keep it OUT of `partialize` (extend the existing exclusion comment `:306-308`) — it re-derives on every load.
3. `persistenceActions.loadFromDraft` (`:429`, `:524-527`, `:551-553`):
   - Keep `storedBaseline` tolerance for the old/raw shapes (`apiResponse.baseline ?? apiResponse.content?.baseline`). If present → hydrate exactly as today (`deepClone`, `baselineDirty=false`) and set `baselineAvailable = true`.
   - Else set `baselineAvailable = Boolean(apiResponse.hasBaseline)`.
   - **THE guard:** change the backfill condition from `if (!storedBaseline)` to `if (!storedBaseline && !apiResponse.hasBaseline)` — a server-side baseline that simply wasn't shipped must NEVER be overwritten by a fresh capture. Comment this with the corruption scenario. (This guard is also what makes Deploy A safe for new-client sessions and Deploy B safe once old clients are gone — see Rollout.)
4. `captureBaseline()` (`:623-631`): also set `state.baselineAvailable = true` (capture makes it resident; covers legacy backfill + Regen Copy `generationActions.ts:628` with zero changes there).
5. New action `ensureBaseline: () => Promise<Record<string, any> | null>` in `createPersistenceActions` + type in `src/types/store/actions.ts` (next to `captureBaseline`/`markBaselineSaved`):
   - `state.baseline` resident → return it.
   - `!state.baselineAvailable` → return `null` (server has none; callers use their existing legacy fallbacks).
   - Else `fetch('/api/loadDraft?tokenId=…&part=baseline')`; on success: `set` `state.baseline = deepClone(json.baseline)`, `baselineDirty = false` (already persisted server-side — must NOT re-ship), return it. If server unexpectedly returns null → set `baselineAvailable = false`, return null.
   - In-flight dedupe: module-level `Map<tokenId, Promise>` in `persistenceActions.ts` (NOT in Immer state — no promises in the store), cleared on settle. Reset click racing the review prefetch shares one request.
   - On fetch failure: clear the in-flight entry, `throw` (do NOT flip `baselineAvailable` — callers decide; see Phase 3 Reset semantics).

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run lint`. Manual (dev): load an existing draft — store shows `baseline` hydrated (old response shape still active), `baselineAvailable: true`, no `captureBaseline` fired (no baseline in next autosave body — check network tab).

---

## Phase 3 — Consumers: async Reset + review-diff lazy fetch + preview opt-out

**Files touched**
- `src/hooks/editStore/layoutActions.ts`
- `src/types/store/actions.ts` (`resetToGenerated` signature `:53`)
- `src/app/edit/[token]/components/ui/useResetSystem.ts`
- `src/components/EditProvider.tsx`
- `src/app/preview/[token]/page.tsx`

**Steps**
1. `layoutActions.resetToGenerated` (`:607-…`) becomes `async () => Promise<void>`:
   - `const baseline = await get().ensureBaseline()` FIRST (outside any producer — network in a `set()` is forbidden).
   - Then one `set()` producer: baseline non-null → existing path verbatim (deep-clone, `applySnapshot`, `isDirty=true`, clear both history stacks). Baseline null (server has none — true legacy) → existing onboarding-derived fallback verbatim.
   - `ensureBaseline` throw (fetch failure while `baselineAvailable`) propagates — do NOT fall into the legacy fallback (it would silently apply a WRONG design reset). `useResetSystem`'s existing catch shows "Reset failed. Please try again."
2. `src/types/store/actions.ts:53`: `resetToGenerated: () => Promise<void>`.
3. `useResetSystem.ts:19`: `await resetToGenerated();` before `triggerAutoSave()` (handler already async).
4. `EditProvider.tsx` — review-diff lazy fetch:
   - New provider option `prefetchBaselineForReview?: boolean` (default `true`).
   - Small helper `maybePrefetchBaselineForReview(store)`: no-op unless option enabled AND `useReviewState.getState().needsReviewItems.length > 0` AND `store.getState().baseline === null` AND `baselineAvailable`; else `ensureBaseline()` (deduped) → on resolve, `useReviewState.getState().refreshFromContent(fresh.content, fresh.baseline, fresh.currentPageId, fresh.globalSettings)` reading fresh via `getState()`; swallow+log failures (markers just stay conservatively active — current missing-baseline guard `useReviewState.ts:538` already treats `undefined` baselineVal as active).
   - **IMPLEMENTER MUST NOT DROP the `refreshFromContent()` call in the resolve handler — it is load-bearing.** `ensureBaseline()` sets `state.baseline`, NOT `state.content`, so EditProvider's content subscription (`:229-234` / debounced callback `:239-251`) will NOT fire on baseline arrival. The explicit `refreshFromContent()` in the `.then` is the ONLY thing that re-derives markers post-arrival; without it, an edited-but-still-marked element stays marked until the NEXT content edit — the intended ms-scale marker window becomes a persistent bug.
   - Call it (i) right after `initFromContent` (`:190-198`) and (ii) inside the debounced subscription callback (`:239-251`) after `refreshFromContent` — covers markers appearing later (e.g. section regen inventing new specifics while baseline not yet resident).
   - No change to `useReviewState.ts` itself: `null` baseline is already handled (markers stay active until baseline arrives — ms-scale window post-load, before any user edit can occur).
5. `preview/[token]/page.tsx:33-39`: pass `prefetchBaselineForReview: false` in EditProvider options → preview NEVER fetches baseline (no Reset, markers not rendered there).

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run lint`. Manual (dev, `npm run dev`): (i) header Reset restores original copy+design, toast success, autosave persists; (ii) kill network → Reset shows failure toast, page state untouched; (iii) project with needs-review markers: edit a marked element → marker auto-clears (baseline background-fetched — confirms the `refreshFromContent()` resolve handler fires); (iv) preview tab network log shows NO `part=baseline` request; (v) full Regen Copy → markers reset against NEW baseline (recapture path).

**End of Phase 3 = Deploy-A boundary.** The Phase-3 commit is what Deploy A merges; it must be independently green and shippable (it is: server still sends baseline; client tolerates both shapes).

---

## Phase 4 — Server flip: drop `baseline` from default loadDraft response + save-path regression test — **DEPLOY B ONLY**

Built on the branch after Phases 2–3, but **merged/deployed SEPARATELY, only after Deploy A (Phases 1–3) has baked in prod** — a stale client running pre-Deploy-A JS against this server response mis-captures baseline (see Rollout). Never ship this in the same deploy as Phases 1–3.

**Files touched**
- `src/app/api/loadDraft/route.ts`
- `src/app/api/loadDraft/baseline.test.ts`
- `src/app/api/saveDraft/baselinePreserve.test.ts` (new)

**Steps**
1. Remove `baseline: content.baseline ?? null` (`route.ts:143`) from the default response; keep `hasBaseline` + the `?part=baseline` branch. Update the whitelist comment (`localeConfig` note references `baseline` — fix it).
2. Update `baseline.test.ts`: default response asserts `baseline` key ABSENT + `hasBaseline` correct.
3. New `saveDraft/baselinePreserve.test.ts` (slice-2 lock-in, follow `i18n.test.ts` pattern): (i) save WITHOUT `body.baseline` → stored `content.baseline` byte-identical after save (the `:178` spread + `:212` guard); (ii) save WITH `body.baseline` → wholesale replace. This is the regression fence against future save-path edits losing the guard.
4. Manual payload measurement: on dev with a naayom-scale project (post-Phase-5 copy, or any multi-page draft), record loadDraft response size before/after via browser devtools (or `content-length`). Expect ~half. Record numbers in the phase audit.

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run lint`; `npm run build` (full — route + client both changed). Manual: fresh editor load → store `baseline === null`, `baselineAvailable === true`, autosave body has NO baseline field; then Reset works (lazy fetch); legacy no-baseline project → backfill capture still fires once and ships.

---

## Phase 5 — **HUMAN GATE**: naayom prod-copy round-trip QA (before ANY merge)

**MANDATORY gate — user sign-off required, BEFORE Deploy A.** Naayom is LIVE; this validates zero content loss on real prod data. Runs against the FULL branch tip in dev (all phases incl. 4), so it validates end-state behavior — note it can NOT validate the prod stale-client race; that is mitigated only by the two-deploy rollout sequence.

**Files touched**
- none (QA only; findings → fixes loop back into the owning phase)

**Steps**
1. Use `/api/admin/migrate-project` to copy naayom (`Ix_Ki4FMSWKB`) prod → dev.
2. Snapshot dev `Project.content` JSON to a scratch file (deep-diff reference).
3. In dev editor: load → verify loadDraft response has no `baseline`, `hasBaseline: true`, page renders identically.
4. Edit an element → autosave → verify stored `content.baseline` UNCHANGED (deep-diff vs snapshot; only `finalContent` moved).
5. Header Reset → verify original copy+design restored (matches stored baseline), autosave, then undo the reset damage by re-loading edits if needed (this is a copy — safe).
6. Section regen + element regen → work; needs-review markers derive + auto-clear on edit.
7. Preview `/preview/[token]` → loads (visibly faster), publishes; published output byte-equivalent to a pre-change publish of the same content.
8. Final deep-diff: stored `content` vs snapshot — only fields the session legitimately edited differ; `baseline` blob intact.
9. Present diff summary + payload before/after numbers to user → **sign-off gates the TWO-STEP merge sequence** (Deploy A: Phase-3 commit → bake → Deploy B: branch tip; see Rollout).

**Verification:** the checklist above + `npm run test:run`, `npm run build` green on the branch tip AND on the Phase-3 commit (the Deploy-A merge point). Each merge to main is itself a human gate per repo rules.

---

## Acceptance mapping

- loadDraft ~halved → Phase 4 / Deploy B (measured). "Store holds no baseline at load" → Phase 2 hydration, SOFTENED by design: marker-bearing editor sessions background-refetch post-paint (see Acceptance-criteria note in Overview — intended, ruled acceptable). Preview never holds/fetches baseline → Phase 3 step 5 (the driving complaint, fully solved).
- Reset + regen + needs-review identical → Phase 3 (manual matrix) + Phase 5 on prod copy.
- naayom zero content loss → Phase 5 deep-diff gate (code correctness) + two-deploy rollout (prod race).
- tsc/test:run/build green → every phase; build at Phases 4–5 and at the Deploy-A merge point.

## Unresolved questions

1. Deploy-A bake: how long / what signal? (24–48 h? confirm naayom sessions hard-reloaded? Vercel deploy age?)
2. Deploy mechanics OK? — Deploy A merges the Phase-3 commit of this branch, Deploy B merges branch tip. Alt: split Phase 4 to a follow-up branch. Preference?
3. Payload numbers via devtools manual capture OK, or want a logged byte-count assertion somewhere?
