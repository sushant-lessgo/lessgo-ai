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

---

# Phase 2 — H2: `hasFeature` deny-by-default

## Files changed

- `src/lib/planManager.ts` — reimplemented `hasFeature` as config-derived/deny-by-default (design decision 4 verbatim); refreshed the now-stale `hasTrackingPixels` doc comment (code unchanged).
- `src/lib/planManager.test.ts` — added a `hasFeature` regression suite (9 tests) driven by rows with deliberately WRONG per-row feature columns.
- `docs/task/billing-correctness.audit.md` — this section (appended; phase 1 content untouched).

## What changed

### `src/lib/planManager.ts`

`hasFeature` body (was `planManager.ts:506-514`):

```ts
// before
return (userPlan as any)[feature] === true || (userPlan as any)[feature] !== 'none';
// after
const value = PLAN_CONFIGS[userPlan.tier as PlanTier]?.features[feature];
return typeof value === 'boolean' ? value : value !== undefined && value !== 'none';
```

- Signature unchanged: `(userId, feature: keyof PlanConfig['features']) => Promise<boolean>`.
- Booleans strict; `analytics` (the one string enum) non-`'none'` → true; `undefined` / unknown tier → false; catch → `false` (fail-closed, unchanged).
- Doc comment records WHY it's config-derived (per-row columns drift; some keys have no column) and that this is behavior-preserving (the create/upgrade/downgrade writers populate those columns from the same config).
- `hasTrackingPixels` comment block rewritten — it previously documented the bug just fixed. Now: hasFeature is config-derived too; hasTrackingPixels stays separate for its no-DB-column key; collapsing them is a deliberate deferred DRY-up (founder ruling Q3). **Its code is byte-identical.**

### `src/lib/planManager.test.ts`

New `describe('hasFeature (deny-by-default, config-derived)')`. Every FREE/PRO row is built by a `wrongRow()` helper that sets `removeBranding/customDomains/exportHTML/whiteLabel: true` and `analytics: 'full'` — so each assertion fails if the DB row is ever trusted again. Cases: FREE+removeBranding→false (the exact `!== 'none'` regression, row says true); FREE+whiteLabel/exportHTML/customDomains→false; FREE+trackingPixels (no column → undefined)→false; FREE+analytics→true (`'basic'`); PRO+removeBranding→true; PRO+exportHTML→false (PRO genuinely lacks it, row says true); AGENCY+exportHTML/whiteLabel→true; garbage tier→false incl. analytics; getUserPlan throws→false.

## Deviations / decisions the plan didn't cover (conservative choices)

1. **`analytics:'none'` tier does not exist.** No shipped tier sets `'none'` (FREE=`'basic'`, PRO/AGENCY/ENTERPRISE=`'full'`). Per the plan's "else synthetic/unknown tier", the `'none'` branch is pinned via the garbage-tier case (`analytics` → undefined → false) **plus** an explicit config-shape assertion: `for tier of PlanTier → features.analytics !== 'none'`. That second test is a tripwire — if a future tier introduces `'none'`, it fires and forces a real `'none'` case to be written. No synthetic tier was injected into `PLAN_CONFIGS` (would violate the values fence).
2. **Added AGENCY positive cases** (exportHTML/whiteLabel → true) beyond the listed set — cheap proof the fix isn't a blanket `false`. Additive to the test file only.
3. Did **not** touch the stale "do NOT use hasFeature… fails OPEN" comments at `publish/route.ts:359` and `domains/verify-dns/route.ts:117` — those files are outside Files-touched, and their code fence is explicit. Their comments now over-state the danger (hasFeature is fixed) but the inlined checks remain correct and behavior is identical. Flagged as tidy-up for whoever does the deferred DRY-up (Q3).

## Step 3 — caller check (READ-ONLY, no edits)

`src/app/api/domains/add/route.ts`, FREE user adding a custom domain:

| | Status | Body |
|---|---|---|
| **Before** (hasFeature effectively `() => true`) | `403` at the `checkLimit` backstop (`:62`, FREE `limits.customDomains = 0`) | `{ error: 'Custom domain limit reached', limit: 0, current: 0 }` |
| **After** (hasFeature correct) | `403` at the feature gate (`:55`) | `{ error: 'Custom domains not available on your plan' }` |

