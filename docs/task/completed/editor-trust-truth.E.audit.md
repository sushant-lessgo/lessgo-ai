# Task E — save-state chip + dirty-guard — audit

## Files changed
- `src/app/edit/[token]/components/ui/SaveStateChip.tsx` (new) — the chip component + dirty-guard.
- `src/app/edit/[token]/components/layout/EditHeader.tsx` — imports and renders the chip in the top bar, left of the action panel.

## Where autosave state lives (investigated, not changed)
- Save state is the `persistence` slice on the token-scoped editStore
  (`src/types/store/state.ts:432-437`): `isDirty`, `isSaving`, `lastSaved?`,
  `saveError?`, plus `metrics`.
- `save()` in `src/hooks/editStore/persistenceActions.ts` sets `isSaving=true` +
  clears `saveError` on start; on success sets `isSaving=false`, `lastSaved`,
  `isDirty=false`; on failure sets `isSaving=false`, `saveError`.
- `useAutoSave.ts` (perf-02) is the event-driven debounced single-flight save
  layer. It ALREADY implements bounded retry: on a failed `save()` it re-arms
  `dispatchSave` with `RETRY_BASE_MS * 2^attempt` = 2s → 4s → 8s, `MAX_RETRY_ATTEMPTS=3`,
  then leaves `saveError` surfaced until the next edit/online/visibility event
  re-arms. No new retry mechanism was needed or added.

## What I reused vs added
- Reused: the entire `persistence` slice + the existing perf-02 retry-with-backoff.
- Added: ZERO new store state. The chip derives a 3-state `SaveStatus`
  (`saved` | `saving` | `error`) purely from `isDirty` / `isSaving` / `saveError`:
  - `error`  ⇐ `saveError` set (retry already in flight in useAutoSave)
  - `saving` ⇐ `isSaving` (POST in flight) OR `isDirty` (debounce pending)
  - `saved`  ⇐ otherwise.

## Retry semantics (surfacing only)
The chip does not drive retries; it only reflects them. While `saveError` is set
(during backoff waits and after the 3-attempt cap) the chip shows
"Not saved — retrying". When a retry succeeds, `save()` clears `saveError` and
sets `isDirty=false` → chip returns to "Saved". A fresh edit after the cap
re-arms the autosave layer through its normal OR-gate.

## Subscription
Narrow `useShallow` selector over the three persistence fields only — no
whole-store subscription added.

## Dirty-guard (beforeunload)
`SaveStateChip` registers ONE native `beforeunload` listener that calls
`preventDefault()` + sets `returnValue = ''` whenever `deriveStatus() !== 'saved'`
(debounce pending / in flight / error). It reads `storeApi.getState().persistence`
at event time so it sees the freshest `isDirty` regardless of listener firing
order. Composes with the two existing best-effort flushers (neither calls
preventDefault):
- InlineTextEditorV2 `beforeunload` → flushes in-progress DOM text into the store.
- useAutoSave `beforeunload` → dispatches a final store→server save.
Ordering note: if the text-editor flush fires first it sets `isDirty` before the
guard reads getState(), so the prompt still appears; the guard never suppresses
the other flushers.

## Visual
Minimal top-bar chip matching the existing pill styling (dot + label, rounded).
Fixed `minWidth: 150px` + a consistent 1px border (transparent for saved/saving,
red for error) → no layout shift between states. Dot: green/amber/red.

## Verification
- `npx tsc --noEmit` — clean.
- No chip/persistence-specific vitest files exist; per scope, targeted tests only
  run when related test files exist, so none were run. (Central gate handles the
  full suite.)

## Deviations
- None material. Chose to derive `SaveStatus` from existing fields rather than add
  a `saveStatus` UI-slice field (the task allowed adding one "only if nothing
  usable exists" — the persistence slice was sufficient). Conservative: fewer
  moving parts, single source of truth.

## Open risks
- "Not saved — retrying" is shown for the whole `saveError` window, including
  after retries are exhausted (chip cannot see `retryAttemptRef` — it lives in
  useAutoSave, out of scope). Wording stays truthful because any subsequent edit
  re-arms a real retry. Exposing an "exhausted" sub-state would need a store field
  (out of this phase's scope).
