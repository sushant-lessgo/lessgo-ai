# billing-correctness — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\billing-correctness`
- **Branch:** `feature/billing-correctness` (verify `git -C <WORKDIR> branch --show-current` before ANY edit; hard-stop on mismatch)
- **Tier:** spec declared `standard`; orchestrator **AUTO-ESCALATED to `full`** (billing/money surface) → plan-review loop + per-phase impl-review loop.
- **Spec:** `docs/task/billing-correctness.spec.md` — NOTE: spec was missing from this worktree's branch; planner copied it in from the main repo (`C:\Users\susha\lessgo-ai\docs\task\billing-correctness.spec.md`). Commit it with phase 1.

## Overview

Close three verified billing-correctness holes before pricing-v2: (H1) `deductCredits` does a read-modify-write with a FALSE "lock" comment — concurrent spends double-generate on one charge; (H2) `hasFeature` is effectively `() => true` (`false !== 'none'` → true) — every boolean paywall flag passes on FREE; (M1/M2) the 8 modern generation routes (`audience/{product,service,work}/{strategy,generate-copy}`, `v2/{scrape-website,understand}`) run the AI call with NO pre-spend balance gate and swallow post-AI charge failures, while the spec's M2 target `withAICredits` turns out to be dead code (zero callers) and gets deleted. One charging model everywhere: **check balance up front → run AI → charge only on success; charge failure = no output.**

## Progress log

```
phase 1 H1 atomic decrement + ledger-in-tx + concurrency test: done (commit d6a4cc21, review loops 1, verdict ship) — AWAITING FOUNDER HUMAN GATE before phase 2
phase 2 H2 hasFeature deny-by-default + tests: done (commit 5eb69db4, review loops 1, verdict ship)
phase 3 M1/M2 route standardization + withAICredits deletion + route tests: pending
```

