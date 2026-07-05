---
name: feature
description: >-
  Runs the Lessgo feature-build pipeline for an agreed spec: scout → plan →
  plan-review (loop) → implement per phase → impl-review (loop), delegating each
  stage to a model+effort-tuned subagent (scout=Opus/medium, planner=Fable/high,
  reviewers=Opus/xhigh, implementer=Fable/medium). Use AFTER you've discussed a
  feature and written its spec to docs/task/<feature>.spec.md, when you want the
  plan→review→implement→review loops driven automatically instead of by hand.
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
> models regardless; only planner/implementer spawns should consume Fable.

**Artifacts** (all under `docs/task/`): `<feature>.spec.md` (the user, already
written), `<feature>.plan.md` (planner), `<feature>.audit.md` (implementer).

## Playbook

**0. Spec check.** Arg = spec path (`docs/task/<feature>.spec.md`). If it's missing
or empty, STOP: ask the user to write the spec first (offer to draft it from the
conversation). Do not proceed without a spec.

**0.5. Branch setup (orchestrator only — subagents NEVER switch branches).**
- If the working tree is dirty, warn the user and wait for their go — don't
  proceed silently.
- Derive the branch from the spec name: `feature/<feature>`. Create it from main
  (`git checkout -b feature/<feature>`), or check it out if it already exists.
- Verify with `git branch --show-current`; record the branch at the top of the
  plan file, and pass it EXPLICITLY to every implementer/impl-reviewer spawn
  (they hard-stop on mismatch).

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
     `git add` the phase's files + artifacts, commit as
     `feat(<feature>): phase <n> — <title>`. Never commit on main.
- e. Note progress, continue to the next phase.

**5. Finish + merge gate.** After the final phase, run `npm run build` once.
Report a summary: phases shipped, files changed (from the audit), test + build
status, any open risks. Then STOP — the merge is a **human gate**: ask the user
explicitly whether to merge `feature/<feature>` into main. Offer a
**comprehension check** first (antidote to comprehension debt): a short
explainer of what changed and why — context + intuition, not a diff dump — plus
a 3–5 question quiz on the change's behavior; recommend merging only after they
pass. They may skip it. Only on their yes:
`git checkout main && git merge feature/<feature>` (plain merge, no squash).
**Never push** — the user pushes manually.

**6. Deploy watch.** After the user says they've pushed, spawn `deploy-watcher`
(Haiku — cheap polling). READY → report the URL and, now that merge + deploy are
green, delete the feature branch (`git branch -d feature/<feature>`). ERROR →
present its condensed failure summary to the user and keep the branch; do not
auto-fix without their go.

## Rules
- Loops have a hard cap of **3**; on exhaustion, escalate to the user, don't spin.
- **Branch state has ONE writer: you.** Subagents never checkout/switch/merge;
  they only verify the branch you hand them and stop on mismatch. All implement
  work happens on `feature/<feature>`, never on main. Per-phase commits land on
  the feature branch only. Merge only at step 5's human gate; delete the branch
  only after deploy is green. The user alone pushes.
- Reviewers are automated approvers; the only human gates are the ones the plan marks.
- Keep progress in the md artifacts, not just this chat, so a phase can resume after
  `/clear`.
- You never edit code directly — if a stage needs code changed, that's the
  implementer's job.
