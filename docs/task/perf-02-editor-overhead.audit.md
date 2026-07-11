# perf-02 — Phase 1 (debug strip & gate) — audit

**Branch:** `feature/perf-02-editor-overhead` (verified via `git branch --show-current` before any edit).

## Files changed
- `src/lib/debugFlags.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `CLAUDE.md`

## Per-file changes

### `src/lib/debugFlags.ts` (NEW)
Plain module (NO `'use client'`). `export const EDITOR_DEBUG = process.env.NEXT_PUBLIC_DEBUG_EDITOR === 'true';`. Build-time inlined → `false` in prod → statement-form guards get Terser-DCE'd. Doc comment records the statement-form + NEXT_PUBLIC rules.

### `src/hooks/editStore/contentActions.ts`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- `updateElementContent` entry log (`🔄 ... CALLED`, incl. `new Error().stack` + `JSON.stringify` preview meta): wrapped in statement-form `if (EDITOR_DEBUG) { ... }`. Zero stack capture per commit by default (dev too).
- Nested-collection-path history gate (was `JSON.stringify(oldCollection) !== JSON.stringify(updatedCollection)`): replaced with a serialization-free direct field compare — `const oldItem = oldCollection.find(item => item.id === itemId); if (oldItem?.[fieldName] !== content) { pushContentHistoryEntry(...) }`. `deepCopy` history snapshots untouched.

### `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- Deleted the "✅ Built userContext" `console.log` outright (per-render success spam).
- Wrapped the "🔍 No validatedFields or hiddenFields" `console.log` in `if (EDITOR_DEBUG) { ... }` (kept as missing-taxonomy diagnostic).

### `src/modules/generatedLanding/LandingPageRenderer.tsx`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- `renderSection` per-section debug logs wrapped in `if (EDITOR_DEBUG) { ... }`, arg/meta-object construction inside the guard:
  - secondary-section log + alternated-section log + CSS-class log (contiguous background-logging block) wrapped in one statement-form guard.
  - hero-section log: guard folded into the existing condition → `if (EDITOR_DEBUG && sectionId === 'hero')`.
- Left the non-renderSection debug logs (`:262` color tokens, `:272` component-body debug, `:689` feature flags) untouched — out of the per-render renderSection hot path named by the phase.

