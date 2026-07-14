# content-baseline-split — Implementation Audit

## Phase 1 — Server-additive: `hasBaseline` flag + `?part=baseline` fetch path

### Files changed
- `src/app/api/loadDraft/route.ts` (modified)
- `src/app/api/loadDraft/baseline.test.ts` (new)

### What changed
- `route.ts`:
  - Read `const part = searchParams.get("part")` alongside the existing `tokenId` read.
  - After the existing auth/ownership block AND after `content`/`onboarding` extraction, added a `part === 'baseline'` branch that returns `createSecureResponse({ baseline: content.baseline ?? null })` and nothing else. Placed AFTER auth so it reuses the exact Clerk-auth → demo/admin carve-out → `verifyProjectAccess` chain (no new auth path). Added the required rationale comment.
  - Default response: added `hasBaseline: Boolean(content.baseline)`. Kept the existing `baseline` field with a `// Phase 4 (Deploy B) removes this` comment (removal is Deploy B only — NOT this phase).
- `baseline.test.ts` (new): follows the `saveDraft/i18n.test.ts` mocking pattern (mocks `@clerk/nextjs/server`, `@/lib/prisma`, `@/lib/security`, `@/lib/admin`; route logic real). Mutable `currentUserId` / `ownershipOk` let tests flip auth. Covers all four required assertions: (i) `hasBaseline:true` + baseline still shipped in default; (ii) `?part=baseline` returns ONLY `{ baseline }` (key-set asserted exactly `['baseline']`); (iii) 401 unauthenticated + 403 non-owner on the part fetch; (iv) legacy project → `hasBaseline:false`, part fetch → `{ baseline: null }`.

### Deviations from plan
- None functional. Placed the `part` branch after the `content` extraction line (a few lines below where a bare line-number reading might suggest) so it can reference `content.baseline`; still strictly after the full auth/ownership block as required.

### Verification
- `npx tsc --noEmit`: one PRE-EXISTING, unrelated error only — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (missing asset, not touched by this phase). No errors in the two files changed.
- Scoped tests (`baseline.test.ts` + `i18n.test.ts`): 14 passed.
- `npm run test:run` (full): 166 files passed | 1 skipped; 2821 tests passed | 15 skipped.
- `npm run lint`: no errors; only pre-existing warnings (`<img>` LCP, react-hooks/exhaustive-deps) — none in the changed files.

### Notes for reviewer / open risks
- Purely additive: `baseline` remains in the default response this phase; its removal is Phase 4 / Deploy B only.
- The `?part=baseline` branch is reached only after full auth/ownership, so it inherits demo-token + admin read-only carve-outs unchanged.
- The pre-existing `founder.jpg` tsc error appears to be a worktree asset artifact and is out of scope.

## Phase 2 — Store: `ensureBaseline()` + hydration honors `hasBaseline`

### Files changed
- `src/types/store/state.ts` (modified) — added `baselineAvailable: boolean` to `PersistenceSlice` next to `baseline`/`baselineDirty`, with lifecycle doc-comment.
- `src/stores/editStore.ts` (modified) — seeded `baselineAvailable: false` in createInitialState beside `baseline`/`baselineDirty`; extended the existing non-partialize comment. (partialize is an explicit whitelist, so the field is excluded by construction.)
- `src/types/store/actions.ts` (modified) — added `ensureBaseline: () => Promise<Record<string, any> | null>` next to `captureBaseline`/`markBaselineSaved`.
- `src/hooks/editStore/persistenceActions.ts` (modified) — module-level dedupe map; hydration sets `baselineAvailable`; THE GUARD; `captureBaseline` sets `baselineAvailable=true`; new `ensureBaseline` action.

### What changed
- Hydration (`loadFromDraft`): the `if (storedBaseline)` branch now also sets `state.baselineAvailable = true`; the new `else` sets `state.baselineAvailable = Boolean(apiResponse.hasBaseline)`. Tolerates BOTH shapes (baseline present OR only the flag).
- `captureBaseline()` also sets `state.baselineAvailable = true` — covers legacy backfill and Regen Copy (`generationActions.ts`) with zero changes there.
- `ensureBaseline()`: resident baseline → return it (no fetch); `!baselineAvailable` → return null; else fetch `/api/loadDraft?tokenId=…&part=baseline`, on success `set` `baseline=deepClone(json.baseline)` + `baselineDirty=false`, return it; server null → set `baselineAvailable=false`, return null; fetch failure → clear map entry + throw (no flag flip). All network I/O is outside Immer producers.

