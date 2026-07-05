---
name: feature
description: >-
  Runs the Lessgo feature-build pipeline for an agreed spec: scout → plan →
  plan-review (loop) → implement per phase → impl-review (loop), delegating each
  stage to a model+effort-tuned subagent (scout=Opus/low, planner=Fable/high,
  reviewers=Opus/high, implementer=Fable/medium). Use AFTER you've discussed a
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

**Artifacts** (all under `docs/task/`): `<feature>.spec.md` (the user, already
written), `<feature>.plan.md` (planner), `<feature>.audit.md` (implementer).

## Playbook

**0. Spec check.** Arg = spec path (`docs/task/<feature>.spec.md`). If it's missing
or empty, STOP: ask the user to write the spec first (offer to draft it from the
conversation). Do not proceed without a spec.

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
- d. Note progress, continue to the next phase.

**5. Finish.** After the final phase, run `npm run build` once. Report a summary:
phases shipped, files changed (from the audit), test + build status, any open risks.
**Never commit or push** — the user does that manually.

## Rules
- Loops have a hard cap of **3**; on exhaustion, escalate to the user, don't spin.
- Reviewers are automated approvers; the only human gates are the ones the plan marks.
- Keep progress in the md artifacts, not just this chat, so a phase can resume after
  `/clear`.
- You never edit code directly — if a stage needs code changed, that's the
  implementer's job.
