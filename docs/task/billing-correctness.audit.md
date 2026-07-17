# billing-correctness — audit

## Phase 1 — H1 atomic decrement + ledger-in-tx + concurrency test

Branch verified: `feature/billing-correctness` (guard passed before any edit).

### Files changed

- `src/lib/creditSystem.ts` — rewrote `deductCredits` (guarded `updateMany` + count-assert + bounded retry + `charge_conflict` exhaustion code + optional `eventData` + in-tx `usageEvent.create`); false lock comment deleted; `consumeCredits` now passes `eventData` through and no longer writes the post-hoc success ledger row.
- `src/lib/creditSystem.test.ts` — `withTx` mock rebuilt for the guarded-updateMany shape (stateful, honours `gte` guards, returns `{ count }`); 4 existing split behaviors kept green; added guard/retry/ledger/`charge_conflict` cases.
- `src/lib/creditSystem.concurrency.test.ts` — NEW; real-DB concurrency suite (5 cases).
- `docs/task/billing-correctness.audit.md` — this file.
- `docs/task/billing-correctness.spec.md` + `docs/task/billing-correctness.plan.md` — untracked, left as-is for the orchestrator to commit (no edits by me).

NOT changed: `planManager.ts`, any route, `planCheck.ts`, `CREDIT_COSTS`, `PLAN_CONFIGS`.

> `git status` also lists `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` as modified. `git diff` on it is **EMPTY** — an LF→CRLF end-of-line touch from running the test suite, zero content change. I did not edit it and left it alone.

---

## RED-first proof (mandatory)

Method: `cp src/lib/creditSystem.ts /tmp/creditSystem.FIXED.ts` → `git show HEAD:src/lib/creditSystem.ts > src/lib/creditSystem.ts` (pre-fix read-modify-write restored; verified by `grep -c "Lock the usage record"` → `1`) → run suite → restore with `cp` (→ grep `0`). Plain file copies only; **no state-changing git commands**.

### RED — pre-fix `deductCredits` (3 of 5 cases FAIL)

```
 ❯ src/lib/creditSystem.concurrency.test.ts (5 tests | 3 failed) 1132ms
     × monthly=0, pool=1, N=5 → 1 success; creditsUsed===1 and counter===1 (NO-PARTIAL-CHARGE ROLLBACK PROOF) 26ms
     × monthly=1, pool=1, N=3 → exactly 2 succeed (retry/recompute path), both buckets drained 11ms
     × ledger atomicity: exactly one success:true UsageEvent per successful spend 11ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  ... > monthly=0, pool=1, N=5 → 1 success; creditsUsed===1 and counter===1 (NO-PARTIAL-CHARGE ROLLBACK PROOF)
AssertionError: expected [ …(5) ] to have a length of 1 but got 5
- Expected
+ Received
- 1
+ 5
 ❯ src/lib/creditSystem.concurrency.test.ts:144:23

 FAIL  ... > monthly=1, pool=1, N=3 → exactly 2 succeed (retry/recompute path), both buckets drained
AssertionError: expected [ …(3) ] to have a length of 2 but got 3
- Expected
+ Received
- 2
+ 3
 ❯ src/lib/creditSystem.concurrency.test.ts:163:46

 FAIL  ... > ledger atomicity: exactly one success:true UsageEvent per successful spend
AssertionError: expected 4 to be 2 // Object.is equality
- Expected
+ Received
- 2
+ 4
 ❯ src/lib/creditSystem.concurrency.test.ts:202:23

 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

The smoking gun is in the RED stdout — **the pool went NEGATIVE**, one credit paying for five generations:

```
[DEV] Deducted 1 credits from user billing_it_1784245467516_4xuwbpwy. Remaining: 0
[DEV] Deducted 1 credits from user billing_it_1784245467516_4xuwbpwy. Remaining: -1
[DEV] Deducted 1 credits from user billing_it_1784245467516_4xuwbpwy. Remaining: -2
[DEV] Deducted 1 credits from user billing_it_1784245467516_4xuwbpwy. Remaining: -3
[DEV] Deducted 1 credits from user billing_it_1784245467516_4xuwbpwy. Remaining: -4
```

**Honest caveat — case 1 (`monthly=1, pool=0, N=5`) PASSES pre-fix**, so it is NOT the case that catches H1. Why it passes is timing luck, not correctness: the losers' `findUnique` happened to execute after the winner's tx had already committed (`creditsRemaining` read as 0), so they threw `Insufficient credits` on the stale-read guard. Nothing in the pre-fix code *guarantees* that — a different interleaving would have let all 5 through, exactly as the pool cases show. **The cases that actually catch H1 are the pool-path ones (2, 3, 5)**, which is precisely why the reviewer's C3 / case-2 insistence mattered: without the `creditsUsed`/counter assertions the suite could have gone green on a broken implementation. All five stay; the suite as a whole is unambiguously red pre-fix.

### GREEN — post-fix (fix restored, grep gate `0`)

```
 RUN  v4.1.8 C:/Users/susha/lessgo-ai/.claude/worktrees/billing-correctness
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  01:44:47
   Duration  1.94s (transform 97ms, setup 0ms, import 101ms, tests 1.30s, environment 0ms)
