# qa-0718 — journeyE audit (B15 + B16-O11)

## Files changed
- `src/components/onboarding/journey/UnderstoodRail.tsx` (B15)
- `src/components/onboarding/journey/UnderstoodRail.test.tsx` (B15)
- `src/components/onboarding/journey/engines/work/PlanStep.tsx` — **NOT changed** (see O11)

---

## B15 (O7) — "Something wrong?" input BETA-HIDDEN

### `UnderstoodRail.tsx`
- Commented out the `<NoteBox saving={saving} onSubmit={submitNote} />` render (was ~line 162)
  with the required note:
  `// BETA-HIDDEN (qa-0718 B15): "Something wrong?" input non-functional (submit discarded); re-enable when wired.`
- Kept everything underneath intact: the `NoteBox` component definition, the
  `submitNote` handler, and `rail.appendNote` types/plumbing. Only the UI render is hidden.
- **Deviation (in-scope, conservative):** the spec pointed at the NoteBox JSX block
  (~lines 430-465). I hid it at the single render site (line 162) instead of gutting
  the component body. Same user-visible result (no input renders), but leaves the
  component + handler byte-intact for clean re-enable, and avoids leaving `NoteBox`
  with no return (which would break tsc). `NoteBox`/`submitNote` are now unused but
  tsc is clean (no `noUnusedLocals` in tsconfig).

### `UnderstoodRail.test.tsx`
- Converted `describe('UnderstoodRail — "Something wrong?"')` → `describe.skip(...)`
  with an inline B15 comment (kept, not deleted — documents intended future behavior).
- **Collateral fix (in-scope, test file):** the chips-lifecycle test
  `'a commit while the chips editor is OPEN remounts it: the draft dies and ids re-seed'`
  (~line 395) USED the NoteBox UI (`rail-note-input` / `rail-note-submit`) as its
  commit vector — it is deliberately the "only writer independent of editingId".
  Hiding NoteBox made that test throw (`type` on a missing input). Rather than skip
  it (losing the projectionKey-remount coverage), I re-pointed its commit through the
  SAME seam path directly — `workJourneySeam.rail.appendNote(...) → commitRail(...)`
  via the store — mirroring the sibling D8 test's vector. The note is still appended
  and the `userNotes` assertion still holds; only the (now-hidden) input widget is
  bypassed. Comment left to re-point back to the UI vector when NoteBox returns.

### Tests
- `npx vitest run src/components/onboarding/journey/UnderstoodRail.test.tsx`:
  **12 passed | 1 skipped** — stable across 3 consecutive runs.
  (Baseline committed files = 13 passed; my change nets the 1 intended skip, no regressions.)

---

## B16 part O11 — dual action buttons on the plan/build step

### Finding: NOT actionable within the given boundary
- `PlanStep.tsx` contains exactly **ONE** advance/primary CTA:
  `data-testid="plan-build"` — "Build my site" (line ~446), which runs the
  load-bearing `approve()` (awaited `commitRail(buildPlanCommit(...))` persistence
  BEFORE `setJourneyStep(5)`). The only other button in the file is
  `data-testid="plan-add-button"` ("Add a page"), a genuinely-distinct secondary
  (not an advance) — correctly kept.
- The **second "Continue" button the founder saw is NOT in PlanStep** — it is the
  JourneyShell agnostic footer nav, `<Button data-testid="journey-next">Continue</Button>`
  in `src/components/onboarding/journey/JourneyShell.tsx` (lines ~231-241), rendered
  for EVERY ready step (2-6). On step 4 it visually duplicates "Build my site" but is
  the *weaker* action (plain `setJourneyStep(+1)`, no awaited commit).
- Removing the redundant "Continue" therefore requires editing **JourneyShell.tsx**,
  which is OUTSIDE my Files-touched list. Per hard rules I did NOT edit it and made
  NO change to PlanStep (there is nothing redundant to remove there).

