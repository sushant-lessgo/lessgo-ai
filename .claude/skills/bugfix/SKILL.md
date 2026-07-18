---
name: bugfix
description: >-
  Runs the Lessgo bug-fix pipeline for a QA round: normalizes the bug list →
  per-bug investigate (bug-investigator, Opus/high, evidence-based root cause)
  → fix (implementer, Opus/medium, mandatory regression test) → tier-gated
  impl-review → per-bug commit on one fix/<round> branch → preview re-test gate
  → merge gate → deploy watch. Batch-first: one run handles ALL bugs from a QA
  pass. Use AFTER testing (QA preview / prod / dev) surfaces bugs. NOT for new
  features (/feature) and NOT for trivial one-liner fixes you'd just do inline.
argument-hint: <path-to-buglist.md | inline bug description(s)>
---

# Bug-fix pipeline orchestrator

You are the **orchestrator**. You do not diagnose, implement, or review yourself —
you delegate each stage to the matching subagent (via the Agent tool) and drive
the loops off their verdicts. No Fable stage exists in this pipeline; the whole
run is fine on Opus (investigator = Opus/high is the priciest spawn).

**Artifacts** (under `<WORKDIR>/docs/task/` once the worktree exists):
`bugs-<round>.md` (normalized bug list + triage + progress log — THE resume
anchor), `bugs-<round>.audit.md` (implementer, appended per bug).

## Playbook

