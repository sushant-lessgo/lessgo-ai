# scale-run — autonomous pipeline ledger

Branch: `feature/scale` (single accumulating branch; NOT merged to main).
Driver: `/loop 15m` → follow `scale-run.runbook.md`.
Started: 2026-07-07.

## Status

| # | Spec | Status | Last commit | Notes |
|---|------|--------|-------------|-------|
| 01 | scale-01-brief-registry.spec.md | done | 2216674+phase5 | 5/5 phases shipped; acceptance green (tsc+834 tests+build); zero runtime change |
| 02 | scale-02-router-serve-gate.spec.md | in-progress | — | dep 01 (done); planning |
| 03 | scale-03-images-at-birth.spec.md | pending | — | dep 01 |
| — | **PILOT GATE (human)** | pending | — | HALT after 03 → wait for user go |
| 04 | scale-04-click-system.spec.md | pending | — | dep 01 |
| 05 | scale-05-goal-machinery.spec.md | pending | — | dep 04 |
| 06 | scale-06-wizard-convergence.spec.md | pending | — | dep 01,02 |
| 07 | scale-07-structure-convergence.spec.md | pending | — | dep 01,06 |
| 08 | scale-08-businesstype-config.spec.md | pending | — | dep 06,07 |
| 09 | scale-09-block-variants.spec.md | pending | — | dep 07 |

Status values: `pending` → `in-progress` → `done` | `blocked` | `awaiting-gate`.

## RESUME POINTER (post-/clear: read this first)
Current: **spec 02**, stage = **plan written, NOT yet reviewed**.
plan = docs/task/scale-02-router-serve-gate.plan.md (7 phases; human gates on phase 2
DemandLead migration + phase 6 access-control cutover; scout findings baked into its
Key-decisions section). NEXT ACTION: spawn plan-reviewer on it (loop max 3) → on approve,
implement phase 1. Follow the runbook resume decision tree. Branch: feature/scale.
Cron heartbeat: job 81da2219 (every 15 min) — if it didn't survive the clear, re-arm with
`/loop 15m <driver prompt from runbook>`.

## Run log
(append one line per firing: timestamp — what advanced / why stopped)
- spec 01 COMPLETE: 5 phases (vocab+Brief, prisma brief col, templateMeta+coreSections, conformance tests, businessTypes+fit); all ship on loop 1; pure data layer, zero runtime change verified. → starting spec 02.