**Delta is status-code-identical (403→403); only the message changes.** The door was never open — the limit backstop already blocked FREE; the feature gate now fires first with a plan-appropriate message. Founder ruled this OK (Q5). Non-FREE tiers are unaffected (PRO/AGENCY/ENTERPRISE all have `features.customDomains: true`, so the gate passes and the limit check behaves exactly as before).

Confirmed UNTOUCHED (read-only inspection, zero diff): `publish/route.ts:359` and `domains/verify-dns/route.ts:117` inlined `getPlanConfig(tier).features.removeBranding === true` checks. `requireFeature` (`planCheck.ts:124`) not touched (phase 3's file; kept per Q6 — it becomes correct now that hasFeature is fixed).

## Scope fences

- **`PLAN_CONFIGS` values diff is EMPTY** — `git diff src/lib/planManager.ts` shows changes ONLY in the `hasFeature` body + two doc-comment blocks. No tier's limit or feature VALUE is touched. M7 (FREE publishedPages vs PRO) deliberately untouched — pricing-v2 owns it.
- `checkLimit` untouched. `creditSystem.ts` untouched (phase 1). No route files touched (phase 3).

## Gate outputs

```
$ npx tsc --noEmit
TSC_EXIT=0   (clean, no output)

$ npx vitest run src/lib/planManager.test.ts
 Test Files  1 passed (1)
      Tests  23 passed (23)

$ npm run test:run          # local Postgres UP — phase-1 concurrency suite executed, not skipped
 Test Files  210 passed | 1 skipped (211)
      Tests  3567 passed | 18 skipped (3585)
   Duration  59.42s

# concurrency suite confirmed EXECUTING (run explicitly to show test count, not a skip line):
$ npx vitest run src/lib/creditSystem.concurrency.test.ts --reporter=verbose
 ✓ monthly=0, pool=1, N=5 → 1 success; creditsUsed===1 and counter===1 (NO-PARTIAL-CHARGE ROLLBACK PROOF)
 ✓ monthly=1, pool=1, N=3 → exactly 2 succeed (retry/recompute path), both buckets drained
 ✓ sequential sanity: monthly=2, pool=1 → drains monthly first, then pool (split-order regression)
 ✓ ledger atomicity: exactly one success:true UsageEvent per successful spend
 Test Files  1 passed (1)
      Tests  5 passed (5)
# The 1 skipped FILE / 18 skipped tests are pre-existing (opt-in golden/real-LLM), not billing.

$ npm run lint
# clean — only the pre-existing warning in src/providers/ph-provider.tsx:78
# (react-hooks/exhaustive-deps), unrelated and untouched by this phase.

$ grep "!== 'none'" src/lib/planManager.ts
512: * Previously this read the DB row and tested `=== true || !== 'none'`, which        <- doc comment
523:    return typeof value === 'boolean' ? value : value !== undefined && value !== 'none';   <- the analytics enum branch, allowed
# No other hits. Both permitted by the gate.

$ git diff -U0 src/lib/planManager.ts    # PLAN_CONFIGS values: ZERO changed lines
# only: hasFeature doc comment, hasFeature 1-line body, hasTrackingPixels doc comment
```

## Open risks

- The two inlined `removeBranding` checks now carry misleading comments ("hasFeature fails OPEN") — stale documentation, not a behavior risk. Clean up with the deferred DRY-up.
- `hasFeature` now genuinely denies. Its only live caller is `domains/add` (already backstopped), so the blast radius is one message string — but any FUTURE caller inherits real deny-by-default semantics, which is the point.
- Legacy DB rows with drifted feature columns are now fully ignored by `hasFeature`. Those columns remain written on create/upgrade/downgrade and are still read directly by other code paths (e.g. Stripe/webhook display surfaces) — out of scope here; pricing-v2 owns whether those columns should exist at all.

---

# Phase 3 — M1/M2: one charging model across modern AI routes + delete `withAICredits`

## Files changed

1. `src/app/api/audience/product/strategy/route.ts` — credit pre-gate (+failed-attempt ledger) before the AI call; post-consume 402/500 split.
2. `src/app/api/audience/product/generate-copy/route.ts` — same.
3. `src/app/api/audience/service/strategy/route.ts` — same.
4. `src/app/api/audience/service/generate-copy/route.ts` — same.
5. `src/app/api/audience/work/strategy/route.ts` — same.
6. `src/app/api/audience/work/generate-copy/route.ts` — same.
7. `src/app/api/v2/scrape-website/route.ts` — same (pre-gate precedes BOTH the network scrape and the AI call).
8. `src/app/api/v2/understand/route.ts` — same.
9. `src/app/api/audience/work/regenerate-story/route.ts` — alignment only: post-consume 402/500 split (pre-gate untouched).
10. `src/app/api/generate-privacy-policy/route.ts` — alignment only: post-consume 402/500 split (consume result was previously not checked at all).
11. `src/lib/middleware/planCheck.ts` — deleted `withAICredits` + its doc comment; dropped the now-unused `consumeCredits` import.
12. `src/app/api/audience/product/strategy/route.test.ts` — extended: strategy-family charging tests (4 cases).
13. `src/app/api/audience/product/generate-copy/route.test.ts` — **NEW**: generate-copy-family charging tests (4 cases).
14. `src/app/api/v2/entryCollections.test.ts` — extended: v2-family charging tests (6 cases).
15. `src/app/api/audience/work/regenerate-story/route.test.ts` — extended: post-consume 402 + charge_conflict cases.
16. `docs/task/billing-correctness.audit.md` — this section.

## What changed

Design decision 1 applied verbatim to all 8 main routes: `requireAuth` untouched → explicit
`checkCredits(userId, COST)` pre-gate → on `!allowed` write `logUsageEvent({ creditsUsed:0,
success:false })` **then** return the route's own `insufficient_credits` 402 envelope → run AI →
`consumeCredits` → two-way post-consume split. The old
`if (!creditResult.success) logger.warn(...)` swallow (which returned `success:true` **and** free
output on a failed charge) is gone from every route. Diff is pure additions: no route's existing
envelope fields/casing, rate-limit wrapper, demo short-circuit, or parsing changed.

Costs used, one per route family: `STRATEGY_GENERATION` (3 strategy routes), `GENERATE_COPY`
(3 generate-copy routes), `SCRAPE_WEBSITE` (v2/scrape-website), `UNDERSTAND` (v2/understand).

### Pre-gate placement relative to demo/mock short-circuits (per route)

Every pre-gate sits **after** the route's demo/mock short-circuit — exactly where `consumeCredits`
already applied — so demo/mock flows stay both **uncharged and ungated**, unchanged.

| Route | Short-circuit | Pre-gate placed |
|---|---|---|
| product/strategy | `2b. Mock mode` (`NEXT_PUBLIC_USE_MOCK_GPT` / `DEMO_TOKEN` bearer) | after 2b, before prompt build (new step `2c`) |
| product/generate-copy | `2b. Mock mode` | after 2b, before the `2c` SiteContext lookup + AI loop |
| service/strategy | `2b. Mock mode` | after 2b, before prompt build |
| service/generate-copy | `2b. Mock mode` | after 2b, before prompt build |
| work/strategy | `2b. Mock mode` | after 2b, before price/voice derivation + prompt |
| work/generate-copy | `2b. Mock mode` | after 2b, before the `2c` SiteContext lookup + AI loop |
| v2/scrape-website | `isDemoMode(req)` inside `handleEntryScrape` | after the demo block, **before `scrapeSite()`** — so a 0-credit user triggers no outbound network fetch either |
| v2/understand | `isDemoMode(req)` inside `handleEntryUnderstand` | after the demo block, before the AI call |
| work/regenerate-story | `requireAICredits` pre-gate (kept) + `isMock` branch | pre-gate unchanged; only the post-consume split added |
| generate-privacy-policy | `requireAICredits` pre-gate (kept) | pre-gate unchanged; only the post-consume split added |

Per plan step 3, the two alignment routes KEEP their `requireAICredits` pre-gate (it already 402s
pre-AI). Whether that middleware ledgers ITS pre-gate failure is **pre-existing behavior — left
as-is, not touched**: `requireAICredits` → `requireCredits` → `checkCredits` writes no UsageEvent.
So those two routes' pre-gate 402s remain unledgered, exactly as before this phase.

### `charge_conflict` → recoverable 500 (client-rail guard)

`error: 'charge_failed'` + `message: 'Temporary billing conflict — please try again. You have not
been charged.'`, logged at `logger.error`, output discarded. Neither the code nor the message
contains the substring "credit" — the client rails (`work.llm.ts:91`, `trust.ts:296`,
`thing.ts:359`) regex-match `/credit/i` and would otherwise strand a solvent paying customer on the
buy-credits wall. This is asserted programmatically in all four test families via
`expect(JSON.stringify(json)).not.toMatch(/credit/i)` on the FULL response payload, not just the code.

## Explicit sign-off items

**Pre-gate ledgering decision (spec human-gate (b) — founder signs off, does not discover):**
the pre-gate 402 path **writes the failed-attempt `UsageEvent` itself**
(`creditsUsed: 0, success: false, errorMessage: 'Insufficient credits'`, route's own eventType +
endpoint). This deliberately **mirrors the row `consumeCredits` writes today** at
creditSystem.ts:365-373. Without it, pre-gating would silently delete 0-credit attempts from the
ledger — the exact missed-ledger regression gate (b) guards. Per founder ruling Q8: preserve
today's behavior. Verified against the real dev DB in the smoke below (exactly 1 row,
`success:false`, `creditsUsed:0`).

