# scale-run — driver runbook

You are the autonomous driver for scale-01..09. Every `/loop 15m` firing, do this.
The 15-min interval is the **usage-limit heartbeat**: if you're rate-limited the
firing no-ops; the first firing after the limit resets continues. When healthy,
run continuously within a firing — do NOT wait between phases or specs.

## Each firing

1. Read `scale-run.progress.md` (the ledger). Confirm branch: `git branch --show-current`
   must be `feature/scale`. If not, `git checkout feature/scale` (create off main only
   if missing). NEVER branch per-spec.
2. If all 9 rows are `done` → **stop the loop** (report done). If a row is `blocked`
   or the pilot gate is `awaiting-gate` → **stop the loop**, leave a note, wait for user.
3. Otherwise take the lowest-numbered `pending`/`in-progress` spec and run the
   `/feature` pipeline for it (playbook in `.claude/skills/feature/SKILL.md`) with the
   OVERRIDES below. On completion, mark it `done` in the ledger + move to the next spec
   in the SAME firing. Keep going until a stop condition or the usage window ends.

## Overrides vs the /feature skill

- **Branch:** ALL specs build on `feature/scale`. Skip skill step 0.5's per-spec branch
  creation. Pass `feature/scale` to every implementer/impl-reviewer spawn.
- **No merge, no push, no deploy-watch.** Skip skill steps 5 (merge gate) + 6 entirely.
  After a spec's final phase: run `npm run build`, log result, mark `done`, next spec.
- **Per-plan phase human gates:** auto-pass. Pick the conservative option, log it in the
  plan/audit, keep moving. (Exception: the pilot gate below.)
- **PILOT GATE:** after spec 03 finishes (`done`), set the pilot-gate row to
  `awaiting-gate` and **stop the loop**. Do not start 04. Wait for user go.
- **3× loop exhaustion** (plan-review or impl-review): mark that spec `blocked`, log the
  outstanding blockers in the ledger Run log, **stop the loop**. Do not build dependents.
- **Commits:** per-phase commits land on `feature/scale` as usual (`feat(scale-0N): ...`).

## Context hygiene
State lives in the ledger + each spec's `*.plan.md` (Progress log) + `*.audit.md`.
Between phases/specs, drop prior detail from working context — `/clear`-safe.

### Post-`/clear` resume decision tree (fresh context, nothing in memory)
Read the ledger's RESUME POINTER + the in-progress spec's artifacts on disk, then:
1. No `<spec>.plan.md` exists → re-scout (spawn scouts) then plan. (Scout findings are
   NOT on disk until captured in plan.md — a clear before plan.md is written loses them,
   so only clear once plan.md exists.)
2. `<spec>.plan.md` exists but ledger says stage=planning/plan-review → spawn plan-reviewer
   on it (the plan already encodes scout findings in its design-decisions section).
3. Plan approved (Progress log seeded) → find the lowest phase NOT marked `done` in the
   plan's Progress log → spawn implementer for it → impl-review → commit → next phase.
4. All phases `done` → run final build, mark spec `done` in ledger, start next spec.
Always re-confirm `git branch --show-current == feature/scale` first. NEVER re-do a phase
already marked `done` (its commit is on the branch).

## Ledger discipline
Update `scale-run.progress.md` on every transition (spec start, spec done, gate, block)
and append a Run-log line each firing. That file is the single source of truth.