### Precedent
- The prior B16-O8 fix (commit 905ef900) consolidated two **step-local** buttons
  inside `ShowWorkStep.tsx` and left the shell "Continue" in place. On the plan step
  there is no step-local dupe — the dupe is purely the shell footer.

### Recommendation (for orchestrator)
Authorize a small JourneyShell edit to suppress the footer nav's "Continue" on steps
that own a terminal CTA (the plan step, at minimum), keeping "Back". The shell already
hides the whole footer while `building` (line ~216), so the cleanest fix is to also
hide/omit `journey-next` when `journeyStep === 4` (or, more generally, when the active
step provides its own forward CTA — e.g. a `seam`/step-declared flag). "Build my site"
must remain the single advance because only it awaits the persistence commit.

---

## Gates
- `npx tsc --noEmit`: clean except the known pre-existing `src/app/page.tsx` founder.jpg error (filtered).

## Open risks
- `NoteBox` component + `submitNote` handler are now unused in `UnderstoodRail.tsx`
  (intentional, per "keep types/handlers"). ESLint `no-unused-vars` may warn if lint
  is run; tsc is unaffected. Not fixed — leaving intact for re-enable.
- O11 remains OPEN pending an out-of-boundary JourneyShell decision (above).

---

# B16-O11 (JourneyShell)

## Files changed
- `src/components/onboarding/journey/JourneyShell.tsx`
- `src/components/onboarding/journey/JourneyShell.test.tsx` (created)

## Root cause
`JourneyShell` renders a generic footer nav (Back + a "Continue" button
`data-testid="journey-next"`) on EVERY step, hidden only while `building`. But
step 2 (StepShowWork: "Looks right" / "Skip for now") and step 4 (StepPlan:
"Build my site") render their OWN primary advance CTA in the step body. So on
steps 2 and 4 the user saw TWO advance buttons. On step 4 the footer Continue was
also a HAZARD: it advances via bare `setJourneyStep(journeyStep+1)`, skipping the
AWAITED `commitRail` persistence that "Build my site" performs.

## Exact change
- Added `const STEPS_OWNING_ADVANCE = new Set<JourneyStep>([2, 4])` + an exported
  pure helper `footerNextVisible(step) => !STEPS_OWNING_ADVANCE.has(step)`.
- Wired the footer Continue `<Button>` (journey-next) behind
  `{footerNextVisible(journeyStep) && (…)}` so it is HIDDEN (not just disabled) on
  steps 2/4. Back (journey-back), the `building` div-level hide, and the existing
  `disabled={journeyStep === LAST_STEP || nextBlocked}` logic are all preserved.
- Step 3 (Questions) is untouched: it still advances via the footer, still gated
  by `nextBlocked`. No step body component was touched.

## Test approach + result
Full-shell render blocks on the async seam loader (`loadJourneySeam`), so per the
phase note I extracted the footer-visibility decision into the exported pure
helper `footerNextVisible` and unit-test THAT (the JSX is wired to the same helper,
so it guards real behavior). `JourneyShell.test.tsx` asserts: step 4 → false,
step 2 → false, step 3 → true, steps 5/6 → true. Pre-fix the helper did not exist,
so the test could not compile/import (fails); post-fix it passes.

`npx vitest run src/components/onboarding/journey/JourneyShell.test.tsx` → 4
passed. Grep of `journey-next` across `src` found only JourneyShell.tsx — no
existing test asserted it on step 2/4, so no expectations needed updating.
`npx tsc --noEmit` → clean except the known pre-existing
`src/app/page.tsx` founder.jpg TS2307.

## Deviations
- Helper signature is `footerNextVisible(step)` (step only). The phase suggested
  `footerNextVisible(step, building)` as an example; `building` already hides the
  whole footer div at the JSX level (which also keeps Back hidden while building),
  so folding it into the helper would duplicate that logic. Conservative choice:
  helper owns only the step-ownership decision; div-level `building` hide unchanged.

## Open risks
- On steps 2/4 the footer now renders Back only (left-aligned under
  `justify-between`); layout is unchanged otherwise. Visual-only, no functional risk.