**0. Bug intake + triage.** Arg = a bug-list file OR inline bug description(s).
- Derive `<round>`: default `qa-<MMDD>` (today's date); if the arg names a round
  or the user gave one, use that.
- Normalize everything into `docs/task/bugs-<round>.md` (write it on main in the
  primary dir BEFORE the worktree, like a spec, so it's in the worktree): per bug
  — id (`B1`, `B2`…), title, symptom, repro steps, expected vs actual, env
  (preview URL / prod / dev), severity (P0/P1/P2). Ask NOTHING unless a bug has
  no usable repro/symptom at all — then ask for just that bug's repro and keep
  moving on the others.
- Add a **triage table**: per bug — severity, suspected area, tier:
  - `hotfix` — obvious cause, ≤2 files, no risky surface → skip impl-review.
  - `standard` — default → one impl-review pass.
  - `risky` — Files-touched (at triage OR after investigation) hits the
    RISKY-SURFACE LIST → impl-review loop ×3. List (same as /feature):
    `src/middleware.ts` or auth/Clerk config; editor store internals
    (`src/hooks/editStore*`, `useEditStore*`, `src/stores/`); dual-renderer
    surface (any `.published.tsx`, `src/modules/generatedLanding/`
    renderers/registries); `prisma/schema.prisma` or migrations; billing/money
    (`src/lib/planManager.ts`, `creditSystem.ts`,
    `src/app/api/{stripe,billing,credits}/`); publish path
    (`src/app/api/publish`, `src/lib/staticExport/`,
    `src/lib/routing/kvRoutes.ts`).
  Tiers only escalate (hotfix→standard→risky), never downgrade — re-check after
  the investigator returns its Files-touched list.
- Announce the triage table before starting.

**0.5. Worktree setup (self-provisioning — run /bugfix from ANY dir).**
The primary repo dir (`C:\Users\susha\lessgo-ai`) permanently holds `main` and
NEVER hosts a fix branch. You NEVER checkout/switch a branch in ANY existing
checkout. Every round gets its own worktree:
- `WORKDIR = C:\Users\susha\lessgo-ai\.claude\worktrees\<round>`.
- If WORKDIR doesn't exist:
  `git -C C:\Users\susha\lessgo-ai worktree add .claude/worktrees/<round> -b fix/<round> main`,
  copy `.env` + `.env.local` from the primary dir into WORKDIR, then REAL
  `npm install` + `npx prisma generate` inside WORKDIR (junction/shared
  node_modules silently corrupts the Prisma client — known pitfall; minutes-long
  install is fine, once). If WORKDIR exists, verify
  `git -C <WORKDIR> branch --show-current` = `fix/<round>` and use it.
- If WORKDIR's tree is dirty, warn the user and wait for their go.
- ALL work happens under WORKDIR from here on; record WORKDIR + branch at the
  top of `bugs-<round>.md`, and pass BOTH explicitly to every subagent spawn —
  "work ONLY in <WORKDIR>; branch must be `fix/<round>`" (they hard-stop on
  mismatch).

**1. Per bug, severity order** (P0 first). Each bug is its own mini-pipeline; a
stuck bug NEVER blocks the rest of the round.
- a. **Investigate.** Spawn `bug-investigator` with the bug's entry (verbatim) +
     WORKDIR/branch. Verdict `diagnosed` → re-check tier against its
     Files-touched list (escalate if risky), continue. Verdict `stuck` → record
     its ruled-out list + missing evidence under the bug in `bugs-<round>.md`,
     mark `stuck`, move to the next bug.
- b. **Fix.** Spawn `implementer` with the investigator's Root cause + Fix
     proposal + Files-touched + Regression-test recipe as its "phase" (audit
     file: `docs/task/bugs-<round>.audit.md`). The regression test is
     MANDATORY — Vitest or Playwright (`e2e/` goes on the Files-touched list),
     failing-before/passing-after; only skip if the recipe says unscriptable,
     and the audit must record why. Never accept a symptom patch: if the
     implementer reports it had to deviate from the root-cause fix, loop back
     to 1a with that finding.
- c. **Review** (tier-gated). `hotfix` → skip (you sanity-read the diff stat
     yourself). `standard` → one `impl-reviewer` pass. `risky` → review loop
     max ×3. Verdicts: `ship` → done; `fix first` → hand Blocking issues back
     to `implementer`, repeat; cap exhausted → mark bug `stuck`, move on.
- d. **Commit** (orchestrator, on `fix/<round>` ONLY):
     `git -C <WORKDIR> add` the bug's files + artifacts, commit as
     `fix(<round>): <id> — <title>`. Never commit on main.
- e. **Progress log** at the top of `bugs-<round>.md`, one line per bug:
     `B<n> <title>: fixed (commit <sha>, review loops <k>) | stuck (<why>) | pending`.
     This is the resume anchor — after a `/clear`, read `bugs-<round>.md` +
     the audit, re-confirm the branch, continue at the next pending bug.
- f. **Context checkpoint.** Drop this bug's detail — never carry prior bugs'
     diffs, transcripts, or audit bodies forward; the md artifacts hold it all.

**2. Green gate.** After the last bug: `npx tsc --noEmit`, `npm run test:run`,
`npm run lint`, `npm run build` in WORKDIR. Failures → route back to the owning
bug (its regression test names it) via step 1b.

**3. Preview re-test gate (human).** Ask the user to push the branch:
`git -C <WORKDIR> push -u origin fix/<round>` → Vercel Preview (the isolated QA
sandbox) deploys it. Present a **re-test checklist**: per fixed bug, its
original repro steps to run against the preview URL. Wait for per-bug
pass/fail. Fail → back to step 1a for that bug WITH the new evidence (what
still happens on preview); max 2 re-loops, then `stuck`. All passing (or
explicitly waived) → merge gate.

**4. Merge gate (human).** Report: bugs fixed / stuck, files changed (from the
audit), green-gate status, regression tests added. Then STOP and ask explicitly
whether to merge `fix/<round>` into main. Only on their yes — NO checkout
anywhere: if main has moved, merge main INTO `fix/<round>` inside WORKDIR and
re-green (tsc/test/lint/build) first. Then merge at the station:
`git -C C:\Users\susha\lessgo-ai merge fix/<round>` (plain merge, no squash;
verify the primary tree is clean first). **Never push** — the user pushes main
manually.

**5. Deploy watch + cleanup.** After the user says they've pushed main, spawn
`deploy-watcher` (Haiku). READY → quick post-deploy HTTP smoke on the routes
the round touched, then clean up:
`git -C C:\Users\susha\lessgo-ai worktree remove .claude/worktrees/<round>` then
`git -C C:\Users\susha\lessgo-ai branch -d fix/<round>` (`-D` if `-d` refuses
despite the merge being proven — known stale-checkout quirk; Windows file lock
on worktree removal → ask user to close handles, retry) and delete the remote
branch (`git push origin --delete fix/<round>` — user runs it). ERROR → present
the condensed failure summary; keep branch + worktree; no auto-fix without
their go. Close by listing the round's `stuck` bugs as open items.

## Rules
- **Unattended by default.** Human gates ONLY: missing repro at intake, dirty
  worktree, preview re-test, merge, deploy failure, and the end-of-round stuck
  list. Everything else: decide, log it in `bugs-<round>.md`, keep moving.
  Relaying a subagent's question to the user is a bug.
- **No symptom-patching.** A fix that can't name its evidence-backed root cause
  is `stuck`, not shipped. Null-guards, retries, and try/catch around a mystery
  are symptom patches unless the diagnosis says the guarded state is legitimate.
- **Regression test or a written reason why not** — every fixed bug. Mutate or
  it isn't a test: the test must fail on pre-fix code.
- Loops cap at **3** (review) / **2** (preview re-test); on exhaustion mark
  `stuck` and move on — never spin, never block the round.
- **Branch state has ONE writer: you — via worktrees only.** No
  checkout/switch anywhere, subagents verify-and-stop, commits on `fix/<round>`
  only, merge only at step 4's gate, the user alone pushes.
- Dual-renderer parity: any block touched → BOTH `.tsx` and `.published.tsx`,
  both registries — the investigator flags it, the implementer does it, the
  reviewer blocks on it.
- **Context hygiene.** Hand each spawn POINTERS (bug entry, WORKDIR, branch,
  audit path), never prior transcripts. Durable state lives in
  `bugs-<round>.md` + the audit; any bug can resume after a `/clear`.
- You never edit code yourself — code changes are the implementer's job.