**`generate-privacy-policy` cost — CONFIRMED** (scout left this unverified): the route uses
`CREDIT_COSTS.PRIVACY_POLICY_GENERATION` at BOTH its `requireAICredits` pre-gate (route.ts:98) and
its `consumeCredits` call (route.ts:159). Value = **2** (creditSystem.ts:23). Unchanged by this
phase; event type `UsageEventType.PRIVACY_POLICY_GENERATION`.

**Known pre-existing shape, NOT a regression from this work (plan step 7, do not fix here):** a user
with enough credits for `STRATEGY_GENERATION` (2) but not `GENERATE_COPY` (3) pays for strategy,
then 402s mid-onboarding holding nothing usable. Pre-gating makes this visible EARLIER (at the
copy call rather than after a wasted generation), but the shape predates this spec. pricing-v2 owns
the UX/policy.

## Deviations from the plan

- **None material.** Two judgment calls, both conservative, logged here:
  1. `planCheck.ts` also imports `CREDIT_COSTS`, which is now unused — but it was **already unused
     before this phase** (`withAICredits` never referenced it), so removing it is outside the plan's
     "now-unused imports" wording. Left in place; lint reports no error. Only `consumeCredits` (unused
     *as a result of* the deletion) was removed.
  2. The `charge_failed` envelope is exactly the plan's three fields — no `recoverable: true` added,
     despite neighbouring 500s carrying it. Plan specified the envelope literally; matched it.