```

Suite **EXECUTED** (not skipped) inside the full `npm run test:run` too — verbose reporter:

```
 ✓ src/lib/creditSystem.concurrency.test.ts > deductCredits concurrency (real DB) > monthly=1, pool=0, N=5 → exactly 1 success, 4 insufficient, nothing negative 484ms
 ✓ src/lib/creditSystem.concurrency.test.ts > deductCredits concurrency (real DB) > monthly=0, pool=1, N=5 → 1 success; creditsUsed===1 and counter===1 (NO-PARTIAL-CHARGE ROLLBACK PROOF) 59ms
 ✓ src/lib/creditSystem.concurrency.test.ts > deductCredits concurrency (real DB) > monthly=1, pool=1, N=3 → exactly 2 succeed (retry/recompute path), both buckets drained 56ms
```

---

## Gate-(b) ledger decisions — founder sign-off, not discovery

1. **Success ledger moved INTO the deduction tx.** `deductCredits` writes `tx.usageEvent.create({ creditsUsed: cost, success: true })` as the last op inside the tx; `consumeCredits`'s post-hoc success `logUsageEvent` call is **DELETED**. Net: a successful spend and its ledger row are atomic (a crash can no longer leave a silent unledgered spend), and there is exactly ONE row per spend (no double-ledger). Retries roll the row back with the tx, so no duplicates.
2. **Pre-gate 402s (phase 3).** Today a 0-credit user reaches `consumeCredits`, which writes a `success:false` UsageEvent. Under phase 3's pre-gate that call is never reached, so **phase 3's routes will write the failed UsageEvent themselves** — 0-credit attempts stay ledgered. Nothing is lost in phase 1 (the `consumeCredits` failure-path logs are untouched and still fire).
3. **`DEV_BYPASS_CREDITS` now writes NO UsageEvent at all.** The bypass short-circuits `deductCredits` before the tx, and the success `logUsageEvent` that used to cover it is gone. Dev-only flag; **accepted per plan decision 3** — deliberately did NOT add a bypass-path ledger write.

## Corrections applied (C1–C4)

- **C1 (pool pin on the wrong client) — applied.** The test mutates `process.env.DATABASE_URL` (appends `?connection_limit=10`; the local URL has no query string, so `?`) at module top level, then `await import('./creditSystem')` in `beforeAll`. That ordering is what makes the pin bite the **`@/lib/prisma` singleton** the code under test actually uses (it does `new PrismaClient()` and reads the URL at import time). The test's own `PrismaClient` is used ONLY for seed/read/cleanup. The suite drives the **real `deductCredits`** — no raw-query theatre. Ordering rationale is written into the file header so nobody "tidies" the dynamic import into a static one.
- **C2 (Neon → local Postgres) — confirmed stale, noted.** `.env:18` is `postgresql://postgres:…@localhost:5432/lessgo_local`; both Neon URLs are commented out (`:10`, `:14`). The plan's "Neon dev DB / WAN contention" framing is dead. **The decision-6 `maxWait`/`timeout` bump was NOT applied** — no timeouts observed (whole suite runs in ~1.3s). Local Postgres reproduced red cleanly, so the concern it hedged never materialized.
- **C3 (counted eventType) — applied.** All concurrency cases use `PAGE_GENERATION` (→ `fullPageGens`), so the `counter === 1` assertion is non-vacuous. Confirmed the `switch` only counts `PAGE_GENERATION`/`SECTION_REGEN`/`ELEMENT_REGEN`/`FIELD_INFERENCE`.
- **C4 (`logUsageEvent` swallows by design) — respected.** Untouched; still catches and logs. A ledger failure never surfaces as a request failure.