### THE GUARD (exact final form)
```
if (!storedBaseline && !apiResponse.hasBaseline) {
  get().captureBaseline();
}
```
Backfill capture fires ONLY when there is no shipped baseline AND the server reports none. A server-side baseline that simply wasn't shipped (`hasBaseline:true`, no `baseline` field — the Phase 4 / Deploy B response) is never recaptured, so autosave can't overwrite the true AI original.

### tokenId source in ensureBaseline
`get().tokenId` — the same `state.tokenId` that `save()` (`:358`) and `loadFromDraft` (`state.tokenId = apiResponse.tokenId || urlTokenId`) use. URL-encoded into `?tokenId=…&part=baseline` (route reads `searchParams.get("tokenId")`/`"part"`, confirmed at `route.ts:54-55,109`). Empty tokenId → return null (no fetch).

### Dedupe-map mechanics
Module-level `const inFlightBaselineFetches = new Map<string, Promise<…>>()` in `persistenceActions.ts` (NOT in store/Immer state — no promises in the store). Keyed by tokenId. On call: if a promise exists for the token, return it (shared request — Reset racing the review prefetch dedupes). Otherwise build the fetch promise, wrap with `.finally(() => map.delete(tokenId))` so the entry clears on settle (success OR failure), store the wrapped promise, return it. Failure propagates via the wrapped promise's rejection (Phase 3 Reset relies on the throw).

### Deviations
- None. partialize is a whitelist (not a denylist), so no exclusion edit was needed for `baselineAvailable` beyond the documentation comment (as the plan intended — "keep it OUT of partialize").

### Verification
- `npx tsc --noEmit`: clean (EXIT 0). The prior phase-1 `founder.jpg` error no longer appears.
- `npm run test:run`: 166 files passed | 1 skipped; 2821 tests passed | 15 skipped. No new failures.
- `npm run lint`: no errors; only pre-existing warnings (`<img>` LCP, react-hooks/exhaustive-deps) — none in changed files.

### Open risks
- No consumer calls `ensureBaseline()` yet (Phase 3 wires Reset + review-diff + preview opt-out). Until then the lazy path is unexercised in-app but unit-clean.
- Backward tolerance intact: loadDraft still ships `baseline` (Deploy A), so `baselineAvailable` derives from the resident branch today; the `hasBaseline`-only branch activates at Phase 4 / Deploy B.

## Phase 3 — Consumers: async Reset + review-diff lazy fetch + preview opt-out

### Files changed
- `src/hooks/editStore/layoutActions.ts` (modified) — `resetToGenerated` now async: awaits `ensureBaseline()` outside any producer, then one `set()`.
- `src/types/store/actions.ts` (modified) — `resetToGenerated: () => Promise<void>` (was `() => void`).
- `src/app/edit/[token]/components/ui/useResetSystem.ts` (modified) — `await resetToGenerated()` before `triggerAutoSave()`.
- `src/components/EditProvider.tsx` (modified) — `prefetchBaselineForReview` option (default true) + `maybePrefetchBaselineForReview` helper + two call sites.
- `src/app/preview/[token]/page.tsx` (modified) — passes `prefetchBaselineForReview: false`.

### resetToGenerated structure (await-then-set, throw-propagation)
```
resetToGenerated: async () => {
  const baseline = await get().ensureBaseline();   // outside producer; THROW propagates
  set((state) => {
    if (baseline) {
      const snapshot = JSON.parse(JSON.stringify(baseline));
      applySnapshot(state, snapshot);
      state.persistence.isDirty = true;
      state.history.undoStack = [];
      state.history.redoStack = [];
      return;
    }
    // baseline === null (true legacy) → EXISTING onboarding-derived fallback verbatim
  });
}
```
- `ensureBaseline()` throw (fetch failure while `baselineAvailable`) propagates out of `resetToGenerated` and is caught by `useResetSystem`'s existing try/catch → toast "Reset failed. Please try again." It does NOT fall into the legacy onboarding fallback (that would apply a WRONG design reset). The legacy fallback runs ONLY on a genuine `null` return (server truly has no baseline).
- Deep-clone kept (comment updated: baseline may alias committed/frozen state).

### refreshFromContent arg shape + matched call site
Used exactly: `refreshFromContent(fresh.content, fresh.baseline, fresh.currentPageId, fresh.globalSettings)` — matched the existing debounced-subscription call site in `EditProvider.tsx` (the reactive refresh, ~`:242`). Signature confirmed at `useReviewState.ts:105-110` (`content`, `baseline?`, `currentPageId?`, `globalSettings?`).

