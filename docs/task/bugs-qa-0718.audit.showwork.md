# QA-0718 audit — Show-Work step (B1 / B14 / B16)

## Files changed
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx` (modified)
- `src/components/onboarding/journey/engines/work/CorrectionBoard.tsx` (modified)
- `src/components/onboarding/journey/engines/work/ShowWorkStep.test.tsx` (created)

---

## B1 (O9) P0 — photos "vanish" after Looks-right (data-loss illusion)

**Root cause.** The correction board and the "Looks right" continue button were
gated on the ephemeral component-local `proposal` state (`useState(null)`), not
the persisted `committedGroups` (derived live from `briefFacts`). The board was
nested INSIDE the `{proposal && proposal.groups.length > 0 && (...)}` summary
wrapper, and the continue button had the same `proposal &&` guard. Any round-trip
away and back to the step remounts the component → `proposal` resets to null →
both surfaces disappear even though `committedGroups` still holds every photo.
Data was never deleted, only hidden/unreachable.

**Change.** In `ShowWorkStep.tsx`:
- Closed the proposal-gated `<div data-testid="show-work-proposal">` after the
  dropped/failed hints, so the just-uploaded SUMMARY stays proposal-gated (it
  describes the last upload only).
- Moved the `<CorrectionBoard>` OUT of the proposal wrapper; it now renders
  whenever `committedGroups.length > 0` (independent of `proposal`). The
  `key={uploadNonce}` remount trick is preserved and still works on cold mount.
- The primary continue button now keys off `committedGroups.length > 0` (see
  B16).

## B16 (O8) — dual action buttons consolidated

**Change.** The bottom action bar previously rendered a `proposal`-gated "Looks
right" primary AND an always-present "Skip the rest"/"Skip for now" ghost →
two buttons when photos existed. Consolidated to a single-CTA ternary keyed off
`committedGroups.length > 0`:
- committed groups present → ONLY the "Looks right" primary (`show-work-continue`).
- zero committed groups → ONLY the "Skip for now" empty-state escape
  (`show-work-skip`).
Both now key off the persisted `committedGroups`, so they survive a remount
(coherent with B1).

## B14 (O5) — beta-hide greyed "Tidy up / Merge selected" controls

**Change.** In `CorrectionBoard.tsx` the header `<div>` containing the "Tidy up
your groups" text and the non-functional "Merge selected" button was wrapped in
a block comment tagged
`// BETA-HIDDEN (qa-0718 B14): re-enable when merge/tidy is functional`.
The underlying logic is intentionally KEPT (unchanged): `doMerge`, `mergeGroups`,
the per-group select checkbox + `selected` state, and the `hideHeader` prop all
remain — only the header UI is hidden. `doMerge`/`Button`/`hideHeader` are now
unused at runtime but harmless (tsconfig has no `noUnusedLocals`, so tsc is
clean); left in place per the "do not delete underlying logic" instruction.

---

## Test added
`ShowWorkStep.test.tsx` — react-dom/client + `act` harness (repo has no
`@testing-library/react`; mirrors `WorkLibraryClient.test.tsx`). Four cases:
1. B1 — hydrate `briefFacts.work.groups` (no upload → `proposal` null), assert
   `show-work-continue` + `correction-board` present, `show-work-proposal` absent.
2. B16 — zero committed groups → only `show-work-skip`, no continue, no board.
3. B16 — committed groups → `show-work-continue` present, `show-work-skip` absent.
4. B14 — `correction-merge` absent and "Tidy up your groups" text absent.

Pre-fix these FAIL (board + continue were `proposal`-gated → null on cold mount;
merge control was rendered). Post-fix all pass.

## Test results
- `npx vitest run ShowWorkStep.test.tsx correctionReducer.test.ts WorkLibraryClient.test.tsx`
  → 3 files passed, 47 tests passed. (WorkLibraryClient = the dashboard
  `CorrectionBoard` consumer — confirms hiding the merge header didn't break it.)
- `npx tsc --noEmit` → no errors in any touched file. One PRE-EXISTING,
  UNRELATED error remains: `src/app/page.tsx(6,26) TS2307` for
  `@/assets/images/founder.jpg` (image-asset import, not in scope, not caused by
  this change).

## Deviations
- **Test fixtures.** The task's suggested group shape
  `{ name, photos }` does NOT satisfy `WorkGroupSchema`, which requires `kind`
  and `price` (`getWorkFacts` safeParse returns null otherwise → empty
  `committedGroups`). Added `kind: 'category'` + `price: { mode: 'on-request' }`
  to every fixture group (conservative, schema-valid). In-scope test judgment
  call.

## Open risks
- B14 hides the merge/tidy header for the dashboard `CorrectionBoard` too (same
  component). Confirmed non-breaking via `WorkLibraryClient.test.tsx` (green).
  When merge is re-enabled, uncomment the tagged block.
