# perf-02 — editor background overhead — implementation plan

**Branch:** `feature/perf-02-editor-overhead`
**Spec:** `docs/task/perf-02-editor-overhead.spec.md`
**Depends on:** perf-01 (landed — same files touched; perf-01's narrow-subscription + localStorage-debounce work is the baseline, do not regress it).

## Overview

The editor does constant background work while idle and leaks memory over long sessions: a per-element overlay fleet (~55 instances) that runs timers + DOM sweeps and renders nothing; a 1s `setInterval` autosave dirtiness poll with render-churning effect deps; a dead `VersionManager` retaining 50 full-page export snapshots; and unconditional debug waste (`new Error().stack` per commit, `console.log` per section per render, stringify-diffs). This plan strips/gates the debug waste, replaces the poll with an event-driven trailing debounce (armed by the store's `lastUpdated` edit signal AND `isDirty` transitions; every save dispatch gated on `lastUpdated > lastSaved || isDirty` — `lastUpdated` alone is NOT a complete edit signal, see phase 2) and dispatched via `persistenceActions.save()` directly (the `isDirty`-gated `triggerAutoSave()` is bypassed — :349 clears `isDirty` on save success, which would no-op mid-flight/teardown flushes; equal-or-better save guarantees), deletes the overlay fleet (selection/toolbar already run entirely through the `EditableElement`/`useEditor` store path), and removes the dead VersionManager + its orphaned UI cluster. NOTE: `src/utils/autoSaveDraft.ts` is a LIVE save path (its `completeSaveDraft` is dynamic-imported by three regen actions) — it is EXCLUDED from all deletions; its double-stringify is off the idle/typing hot path and out of perf-02 scope. No change to WHAT is saved, no UX change, no user-visible undo change (real undo = editStore history stack in `uiActions.ts`, untouched).

**Decisions locked before implementation (was Unresolved Q1/Q2):**
- Debounce delay: **1000ms trailing** (parity with today's ≤1s guarantee; module const, trivial to retune later).
- Teardown `keepalive` POST: **best-effort optional only** — naayom's 13-page payload exceeds the 64KB keepalive body cap and will silently fail, so it is NOT a reliability guarantee. Primary server-save guarantee = visibility-hidden flush + trailing debounce + unmount-cleanup flush while the document is alive. perf-01's localStorage teardown flush (`src/stores/editStore.ts:47-60`) already prevents same-browser reload loss.

## Progress log

- phase 1 debug strip & gate: done (commit dbd6fde6, review loops 1, ship; non-blocking: harmless dead-undo-step in unreachable itemId-not-found path, 1 residual plan-compliant logger.debug)
- phase 2 autosave event-driven debounce: done (commit 983801bf, review loops 2, ship; blocker fixed = spurious save-on-open via load/clean-bump baseline re-sync; known-accepted parity gap: lastUpdated-silent edit during already-dirty in-flight save can drop, equal-not-worse vs old poll)
- phase 3 overlay fleet removal: done (commit 0d5eacc1, review loops 1, ship; overlay confirmed dead via live-route trace, no double-fire, 296 deletions; manual single-fire/hover QA pending at merge gate)
- phase 4 VersionManager removal from live path: done (commit 913a5a8f, review loops 1, ship; human gate cleared = user approved DELETE; phase-2 machinery byte-identical intact, tsc/test/build green; heap-flat 10min QA pending at merge)
- phase 5 dead persistence cluster deletion: done (review loops 1, ship; verify-first passed, 4 files/~2519 lines deleted, autoSaveDraft.ts excluded+intact, tsc/test/build green; orchestrator fixed src/utils/README.md dangling refs; NOTE phase-1 debug strings survive in bundle but never execute — acceptance met at runtime)

## Scope guards (all phases)

- OUT: saveDraft payload/contract changes (that's `content-baseline-split`), UX changes, user-visible undo changes, image work (perf-03), and ANY change/deletion of `src/utils/autoSaveDraft.ts` (live regen save path).
- Editor is client code: build-time env gating must use a `NEXT_PUBLIC_*` var (plain `DEBUG_*` vars are not inlined into the client bundle). New flag: `NEXT_PUBLIC_DEBUG_EDITOR` (off by default), mirroring the `DEBUG_ICON_SELECTION === 'true'` convention in `src/lib/logger.ts:143`.
- Corrected path from spec: the real overlay file is `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx` (NOT `src/modules/generatedLanding/EditablePageRenderer.tsx` — doesn't exist).
- Dual-renderer landmine: none of these files are block pairs, but phase 3 touches edit-side render wrapping only — published renderer untouched by design; do not let any edit-only helper leak into published registries.

---

## Phase 1 — debug strip & gate (cheapest)

**Files touched**
- `src/lib/debugFlags.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `CLAUDE.md` (Debug Environment Variables section: add `NEXT_PUBLIC_DEBUG_EDITOR`)

**Steps**
1. Create `src/lib/debugFlags.ts` — plain module (no `'use client'`), exports `export const EDITOR_DEBUG = process.env.NEXT_PUBLIC_DEBUG_EDITOR === 'true';` (build-time inlined → `false` in prod).
2. **DCE rule for every gate in this phase:** use STATEMENT-form guards — `if (EDITOR_DEBUG) { logger.debug(...); }` — never ternary/argument-position forms. Statement-form with a build-time-`false` const is what Terser actually dead-code-eliminates; a ternary or inline-arg form leaves `new Error().stack` / `console.log` construction in the bundle.
3. `contentActions.ts` `updateElementContent` (:61-70): wrap the entry `logger.debug` (including its `new Error().stack` + preview `JSON.stringify` meta construction) in an `if (EDITOR_DEBUG) { ... }` block. Result: zero stack capture per commit by default, in dev too. (`logger.debug`'s lazy-thunk meta support is fine as extra belt, but the statement-form `if` is the load-bearing gate.)
4. `contentActions.ts` (:101): replace the `JSON.stringify(oldCollection) !== JSON.stringify(updatedCollection)` skip-guard with a direct compare — locate the target item by `id` and compare `oldItem?.[fieldName] !== content` BEFORE mapping; if equal, skip both the update and the history push. Behavior-identical (same "skip when nothing changed" semantics), no serialization. KEEP the `deepCopy` history snapshots (:102-110) — load-bearing for the real undo stack; do not touch undo behavior.
5. `EditablePageRenderer.tsx` (:288-294, :308-313): delete the "Built userContext" success log outright; wrap the "No validatedFields" one in `if (EDITOR_DEBUG) { ... }` (useful missing-taxonomy diagnostic).
6. `LandingPageRenderer.tsx` (:388, :400, :409): wrap the heavy `renderSection` `logger.debug` calls (and their meta-object construction) in `if (EDITOR_DEBUG) { ... }` blocks — arg construction is the cost; the object literals must not be built outside the guard.
7. Sweep ONLY these three touched files for any other unconditional `console.log`/stack-capture in the per-render/per-commit paths; apply the same statement-form gate. Do not expand to other files.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- Manual (dev): open naayom (`Ix_Ki4FMSWKB`) editor, type in a headline — console silent; content updates; Ctrl+Z/Ctrl+Y undo/redo still works (deepCopy path intact).
- Set `NEXT_PUBLIC_DEBUG_EDITOR=true` in `.env.local`, restart dev — logs reappear with callStack populated.
- Edit a collection item (e.g. feature card text) — updates + undo still work (validates the stringify-diff replacement).
- Prod-bundle spot check (can defer to phase-5 final sweep): grep the built editor chunk for the gated log strings — absent.

---

## Phase 2 — autosave: event-driven trailing debounce + effect-churn fix

**Files touched**
- `src/hooks/useAutoSave.ts`
- `src/hooks/editStore/persistenceActions.ts` (mechanical ONLY: add `state.lastUpdated = Date.now();` beside the 7 dirty-setters that lack it — :588, :597, :609, :620, :644, :651, :715 — **defense-in-depth / trailing-debounce precision, NOT a correctness dependency** (see step 1); ZERO logic changes to `save()`/`triggerAutoSave()`)
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (only if config call needs a stable object; otherwise untouched)

**Context (scout- + review-verified)**
- Live save path is `useAutoSave` 1s poll (:163-168) → `triggerAutoSave()` → `persistenceActions.save()` → POST `/api/saveDraft`. That path ALREADY does exactly one `export()` + one `stringify` (persistenceActions :289/:323). The spec's double-stringify lives in `src/utils/autoSaveDraft.ts` — that file is a LIVE regen-save path (see Overview) and is untouched by this plan; do NOT optimize or import it here.
- **`lastUpdated` is NOT a complete edit signal — the save gate must OR in `isDirty` (final-review blocker 1).** Grep-verified reality (`isDirty = true` vs `state.lastUpdated = Date.now()` across `src/hooks/editStore/`): DOZENS of live mutation sites set `persistence.isDirty = true` but never bump top-level `state.lastUpdated` — e.g. `coreActions.ts` (add/remove/move section, `updateSectionLayout`), ~27 sites in `layoutActions.ts` (several bump NESTED `state.navigationConfig.lastUpdated` / `socialMediaConfig.lastUpdated`, NOT top-level), `formActions.ts`, `formsImageActions.ts` (incl. image swap), `uiActions.ts`, `generationActions.ts`. Gating any dispatch solely on `lastUpdated > lastSavedUpdatedRef` would silently drop those saves (reorder a section / edit a form field / swap an image / change a nav or social link → close tab → no-op → edit never POSTed) — a strict regression vs today's poll, which gates purely on `isDirty`. Rule for this phase: **every** save gate is `(lastUpdated > lastSavedUpdatedRef || persistence.isDirty)` — `isDirty === true` always means something is unsaved (restores old durability); the `lastUpdated > ref` term still catches the mid-flight `:349`-clobber case (in-flight save success clears `isDirty` while a newer edit already advanced `lastUpdated`).
- **Why the debounce timer is still RE-ARMED off `lastUpdated` (trailing precision):** `isDirty` stays `true` throughout a typing burst (no per-keystroke toggle), so an `isDirty`-transition-only listener arms the timer on the FIRST keystroke, not the last — not a trailing debounce. `lastUpdated` bumps per mutation on the text-edit hot path (`contentActions` etc.), giving true trailing behavior where it matters. `isDirty` false→true transitions ALSO arm the timer (required for the `lastUpdated`-silent sites above); those sites get fire-once-per-quiet-period rather than per-op-trailing semantics — acceptable, the OR-gate saves them.
- **Why saves are DISPATCHED via `save()` directly, not `triggerAutoSave()` (retained from prior review):** `triggerAutoSave()` RE-GATES on `isDirty` (`persistenceActions.ts:721` `if (isDirty && !isSaving)`). Failing trace if dispatch went through it: timer→save(T_n), isSaving=true, lastSavedRef=T_n → keystroke C bumps lastUpdated=T_{n+1}, isDirty=true → in-flight POST succeeds → :349 clears isDirty (clobbers C), isSaving=false → mid-flight guard correctly re-arms (T_{n+1}>T_n) → timer fires → triggerAutoSave sees isDirty=false → NO-OP → C detected but never POSTed — the same lost-edit bug, relocated to the dispatch layer. Fix: EVERY server-save dispatch in this hook calls `getState().save()` directly (the hook's existing `forceSave` already bypasses to `save()` the same way), guarded only by this plan's own gates.
- **`save()` failure semantics (final-review blocker 2):** `persistenceActions.save()` (:356-364) sets `persistence.saveError` and **THROWS** on failure WITHOUT clearing `isDirty` (only success clears it, :349). The rejection IS the failure signal — there is no `persistence.lastError` field; do not read one. Trap: `save()`'s failure `set(isSaving=false)` fires the store subscription SYNCHRONOUSLY *before* the throw, with `isDirty` still `true` — a plain OR-gated mid-flight guard WOULD see that and re-arm the ~1s debounce, competing with (and bypassing the attempt counter of) the bounded retry below. Therefore the mid-flight guard does NOT re-arm on failure BECAUSE it is explicitly gated off `persistence.saveError` (`&& !saveError` on that guard only — `saveError` is set on failure and cleared/undefined on success at :285, and is the plan's designated failure signal), i.e. it re-arms on SUCCESS transitions only; ALL failure re-arming is owned solely by step 2's `catch` BOUNDED retry. Transient 500 while idle+online → edit would otherwise sit unsaved until the next edit/visibility/unmount — a reliability regression vs today's every-second poll retry. Fix: the `catch` itself schedules a BOUNDED retry (step 2).
- **The 7 mechanical `lastUpdated` bumps are kept, but re-labeled:** they are defense-in-depth + trailing-debounce precision for those 7 form/image setters (all 7 target persistent state; the paired pattern already exists at :575-576 and :706-708). They do NOT close the coverage gap above and correctness never depends on them — the OR-gate does the work. No claim of signal completeness anywhere in this plan.
- `src/stores/editStore.ts:47-60` already has beforeunload/pagehide/visibilitychange listeners — those flush the perf-01 **localStorage** debounce only. Keep them; do not duplicate or fight them. This phase adds the **server-POST** flush separately, component-scoped in `useAutoSave`.

**Steps**
1. `persistenceActions.ts`: add `state.lastUpdated = Date.now();` beside the 7 `persistence.isDirty = true` sites listed above (:588/:597/:609/:620/:644/:651/:715). Purely mechanical, defense-in-depth only (see Context). Nothing else in this file changes — `save()`, `triggerAutoSave()`, and :349's success-clear stay exactly as they are (`triggerAutoSave` remains for any external callers).
2. `useAutoSave.ts`: remove the 1s `setInterval` effect (:160-172). Add ONE dispatch helper — `dispatchSave()` — the single choke point for every server save this hook fires (timer, mid-flight re-arm, all flushes, online recovery, failure retry):
   - **Gate (uniform, everywhere):** `(getState().lastUpdated > lastSavedUpdatedRef.current || getState().persistence.isDirty) && !getState().persistence.isSaving` + the hook's online guard where it already applies. Never gate solely on `lastUpdated`.
   - Capture-at-dispatch: BEFORE awaiting the POST — `const prev = lastSavedUpdatedRef.current; lastSavedUpdatedRef.current = getState().lastUpdated;` — so edits landing DURING the flight satisfy `lastUpdated > lastSavedUpdatedRef` and re-arm.
   - Dispatch: `await getState().save()` directly (NOT `triggerAutoSave()`).
   - **Failure path (`catch` — `save()` throws; `persistence.saveError` is already set by `save()`):** restore `lastSavedUpdatedRef.current = prev` so arm/flush gates still see the edit as unsaved, THEN schedule a **bounded retry**: `setTimeout(dispatchSave, backoff)` with exponential backoff **2s → 4s → 8s, max 3 attempts**; the attempt counter (a ref) resets on save success and on any new arm event (new edit). After the cap: stop retrying, leave `saveError` surfaced; the next real edit or visibility/online event re-arms through the normal gates. One timeout ref, no queue, no elaborate machinery. (Needed because the mid-flight guard is explicitly gated off `saveError` and never re-arms on failure — see Context — so this `catch` retry solely owns failure re-arming; nothing else re-arms an idle failed save.)
   - **Stable reference (required):** hold `dispatchSave` in a `useRef` (or `useCallback` with empty deps, reading ALL state via `getState()` / refs) — it is captured by the mount-once `storeApi.subscribe` listener and by the online/visibility/pagehide effects; a stale closure would silently break mid-flight re-arm and the retry path.
3. Replace the poll with a store-subscription-driven trailing debounce (**1000ms**, module const): mount-once effect, `storeApi.subscribe(listener)`; listener does cheap field compares only:
   - `state.lastUpdated > lastSeenUpdatedRef.current` → record it and **(re)arm** the debounce timer — per-keystroke re-arm → true trailing debounce on the text-edit hot path: timer fires `dispatchSave()` once, ~1s after the LAST keystroke.
   - `persistence.isDirty` false→true transition → ALSO arm the timer. **Required, not belt** — it is the only arm signal for the `lastUpdated`-silent mutation sites (section reorder, form/image, nav/social, etc.). Double-arm with the line above is harmless (same timer). This arm keeps the plain OR semantics — NO `saveError` clause here.
   - **Mid-flight guard:** on `persistence.isSaving` true→false, re-arm the debounce if `(state.lastUpdated > lastSavedUpdatedRef.current || persistence.isDirty) && !persistence.saveError` — **the `&& !saveError` clause applies to THIS guard ONLY** (success-transition-only re-arm); the debounce-timer arm, the `isDirty` false→true arm, and the teardown/visibility/pagehide/unmount flush gates all keep the plain OR gate — they must still fire for normal dirty edits. Success case: `saveError` is cleared/undefined (:285) and :349 clobbers `isDirty`, so the `lastUpdated > ref` term is what catches a mid-flight keystroke — dispatch cannot no-op because `dispatchSave()` gates on the OR, never on `isDirty` alone. Failure case: this guard does NOT re-arm — not incidentally, but BECAUSE it is explicitly gated off `saveError` (already set by `save()` when the failure `isSaving=false` transition fires the subscription) — so it never competes with, or bypasses the attempt counter of, step 2's `catch` bounded 2/4/8s retry, which solely owns failure re-arming.
4. Flush triggers — ALL dispatch through `dispatchSave()` (its OR-gate + `!isSaving` + online gates apply uniformly; equal-or-better than today's ≤1s-poll guarantee, which has NO teardown flush at all):
   - `visibilitychange` → hidden: cancel timer + `dispatchSave()` immediately (page alive, normal fetch OK — this is the PRIMARY teardown guarantee).
   - `pagehide` + `beforeunload`: same immediate `dispatchSave()`, explicitly best-effort (fetch may be killed mid-flight; strictly better than today's nothing). OPTIONAL, non-guarantee hardening: teardown-only `fetch(..., { keepalive: true })` variant of the same POST — 64KB keepalive body cap means naayom-scale payloads silently fail, so this is transport-opportunism only, never presented as reliability; same `/api/saveDraft` contract; SKIP if it complicates `persistenceActions.save()` at all. Same-browser reload loss is already covered by perf-01's localStorage teardown flush.
   - Effect cleanup (unmount / SPA route change away from `/edit`): clear timer + any pending retry timeout; fire one last `dispatchSave()` (its own gates decide whether anything is outstanding).
   - Online-recovery flush (:136-144): keep the trigger (online event) but re-point its save call to `dispatchSave()` — keeps `lastSavedUpdatedRef` consistent (a recovery save that bypassed the ref would leave it stale → spurious later flush POST). Its old `isDirty` read is preserved by the OR-gate; step 2's failure rollback + bounded retry keep failed offline saves flush-eligible.
5. Fix `finalConfig` identity churn (:98-104): memoize with `useMemo` keyed on the individual config fields (or destructure primitives into effect deps directly). Effects at :157, :194, :201, :207 must stop re-subscribing every render. The snapshot effect (:175-194) gets whatever stabilization falls out of the same one-line `useMemo` for free — do NOT invest anything bespoke in it; phase 4 deletes it.
6. Do NOT change the hook's public return shape, what/when `save()` serializes, or any `persistenceActions.ts` logic beyond step 1's seven one-line bumps. VersionManager code stays (phase 4).

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- Grep-confirm gate uniformity and record in the phase audit: every save gate / arm / re-arm / flush-eligibility check in `useAutoSave.ts` uses the OR form (`lastUpdated > lastSavedUpdatedRef || isDirty`); ZERO sites gate solely on `lastUpdated`. (No "signal completeness" grep — the OR-gate makes it unnecessary.)
- Grep-confirm zero `triggerAutoSave` call sites remain inside `useAutoSave.ts` dispatch paths (all replaced by `dispatchSave()` → `save()`).
- Manual (dev, naayom): DevTools Network tab — one typing burst → exactly ONE POST to `/api/saveDraft` ~1s after the LAST keystroke, not the first (acceptance: one commit = one export + one stringify + one POST; trailing behavior explicitly checked).
- **Blocker-1 durability (phase gate a):** perform each of — reorder a section, edit a form field, swap an image, change a nav/social link (`lastUpdated`-silent, `isDirty`-only sites) — then close the tab (and separately: just switch tabs) → reload → the edit persists. Proves the OR-gate + `isDirty`-transition arm cover the non-bumping mutation sites.
- **Mid-flight case (phase gate b):** DevTools throttle to Slow 3G, type → while POST in flight, type again → after POST completes, a SECOND POST fires within ~1s carrying the newer edit; reload → both edits present. (Passes because dispatch goes through `save()` and gates on the OR — an `isDirty`-only gate would no-op here per the failing trace above.)
- **Failed-save retry (phase gate c, Blocker-2):** DevTools → block `/api/saveDraft` (or force a 500), make one edit, then go idle while staying online → observe retry POSTs at ~2s/4s/8s backoff → unblock before the cap → save succeeds; reload → edit present. Repeat leaving the block in place → retries stop after 3 attempts (no infinite spam), `saveError` surfaced; make a new edit → cycle re-arms.
- Idle editor 60s, Performance tab recording: no recurring 1s timer, no store/DOM work while clean (acceptance criterion 1).
- Edit → switch tab (visibility hidden) → POST fires. Edit → reload immediately after debounce window → edit present (acceptance criterion 5).
- Edit → navigate away within the app → edit present on return.
- DevTools offline → edit → no POST spam while offline → back online → save fires and succeeds (online-recovery re-pointed through `dispatchSave()`; failure rollback + bounded retry keep the edit flush-eligible).
- Regen smoke: run one section regenerate → result persists after reload (confirms the untouched `completeSaveDraft` regen path still works alongside the new debounce).

---

## Phase 3 — overlay fleet removal

**Files touched**
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/layout/MainContent.tsx` (parent — remove orphaned `onElementClick`/`onContentUpdate` prop wiring at the `<EditablePageRenderer>` call site :652, IF verified orphaned)
- `src/app/edit/[token]/components/selection/ElementDetector.tsx` (only if hover CSS gap found — see step 4)

**Context (scout-verified)**
- `ElementEditingOverlay` (mounted per element per section at :353-371, component :377-535) ALWAYS returns null. Its `setTimeout(100ms)` + ~7 `querySelector` + `querySelectorAll` sweep + `availableElements` array are dead. Selection + `ElementToolbar` get everything from the store via the `EditableElement`/`useEditor` path (`data-element-key` → `handleElementClick` → store); `ElementToolbar` re-derives its DOM target via its own `targetSelector` (`ElementToolbar.tsx:119`).
- The overlay's ONE live side effect: hover affordance on the matched target (`cursor:pointer` + `hover:bg-blue-50 hover:bg-opacity-50 transition-colors rounded`) and a native click listener that duplicates the store path.
- Subtlety: the overlay's native click listener calls `e.stopPropagation()` BEFORE React's root-delegated handlers run — today it may be the listener actually firing selection AND suppressing the React `onClick`. After removal, the React path takes over; verify exactly one selection event per click and identical toolbar targeting.

**Steps**
1. **Pre-delete live-route check:** the overlay carries `showTextToolbar`/`isEditing` inline-edit state. Trace one click path in dev (click a text element → observe which code path opens inline editing / the text toolbar) and confirm that state is NOT a live edit route — inline editing must run through `EditableElement`/`useEditor`/`InlineTextEditorV2`, not overlay state. If the overlay state turns out live: STOP, report, re-plan this phase.
2. Delete the `ElementEditingOverlay` component (:377-535) and its per-element map-mount inside the section wrapper (:353-371). Keep the `data-section-id` wrapper div and `RenderedLayout` untouched.
3. Orphaned-prop cleanup sweep (keeps tsc/lint green):
   - In `EditablePageRenderer.tsx`: remove now-unused imports/types (`TextFormatState` if the overlay was its only consumer — check `EditableTextContent` below it first; delete only what's actually orphaned).
   - `onElementClick` / `onContentUpdate` props: grep their remaining consumers inside `EditablePageRenderer.tsx` after overlay removal. If the overlay was the only consumer, remove them from `EditablePageRendererProps` (local interface :22 AND the shared `src/types/core/ui.ts:3079` copy if that's the one in use — verify which is imported; add `src/types/core/ui.ts` to this phase's touched set only if edited) and strip the wiring at the `MainContent.tsx:652` call site + any handler definitions in `MainContent` that become unused. If anything else still consumes them, leave them.
4. Hover affordance parity: `ElementDetector.tsx` already injects `.selectable-element:hover` styles (:256) and `cursor` handling for the live selection system. Manually compare against the overlay's blue-tint hover on `[data-element-key]` targets. If a visible gap exists, add ONE equivalent CSS rule to ElementDetector's injected stylesheet (edit-mode scoped, e.g. `.element-detector-section.edit-mode [data-element-key]:hover`) — pure CSS, no querySelector sweeps, no JS.
5. Confirm no other reader of the overlay's props/side effects (scout: none; `availableElements` only fed a commented-out log).

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green; no unused-var/prop lint noise in the two touched components.
- Manual (dev, naayom — the critical gate for this phase):
  - Click every element type (headline, body text, CTA button, collection item, image) → ElementToolbar appears, anchored to the correct target; selection fires ONCE (no double-toggle).
  - Inline text editing (click-to-edit, format toolbar) works unchanged (proves step-1 conclusion).
  - Hover an editable element → affordance present (cursor + highlight) and visually equivalent to before.
  - Performance tab: rendering a page no longer schedules the 100ms setTimeout burst; no querySelector sweeps on mount; idle 60s clean.
- Editor↔published parity smoke: publish preview of one section unchanged (edit-only files, but cheap to confirm).

---

## Phase 4 — VersionManager removal from live path — **HUMAN GATE**

**Gate (before implementing):** spec's candidate gate. Scout verdict: VersionManager is DEAD — no reachable restore UI. Real editor undo/redo is editStore's own history stack (`src/hooks/editStore/uiActions.ts:931/935/966` + keyboard shortcuts) and never touches VersionManager. Its only readers (`undo/redo/exportHistory` in `useAutoSave`) surface solely through `useVersionControl`/`useConflictResolution` → `SaveStatusIndicator.tsx` / `PersistenceStatusIndicator.tsx`, both with ZERO JSX render sites. Present this evidence to the user and get sign-off to DELETE (vs cap-to-5 fallback). **If any restore path surfaces during implementation — stop, report, re-gate.**

**Files touched**
- `src/hooks/useAutoSave.ts`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `src/components/ui/SaveStatusIndicator.tsx` (DELETE)
- `src/components/ui/PersistenceStatusIndicator.tsx` (DELETE)

**Steps**
1. `useAutoSave.ts`: remove the `VersionManager` import, `versionManagerRef` + instantiation (`maxSnapshots: 50`, :120-129), the snapshot-creation effect (:175-194), `changeCountRef`, and all manager-dependent actions: `undo`, `redo`, `createSnapshot`, `exportHistory`, `resolveConflict`'s manager branches, `getActiveConflicts`, plus `undoLastChange`/`redoLastUndo`/`getConflictSummary` conveniences.
2. Slim `AutoSaveStatus`: drop `canUndo/canRedo/currentVersion/totalVersions/hasActiveConflicts/conflictCount` (and `enableVersioning`/`snapshotInterval`/`conflictResolution` config fields). Delete the `useVersionControl` and `useConflictResolution` specialized hooks; delete `useSaveStatus` too if its only consumer was the deleted indicator (verify with grep) — otherwise keep it slimmed.
3. Delete `src/components/ui/SaveStatusIndicator.tsx` and `src/components/ui/PersistenceStatusIndicator.tsx` (orphaned; the latter is also the LAST consumer of `useStatePersistence` — which phase 5 then deletes). Grep for any imports of either before deleting; fix stragglers (expect none outside READMEs).
4. `EditLayout.tsx:67`: drop `enableVersioning`/versioning config from the `useAutoSave({...})` call; if `status`/`actions` are destructured but unused (scout: never read), remove the destructure.
5. Do NOT touch `src/utils/versionManager.ts`, `statePersistence.ts`, or `useStatePersistence.ts` in this phase (phase 5's blast radius, kept separate so this phase ships alone). Do NOT touch `src/utils/autoSaveDraft.ts` (live regen path).

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green.
- Manual (dev, naayom): editor loads; edits save (phase-2 debounce unaffected); Ctrl+Z/Ctrl+Y undo/redo works exactly as before (editStore history stack untouched).
- Heap check (acceptance criterion 3): DevTools Memory — snapshot at session start, edit continuously ~10 min on naayom, snapshot again → heap flat ±10% (previously grew ~50 full-page export snapshots).

---

## Phase 5 — dead persistence cluster deletion (verify-first cleanup)

**Files touched**
- `src/hooks/useStatePersistence.ts` (DELETE)
- `src/utils/statePersistence.ts` (DELETE)
- `src/utils/versionManager.ts` (DELETE)
- `src/middleware/autoSaveMiddleware.ts` (DELETE)
- `src/types/store/index.ts` (remove the `StatePersistenceManager` re-export at :399; fix any type fallout)
- `src/hooks/useAutoSave.ts` (inline/replace the `AutoSaveState`/`ChangeEvent` type imports from `autoSaveMiddleware` — move the two type shapes local or to store types)
- `src/hooks/README.md`, `src/app/edit/[token]/README.md` (drop references to deleted files — keep the agent-README invariant accurate)

**EXPLICITLY EXCLUDED from deletion: `src/utils/autoSaveDraft.ts`.** It is a LIVE save path — `completeSaveDraft` is dynamic-imported at `src/hooks/editStore/regenerationActions.ts:138/:329` (content + element regen) and `src/hooks/editStore/aiActions.ts:174` (section regen) to persist regeneration output. Deleting it breaks regenerate-content/section/element saves at runtime. Leave the file as-is (its double-stringify is not in the idle/typing hot path — out of perf-02 scope; re-pointing those three call sites to `persistenceActions.save()` is a possible later cleanup, NOT this track). Import-direction check (verified): `autoSaveDraft.ts` imports nothing from the deletion set, so the four deletions cannot break it; `autoSaveMiddleware.ts` importing `autoSaveDraft` is fine (the importer dies, the import target stays).

**Verify-first (hard precondition — if ANY check fails, fall back to capping `statePersistence.ts:119` VersionManager `maxSnapshots` to 5 and stop the deletions):**
1. Grep confirms the mounted-editor save path is `persistenceActions.save()` only; `StatePersistenceManager`'s save path has no runtime caller (scout caveat: only its version-control METHODS were confirmed dead — this step confirms the save path too). Import chain expected: `useStatePersistence` → `statePersistence` → {`autoSaveDraft`, `versionManager`}; `autoSaveMiddleware` only type-imported by `useAutoSave`/`versionManager`; sole component consumer (`PersistenceStatusIndicator`) already deleted in phase 4.
2. Grep for `getPersistenceManager` / `globalPersistenceManager` runtime callers outside the deleted set — expect zero.
3. Grep for runtime callers of the EXCLUDED file to re-confirm the exclusion is honored and complete: `rg "autoSaveDraft|completeSaveDraft" src` — expected hits: the file itself + the three dynamic-import call sites in `regenerationActions.ts`/`aiActions.ts` + the dying importers (`statePersistence.ts`, `autoSaveMiddleware.ts`). Include dynamic-import pattern in the sweep (`rg "import\(['\"]@/utils/(autoSaveDraft|statePersistence|versionManager)"`) — static `from`-greps miss `await import()` callers.

**Steps**
1. Run the verify-first greps; record results in the phase audit.
2. Delete the FOUR files (NOT `autoSaveDraft.ts`); fix `types/store/index.ts` re-export; relocate the two types used by `useAutoSave`.
3. Fix all TS fallout iteratively via `tsc` (blast-radius lesson: let the compiler find readers).

**Verification**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` green (build catches any published-path surprise).
- Editor smoke (dev, naayom): load → edit → autosave POST → reload → edit present → publish preview renders.
- Regen smoke: regenerate one section → reload → regenerated content present (proves the excluded `completeSaveDraft` path survived the cleanup).
- Final acceptance sweep (whole spec): idle 60s no recurring timers; one commit = one export+stringify+POST; heap flat over 10-min session; prod build editor path has no console.log/stack-capture (`npm run build` + quick prod-server check of console on `/edit`); autosave reload test; manual-test editor P0 pass.

---

## Acceptance criteria → phase mapping

| Criterion | Proven by |
|---|---|
| Idle 60s: no recurring store/DOM timers | Phase 2 (poll removed; failure retry is bounded + only after a failed save, never while clean) + Phase 3 (overlay timers removed) |
| One commit → one export + one stringify + one POST | Phase 2 (live path already single-serialize; trailing debounce + `save()`-direct dispatch guarantee single POST after last keystroke) |
| Heap flat ±10% over 10-min session | Phase 4 (snapshot retention removed) |
| No console.log/stack in prod editor path | Phase 1 (+ phase 5 final sweep) |
| Autosave reliability unchanged (durability incl. `isDirty`-only edits + failed-save retry) | Phase 2 (OR-gate + `isDirty`-transition arm + bounded retry; phase gates a/b/c) |
| Autosave reload test + editor P0 | Phase 2 + phase 5 final sweep |
| tsc / test:run / build green | Every phase (build required phases 4-5) |

## Unresolved questions

1. Phase 4 gate decision: DELETE VersionManager (scout: dead) vs cap-to-5 — confirm delete?
2. Phase 5 cleanup: do now in this track, or defer deletion cluster to a later declutter pass?
3. "No validatedFields" diagnostic log in EditablePageRenderer: keep gated, or delete outright?
4. Later cleanup (out of perf-02): re-point the 3 regen `completeSaveDraft` call sites to `persistenceActions.save()` and retire `autoSaveDraft.ts` — queue it?
5. Retry bound 3 attempts / 2-4-8s backoff OK, or want more attempts before surfacing saveError?