### `CLAUDE.md`
Added `NEXT_PUBLIC_DEBUG_EDITOR=true` to the Debug Environment Variables block with a note (client-side → must be NEXT_PUBLIC; off by default → DCE'd in prod; flag in `src/lib/debugFlags.ts`).

## Sweep (step 7)
Grepped all 3 touched code files for `console.log` / `new Error().stack` in per-render/per-commit paths:
- `contentActions.ts`: only stack-capture site was the entry log (gated).
- `EditablePageRenderer.tsx`: both `console.log`s handled (one deleted, one gated); none remain unconditional.
- `LandingPageRenderer.tsx`: no `console.log`/stack-capture; only `logger.debug` (renderSection ones gated).

## Deviations
1. **Collection-path skip semantics — kept the assignment/queued/dirty unconditional; gated only the history push.** Plan step 4 wording says "skip both the update and the history push". The original code gated ONLY the history push on the stringify-diff; the collection assignment, `queuedChanges.push` (which references `updatedCollection`/`oldCollection`), `isDirty`, and `lastUpdated` were all unconditional. To keep behavior truly identical (no lost updates, no changed dirty/Immer re-render behavior, no orphaned refs) I replaced only the serialization-based history gate with the cheap `oldItem?.[fieldName] !== content` compare. This satisfies the stated verification exactly — no lost updates; undo pushes only on real change; no serialization. Conservative in-scope choice.
2. **CSS-class debug log (`🎨 Section ... CSS class`) also gated.** Plan step 6 names the heavy meta-object logs; this one has a cheap arg but runs unconditionally per section per render in the same block, so it was folded into the same `EDITOR_DEBUG` guard for a clean renderSection hot path. No behavior change (debug is prod-silent regardless).

## Test results
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: 127 files passed / 1 skipped; 2007 tests passed / 3 skipped. Green.

## Open risks
- DCE verification (prod bundle grep for gated strings absent) is deferred to the phase-5 final sweep per the plan; not run here.
- Manual dev QA (type in headline → console silent, undo/redo intact; `NEXT_PUBLIC_DEBUG_EDITOR=true` restores logs) not performed by the agent — left for the human gate.

---

# perf-02 — Phase 2 (autosave: event-driven trailing debounce + effect-churn fix) — audit

**Branch:** `feature/perf-02-editor-overhead` (verified via `git branch --show-current` before any edit).

## Files changed
- `src/hooks/editStore/persistenceActions.ts` (7 mechanical `lastUpdated` bumps)
- `src/hooks/useAutoSave.ts` (event-driven debounce + dispatchSave + flushes + finalConfig memo)

`EditLayout.tsx` was intentionally NOT touched — the caller passes a primitive-only literal config (`{ enableAutoSave: true, enableVersioning: true }`); the new `useMemo` inside the hook (keyed on individual primitive fields) stabilizes `finalConfig` for free, so no stable-object wrapper was needed at the call site (plan step 5 / Files-touched "only if" condition not met).

## Per-file changes

### `src/hooks/editStore/persistenceActions.ts`
MECHANICAL ONLY (plan step 1). Added `state.lastUpdated = Date.now();` beside the 7 `persistence.isDirty = true` setters that lacked it: `addFormField`, `removeFormField`, `updateFormField`, `toggleFormFieldRequired`, `updateImageAsset`, `removeImageAsset`, `reorderSections`. ZERO logic changes to `save()` / `triggerAutoSave()` / :349 success-clear. `git diff` confirms only 7 additive one-liners (defense-in-depth / trailing-debounce precision; correctness rests on the OR-gate, not these).

### `src/hooks/useAutoSave.ts`
- Added module consts `DEBOUNCE_MS = 1000`, `RETRY_BASE_MS = 2000`, `MAX_RETRY_ATTEMPTS = 3`.
- `finalConfig`: destructure config into primitives (aliased `cfg*` to avoid colliding with the existing `enableAutoSave`/`disableAutoSave` action names) + `useMemo` keyed on those primitives → stable object. Effects that depended on `finalConfig` (online, snapshot, onSaveSuccess/onSaveError) stop re-subscribing every render.
- **Removed the 1s `setInterval` poll effect entirely.**
- Added refs: `lastSavedUpdatedRef` (value the last dispatched save captured), `lastSeenUpdatedRef` (last lastUpdated the subscription observed), `debounceTimerRef`, `retryTimeoutRef`, `retryAttemptRef`, `enableAutoSaveRef`, `dispatchSaveRef`.
- **`dispatchSave` (single choke point, stable — `useCallback` dep `[storeApi]`, reads all live state via `getState()`/refs):** uniform OR-gate `(s.lastUpdated > lastSavedUpdatedRef.current || s.persistence.isDirty) && !s.persistence.isSaving` + `enableAutoSaveRef` + `isOnlineRef`. Capture-at-dispatch (`prev = ref; ref = s.lastUpdated`) BEFORE awaiting. Dispatches via `await s.save()` DIRECTLY. `catch`: restore `lastSavedUpdatedRef.current = prev`, then bounded retry `setTimeout(dispatchSaveRef.current, 2s→4s→8s)` capped at 3 attempts; `retryAttemptRef` resets on save success and on any new arm event. `dispatchSaveRef.current = dispatchSave` kept fresh each render.
- **`armDebounce`** (stable): clears + re-sets the trailing debounce timer → fires `dispatchSaveRef.current()` after `DEBOUNCE_MS`.
- **Store-subscription trailing debounce (mount-once `storeApi.subscribe`):** listener does cheap compares — (a) `lastUpdated > lastSeenUpdatedRef` → record + rearm + reset retry counter; (b) `isDirty` false→true → arm + reset retry (plain OR, no saveError clause); (c) mid-flight guard on `isSaving` true→false → re-arm iff `(lastUpdated > lastSavedUpdatedRef || isDirty) && !saveError` (the `&& !saveError` is on THIS guard only). Cleanup: unsubscribe, clear both timers, one last `dispatchSave()`.
- **Teardown flush effect (mount-once):** `visibilitychange`→hidden (cancel timer + dispatch — PRIMARY guarantee); `pagehide` + `beforeunload` (immediate dispatch, best-effort). Keepalive-fetch hardening SKIPPED (would require touching `save()` — plan says skip-if-it-complicates).
- **Online-recovery** re-pointed to `dispatchSaveRef.current()` (was `triggerAutoSave`); effect now mount-once (reads refs only).
- **`triggerSave` action** re-pointed to `dispatchSaveRef.current()` (was `triggerAutoSave`) so no server-save dispatch path in this hook goes through `triggerAutoSave()`.
- VersionManager code, public return shape, and `save()` serialization semantics all UNCHANGED (phase 4 owns VersionManager removal).

## Grep confirmations (plan verification)
1. **OR-gate uniformity / zero solo-`lastUpdated` gates:** the only two `lastUpdated > …Ref` SAVE gates are `useAutoSave.ts:202` (dispatchSave) and `:304` (mid-flight guard) — both `|| …isDirty`. The `:285` `lastUpdated > lastSeenUpdatedRef` compare is a debounce ARM trigger (per-keystroke trailing), paired with the `:294` `isDirty` false→true arm; the actual save dispatch always re-gates on the OR at `:202`. ZERO sites gate a save solely on `lastUpdated`.
2. **Zero `triggerAutoSave` dispatch sites:** `rg triggerAutoSave src/hooks/useAutoSave.ts` → 3 hits, all in comments (`:26` stale legacy NOTE, `:218` and `:434` explanatory). No call sites remain — every dispatch path (timer, mid-flight re-arm, flushes, online recovery, failure retry, `triggerSave`) routes through `dispatchSave()` → `save()`.

## Test / typecheck results
- `npx tsc --noEmit`: green (after aliasing the config destructure to avoid the `enableAutoSave` action name collision).
- `npm run test:run`: 127 files passed / 1 skipped; 2007 tests passed / 3 skipped. Green.

## Deviations
- Config destructure aliased to `cfg*` names (e.g. `cfgEnableAutoSave`) because plain `enableAutoSave`/`disableAutoSave` already exist as action `useCallback`s later in the hook — a name collision (conservative, in-scope naming choice; no behavior change).
- `triggerSave` public action re-pointed to `dispatchSave` (not strictly named in the plan's flush list, but it is a server-save dispatch, and the plan mandates EVERY server-save dispatch use `save()` directly + the grep-confirm requires zero `triggerAutoSave` dispatch sites). Return shape/type unchanged (`() => void`).
- Stale NOTE comment at `:26` ("Saves go through store.forceSave()/triggerAutoSave() only") left as-is — not a call site, not load-bearing, and pre-existing.

## Manual dev gates (human/QA responsibility — agent cannot run a browser)
The code is written to satisfy, but the agent did NOT run:
- **gate a (durability):** reorder section / edit form field / swap image / change nav-social link (lastUpdated-silent, isDirty-only) → close/switch tab → reload → edit persists. Covered by the OR-gate + `isDirty` false→true arm.
- **gate b (mid-flight):** Slow-3G, type during in-flight POST → second POST fires ~1s after completion carrying the newer edit. Covered by capture-at-dispatch + mid-flight guard re-arm.
- **gate c (retry):** block `/api/saveDraft` → one edit while idle+online → retries at 2s/4s/8s → stop after 3 → saveError surfaced → new edit re-arms. Covered by the catch bounded retry + counter reset on arm.
- Plus: idle-60s no recurring 1s timer; one typing burst = one trailing POST; navigate-away flush; offline→online recovery.

## Open risks
- Best-effort `pagehide`/`beforeunload` fetch may be killed mid-flight for large (naayom 13-page) payloads — a known non-guarantee per the plan; primary guarantee is visibility-hidden flush + trailing debounce + unmount flush while the doc is alive (+ perf-01 localStorage teardown for same-browser reload).
- `docs/task/perf-02-editor-overhead.plan.md` shows a pre-existing 1-line working-tree change (phase-1 commit hash added) that predates this phase and is NOT part of Phase 2 — left untouched.

## Post-review fix — spurious server save on every editor open (BLOCKER)
**Symptom / root cause:** `useAutoSave`'s store subscription mounts BEFORE the async `loadFromDraft` lands (child effects run before parent; the load is behind a fetch), so `lastSeenUpdatedRef`/`lastSavedUpdatedRef` were captured at the PRE-load `lastUpdated`. `loadFromDraft` bumps `state.lastUpdated = Date.now()` while setting `isDirty = false` (and the follow-up `captureBaseline()` does not dirty). When that `set()` lands, the `:285` `lastUpdated > lastSeenUpdatedRef` arm clause fired → debounce armed → ~1s later `dispatchSave`'s OR-gate was true via the `lastUpdated > lastSavedUpdatedRef` term → POST of unchanged content on every editor open. Data-safe + single POST (not a loop), but a real regression vs the old isDirty-gated poll and it falsified the plan's concern-7 argument.

**Fix (in-hook ONLY; `loadFromDraft`/`persistenceActions.ts` untouched):** In the `:285` `lastUpdated`-advance arm clause, read `state.persistence.isDirty` at the moment of the advance:
- `isDirty === true` (real user edit — same `set()` that bumps `lastUpdated` also dirties) → record `lastSeenUpdatedRef` + reset retry counter + `armDebounce()` (unchanged behavior).
- `isDirty === false` (load / clean programmatic bump) → record `lastSeenUpdatedRef` AND advance the clean baseline `lastSavedUpdatedRef.current = state.lastUpdated` (no save owed) → do NOT arm.

The `:294` `isDirty` false→true arm clause and the `:302` mid-flight `isSaving` true→false guard (`&& !saveError`) are UNCHANGED; the `dispatchSave` OR-gate is UNCHANGED.

**Why the mid-flight guarantee (blocker-2) is preserved:** a mid-flight user keystroke sets `isDirty = true` in the SAME `set()` that bumps `lastUpdated`, so it takes the `isDirty === true` branch → still arms AND never syncs `lastSavedUpdatedRef`. Thus the second (post-completion) POST still fires. Only the load transition — the sole clean `lastUpdated` bump with `isDirty === false` — re-syncs the baseline and suppresses the arm.

**Re-checked (code-level):** freshly-loaded clean page fires NO POST; a normal text edit still arms (isDirty true); a `lastUpdated`-silent edit (form field / nav link, isDirty false→true, no lastUpdated bump) still saves via the `:294` isDirty-arm clause + OR-gate; a mid-flight edit still triggers the second POST.

**Verification:** `npx tsc --noEmit` green; `npm run test:run` 127 files passed / 1 skipped, 2007 tests passed / 3 skipped — green.

**KNOWN ACCEPTED parity gap (reviewer non-blocking note #1):** a `lastUpdated`-silent mutation (isDirty false→true, no lastUpdated bump) landing DURING an already-dirty in-flight save can be dropped. This is identical to the old 1s poll's behavior (equal-not-worse), and is out of perf-02 scope.
