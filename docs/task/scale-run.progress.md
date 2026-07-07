# scale-run — autonomous pipeline ledger

Branch: `feature/scale` (single accumulating branch; NOT merged to main).
Driver: `/loop 15m` → follow `scale-run.runbook.md`.
Started: 2026-07-07.

## Status

| # | Spec | Status | Last commit | Notes |
|---|------|--------|-------------|-------|
| 01 | scale-01-brief-registry.spec.md | pending | — | |
| 02 | scale-02-router-serve-gate.spec.md | pending | — | dep 01 |
| 03 | scale-03-images-at-birth.spec.md | pending | — | dep 01 |
| — | **PILOT GATE (human)** | pending | — | HALT after 03 → wait for user go |
| 04 | scale-04-click-system.spec.md | pending | — | dep 01 |
| 05 | scale-05-goal-machinery.spec.md | pending | — | dep 04 |
| 06 | scale-06-wizard-convergence.spec.md | pending | — | dep 01,02 |
| 07 | scale-07-structure-convergence.spec.md | pending | — | dep 01,06 |
| 08 | scale-08-businesstype-config.spec.md | pending | — | dep 06,07 |
| 09 | scale-09-block-variants.spec.md | pending | — | dep 07 |

Status values: `pending` → `in-progress` → `done` | `blocked` | `awaiting-gate`.

## Run log
(append one line per firing: timestamp — what advanced / why stopped)