**Phase 2 review outcome (impl-reviewer, verdict `ship`):** Reviewer reverted `hasFeature`
to the pre-fix predicate and re-ran → **5 tests RED** (FREE removeBranding, FREE
whiteLabel/exportHTML/customDomains, FREE trackingPixels, PRO exportHTML, garbage tier),
then restored byte-exact → 23/23 green. Genuine regression net, not theatre. `wrongRow()`
helper sets every row column to `true`/`'full'` → config-wins-over-row is PROVEN.
Not a blanket-false: PRO+removeBranding→true, PRO+exportHTML→false, AGENCY positives all
verified against real config. `analytics:'basic'` on FREE still → true (typeof branch).
`hasTrackingPixels` code byte-identical (comment only). **M7 fence HOLDS** — 29 changed
lines total, ZERO tier limit/feature VALUES touched. Gates: `tsc` exit 0, `test:run` 3567
passed (= phase 1's 3557 + 10 new), concurrency suite EXECUTED (5 real-DB), `lint` clean.

**Verified fact (founder already ruled OK, Q5):** `domains/add` FREE = **403 → 403,
message-only** delta (`'Custom domain limit reached'` → `'Custom domains not available on
your plan'`). The `hasFeature` gate at :55 genuinely precedes the `checkLimit` backstop at
:62, and FREE `limits.customDomains = 0` (planManager.ts:79) already shut the door.
**H2 was a LATENT paywall hole, not a live leak** — worth closing before pricing-v2 gates
anything new on it, exactly as the spec argued.

**Known honest gap (reviewer-endorsed):** the `value !== 'none'` sub-clause is currently
UNREACHABLE — no shipped tier sets `analytics:'none'` (FREE='basic', others='full'), so
the garbage-tier test covers the `undefined` half only. A mutation deleting `&& value !==
'none'` would NOT be caught. Accepted because: the expression is mandated verbatim by
design decision 4; injecting a synthetic tier would breach the M7 values fence; and the
tripwire test (asserts no tier uses `'none'`) is SELF-HEALING — it goes red the moment a
tier adopts `'none'`, forcing real coverage before the branch can matter.

**Carry-forward (do NOT fix in phase 3 — belongs to the deferred Q3 DRY-up):** comments at
`publish/route.ts:359` + `domains/verify-dns/route.ts:117` still claim hasFeature "fails
OPEN" — now STALE/false. Reviewer's advice: leave them; a wrong-but-inert comment on a
correct inlined check is low-risk, and phase 3 shouldn't touch those files either.

**Phase 1 review outcome (impl-reviewer, verdict `ship`):** RED proof independently
reproduced (reviewer reverted to HEAD creditSystem.ts, got identical 3-fail/pool-negative
result — not fabricated). Atomic design matches decision 2 exactly; retry fires only on
`instanceof BucketConflictError`; half-charge impossible; neither bucket can go negative;
split recomputed from fresh reads on retry. `charge_conflict` propagates unmangled
(`consumeCredits:491`). Ledger single-write in-tx (`:313`), failure paths still outside.
Case 2 non-vacuous (PAGE_GENERATION → `fullPageGens` counter genuinely increments).
Pin bites: dynamic `import()` after DATABASE_URL mutation; suite also goes RED inside a
full `npm run test:run` (real regression net, not a standalone artifact). Cleanup verified
by querying dev DB after a failing run → 0 leftover rows. Gates: `tsc` FULLY CLEAN (the
audit's `founder.jpg` error was environmental, resolved once `next-env.d.ts` generated),
`test:run` 3557 passed w/ concurrency suite EXECUTED (5 real-DB tests), `lint` clean.
Scope clean — only the 3 planned files.

**Known honest caveat (implementer-flagged, reviewer-confirmed):** concurrency case 1
(monthly=1,pool=0) passes even PRE-fix — timing luck (losers' reads landed after the
winner committed). The pool-path cases (2/3/5) are the ones that actually catch H1.
Suite as a whole genuinely proves H1.

**Non-blocking carry-forward for later phases:**
- `deductCredits` without `eventData` writes no ledger row — inert today (only
  `consumeCredits` calls it; phase 3 goes through it), but a latent footgun if a direct
  caller is ever added.
- `logger.error('Error deducting credits:', …)` fires on routine genuine insufficiency
  (a normal 402) and the sentinel serializes as `{}` — cosmetic log noise; tidy when
  phase 3 wires observability.
- Typo `CORROLARY` → `COROLLARY` in a creditSystem.ts comment.
- Commit with explicit paths (`git add <files>`) — `uiFoundationIsolation.test.tsx.snap`
  shows modified in `git status` but its diff is empty (CRLF touch); it stages as a no-op.

## Verified ground truth (planner settled the scout contradiction — implementers do NOT re-derive)

Planner read the routes. The contradiction resolves as:

- The **6 audience routes + 2 v2 routes call `requireAuth` only** (auth, NO credit check): product/strategy:102, product/generate-copy:154, service/strategy:86, service/generate-copy:128, work/strategy:82, work/generate-copy:164, v2/scrape-website:337, v2/understand:251. Scout A was right for these.
- `checkCredits` IS reached on these routes — but only INSIDE `consumeCredits`, which runs AFTER the AI call; its failure is `logger.warn` + response still `success:true` (e.g. product/strategy:225-227). So the balance check exists but gates nothing. Scout B saw this internal call.
- Already correctly pre-gated via `requireAICredits` (auth + `checkCredits`, no charge): `audience/work/regenerate-story`:78 and `generate-privacy-policy`:95. Both still `consumeCredits` post-AI; their handling of a post-AI consume failure must be verified/aligned in phase 3.
- `outreach/[token]`: has its own check-before-scrape ladder; consume error swallowed in try/catch — **OUT of scope** (nuanced cache/no-charge ladder, separate rail; deferred, see unresolved Qs).
- `withAICredits` (planCheck.ts:243-296): **zero callers** (grep confirms only its definition). Charge-first/never-refund — the exact model the spec bans. Fix-by-deletion; "fixing" dead code fixes nothing. `requireAICredits`, `checkAIAccess`, `requireAuth` ARE used — keep. `requireFeature` (planCheck.ts:124) also has zero callers but becomes correct once hasFeature is fixed — keep (harmless), noted in Qs.
- `deductCredits` has exactly ONE caller: `consumeCredits` (creditSystem.ts:383) + its own tests. Signature change is safe.
- `hasFeature` is at `planManager.ts:506-514` (spec's `:403` was stale). Callers: `domains/add/route.ts:55` (live) + dead `requireFeature`. `domains/add` has a `checkLimit('customDomains')` backstop at :62 (FREE limit 0) that already blocks FREE — so H2's user-visible delta there is status/message (403 feature-gate fires first), not a newly closed door. Two routes deliberately inline `getPlanConfig(tier).features.removeBranding === true` to route around the bug (`publish/route.ts:359`, `domains/verify-dns/route.ts:117`) — leave them untouched.
- Balance = TWO buckets: `UserUsage.creditsRemaining` (monthly, per `(userId, period)`) + `UserPlan.creditPool` (persistent). `creditsUsed` counts TOTAL incl. pool → `creditsUsed + creditsRemaining !== creditsLimit` once pool drains — do NOT write a test asserting that invariant.
- **Guard-strength corollary (write into code comment too): the monthly `updateMany` guard is a NO-OP whenever `fromMonthly === 0`** — `creditsRemaining: { gte: 0 }` is trivially true, the update still increments `creditsUsed` + the per-eventType counter, and only THEN can the pool guard fail. **On pool-only spends the pool guard is the SOLE enforcer**, and the whole-tx rollback is the only thing preventing a phantom `creditsUsed` inflation. Concurrency-test case 2 exists specifically to prove that rollback (see phase 1).
- Ledger (`logUsageEvent`) is OUTSIDE the decrement tx and swallows errors → crash between decrement and log = silent unledgered spend. Fixed in phase 1 (success-path ledger moves into the tx).
- **Ledger behavior today for a 0-credit user:** they DO reach `consumeCredits`, which writes a `success:false` UsageEvent (creditSystem.ts:365-373). Under the new pre-gate this call is never reached → that failure record would silently vanish from the ledger. **Decision: preserve it** — the pre-gate writes the failed UsageEvent itself (design decision 1). This is exactly spec human-gate (b) territory; audits must surface it.
- DELIBERATE non-gated routes (creditSystem.ts:126-137 comment): `saveDraft`, `publish` — do NOT add credit gates there.
- **Client error rails** (`work.llm.ts:91`, `trust.ts:296`, `thing.ts:359`) match `status === 402 || /credit/i.test(error)` → ANY error whose message contains "credit" lands the user on the buy-credits wall. Consequence: the retry-exhaustion path (solvent user, transient conflict) must return an error whose code AND message contain NO "credit" substring (design decisions 1+2).

## Design decisions (locked; reviewers hold implementers to these)

1. **Charging model (all modern AI routes):** `requireAuth` stays as-is → explicit `checkCredits(userId, COST)` pre-gate → if `!allowed`: **first write the failed-attempt ledger row via `logUsageEvent({ …, creditsUsed: 0, success: false })`** (preserves today's behavior where the 0-credit attempt is ledgered inside `consumeCredits`; without this, spec gate (b)'s missed-ledger regression fires) → return the route's own `createSecureResponse({ success:false, error:'insufficient_credits', message, creditsRequired, creditsRemaining }, 402)` envelope → run AI → `consumeCredits` → **post-AI consume failure splits TWO ways**:
   - `error === 'charge_conflict'` (retry exhaustion — user is SOLVENT, we just lost 3 races): return a **recoverable 500** `createSecureResponse({ success:false, error:'charge_failed', message: 'Temporary billing conflict — please try again. You have not been charged.' }, 500)`. The code AND message MUST NOT contain the substring "credit" (case-insensitive) — the client rails regex-match `/credit/i` and would otherwise dead-end a paying customer on the buy-credits wall. Log at `logger.error` (observable; this is a money-path anomaly). Output discarded.
   - any other consume failure (genuine insufficiency — loser of a check→charge race whose balance truly drained): return 402 with the `insufficient_credits` envelope and DISCARD the generated output (no free output).
   We keep `requireAuth` + explicit `checkCredits` rather than swapping to `requireAICredits` so each route's existing error envelope (parsed by the generation stores) is untouched — the diff is pure additions.
2. **H1 fix shape** (`deductCredits`): keep `prisma.$transaction(async tx => …)`, but ALL writes become guarded conditional `updateMany` with affected-count assertions; the reads that remain are only to COMPUTE the monthly/pool split — they no longer enforce anything:
   - read usage + plan → `fromMonthly = min(creditsRemaining, cost)`, `fromPool = cost - fromMonthly`; if fresh combined balance < cost → throw `Insufficient credits` (no retry).
   - `tx.userUsage.updateMany({ where: { userId, period, creditsRemaining: { gte: fromMonthly } }, data: { creditsUsed: { increment: cost }, creditsRemaining: { decrement: fromMonthly }, <per-eventType counter>: { increment: 1 } } })` → if `count !== 1` throw sentinel `BucketConflictError` (rolls tx back). NOTE the corollary above: when `fromMonthly === 0` this guard is trivially true — it is NOT a defense on pool-only spends.
   - if `fromPool > 0`: `tx.userPlan.updateMany({ where: { userId, creditPool: { gte: fromPool } }, data: { creditPool: { decrement: fromPool } } })` → `count !== 1` → same sentinel → WHOLE tx rolls back, so a partial (monthly-charged, pool-failed) state is impossible.
   - `remaining` for the return value: re-read inside the tx after the updates (tx sees its own writes).
   - **Bounded retry loop around the tx (max 3 attempts), retrying ONLY on `BucketConflictError`.** Why: with balance monthly=1/pool=5 and two concurrent cost-1 spends, both read remaining=1 → both pick fromMonthly=1; the loser's monthly guard fails even though the pool could cover it. Retry re-reads fresh balances, recomputes the split (fromMonthly=0/fromPool=1), succeeds. Genuine insufficiency throws immediately (no retry). **After 3 conflicts → return `{ success:false, error:'charge_conflict', remaining }` — a DISTINGUISHABLE code, never the insufficient-credits string** (the user may be fully solvent; misreporting them as broke is a support ticket on the money path). `consumeCredits` propagates this `error` string unchanged so routes can branch on it (decision 1).
   - Delete the false `// Lock the usage record for update` comment (explicit acceptance criterion). Replace with a comment explaining guarded-updateMany + count-assert + retry + the fromMonthly=0 no-op corollary.
   - The `Usage record not found` throw stays (consumeCredits→checkCredits→getUserUsage lazily creates the row first).
3. **Ledger-in-tx:** `deductCredits` gains an optional `eventData?: Partial<UsageEventData>` param; on the success path it writes the `tx.usageEvent.create({ …, creditsUsed: cost, success: true })` INSIDE the tx (last op, after both decrements; retries roll it back so no dupes). `consumeCredits` passes its eventData through and **deletes its own post-hoc success `logUsageEvent` call** (no double-ledger). Failure-path logs in `consumeCredits` (insufficient / deduct-failed / thrown) stay as-is via `logUsageEvent` (no tx exists there; swallow-on-error remains acceptable for failure records). Net: a successful spend and its ledger row are atomic — the silent-unledgered-spend crack closes. **Known dev-only side effect:** `deductCredits`'s `DEV_BYPASS_CREDITS` short-circuit returns at :175-178 BEFORE the tx, and this decision deletes `consumeCredits`'s success-path `logUsageEvent` → under the bypass NO UsageEvent is written at all (today one is). Dev-only flag, accepted; implementer notes it in the audit; do not add a bypass-path ledger write.
4. **H2 fix shape** (`hasFeature`, planManager.ts:506-514): go **config-derived** (the `hasTrackingPixels` shape) — resolve tier from the DB row, read the flag from `PLAN_CONFIGS`, never trust per-row feature columns (legacy FREE rows drift; `trackingPixels` has no column at all):
   ```
   const value = PLAN_CONFIGS[userPlan.tier as PlanTier]?.features[feature];
   return typeof value === 'boolean' ? value : (value !== undefined && value !== 'none');
   ```
   **Analytics caveat, decided:** `analytics` is the one string-enum key (`'none'|'basic'|'full'`) — non-`'none'` strings stay truthy; booleans are strict `=== true`; `undefined`/unknown tier → `false`. Catch → `false` (unchanged fail-closed). Update `hasTrackingPixels`'s comment block (:520-526) — it documents the now-fixed bug; do NOT collapse `hasTrackingPixels` or the two inlined `removeBranding` checks onto `hasFeature` (deferred DRY-up; "minimal and self-contained" constraint wins — noted in Qs).
5. **M2 = delete `withAICredits`** (planCheck.ts:243-296 incl. its doc comment). Zero callers; it IS the charge-first model. If review prefers keeping dead code, the fallback is deletion anyway — the spec's "fix" for it has no observable effect.
6. **Concurrency test = real DB, not mocked — and it must be seen FAILING before it counts.** A mocked-Prisma "concurrency" test is theatre (mock can't reproduce row-lock re-evaluation) and will be rejected. Honest design: a `node`-environment vitest file using the real Prisma client against the Neon **dev** DB, firing `Promise.all` of N real `deductCredits` calls from one process. Mandatory mechanics:
   - **File header (order matters):** `// @vitest-environment node` docblock as the FIRST lines, then `import 'dotenv/config'` at the very top of the file so `process.env.DATABASE_URL` is populated BEFORE the `describe.skipIf` expression evaluates. (`vitest.config.ts:18` is `environment:'jsdom'` globally with no `environmentMatchGlobs`/setupFiles — without the docblock the file runs under jsdom; without the early dotenv import, skipIf silently skips.)
   - **Pin the connection pool:** the test constructs its OWN `PrismaClient` whose datasource URL is `DATABASE_URL` with `connection_limit=10` appended (≥ N=5) as a connection-string param. Rationale: `Promise.all` from one process only exercises real concurrency if the pool grants N connections simultaneously — if the pool serializes acquisition, the interactive txs run one-at-a-time and the test can go GREEN against today's broken read-modify-write. Pool-serialized fake passes are exactly what this pin prevents.
   - **RED-first proof (non-negotiable):** the implementer MUST demonstrate the suite failing against the PRE-fix `deductCredits` — stash/revert the creditSystem.ts fix (e.g. `git stash` the file or check out the pre-phase version of just that file), run the suite, capture the FAILING output; restore the fix, run again green. BOTH outputs (red + green) get pasted into the audit. A concurrency test never seen failing is theatre and WILL be rejected at impl-review. (If red cannot be produced even with the pool pinned — e.g. Neon still serializes — that is itself a finding: the test doesn't prove the property; escalate to the orchestrator instead of shipping a green-only suite.)
   - Isolation: per-run random `userId` (`billing_it_<timestamp>_<rand>`), explicit seed of `UserPlan`+`UserUsage` (+`User` if FK requires — implementer checks schema relations), `afterAll` cleanup of usageEvent/userUsage/userPlan(/user) rows, `delete process.env.DEV_BYPASS_CREDITS` in setup so the dev bypass can't fake a pass.
   - **Gating:** `describe.skipIf(!process.env.DATABASE_URL)` with a LOUD, unmissable `console.warn` when skipped (e.g. `'*** BILLING CONCURRENCY SUITE SKIPPED — no DATABASE_URL — this run proves NOTHING about H1 ***'`). No CI exists; the founder runs locally — a silent skip is a silent hole. On the dev machine `.env` always has `DATABASE_URL`, so `npm run test:run` genuinely executes it; implementer AND impl-reviewer must run it and paste output that SHOWS the tests executed (test count, not a skip line).
   - **Worktree Prisma pitfall:** real-DB tests from a worktree are exactly where the known node_modules-junction/locked-engine corruption bites. The orchestrator already ran a real `npm install` in this worktree — implementer VERIFIES it (e.g. `node_modules` is a real dir not a junction, `npx prisma -v` works) before trusting any green; do not redo the install unless verification fails.
   - If Neon-over-WAN tx contention flakes the default 5s interactive-tx timeout, bump `deductCredits`'s `$transaction` options (`{ maxWait: 10000, timeout: 15000 }`) — an allowed, explicit change.

## Phase 1 — H1: atomic decrement + ledger-in-tx + concurrency test

**HUMAN GATE (spec gates a + b): changes live billing DB write path (`UserUsage`/`UserPlan`/`UsageEvent`). User signs off on the diff + the pasted RED+GREEN concurrency-test outputs before phase 2 starts. The audit MUST also record the ledger-behavior decisions for gate-(b) sign-off: (i) success ledger moves in-tx, `consumeCredits` double-log removed; (ii) pre-gate 402s will write the failed UsageEvent at the route (phase 3) so 0-credit attempts stay ledgered; (iii) DEV_BYPASS_CREDITS path now writes NO UsageEvent (dev-only, accepted).**

**Files touched**
- `src/lib/creditSystem.ts` — rewrite `deductCredits` (guarded updateMany + count-assert + retry + `charge_conflict` exhaustion code + optional `eventData` + in-tx `usageEvent.create`; kill false lock comment); trim `consumeCredits` success-path double-log; propagate `charge_conflict` through `consumeCredits` unchanged.
- `src/lib/creditSystem.test.ts` — update existing mocked-prisma tests for the new updateMany shape; add unit tests for split/guard/retry/ledger logic.
- `src/lib/creditSystem.concurrency.test.ts` — NEW: real-DB concurrency suite (design decision 6 mechanics verbatim).
- `docs/task/billing-correctness.spec.md` — commit the spec copy (already written into the worktree by the planner; no edits).

**Steps**
1. Reconfirm branch. Verify worktree `npm install` per design decision 6 (verify, don't redo). Implement `deductCredits` per design decisions 2+3 exactly (sentinel error class module-local; retry max 3; exhaustion → `{ success:false, error:'charge_conflict', remaining }`; dev-bypass short-circuit unchanged; return shape `{ success, remaining, error? }` unchanged so `consumeCredits` and existing route code compile untouched).
2. Update `consumeCredits`: pass `eventData` into `deductCredits`; remove the success-path `logUsageEvent` call; keep all failure-path logging as-is; ensure the `charge_conflict` error string reaches the caller unmangled (routes branch on it in phase 3).
3. Update `creditSystem.test.ts` mocks (`$transaction` executor now needs `userUsage.updateMany`/`userPlan.updateMany` returning `{ count }`, `usageEvent.create`): keep the 4 existing monthly/pool-split behaviors green under the new shape; add: (a) monthly guard count=0 + fresh-balance-still-sufficient → retries and succeeds with recomputed split; (b) pool guard count=0 → the tx promise rejects with the sentinel and `deductCredits` retries/fails — **NOTE: this mocked test proves ONLY sentinel propagation + promise rejection. A mocked `$transaction` executor rolls nothing back, so it CANNOT prove no-partial-charge; do not write an assertion pretending it does. The real rollback proof is concurrency case 2 (step 4).** (c) success path creates exactly ONE usageEvent (in-tx) and `consumeCredits` adds none; (d) 3 consecutive conflicts → `success:false` AND `error === 'charge_conflict'` (not the insufficient string).
4. Write `creditSystem.concurrency.test.ts` per design decision 6 (node docblock, early dotenv, own PrismaClient with `connection_limit=10`, skipIf + loud warn, isolation/cleanup). Cases (all with real `deductCredits`, cost 1):
   - monthly=1, pool=0, N=5 concurrent → exactly 1 success, 4 `Insufficient credits`; final `creditsRemaining=0`, `creditPool=0`, `creditsUsed=1`; nothing negative.
   - monthly=0, pool=1, N=5 → exactly 1 success; `creditPool=0`, never negative; **AND `creditsUsed === cost × successes` (= 1) AND the per-eventType counter === 1.** This is the ONLY case that exercises the no-partial-charge rollback: with `fromMonthly=0` every loser's monthly guard is trivially true (`gte: 0`) — each loser DOES increment `creditsUsed` + the counter before its pool guard fails, so if rollback were broken, `creditsUsed` would read 5 while balances still look right. Without these two assertions the case cannot fail on broken rollback.
   - monthly=1, pool=1, N=3 → exactly 2 succeed (exercises the retry/recompute path); both buckets 0, never negative.
   - sequential sanity: monthly=2, pool=1, three cost-1 spends → drains monthly first (2 then pool 1) — split-order regression.
   - assert exactly (number of successes) `UsageEvent` rows with `success:true` for the test user (ledger-atomicity check).
5. **RED-first run (design decision 6):** stash/revert the `deductCredits` fix, run the concurrency suite, capture the failing output; restore, run green. Paste BOTH into the audit. Suite output must show tests executed, not skipped.
6. Do NOT assert `creditsUsed + creditsRemaining === creditsLimit` anywhere (two-bucket invariant is false by design).

**Verification**
- `npx tsc --noEmit`
- `npm run test:run` (must include the concurrency suite actually RUNNING, not skipping — paste its output lines into the audit)
- Audit contains the RED (pre-fix) concurrency output AND the GREEN (post-fix) output. Impl-reviewer rejects the phase if the red run is missing.
- `npm run lint`
- Grep gate: `rg "Lock the usage record" src/` → zero hits.

**Maps to acceptance criteria:** #1 (concurrency test), #2 (atomic conditional update + count assert + false-comment gone), #6 partial.

## Phase 2 — H2: `hasFeature` deny-by-default

**Files touched**
- `src/lib/planManager.ts` — reimplement `hasFeature` (design decision 4); refresh the now-stale `hasTrackingPixels` comment (:517-527) to say hasFeature is config-derived too but stays separate for its no-DB-column key (keep its code unchanged).
- `src/lib/planManager.test.ts` — regression tests.

**Steps**
1. Rewrite `hasFeature` per design decision 4. No signature change (`(userId, feature: keyof PlanConfig['features']) => Promise<boolean>`). Do not touch `PLAN_CONFIGS` values (M7 out of scope), `checkLimit`, or any limit numbers.
2. Tests (mock `getUserPlan` to return rows with a `tier` and DELIBERATELY WRONG per-row feature columns, proving the DB row is ignored): FREE + `removeBranding` → false (the exact `!== 'none'` regression, even if the row column says true); FREE + `whiteLabel`/`exportHTML`/`customDomains` → false; FREE + `trackingPixels` (no DB column, `undefined` on row) → false; FREE + `analytics` → true (`'basic'`); tier with `analytics:'none'` if any (else synthetic unknown-tier) → false; PRO + `removeBranding` → true; PRO + `exportHTML` → false; unknown/garbage tier → false; `getUserPlan` throws → false.
3. Caller check (read-only, no edits): confirm `domains/add/route.ts` FREE flow now 403s at the feature gate (previously fell through to the `checkLimit` backstop) — record the before/after status+message in the audit. Confirm `publish/route.ts:359` and `domains/verify-dns/route.ts:117` inlined checks are untouched.

**Verification**
- `npx tsc --noEmit` · `npm run test:run` · `npm run lint`
- Grep gate: `rg "!== 'none'" src/lib/planManager.ts` → only allowed inside the new config-derived expression for the analytics enum (or zero hits if implemented via the typeof branch).

**Maps to acceptance criteria:** #3, #5 (values untouched — reviewer greps the PLAN_CONFIGS diff is empty), #6 partial.

## Phase 3 — M1/M2: one charging model across modern AI routes + delete `withAICredits`

**Files touched**
- `src/app/api/audience/product/strategy/route.ts`
- `src/app/api/audience/product/generate-copy/route.ts`
- `src/app/api/audience/service/strategy/route.ts`
- `src/app/api/audience/service/generate-copy/route.ts`
- `src/app/api/audience/work/strategy/route.ts`
- `src/app/api/audience/work/generate-copy/route.ts`
- `src/app/api/v2/scrape-website/route.ts`
- `src/app/api/v2/understand/route.ts`
- `src/app/api/audience/work/regenerate-story/route.ts` — alignment only (already pre-gated): enforce post-AI consume failure → 402/500 split, if not already.
- `src/app/api/generate-privacy-policy/route.ts` — alignment only (already pre-gated via `requireAICredits`:95): same post-consume enforcement; confirm cost = `CREDIT_COSTS.PRIVACY_POLICY_GENERATION` (scout left this unverified — implementer records it in the audit).
- `src/lib/middleware/planCheck.ts` — delete `withAICredits` (:243-296) + any now-unused imports.
- `src/app/api/audience/product/strategy/route.test.ts` — extend (pre-gate + consume-failure cases).
- `src/app/api/v2/entryCollections.test.ts` — extend (both v2 routes).
- `src/app/api/audience/work/regenerate-story/route.test.ts` — extend (consume-failure case).
- `src/app/api/audience/product/generate-copy/route.test.ts` — NEW (generate-copy family representative).

**Steps**
1. For each of the 8 main routes, apply design decision 1 verbatim: add `checkCredits` (+ `logUsageEvent` if not imported) to the existing `@/lib/creditSystem` import; insert the pre-gate immediately after the `requireAuth` block (before ANY AI/scrape work) with that route's exact cost (`STRATEGY_GENERATION` / `GENERATE_COPY` / `SCRAPE_WEBSITE` / `UNDERSTAND`); on `!allowed` write the failed UsageEvent (`success:false`, `creditsUsed:0`, route's eventType — mirrors the row `consumeCredits` writes today at creditSystem.ts:365-373, so gate-(b)'s ledger behavior is preserved) then return 402; replace the post-AI `if (!creditResult.success) logger.warn(…)` swallow with the two-way split — `charge_conflict` → 500 `charge_failed` (message with NO "credit" substring, `logger.error`), anything else → 402 `insufficient_credits` (output discarded in both). Preserve each route's existing response envelope fields/casing; touch nothing else in the route (rate-limit wrapper, demo short-circuits, parsing all stay).
2. Demo/mock caution: routes with demo/no-auth short-circuits (scout flagged work routes; v2 have their own flow) — the pre-gate goes AFTER those short-circuits, exactly where `consumeCredits` already applies, so demo flows stay uncharged and ungated. Implementer confirms per route and notes placement in the audit.
3. Alignment pass on `work/regenerate-story` + `generate-privacy-policy`: keep their `requireAICredits` pre-gate (it already 402s pre-AI; whether IT ledgers the pre-gate failure is pre-existing behavior — leave as-is, note in audit); only ensure a failed post-AI `consumeCredits` gets the same 402/500 split rather than success.
4. Delete `withAICredits`. Grep `rg "withAICredits" src/` → zero hits. Leave `requireAuth`/`requireCredits`/`requireAICredits`/`checkAIAccess`/`requireFeature` in place.
5. Tests (route-family coverage per acceptance criterion #4; mock `checkCredits`/`consumeCredits`/`logUsageEvent`/AI provider). **Explicit substitution note:** product/strategy stands in for `service/strategy` + `work/strategy`; product/generate-copy stands in for `service/generate-copy` + `work/generate-copy` — the 6 audience routes get identical mechanical edits, so one test per FAMILY (strategy, generate-copy, v2, work-regen) is the deliberate coverage level; `service/*` and `work/{strategy,generate-copy}` have NO tests of their own. Reviewer verifies the untested four by diff-reading against the tested twin.
   - strategy family (product/strategy test): `checkCredits → allowed:false` ⇒ 402 AND the AI/provider mock was NOT invoked AND `logUsageEvent` was called with `success:false`; `consumeCredits → { success:false, error:'Insufficient credits' }` post-AI ⇒ 402, response contains no strategy data; `consumeCredits → { success:false, error:'charge_conflict' }` ⇒ status 500, `error:'charge_failed'`, and assert the full response JSON does NOT match `/credit/i` (client-rail guard); happy path unchanged (`success:true`, `creditsRemaining` surfaced).
   - generate-copy family (NEW product/generate-copy test): same four cases.
   - v2 family (entryCollections.test.ts): add `checkCredits` mock; 0-credit ⇒ 402 pre-scrape/pre-AI + failed-event ledgered; consume-failure ⇒ 402; `charge_conflict` ⇒ 500 `charge_failed`.
   - work regen family (regenerate-story test): consume-failure ⇒ non-success (pre-gate case already covered by its existing `requireAICredits allowed:false` test).
6. Hard scope fence: `git diff --stat` must show NO changes under `src/app/api/regenerate-content|regenerate-section|regenerate-element` (regen-modernization owns them), none under `saveDraft`/`publish` (deliberately ungated), none to `CREDIT_COSTS` values or `PLAN_CONFIGS` limits.
7. Known pre-existing shape, NOT a regression from this work (one line so it isn't "discovered" post-deploy): a user with enough credits for STRATEGY_GENERATION but not GENERATE_COPY pays for strategy, then 402s mid-onboarding with nothing usable. Pre-gating makes it visible earlier but the shape predates this spec; pricing-v2 owns the UX/policy. Record in audit, do not fix here.

**Verification**
- `npx tsc --noEmit` · `npm run test:run` · `npm run lint`
- Grep gates: `rg "withAICredits" src/` → 0; `rg "logger.warn" <the 8 routes>` shows no remaining consume-failure swallow; `rg -i "credit" <the charge_failed literals>` → the 500 code/message strings contain no "credit".
- Manual smoke (implementer, `npm run dev`, DEV_BYPASS_CREDITS unset): one real onboarding generation on a funded dev user succeeds and decrements; set a test user's balances to 0 → generation endpoint returns 402 before any provider call (check logs) AND a `success:false` UsageEvent row exists for the attempt.
- Audit records the pre-gate-ledgering decision explicitly (gate-(b) reviewer signs off on it, not discovers it).

**Maps to acceptance criteria:** #4, #6.

## Final bundle gate (HUMAN)

Spec says ship as ONE bundle: after phase 3 review passes, user sign-off on the full branch diff (money path) → user merges to main (plain merge) + pushes → deploy-watcher. Post-deploy sanity on prod: one generation on a funded account, confirm single `UsageEvent` + correct decrement.

## Acceptance-criteria map

| Criterion | Phase |
|---|---|
| Concurrent spend: 1 credit, N calls → exactly 1 success, no negative | 1 |
| Atomic conditional update + affected-rows assert; false "lock" comment gone | 1 |
| `hasFeature` false for false/absent boolean; `!== 'none'` regression test | 2 |
| All `audience/*` + `v2/*` check-before-AI, charge-on-success; per-family tests | 3 |
| M7 plan-limit values untouched | 2 (grep) + fence in 3 |
| `tsc` + `test:run` green | every phase |

## FOUNDER RULINGS (phase-1 human gate, 2026-07-17 — BINDING, do not re-litigate)

- **Phase 1 gate: PASSED.** Founder signed off on the atomic decrement + all three
  gate-(b) ledger decisions ((i) in-tx success ledger + double-log removed, (ii) pre-gate
  402 writes the failed UsageEvent at the route in phase 3, (iii) DEV_BYPASS_CREDITS
  writes no UsageEvent — dev-only, accepted). Phase 2 authorized.
- **Q1 race-loser policy: 402 + DISCARD OUTPUT.** No free output. Confirms design
  decision 1. (Retry-exhaustion `charge_conflict` → recoverable 500 stays separate.)
- **Q4 concurrency-test DB dependency: KEEP AS-IS.** Hard-fail (not skip) when local
  Postgres is down is the accepted behavior — a silent skip on the money path is the
  worse failure. Do NOT add a skip fallback.
- **Q7 phase-3 scope: INCLUDE** `generate-privacy-policy` + `work/regenerate-story` for
  post-consume alignment (402/500 split) as the plan specifies.
- Not re-asked, standing as planned: Q2 (outreach deferred), Q3 (DRY-up deferred),
  Q5 (`domains/add` FREE → 403 feature-gate message), Q6 (`requireFeature` kept),
  Q8 (pre-gate ledger write — preserve today's behavior), Q9 (`charge_conflict` generic
  500, no client auto-retry), Q10 (DEV_BYPASS no ledger row).

## Unresolved questions

1. Race-loser policy: post-AI genuine insufficiency → 402 + discard output (no free output). OK, or prefer deliver-free-and-eat-cost? (Retry-exhaustion conflict now separately → recoverable 500, NOT the credits wall.)
2. Outreach consume-swallow (`outreach/[token]`:421) deferred (separate rail, nuanced charge ladder) — OK to leave for its own follow-up?
3. DRY-up (collapse `hasTrackingPixels` + 2 inlined `removeBranding` checks onto fixed `hasFeature`) deferred as scope creep — OK?
4. Concurrency test hits Neon DEV DB on every local `test:run` (skips only if no `DATABASE_URL`) — acceptable?
5. `domains/add` FREE now 403s at feature gate w/ upgrade message (was blocked by limit backstop w/ different message) — OK?
6. `requireFeature` = dead but kept (correct post-fix). Delete too?
7. `generate-privacy-policy` + `work/regenerate-story` pulled in for post-consume alignment though spec names only `audience/*`+`v2/*` — OK?
8. Pre-gate 402 now writes the `success:false` UsageEvent at the route (preserves today's ledger) — confirm, or prefer pre-gate rejections deliberately unledgered?
9. `charge_conflict` UX = generic "try again, not charged" 500; no client-side auto-retry added — OK for now?
10. DEV_BYPASS_CREDITS path loses its UsageEvent row entirely (dev-only) — acceptable?
