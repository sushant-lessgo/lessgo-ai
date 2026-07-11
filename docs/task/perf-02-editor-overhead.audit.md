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

---

# perf-02 — Phase 3 (overlay fleet removal) — audit

**Branch:** `feature/perf-02-editor-overhead` (verified via `git branch --show-current` before any edit).

## Files changed
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/layout/MainContent.tsx`

(NOT touched: `ElementDetector.tsx` — no hover gap found; `src/types/core/ui.ts` — its `EditablePageRendererProps` copy is not the one imported.)

## Step-1 live-route check (result)
Traced the click/inline-edit path. The live selection + inline-edit route is `useEditor.ts`, NOT overlay state:
- `useEditor.ts:384` registers a document-level bubble-phase `click` listener (`handleEditorClick`) that resolves the nearest `data-element-key` via `.closest()` (`:76`), then calls `selectElement(...)` + `showToolbar(...)` (`:286`/`:294`). This is the single live selection path.
- Inline text editing runs through `useEditor`'s `enterTextEditMode` (`:394`) + `InlineTextEditorV2`.
- The overlay's `isEditing`/`showTextToolbar` state was DEAD: `isEditing` was never set true (its `handleClick` comment: "DISABLED: Don't set isEditing here — let useEditor handle all text editing"; the component always `return null`). `showTextToolbar` (from store) appeared only in a commented-out call. The overlay's one live side effect was a native `click` listener on the DOM target that duplicated the store path (via MainContent's `handleElementClick`) plus `cursor:pointer` + blue-tint hover classes.
Conclusion: overlay state is NOT a live edit route → safe to delete. No STOP/re-plan needed.

## Per-file changes

### `EditablePageRenderer.tsx`
- Deleted the `ElementEditingOverlay` component (~160 lines) and its per-element `.map()` mount inside `EnhancedLayoutWrapper`'s return. Return now renders just `{RenderedLayout}` inside the kept `data-section-id` wrapper div. `RenderedLayout` untouched.
- Removed orphaned props `onElementClick`/`onContentUpdate` from the local `EditablePageRendererProps` interface (the one in use — line 14, NOT `ui.ts:3079`), from the function destructure, from `EnhancedLayoutWrapper`'s prop type + destructure, and from the props passed to `EnhancedLayoutWrapper`.
- Removed the now-orphaned `handleElementClick`/`handleContentUpdate` `useCallback` wrappers (their sole consumer was the deleted overlay map).
- Removed orphaned `import type { TextFormatState }` and the local `TextSelection` interface (both had the overlay as their ONLY consumer — verified via grep).
- **Intentionally KEPT** (out of scope / not orphaned by this phase): pre-existing unused `import { InlineTextEditorV2 }` (was already unused before this change — not made orphaned by overlay removal); the dead `SelectableElementWrapper` / `EditableTextContent` / `EditableButtonContent` / `EditableImageContent` / `EditableListContent` components (pre-existing dead code, unrelated to the overlay); `useEditStore`, `logger`, `EDITOR_DEBUG`, `isHexColor`, `promptDialog` imports (all still consumed elsewhere in the file).

### `MainContent.tsx`
- Removed the `onElementClick={handleElementClick}` / `onContentUpdate={handleContentUpdate}` wiring at the `<EditablePageRenderer>` call site (~:652).
- Removed the now-orphaned `handleElementClick` and `handleContentUpdate` handler defs (their only consumer was the removed wiring; grep-verified no other callers).
- Removed the store-actions they solely consumed from the destructure (`selectElement`, `updateElementContent`, `showElementToolbar`) and the two stub helpers they solely used (`analyzeElementContext`, `isMultiToolbarMode`) to avoid introducing unused-var noise. All grep-verified to have no other consumers. `trackPerformance`/`announceLiveRegion` KEPT (used by other handlers).

## Hover-affordance decision (step 4)
No CSS added. `ElementDetector.tsx` marks every `[data-element-key]` with `.selectable-element` and already injects (`:251`/`:256`) `cursor:pointer` + `.selectable-element:hover { background-color: rgba(59,130,246,0.05); outline: 1px solid rgba(59,130,246,0.2); }`. This is visually equal-or-stronger than the overlay's `hover:bg-blue-50 hover:bg-opacity-50 rounded` (≈ rgba(239,246,255,0.5), no outline). No gap → `ElementDetector.tsx` left untouched.

## Step-5 other-readers check
No other reader of the overlay's props/side effects. `availableElements` fed only a commented-out log (deleted with the overlay). Grep confirmed `onElementClick`/`onContentUpdate` had no consumers outside the removed path.

## Dual-renderer guard
Edit-side only. Published renderer (`LandingPagePublishedRenderer` / `componentRegistry.published`) untouched; no edit-only helper leaked into any published path.

## Verification
- `npx tsc --noEmit`: green.
- `npm run test:run`: 2005 passed / 3 skipped; 2 failures were 5s-timeout flakes in `staticExport/__tests__/{realProofPublishedOutput,multipageGoalRef}.test.ts` under full-suite parallel load — both PASS in isolation (`vitest run` those two files → 8/8 pass in ~5s). Published-path tests, unrelated to edit-side changes.
- Removed on-mount cost: the per-element `setTimeout(100ms)` + ~7 `querySelector`/`querySelectorAll` DOM sweeps are gone (were the fleet's idle/mount overhead). Confirmed no residual overlay timers/sweeps in the touched files.

## Deviations
- Beyond the two orphaned handler defs the plan named, also removed 3 now-unused destructured store actions + 2 now-unused stub helpers in `MainContent.tsx` (conservative cleanup to keep the touched component free of newly-introduced unused-var noise; all grep-verified orphaned). No behavior change — `useEditor`'s document listener already owns selection/toolbar.

## Human/QA gates (cannot run a browser — need manual verification on naayom `Ix_Ki4FMSWKB`)
- Click each element type (headline, body, CTA, collection item, image) → ElementToolbar appears anchored correctly; selection fires ONCE (no double-toggle from the removed duplicate native listener).
- Inline text editing (click-to-edit + format toolbar) unchanged.
- Hover affordance present + visually equivalent.
- Performance tab: no 100ms setTimeout burst / querySelector sweeps on mount; idle 60s clean.
- Editor↔published parity smoke on one section (edit-only change, expected unchanged).

---

## Phase 4 — VersionManager removal from live path

**Human gate:** CLEARED — user approved DELETE (not cap-to-5). No restore path surfaced during implementation (VersionManager methods `undo/redo/exportHistory/getActiveConflicts` were only surfaced through the deleted indicators; editStore's own history stack in `uiActions.ts` is the real undo/redo and was never touched).

**Files changed**
- `src/hooks/useAutoSave.ts` (modified)
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (modified)
- `src/components/ui/SaveStatusIndicator.tsx` (DELETED)
- `src/components/ui/PersistenceStatusIndicator.tsx` (DELETED)

**What was removed from `useAutoSave.ts`**
- `VersionManager` + `ConflictResolution` import from `@/utils/versionManager`.
- `versionManagerRef` + its `new VersionManager({ maxSnapshots: 50, ... })` instantiation.
- `changeCountRef`.
- The version-snapshot-creation `useEffect` (was gated on `enableVersioning` + `queuedChanges`).
- Manager-dependent actions: `undo`, `redo`, `createSnapshot`, `resolveConflict` (+ its manager branches), `getActiveConflicts`, `exportHistory`.
- Convenience fns: `undoLastChange`, `redoLastUndo`, `getConflictSummary`.
- The versioning snapshot block inside `forceSave` (manual-save snapshot).
- `AutoSaveStatus`: dropped `canUndo/canRedo/currentVersion/totalVersions/hasActiveConflicts/conflictCount`.
- `AutoSaveHookConfig`: dropped `enableVersioning/snapshotInterval/conflictResolution` AND the now-orphaned `onConflictDetected/onVersionCreated` callbacks (the latter two were only fired by deleted code and `onConflictDetected` referenced the removed `ConflictResolution` type).
- `AutoSaveActions`: dropped `undo/redo/createSnapshot/resolveConflict/getActiveConflicts/exportHistory`.
- `UseAutoSaveReturn`: dropped `undoLastChange/redoLastUndo/getConflictSummary`.
- Specialized hooks `useSaveStatus`, `useVersionControl`, `useConflictResolution` — all DELETED.

**`useSaveStatus` decision: DELETED.** Grep confirmed its sole consumer was `SaveStatusIndicator.tsx` (deleted this phase). Same for `useVersionControl`/`useConflictResolution` (the useAutoSave copies). Note: `useStatePersistence.ts` defines its OWN `useVersionControl`/`useConflictResolution` (different signatures — take `tokenId`); those are separate and untouched (phase 5's blast radius).

**`EditLayout.tsx`:** the `useAutoSave({ enableAutoSave: true, enableVersioning: true })` call had `{ status, actions }` destructured but never read (scout-confirmed). Replaced with a bare `useAutoSave({ enableAutoSave: true })` (no destructure, no versioning config).

**Grep results (no stragglers)**
- `SaveStatusIndicator|PersistenceStatusIndicator|CompactSaveStatus|DetailedSaveStatus|FloatingSaveStatus|HeaderSaveStatus` across `src/` → 0 files after deletion.
- `from '@/hooks/useAutoSave'` across `src/` → only `EditLayout.tsx` (imports `useAutoSave` only).
- No remaining import of `useSaveStatus`/`useVersionControl`/`useConflictResolution` from `useAutoSave`.

**Phase-2 machinery intact (confirmed):** the event-driven `dispatchSave()` choke point (OR-gate + capture-at-dispatch + bounded 2/4/8s retry), `armDebounce`, the mount-once `storeApi.subscribe` trailing-debounce listener (lastUpdated advance / isDirty false→true arm / mid-flight `!saveError` success re-arm), the teardown visibility/pagehide/beforeunload flush, the online-recovery flush, and the `finalConfig` `useMemo` were all preserved verbatim (memo key just lost the versioning fields). Diff shows only VersionManager/versioning/conflict code removed; the debounce/dispatchSave path is byte-identical.

**Not touched (per plan):** `src/utils/versionManager.ts`, `statePersistence.ts`, `useStatePersistence.ts` (phase 5), `src/utils/autoSaveDraft.ts` (live regen path). Left the two dead-but-harmless `type` imports (`AutoSaveState`, `ChangeEvent`) from `autoSaveMiddleware` in place — `AutoSaveState` is still used by `getPerformanceStats`'s return type; `ChangeEvent` was already unused pre-phase (no `noUnusedLocals` error) and its relocation is explicitly phase 5's step.

**Verification**
- `npx tsc --noEmit` → green (no output).
- `npm run test:run` → green (2007 passed | 3 skipped, 127 files).
- `npm run build` → green (full build incl. published-css/assets + next build).

**Deviations**
- Also removed `onConflictDetected`/`onVersionCreated` config callbacks (beyond the three config fields the plan named) — forced because they were orphaned versioning callbacks and `onConflictDetected` typed against the removed `ConflictResolution` import. Conservative, in-scope (versioning removal). Logged here.

**Open risks / human QA**
- Heap-flat check (acceptance criterion 3: DevTools Memory, ~10-min continuous edit on naayom, heap flat ±10%) is a human/QA gate — not automatable here.
- Manual dev smoke (editor loads, edits save via phase-2 debounce, Ctrl+Z/Ctrl+Y undo/redo via editStore history) pending at merge gate.
