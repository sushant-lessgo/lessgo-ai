# editor-phase-4-store-finish — spec

> editorPlan.md phase 4 ("Store finish"). Scope corrected during discuss:
> premise on the plan ("ops-based undo = the heap fix") is stale; phase 4 is now
> the **store access-layer cleanup**, ops-based undo descoped to universe/i18n.

## Problem / why

The editor store was partly built by sub-par prior work, leaving duplication and
misleading naming — the residue the founder senses as "two stores running in
parallel." Reality (verified):

- There is **one** data store: one Zustand instance per token, created/cached by
  `storeManager.getEditStore` (`src/stores/editStore.ts` factory, actions already
  split across 11 slice creators in `src/hooks/editStore/*`).
- But **three overlapping access layers** wrap it: `useEditStore.ts` (token-explicit
  bootstrap hook), `useEditStoreLegacy.ts` (context-reader, ~103 call sites, also
  re-exported as `useEditStoreCompat`), and a deprecated `createEditStore()` shim.
  A hook named "Legacy" is actually the primary one.
- ~90 call sites subscribe via the **bare whole-store** form → they re-render on any
  state change. Phase 3 already selector-ized the toolbars; the rest
  (templates/primitives/modals/layout hooks) remain whole-store.

This is a quality/architecture reimagining of the edit internals, not a perf patch
(perf-04 already took idle 77%→0.85%; edit-loss is fixed). UX is deemed good enough
and is explicitly held.

## Goal

Collapse the three access layers into **one clean, well-named, selector-first hook**,
then selector-ize the ~90 whole-store call sites so components subscribe only to what
they read. Enforce it with a lint rule banning bare whole-store subscriptions.
**Zero user-visible change** — internal architecture/quality only, brought to
industry standard.

## Scope OUT (non-goals)

- **Ops-based undo** — descoped to universe/i18n, where the replay consumer defines
  the op schema. Rationale: today's content undo is already delta-based
  (`{storageKey, value}`), so ops-undo is no longer a heap fix; its only real payoff
  is replayability (universe shared-edit propagation = queue #5; i18n assisted mode =
  deferred), and freezing the op shape blind to that consumer means reworking the
  mutation layer twice. Phase 4 only **preserves** the named-op mutation discipline so
  ops-undo is a small later addition, not a rewrite.
- Any UX / editing-behavior / selection / toolbar-feel change (locked good-enough).
- Renderer / dual-pair (`.tsx` / `.published.tsx`) changes.
- Building undo/redo semantics changes of any kind.

## Constraints

- **No user-visible change.** InlineTextEditorV2 stays uncontrolled (cursor-jump
  history). Phase-1 synchronous blur-flush commit path preserved.
- Token-scoped store + `storeManager` LRU (max 3) preserved — this is the correct
  architecture, keep it.
- Named-op mutation discipline preserved: every edit routes through one named store op
  (`setText`/`setImage`/`collectionOp`/…), no ad-hoc `set()` mutations introduced.
- Two-step, pilot-first sequencing (below) — not a single big-bang sweep.
- Static (`.getState()` / `globalStoreRef`) non-reactive access used by event handlers
  must keep working (`useEditStoreApi`).

## Pilot / smallest slice

**Step A — unify as a pure no-op.** Collapse `useEditStore` / `useEditStoreLegacy` /
`useEditStoreCompat` / deprecated `createEditStore` into **one** hook, mechanically,
with zero behavior change — every call site still reads whole-store, nothing
re-renders differently. Verifiable by `tsc` + `test:run` green + scoped diff review
confirming it's a rename. Lands the "one clean layer" win at low risk.

**Step B — selector-ize incrementally**, in small batches, **hot paths first**
(typing / toolbar-adjacent surfaces), each batch measured against the phase-1
throttled harness. Turn the lint rule ON at the **end** to lock it. Batching keeps any
reactivity regression bisectable.

Decision gate between A and B: A merged + editor verified working before B starts.

## References

- `src/hooks/useEditStoreLegacy.ts`, `src/hooks/useEditStore.ts` — the 3 access layers
  to collapse (self-documented; `useEditStoreLegacy` header states ~103 callers).
- `src/stores/editStore.ts` + `src/stores/storeManager.ts` — the single backing store
  factory + LRU cache (the architecture to keep).
- `src/hooks/editStore/*` — 11 slice creators; the named-op mutation surface to preserve.
- `src/hooks/editStore/historyHelpers.ts` + `uiActions.ts` undo/redo — the existing
  delta-based undo (evidence the heap premise is stale; DO NOT rewrite here).
- `docs/task/completed/editor-phase-3-shell-primitives.audit.md` — phase-3 toolbar
  selector-ization pattern to imitate for Step B (`useShallow` selectors, no bare reads).
- `src/app/edit/[token]/components/ui/useUndoRedo.ts` — narrow-selector pattern already
  in use.
- phase-1 throttled Playwright persistence/perf harness — the Step-B perf gate.
- `src/app/edit/[token]/README.md`, `docs/tracks/editorPlan.md` phase 4.

## Open exploration questions (feeds scout)

- Exact inventory + all export names of the 3 access layers; who imports which; does
  `EditProvider` bootstrap via `useEditStore.ts` (untangle the collapse order).
- Categorize the ~90 call sites: whole-store vs already-selector; which are hot
  (typing/toolbar) vs cold (settle Step-B batch order).
- Consumers of static `.getState()` / `globalStoreRef` — care needed on collapse.
- Existing reactivity/update test coverage — which surfaces have update assertions
  (informs how thin the automated net is for Step B).
- The phase-1 throttled Playwright harness: location, how to run, what it measures
  (re-render counts? heap?) — the Step-B perf gate.
- `useOptimizedEditStore` (27 refs), `useUniversalElements`, `useSmartTextColors`,
  `useModalManager` — do these wrap the façade and need to move with it.

## Candidate human gates (feeds planner)

- **Step-B reactivity sign-off.** Verification approach (agent-driven browser smoke vs
  human `/manual-test` editing-interactions pass vs both) is **delegated to the
  /feature pipeline to decide** — with the hard constraint that reactivity MUST be
  verified beyond "tests green," because a too-narrow selector silently breaks updates
  and existing test coverage across 90 sites is incomplete.
- **Lint-rule flip** (bans future bare whole-store reads) — confirm no legitimate
  whole-store consumer remains before turning it on.
- Merge to main (standard human gate).

## Acceptance criteria

- [ ] **One** access hook remains; `useEditStoreLegacy` / `useEditStoreCompat` /
      deprecated `createEditStore` names removed (or reduced to a thin deprecated
      re-export scheduled for deletion). Clean, non-misleading name.
- [ ] Step A landed as a verified no-op (diff is mechanical; `tsc` + `test:run` green;
      editor works) before Step B begins.
- [ ] Hot-path call sites subscribe via narrow selectors; no bare whole-store reads in
      selector-ized surfaces.
- [ ] Lint rule active and green, banning bare whole-store subscription.
- [ ] Perf gate: typing re-render count drops vs baseline; heap flat while typing
      (phase-1 throttled harness).
- [ ] Reactivity gate met (approach per /feature pipeline) — no editing regression on
      touched surfaces.
- [ ] Named-op mutation discipline intact; no ad-hoc store mutations introduced.
- [ ] `docs/tracks/editorPlan.md` phase-4 row + unresolved Q2/Q3 updated (Q2: phase 3
      did toolbars, phase 4 does the rest; ops-undo moved to universe).