- `requireFeature`, `requireAuth`, `requireCredits`, `requireAICredits`, `checkAIAccess` all kept
  (rulings Q6/Q7). Only `withAICredits` deleted.

## Test results & gates

```
npx tsc --noEmit                                        → exit 0, clean
npm run test:run    → Test Files 211 passed | 1 skipped (212)
                      Tests    3583 passed | 18 skipped (3601)
                      (phase 2 = 3567 → +16 new phase-3 tests)
npm run lint        → 0 errors (pre-existing warnings only; NONE in touched files)
```

Postgres was UP: the phase-1 concurrency suite **executed** (verified separately:
`creditSystem.concurrency.test.ts → Test Files 1 passed, Tests 5 passed` — real-DB, not skipped).
The 1 skipped test FILE is pre-existing and unrelated (not the concurrency suite).

**Grep gates**

- `withAICredits` in `src/` → **0 hits** (definition deleted; had zero callers).
- `Credit consumption failed` (the old swallow) across `src/app/api/{audience,v2,generate-privacy-policy}` → **0 hits**.
- `charge_failed` / `'Temporary billing conflict...'` literals → present in all **10** routes; none of the code/message strings contain "credit" (also asserted in tests).

**Scope fences — all clean (`git diff --stat HEAD -- <path>` empty for each):**

- `src/app/api/regenerate-{content,section,element}` → empty (regen-modernization owns them).
- `saveDraft` / `publish` → empty (deliberately ungated, creditSystem.ts:126-137).
- `src/lib/creditSystem.ts` / `src/lib/planManager.ts` → empty ⇒ **zero** `CREDIT_COSTS` value or `PLAN_CONFIGS` limit changes (M7 fence holds).
- `src/app/api/outreach` → empty (deferred, ruling Q2).
- `publish/route.ts:359` / `domains/verify-dns/route.ts:117` stale "fails OPEN" comments → untouched (deferred Q3).
- (`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` shows modified in `git status` with an EMPTY diff — the pre-existing CRLF touch the plan already flagged. Not mine.)