## Non-negotiables checklist

| # | Item | Status |
|---|---|---|
| 1 | RED-first proof, both outputs pasted | ✅ above |
| 2 | Suite executes (count shown), loud warn on skip | ✅ `console.warn('*** BILLING CONCURRENCY SUITE SKIPPED — no DATABASE_URL — this run proves NOTHING about H1 ***')` |
| 3 | Case 2 asserts `creditsUsed === 1` AND `fullPageGens === 1` | ✅ |
| 4 | No fake rollback assertion in the mocked test | ✅ comment states it proves only sentinel propagation + promise rejection |
| 5 | No `creditsUsed + creditsRemaining === creditsLimit` assertion | ✅ absent |
| 6 | False lock comment gone | ✅ `rg "Lock the usage record" src/` → **0 hits** |
| 7 | Exhaustion → `charge_conflict`, propagated unmangled | ✅ + test asserts `.not.toMatch(/insufficient/i)` |
| 8 | Worktree install real | ✅ `node_modules` real dir (not a junction), `npx prisma -v` → prisma 6.8.2 / @prisma/client 6.8.2, binaryTarget windows |
| 9 | Isolation: random userId, seed, cleanup, bypass deleted | ✅ `billing_it_<ts>_<rand>`; **no `User` FK exists** (`UserPlan`/`UserUsage`/`UsageEvent.userId` are plain Clerk-ID strings, no relations) → no User seed needed |

## Verification

- `npx tsc --noEmit` → **one error, pre-existing + environmental, in a file I did not touch**: `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`. Cause: `next-env.d.ts` (which declares the image-module types) is absent from this worktree because `next build`/`next dev` has never run here; `src/assets/images/founder.jpg` exists on disk. Not billing-related, not introduced by this phase. **Zero errors in `src/lib/creditSystem*`.**
- `npm run test:run` → `Test Files 210 passed | 1 skipped (211)` · `Tests 3557 passed | 18 skipped (3575)`. Concurrency suite among the passers (✓ lines above). `creditSystem.test.ts` alone: 17 passed.
- `npm run lint` → clean (only pre-existing warnings in `vestria/blocks/publishedPrimitives.tsx` and `providers/ph-provider.tsx`; no errors).
- `rg "Lock the usage record" src/` → 0 hits.

## Deviations / judgment calls (plan didn't cover)

1. **Ledger row is written only when `eventData` is passed.** `deductCredits(userId, cost, eventType)` with no 4th arg writes NO UsageEvent. To keep today's behavior, `consumeCredits` **always** passes an object (`{ duration, ...eventData }`), so every consume-driven spend is still ledgered even when the caller supplies no eventData. Conservative: direct `deductCredits` callers (there are none in prod — `consumeCredits` is the sole caller) keep their current no-ledger behavior rather than silently gaining rows.
2. **`remaining` on retry exhaustion** = the combined balance seen by the last attempt (`lastKnownBalance`), not `0`. Reporting a solvent user as having 0 is exactly the misreport decision 2 warns about. Test asserts `remaining === 5` for a solvent conflict-loser.
3. **`duration` is computed at the `deductCredits` call site** in `consumeCredits` (before the tx) rather than after it, so the in-tx row can carry it. Slight under-count vs the old post-hoc value (excludes tx time). Ledger metadata only, not money.
4. **Existing "insufficient combined balance" test tightened** to also assert no retry is burned (`$transaction` called once, `updateMany` never called) — genuine insufficiency must fail fast.
5. `usageEvent.create` was added to the mocked `tx` object; the mock's `updateMany` honours the `gte` guards and applies `{ increment }`/`{ decrement }` ops so the 4 pre-existing split assertions still test real arithmetic rather than echoing the mock.

## Open risks

- The concurrency suite hits the local dev DB on **every** `npm run test:run` (plan unresolved Q4). It seeds/cleans its own random user, but it is not hermetic — a dev with no local Postgres running gets a hard failure, not a skip (`DATABASE_URL` is set in `.env` regardless of whether the server is up). Founder call.
- `charge_conflict` has no client-side auto-retry (plan Q9); phase 3 surfaces it as a recoverable 500.
- Retry exhaustion under sustained real contention returns a 500 rather than queueing — acceptable at current scale, revisit if the money path ever gets hot.
</content>
