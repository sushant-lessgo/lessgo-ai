# remove-your-inputs-panel — spec

## Problem / why
Edit page left panel (`LeftPanel.tsx`) has a "Your Inputs" accordion that renders empty/partial and looks broken. It's read-only (a mirror of onboarding fields, can't edit in-editor), and its "Change inputs & regenerate" button is mislabeled — it restarts onboarding from a **blank** first step (no pre-fill; in-memory store), a destructive footgun that would replace the current page. Neither half earns its place.

## Goal
Delete the entire "Your Inputs" accordion (read-only field display + "Change inputs & regenerate" button) from the edit page left panel. Left panel keeps Section Outline + Review checklist.

## Scope OUT (non-goals)
- NOT fixing/backfilling onboardingData so inputs render clearly.
- NOT building a proper in-editor "edit inputs" or "regenerate page" flow (may be rebuilt properly later).
- NOT touching Section Outline, Review mode, panel chrome (collapse/resize/tabs).
- NOT touching the onboarding route itself.

## Constraints
- Edit-page-only change; product editor. Keep left panel layout clean after removal (no dead accordion header / empty state).
- Remove now-dead code/state cleanly (e.g. `inputsExpanded` local state, unused `onboardingData` reads/imports if orphaned) — but grep before deleting shared readers.

## References
- `src/app/edit/[token]/components/layout/LeftPanel.tsx` — the "Your Inputs" accordion lives here (normal/"Page" tab, `inputsExpanded` state). Remove that block; keep Section Outline + ReviewChecklist.
- `src/app/edit/[token]/components/layout/EditLayout.tsx` — mounts LeftPanel (context only).

## Open exploration questions
- Is `onboardingData` (oneLiner / validatedFields / hiddenInferredFields / featuresFromAI) read ONLY by the accordion in LeftPanel, or elsewhere? If only here, drop the import/wiring.
- Any store selector/prop feeding LeftPanel solely for the accordion that becomes dead after removal.
- `FIELD_DISPLAY_NAMES` usage — still needed elsewhere or now orphaned?

## Candidate human gates
- None expected (pure UI deletion, no schema/auth/publish/prod-data). Standard build/tsc/test green before merge.

## Acceptance criteria
- [ ] "Your Inputs" accordion (fields + "Change inputs & regenerate" button) no longer renders on `/edit/[token]`.
- [ ] Left panel "Page" tab shows Section Outline only; Review mode unchanged; collapse/resize/tabs unchanged.
- [ ] No dead code left behind (orphaned state/imports/selectors removed; nothing else broken by their removal).
- [ ] `tsc` + `test:run` + `npm run build` green.

## Pilot / smallest slice
Single-phase; the whole thing is the slice. Delete accordion + clean orphaned code, verify build green, manual glance at edit page.