### maybePrefetchBaselineForReview — helper + both call sites
- Module-level helper `maybePrefetchBaselineForReview(store, enabled)`. No-op unless `enabled` AND `useReviewState.getState().needsReviewItems.length > 0` AND `store.getState().baseline === null` AND `store.getState().baselineAvailable`. Otherwise calls `state.ensureBaseline()` (deduped in store); on RESOLVE calls `refreshFromContent(...)` reading fresh state via `store.getState()`; failures swallowed + logged (`logger.warn`).
  - Signature takes `enabled` explicitly (kept helper module-level/pure rather than closing over the prop) — the `(store)`-only shape in the plan is preserved semantically; `enabled` threads the option. Logged under Deviations.
- Call site (i): inside the `initFromContent` try-block right after `initFromContent(...)` (post-load markers).
- Call site (ii): inside the debounced subscription callback right after its `refreshFromContent(...)` (markers appearing later, e.g. section regen before baseline resident).
- `prefetchBaselineForReview` added to BOTH effect dep arrays (`[store, isInitialized, isHydrating, tokenId, prefetchBaselineForReview]` and `[store, tokenId, prefetchBaselineForReview]`).
- The load-bearing `refreshFromContent()` in the resolve handler is present (the ONLY re-derive path on baseline arrival — `ensureBaseline` sets `state.baseline`, not `state.content`, so the content subscription will not fire).

### Preview opt-out
`preview/[token]/page.tsx` passes `prefetchBaselineForReview: false` in the EditProvider `options` object → preview never calls `ensureBaseline()` (no `?part=baseline` request).

### Deviations
- `maybePrefetchBaselineForReview` takes an explicit `enabled` param (module-level pure fn) instead of the literal `(store)`-only signature in the plan text — behaviorally identical (option gate still first check), avoids capturing the prop in a closure. Conservative; keeps the helper reusable/testable.

### Verification
- `npx tsc --noEmit`: clean (EXIT 0).
- `npm run test:run`: 166 files passed | 1 skipped; 2821 tests passed | 15 skipped. No new failures.
- `npm run lint`: no errors; only pre-existing warnings (`<img>` LCP, react-hooks/exhaustive-deps) — none in changed files.

### Open risks
- No `useReviewState.ts` change (as planned): `null` baseline stays conservatively active until baseline lands.
- Reset failure path relies on `ensureBaseline` throwing only when `baselineAvailable && fetch fails` (Phase 2 contract). Genuine-legacy `null` returns still hit the onboarding fallback.
- Deploy-A boundary: server still ships `baseline`, so `ensureBaseline` resolves from resident baseline; the `?part=baseline` fetch path activates at Phase 4 / Deploy B.

## Phase 4 — Server flip: drop `baseline` from default loadDraft response + save-path fence

> ⚠️ DEPLOY B — this phase MUST NOT ship in the same deploy as Phases 1–3 (Deploy A).
> It drops the resident `baseline` blob from the default loadDraft response; clients
> must already be fetching lazily via `?part=baseline` (Phase 1/2/3, baked in Deploy A)
> before this lands, or Reset breaks.

### Files changed
- `src/app/api/loadDraft/route.ts` (modified)
- `src/app/api/loadDraft/baseline.test.ts` (modified)
- `src/app/api/saveDraft/baselinePreserve.test.ts` (new)

### `route.ts` — exact change to the default response
- REMOVED the `baseline: content.baseline ?? null` field (the one carrying the
  `// Phase 4 (Deploy B) removes this` comment) from the DEFAULT response object.
- KEPT `hasBaseline: Boolean(content.baseline)` unchanged.
- KEPT the `?part=baseline` branch fully intact (returns `{ baseline: content.baseline ?? null }`)
  — that is now the sole on-demand path clients rely on.
- Rewrote the now-stale response comments: the old `baseline` comment block became a
  Phase-4 note explaining the blob is no longer shipped + points to `hasBaseline` /
  `?part=baseline`; the `localeConfig` comment lost its stale "mirrors `baseline`" phrasing
  (baseline no longer sits above it) while keeping the whitelist-passthrough rationale.

### `baseline.test.ts` — assertion updates (2)
- (i) default-response test: renamed + now asserts `expect(res.__body).not.toHaveProperty('baseline')`
  and `res.__body.baseline` is `undefined`, while `hasBaseline` stays `true`. (Was: asserted
  `baseline` equalled the stored blob.)
- (iv) legacy test: replaced `expect(dflt.__body.baseline).toBeNull()` with
  `expect(dflt.__body).not.toHaveProperty('baseline')`. `hasBaseline:false` unchanged.
