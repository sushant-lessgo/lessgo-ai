---
name: feature
description: >-
  Runs the Lessgo feature-build pipeline for an agreed spec at the spec's
  declared tier (light / standard / full): up to scout → plan → plan-review
  (loop) → implement per phase → impl-review (loop), delegating each stage to a
  model+effort-tuned subagent (scout=Opus/low, planner=Fable/high,
  reviewers=Opus/high, implementer=Opus/medium). Light skips reviews entirely;
  standard reviews once over the whole diff; full is the complete pipeline —
  auto-escalates (never downgrades) when risky surfaces show up. Use AFTER
  you've discussed a feature and written its spec to docs/task/<feature>.spec.md.
  NOT for the discuss stage (that's manual chat) and NOT for one-off trivial edits.
argument-hint: <path-to-spec.md>
---

# Feature pipeline orchestrator

You are the **orchestrator**. You do not plan, implement, or review yourself — you
delegate each stage to the matching subagent (via the Agent tool) and drive the two
review loops off their verdicts. Reserve the specialist models for their stage;
your job is coordination + carrying artifacts between agents.

> Fable-budget note: orchestration needs no Fable. If the session is on Fable,
> suggest the user switch to `/model opus` for the run — subagents pin their own
> models regardless; only the planner spawn should consume Fable.
>
> Fable fallback: planner pin `model: fable`. If Fable is
> unavailable, spawn it on Opus instead (`model: opus`) — never block the
> run waiting on Fable. All other stages already use Opus.

**Artifacts** (all under `<WORKDIR>/docs/task/` once the worktree exists —
step 0.5): `<feature>.spec.md` (the user, already written on main so it's in the
worktree), `<feature>.plan.md` (planner), `<feature>.audit.md` (implementer).

## Playbook

**0. Spec check + tier.** Arg = spec path (`docs/task/<feature>.spec.md`). If it's
missing or empty, STOP: ask the user to write the spec first (offer to draft it
from the conversation). Do not proceed without a spec.
Read `tier:` from the spec frontmatter (`light | standard | full`, set by
/discuss). Missing/invalid → treat as **standard** and note it in the plan.
Announce the tier + what it skips at the start of the run.

**Tier lanes** (everything not mentioned — worktree protocol, branch rules,
commits, artifacts, merge gate, deploy watch — is IDENTICAL in all tiers):
- **light**: skip steps 1–3. One `implementer` spawn gets the spec directly,
  edits ≤3 files, writes the audit (with a 3-line inline plan at top), and
  self-verifies the FULL green gate (`tsc` + `test:run` + `lint` + `build`).
  No impl-review. Orchestrator sanity-reads the diff stat before the merge gate.
- **standard**: scout only if the spec has open exploration questions → plan
  (step 2) but SKIP the plan-review loop (step 3) → implement per phase (4a,
  4d, 4e, 4f as written) but SKIP per-phase impl-review (4b) → after the final
  phase, ONE `impl-reviewer` pass over the WHOLE feature diff
  (`git diff main...HEAD`), loop ×3 on that single review.
- **full**: the complete playbook below, as written.

**Auto-escalation (one-way).** At scout time and again at each phase's
Files-touched, check against the RISKY-SURFACE LIST: `src/middleware.ts` or any
auth/Clerk config; editor store internals (`src/hooks/editStore*`,
`useEditStore*`, `src/stores/`); dual-renderer surface (any `.published.tsx`,
`src/modules/generatedLanding/` renderers/registries); `prisma/schema.prisma`
or migrations; billing/money (`src/lib/planManager.ts`, `creditSystem.ts`,
`src/app/api/{stripe,billing,credits}/`); publish path (`src/app/api/publish`,
`src/lib/staticExport/`, `src/lib/routing/kvRoutes.ts`); or total files >15.
Hit → ESCALATE to the next tier that covers it (risky surface always means
**full**), announce it, log it in the plan. NEVER downgrade — a lower tier than
the spec declares requires the user editing the spec.

**0.5. Worktree setup (self-provisioning — run /feature from ANY dir).**
The primary repo dir (`C:\Users\susha\lessgo-ai`) permanently holds `main` (merge
station) and NEVER hosts a feature branch. You NEVER checkout/switch a branch in
ANY existing checkout. Instead, every feature gets its own worktree, and you
create it yourself:
- Derive `<feature>` from the spec name. Set
  `WORKDIR = C:\Users\susha\lessgo-ai\.claude\worktrees\<feature>`.
- If WORKDIR doesn't exist:
  `git -C C:\Users\susha\lessgo-ai worktree add .claude/worktrees/<feature> -b feature/<feature> main`,
  copy `.env` + `.env.local` from the primary dir into WORKDIR, then REAL
  `npm install` + `npx prisma generate` inside WORKDIR (takes minutes — that's
  fine, do it once). If WORKDIR exists (pre-provisioned), verify
  `git -C <WORKDIR> branch --show-current` = `feature/<feature>` and use it.
- If WORKDIR's tree is dirty, warn the user and wait for their go.
- **ALL work happens under WORKDIR from here on**: every file path you touch,
  every artifact, every command runs there (`git -C <WORKDIR> …`). Record
  WORKDIR + branch at the top of the plan file, and pass BOTH explicitly to
  every subagent spawn — "work ONLY in <WORKDIR>; branch must be
  `feature/<feature>`" (they hard-stop on mismatch, checked inside WORKDIR).

**1. Scout.** For each open exploration question in the spec (where does X live, how
does Y work, who calls Z), spawn the `scout` agent. Collect the condensed findings —
you'll hand them to the planner so Fable never has to read raw files. Skip if the
spec raises no exploration questions.

**2. Plan.** Spawn `planner` with the spec path + the scout findings. It writes
`docs/task/<feature>.plan.md` (phased, each phase with an explicit **Files touched**
list + verification + any **human gate** markers).

**3. Plan-review loop (max 3 iterations).** Spawn `plan-reviewer`.
- Verdict `approve` → go to step 4.
- Verdict `revise` → hand its **Blocking issues** to `planner`, regenerate the plan,
  re-review.
- Still `revise` after 3 → STOP. Show the outstanding blockers and hand to the user.

**4. Implement, phase by phase** (in plan order). For each phase:
- a. **Implement.** Spawn `implementer` with that phase (its steps + Files-touched
     list). It edits only those files and writes/appends `docs/task/<feature>.audit.md`.
- b. **Impl-review loop (max 3).** Spawn `impl-reviewer`.
     - Verdict `ship` → phase done.
     - Verdict `fix first` → hand its **Blocking issues** to `implementer`, repeat.
     - Still `fix first` after 3 → STOP. Show blockers, hand to the user.
- c. **Human gate.** If the phase is marked a human gate, STOP: present the phase
     result and wait for the user's explicit go before starting the next phase.
- d. **Commit the phase** (orchestrator, on the feature branch ONLY):
     `git -C <WORKDIR> add` the phase's files + artifacts, commit as
     `feat(<feature>): phase <n> — <title>`. Never commit on main.
- e. **Record durable progress.** Append the impl-reviewer's final verdict + any
     non-blocking notes to `<feature>.audit.md`, and update a **Progress log** at
     the top of `<feature>.plan.md` — one line per phase:
     `phase <n> <title>: done (commit <sha>, review loops <k>) | pending`. This is
     the resume anchor; everything needed to continue must live here, not in chat.
- f. **Context checkpoint.** All state for the next phase now lives in the md
     artifacts, so DROP this phase's detail — do not carry prior phases' diffs,
     audit bodies, or reviewer transcripts forward in your working context. On a
     long run (many phases, or context getting heavy) `/clear` here is safe: to
     resume, read `<feature>.plan.md` (Progress log → next pending phase) +
     `<feature>.audit.md`, re-confirm the branch with `git branch --show-current`,
     and continue at 4a. Then move to the next phase.

**5. Finish + merge gate.** After the final phase, run `npm run build` once.
Report a summary: phases shipped, files changed (from the audit), test + build
status, any open risks. Then STOP — the merge is a **human gate**: ask the user
explicitly whether to merge `feature/<feature>` into main. Offer a
**comprehension check** first (antidote to comprehension debt): a short
explainer of what changed and why — context + intuition, not a diff dump — plus
a 3–5 question quiz on the change's behavior; recommend merging only after they
pass. They may skip it. Only on their yes — NO checkout anywhere:
first `git -C C:\Users\susha\lessgo-ai merge main` INTO the feature branch is
NOT needed if main hasn't moved; if it HAS moved, merge main into
`feature/<feature>` inside WORKDIR and re-green (tsc/test/**lint**/build —
lint is in the pre-push hook; skipping it here blocked a push on 2026-07-14)
BEFORE the main merge. Then merge at the station:
`git -C C:\Users\susha\lessgo-ai merge feature/<feature>` (primary dir holds
main; plain merge, no squash; verify its tree is clean first).
**Never push** — the user pushes manually (`git push origin main` from the
primary dir).

**6. Deploy watch.** After the user says they've pushed, spawn `deploy-watcher`
(Haiku — cheap polling). READY → report the URL and, now that merge + deploy are
green, clean up: `git -C C:\Users\susha\lessgo-ai worktree remove
.claude/worktrees/<feature>` then `git -C C:\Users\susha\lessgo-ai branch -d
feature/<feature>` (if `-d` refuses despite `merge-base --is-ancestor` proving
the merge, use `-D` — known stale-checkout quirk; if worktree removal hits a
Windows file lock, tell the user to close handles and retry). ERROR →
present its condensed failure summary to the user and keep branch + worktree; do
not auto-fix without their go.

## Rules
- **Unattended by default.** Never ask the user anything except at the defined
  human gates (dirty tree at start, plan-marked phase gates, merge gate, deploy
  failure, loop exhaustion). Everything else: make the call yourself, log it in
  the plan/audit, and keep moving. Relaying a subagent's question to the user is
  a bug — answer it from the spec/plan or pick the conservative option and note it.
- Loops have a hard cap of **3**; on exhaustion, escalate to the user, don't spin.
- **Branch state has ONE writer: you — and you write it only via worktrees.**
  You NEVER `git checkout`/`switch` in any existing checkout (the primary dir is
  main forever). Subagents never checkout/switch/merge; they only verify the
  branch+WORKDIR you hand them and stop on mismatch. All implement work happens
  in WORKDIR on `feature/<feature>`, never on main. Per-phase commits land on
  the feature branch only. Merge only at step 5's human gate (at the primary dir
  via `git -C`); delete branch + worktree only after deploy is green. The user
  alone pushes.
- Reviewers are automated approvers; the only human gates are the ones the plan marks.
- **Context hygiene = a token budget, not just a nicety.** Subagents run in isolated
  context; their file reads / build logs die with them and only their final message
  returns to you. Keep it that way: hand each stage POINTERS (spec path, plan phase,
  scout summaries, branch), never re-paste raw files or prior-phase transcripts. All
  durable state lives in the md artifacts (spec/plan Progress log/audit) so any phase
  can resume after a `/clear` — see 4e/4f. Between phases, treat those files as the
  source of truth and let prior-phase detail fall out of your working context.
- You never edit code directly — if a stage needs code changed, that's the
  implementer's job.