## Test honesty — mutation-verified, not theatre

The new tests were proven to be a genuine regression net, not green-only decoration. Mutating
`product/strategy/route.ts` — pre-gate `if (!preCheck.allowed)` → `if (false)` **and** the
`charge_conflict` branch → `if (false)` — produced:

```
× (a) pre-gate: no credits ⇒ 402 BEFORE any AI call, and the attempt is ledgered
× (c) charge_conflict ⇒ recoverable 500 charge_failed with NO "credit" anywhere (client-rail guard)
  Test Files  1 failed (1)
  Tests  2 failed | 5 passed (7)
```

Route restored byte-exact afterwards (pre-gate + conflict branch re-verified present; no stray
`if (false)`); full suite re-run green.

**Deliberate coverage substitution (plan step 5):** product/strategy stands in for service/strategy
+ work/strategy; product/generate-copy stands in for service/generate-copy + work/generate-copy.
The 6 audience routes received identical mechanical edits, so coverage is one test per FAMILY
(strategy / generate-copy / v2 / work-regen). `service/*` and `work/{strategy,generate-copy}` have
NO tests of their own — the reviewer diff-reads them against the tested twin. This is stated in the
test files' headers too.

## Manual smoke — PARTIAL, honestly reported

**The full HTTP smoke could NOT be run**, and I did not fake it. This worktree's env has
**no AI provider key and no Clerk secret** (`OPENAI_API_KEY`, `NEBIUS_API_KEY`, `USE_OPENAI`,
`CLERK_SECRET_KEY` all unset; only `DATABASE_URL` is set). Both halves of the prescribed smoke are
therefore impossible here: a real generation needs a provider key, and hitting the endpoint at all
needs Clerk auth. **The founder should run the HTTP smoke before merge** — it is the one gate this
phase leaves open.

What I DID verify, against the **real dev Postgres** with `DEV_BYPASS_CREDITS` unset, driving the
**real** `checkCredits` / `logUsageEvent` (the exact calls the new pre-gate makes), on a seeded
0-credit user:

```
pre-gate checkCredits => {"allowed":false,"remaining":0,"required":2}
UsageEvent rows: 1 | success: [false] | creditsUsed: [0]
SMOKE PASS: pre-gate denies a 0-credit user AND ledgers success:false/creditsUsed:0
funded checkCredits => {"allowed":true,"remaining":10,"required":2}
SMOKE PASS: funded user passes the pre-gate
cleanup done
```

This proves, on real DB rows: (i) a 0-credit user is denied by the pre-gate — before any provider
call, since the gate precedes the AI call in code; (ii) the attempt IS ledgered as
`success:false / creditsUsed:0` (gate (b)); (iii) the gate is not a blanket deny — a funded user
passes. All seeded rows cleaned up; no scratch files left in the repo. What it does NOT prove:
end-to-end HTTP status codes with real auth, and a real provider decrement.

## Open risks

- **The end-to-end HTTP smoke is unrun** (no provider/Clerk keys here). Route-level status codes and
  envelopes are covered by the mocked family tests + the real-DB pre-gate smoke, but a real funded
  generation decrementing against a live provider has not been observed on this branch. Founder gate
  before merge.
- **`v2/scrape-website` charges only after a successful scrape + AI call**, and the pre-gate now also
  prevents the outbound fetch for a 0-credit user — a small, intended behavior improvement (previously
  a broke user could burn our egress and an AI call for free), but it does change what an unfunded
  user's import attempt does. Worth a line in release notes.
- The `charge_conflict` → 500 path has **no client-side auto-retry** (ruling Q9) — the user sees a
  generic "try again". Acceptable for now; only reachable after 3 lost write races.
- `deductCredits` without `eventData` still writes no ledger row (phase-1 carry-forward) — inert;
  phase 3 goes through `consumeCredits`, which always passes eventData.
- The two alignment routes' `requireAICredits` pre-gate 402s remain **unledgered** (pre-existing,
  left as-is per plan step 3) — so the ledger's coverage of "blocked attempts" is now consistent
  across the 8 main routes but still absent on those two. Worth folding into the deferred Q3 DRY-up.
