# content-baseline-split — spec

## Problem / why
`Project.content` JSON stores the page TWICE: `content.baseline` (~68 KB for naayom — original AI-generated snapshot) + `content.finalContent` (~68 KB — current edited state) + tiny `content.onboarding`. Every loadDraft ships both to the editor AND to /preview/[token] (preview mounts the same EditProvider + loadDraft — user complaint: preview very slow; halving this payload is preview's biggest load win); every full-content save carries both; both sit in the Zustand store, localStorage persist, undo snapshots, and autosave payloads. Editor never edits `baseline` — it's reference data (regen/reset provenance). Working payload is ~2× what it needs to be, and grows with page count.

## Goal
Editor's working payload contains only what the editor edits. `baseline` (and any other reference-only data) lives server-side, fetched only by the operations that need it (regen/reset). No data loss for existing projects.

## Scope OUT (non-goals)
- No schema migration of `Project.content` column itself unless exploration proves necessary (prefer read/write-path change over data migration).
- No change to regen/reset BEHAVIOR — same results, different data source.
- No editor perf work (perf-01..03 own that).

## Constraints
- First map ALL readers of `content.baseline` (and `onboarding`) — API routes, regen paths (`regenerate-content`/`-section`/`-element`, audience routes), reset flows, store hydration. Re-point, don't drop (see field-drop semantic-regression lesson: grep all readers).
- loadDraft/saveDraft contract change must be backward-compatible: old clients/drafts mid-session must not corrupt; existing prod rows (naayom!) load unchanged.
- saveDraft must never write a `content` blob that loses `baseline` for existing projects (no destructive overwrite on partial save).
- Depends on perf-01/02 landing first (same save-path files); /feature pipeline; green locally before merge.

## References
- Prod evidence: naayom `Ix_Ki4FMSWKB` — `content` = baseline 67.6 KB + finalContent 68.1 KB + onboarding 0.1 KB (measured 2026-07-10).
- `src/hooks/editStore/persistenceActions.ts` (export/save), `src/utils/autoSaveDraft.ts`, `/api/saveDraft`, `/api/loadDraft`.

## Open exploration questions
- Full reader map of `content.baseline`: who reads it, when? Is it ever written after generation?
- Is `onboarding` needed client-side post-generation?
- Does publish read `baseline`? (must not — verify)

## Candidate human gates
- Any prod-data-touching step (naayom is live) — sign-off before merge; verify naayom loads + saves round-trip on a prod copy first (migrate-project to dev).

## Acceptance criteria
- [ ] loadDraft response for naayom-scale project ~halved; editor store no longer holds `baseline`.
- [ ] Regen section/element + reset flows work identically (uses server-side baseline).
- [ ] Existing prod project (naayom copy) loads, edits, saves, publishes with zero content loss (deep-diff before/after).
- [ ] tsc, test:run, build green.

## Pilot / smallest slice
Slice 1: reader map + re-point loadDraft to exclude `baseline` from editor hydration (server keeps blob intact). Gate: naayom-copy round-trip diff clean. Slice 2 (only if needed): stop round-tripping baseline through saveDraft writes.