- The `?part=baseline` tests (ii, iii-a, iii-b) are untouched — still return `{ baseline }` /
  still 401/403. Header comment updated to describe the Deploy-B default-response contract.

### `saveDraft/baselinePreserve.test.ts` — new save-path fence (slice-2 regression)
Mirrors `saveDraft/i18n.test.ts` mocking (auth/prisma/security/rate-limit mocked; route +
validation REAL; shared in-memory `store` row seeded with a known `content.baseline`).
Cases:
- (i) save WITHOUT `body.baseline` (a normal edit save that mutates finalContent) →
  the stored baseline stays byte-identical. Key assertion:
  `expect(store.content.baseline).toEqual(STORED_BASELINE)` — compared against a pristine
  module-level reference (`STORED_BASELINE`), while the seed row is a `structuredClone` of it,
  so any in-place mutation of the stored object would diverge and fail. Also asserts the edit
  itself landed (`finalContent.content['hero-1'].elements.headline === 'Edited headline'`).
- (i-b) a metadata-only save (no finalContent, no baseline) also preserves the baseline
  (`toEqual(STORED_BASELINE)`) — proves the guard, not finalContent presence, protects it.
- (ii) save WITH `body.baseline` → wholesale replace: `store.content.baseline` deep-equals the
  NEW value and `not.toEqual(STORED_BASELINE)`.
This fences the `...existingContent` spread + `if (body.baseline !== undefined)` guard against a
future save-path edit silently dropping baseline preservation.

### Manual payload note (Step 4)
No code. The loadDraft DEFAULT response no longer carries the (~68 KB on a naayom-scale project)
baseline blob. Actual byte measurement is deferred to Phase 5 against a real naayom-scale project.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — 167 passed | 1 skipped (168 files); 2824 passed | 15 skipped (2839 tests).
  Targeted trio (baseline.test.ts + baselinePreserve.test.ts + i18n.test.ts) 17 passed.
- `npm run lint` — clean; only pre-existing warnings (techpremium/vestria `<img>`, ph-provider
  exhaustive-deps), none in touched files.
- `npm run build` — FULL build green: `✓ Compiled successfully`, route table emitted normally.

### Deviations
- None. Scope matched the plan exactly.

### Open risks
- DEPLOY ORDERING is the sole risk: shipping this before Phase-1/2/3 clients are live in
  production removes the resident baseline before the lazy `?part=baseline` fetch is in the
  deployed client bundle → Reset would fail. Must merge/deploy strictly after Deploy A bakes
  (orchestrator's rollout concern).

## Phase 5 — QA gate (results)

Orchestrator ruling: run **(c)** script-level dev round-trip; **(b)** browser only if dev Clerk
auth possible w/o founder creds; **(a)** prod naayom read NOT authorized (founder-only).

### (c) script-level dev round-trip — DONE, PASS (12/12) — 2026-07-14
Method: 3 real dev-project `content` blobs extracted read-only (dev DB only; prod untouched),
fed through the REAL `loadDraft GET` + `saveDraft POST` handlers (only auth/prisma/security/
rateLimit mocked; route logic real). Temp test + extract scripts + fixtures deleted after
(never committed); permanent synthetic coverage stays in `baseline.test.ts` + `baselinePreserve.test.ts`.

Fixtures: lumen/service/2pg (99.6KB, baseline 49.1KB) · vestria/product/5pg (61.5KB, baseline
25.6KB) · surge/service/1pg (33.1KB, baseline 16.2KB).

Per fixture verified on REAL content:
1. default loadDraft resp: `baseline` ABSENT, `hasBaseline:true`, `finalContent` byte-identical to stored.
2. `?part=baseline`: returns exactly `{ baseline }` = stored baseline byte-for-byte.
3. edit save WITHOUT `body.baseline` → stored `content.baseline` BYTE-IDENTICAL + `onboarding` preserved + edit landed. (Data-loss guarantee confirmed on real 49/26/16KB baselines.)
4. loadDraft response payload delta: lumen −49.3% (99.6→50.5KB), vestria −41.6% (61.5→35.9KB),
   surge −48.8% (33.1→17.0KB). "Response ~halved" acceptance criterion MET on real content.

### (b) browser editor QA — SKIPPED
Dev editor/loadDraft require a Clerk session; no dev test-user creds without founder credentials.

### Residual (not covered by (c))
Live editor UX on real data — Reset restoring, needs-review markers auto-clearing, Regen-Copy
recapture, publish byte-equivalence — needs Clerk/browser or founder's own naayom prod-copy pass.
Data-loss + payload are validated; residual is UX-correctness, not data-safety.
