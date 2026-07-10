# perf-02 — editor background overhead (P1) — spec

## Problem / why
Beyond interaction cost (perf-01), the editor carries constant background work + memory pressure (evidence 2026-07-10):
1. **55 dead-weight overlays**: `EditablePageRenderer.tsx:353-371` mounts a stateful `ElementEditingOverlay` per element per section; each fires `setTimeout(100ms)` + ~7 `document.querySelector` + a `querySelectorAll` sweep, then returns `null` (`:377-535`).
2. **Autosave machinery**: 1s `setInterval` dirtiness poll (`src/hooks/useAutoSave.ts:150`); effect keyed on new-array/new-object deps re-runs every render (`:161-180`); each save runs full multi-page `store.export()` + `JSON.stringify` TWICE (`src/utils/autoSaveDraft.ts:215,267`) and POSTs whole project (13 pages for naayom).
3. **Memory**: `VersionManager` retains 50 full-page export snapshots (`useAutoSave.ts:112`); undo deep-copies collections per commit (`contentActions.ts:102-110`).
4. **Debug waste in prod**: `new Error().stack` captured per content commit (`src/hooks/editStore/contentActions.ts:61-70`); `JSON.stringify` diffing collections (`:101`); unconditional `console.log` with full context objects per section per render (`EditablePageRenderer.tsx:288-313`); heavy `logger.debug` in `renderSection` (`LandingPageRenderer.tsx:388,400,409`).

## Goal
Idle editor does ~zero work; a commit costs one serialize; memory footprint flat over a long editing session. Autosave reliability unchanged (no lost edits).

## Scope OUT (non-goals)
- No change to WHAT is saved or the /api/saveDraft contract (payload-shape work = `content-baseline-split.spec.md`).
- No UX change; no undo-behavior change visible to users (cap/trim internals only).
- No image work (perf-03).

## Constraints
- One on-demand overlay (or equivalent) replaces the per-element fleet — element-toolbar/selection behavior must stay identical.
- Autosave: event-driven debounce replaces the 1s poll; single stringify per save; no regression in save-on-navigate/save-on-blur guarantees.
- VersionManager: cap to a handful of snapshots or remove if nothing user-facing consumes it — verify consumers first.
- Strip/gate debug: `Error().stack`, per-render `console.log`s, stringify-diffs — behind `DEBUG_*` env flags, off by default.
- Depends on perf-01 landing first (same files touched); /feature pipeline; tsc/test:run/build green locally.

## References
- File:line evidence above. Test project: naayom `Ix_Ki4FMSWKB`.
- perf-01 spec for the measurement setup (6× throttle + Profiler).

## Open exploration questions
- What consumes `VersionManager` snapshots — any restore UI, or dead?
- What guarantees does the 1s poll actually provide (tab close? route change?) — what events must the debounced replacement cover?
- Does anything read the per-element overlays' side effects (the `availableElements` array)?

## Candidate human gates
- Removing/capping VersionManager if a restore path exists.

## Acceptance criteria
- [ ] Performance tab, idle editor 60s: no recurring timers doing store/DOM work (beyond the debounced autosave when dirty).
- [ ] One commit → exactly one `store.export()` + one stringify + one POST.
- [ ] Heap flat (±10%) over a 10-min editing session on naayom-scale project.
- [ ] No `console.log`/stack-capture in prod build editor path.
- [ ] Autosave still saves: edit → wait → reload → edit present. Manual-test editor P0 pass.
- [ ] tsc, test:run, build green.

## Pilot / smallest slice
Runs after perf-01's gate. Slice order inside: debug strip (cheapest) → autosave debounce → overlay consolidation → snapshot cap.
