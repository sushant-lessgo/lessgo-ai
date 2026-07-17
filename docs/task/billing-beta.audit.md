# billing-beta — implementation audit

Branch: `feature/billing-beta` (verified before any edit). WORKDIR:
`C:\Users\susha\lessgo-ai\.claude\worktrees\billing-beta`.

## Phase 1 — config extraction (prisma-free constants)

### Files changed

- `src/lib/planConfigs.ts` (new)
- `src/lib/creditCosts.ts` (new)
- `src/lib/planConfigs.test.ts` (new)
- `src/lib/planManager.ts` (modified)
- `src/lib/creditSystem.ts` (modified)

No other file was touched. All within the phase's Files-touched list.

### What changed, file by file

**`src/lib/planConfigs.ts` (new)** — receives `PlanTier`, `PlanStatus`, `PlanConfig`,
`PLAN_CONFIGS`, `getPlanConfig`, moved out of `planManager.ts`. No prisma/logger import, no `@/`
alias import (stated as an invariant in the file header — the Playwright runner imports these
modules by relative path and does not resolve tsconfig aliases). Values byte-identical: the
`PLAN_CONFIGS` block and the enum/interface block were diffed line-by-line against
`git show HEAD:src/lib/planManager.ts` — 0 differing lines except the 2 comment lines noted under
Deviations. Load-bearing comments moved with the code (FREE `credits:20` divergence note, the
socialPosts migration-sync note, the trackingPixels config-only note).

**`src/lib/creditCosts.ts` (new)** — receives `CREDIT_COSTS` (`as const`) verbatim; the moved
block is byte-identical to HEAD (verified programmatically). Same prisma-free / no-`@/` header
invariant. Adds `export type CreditOperation = keyof typeof CREDIT_COSTS` (see Deviations).

**`src/lib/planManager.ts`** — the moved declarations are replaced by an import + re-export of the
same five names. `PlanConfig` is re-exported via `export type { PlanConfig }` (required by
`isolatedModules: true`); the `PlanTier`/`PlanStatus` enums re-export as values. The duplicate
`getPlanConfig` definition further down the file was removed (it now comes from the re-export).
Everything else — the prisma-backed functions and the limit-column writer-completeness guard —
is untouched.

**`src/lib/creditSystem.ts`** — same pattern for `CREDIT_COSTS` (+ `CreditOperation` as a type
re-export). `UsageEventType` and all prisma-backed logic untouched.

**`src/lib/planConfigs.test.ts` (new)** — value pins. Scoped deliberately (see Deviations):
pins all 13 `CREDIT_COSTS` values (previously unpinned anywhere in the suite), the two
deliberate-divergence facts (FREE `credits:20`; PRO `price.annual: 24` is per-month, not $290/yr)
with comments so nobody "fixes" them, and `getPlanConfig` tier round-trip. No re-export identity
assertion (cannot fail — theatre), per the plan.

### Deviations from the plan

1. **Plan-value pins not duplicated.** Plan step 4 asks to pin FREE `credits:20` and PRO
   `monthly:29`/`annual:24`. `src/lib/planManager.test.ts:148-185` ("PLAN_CONFIGS pricing v2
   numbers") **already pins these**, and since `planManager` now re-exports `planConfigs`, those
   existing pins cover the moved module unchanged. Per the plan's "extend/de-dupe rather than
   duplicate" instruction I did not copy them; I kept a deliberate small overlap only for the two
   values that look like bugs (FREE 20, PRO annual 24), because their *pin comment* is the point.
   Scope note recorded in the test file header. `creditSystem.test.ts` had no `CREDIT_COSTS`
   value pins — that gap is now filled.
2. **Two comment lines reworded** in the `trackingPixels` note. Original read "the
   create/upgrade/downgrade writers **below** do not write this field" — after the move those
   writers are no longer below it (they stayed in `planManager.ts`), so the pointer would be a
   lie. Now reads "…writers **in planManager.ts** do not write this field". Comment text only;
   zero value/semantic change. This is the ONLY textual difference in the moved blocks.
3. **`CreditOperation` type added.** Plan step 2 says move `CREDIT_COSTS` "+ derived operation
   type"; no such type existed in `creditSystem.ts`. I defined
   `export type CreditOperation = keyof typeof CREDIT_COSTS` in `creditCosts.ts` and type-re-exported
   it from `creditSystem.ts`. Additive type-only, no runtime/value impact, no current importer.

### Verification (run in WORKDIR)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, clean |
| `npm run test:run` | **212 passed / 1 skipped** files; **3599 passed / 18 skipped** tests |
| `npm run lint` | 0 errors (pre-existing warnings only, all in untouched files) |
| `npm run build` | exit 0 (`PIPESTATUS=0`), full route table emitted |

Diff review: `git diff --stat` = `creditSystem.ts` (+/-29), `planManager.ts` (-203 net) — deletions
only, matching the two new modules. Moved blocks confirmed identical by scripted line-diff vs HEAD.

### Noticed but deliberately NOT touched

- **FREE `credits: 20` vs DB `creditsLimit=0`** — intentional (pool-backed), left as-is with its
  comment; now also pinned by a test.
- **PRO `price.annual: 24`** — a per-month figure; $290/yr lives only at `pricing/page.tsx:77`.
  Left as-is (plan decision 10); pinned with an explanatory comment.
- **`IVOC_RESEARCH: 3`** — dead constant (backend removed in scale-08). Left in config per plan;
  pinned for completeness. Must not be surfaced in UI (phases 3/6).
- `getPlanConfig(tier)` returns `PlanConfig` but is typed non-optional while two callers
  (`publish/route.ts:367`, `verify-dns/route.ts:123`) use `?.` — pre-existing, out of scope.
- No `@/` alias imports exist in either new module; treat as a standing invariant for phases 3+
  (the Playwright relative import depends on it).

### Open risks

- Low. Pure move; the only runtime-visible change is module identity of re-exported symbols, which
  TS/bundler resolve transparently — `tsc`, 3599 tests, lint, and a full production build are green.
- Phases 3/6 e2e specs will import `src/lib/creditCosts` / `src/lib/planConfigs` relatively from
  Playwright — the no-alias/no-prisma invariant must survive future edits to these two files.
