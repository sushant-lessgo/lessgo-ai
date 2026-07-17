---
tier: standard
tier-why: small, self-contained correctness fixes (atomic credit deduction, deny-by-default feature gate, one charging model) — but money-path, so one adversarial diff review. /feature auto-escalates if scope widens.
---

# billing-correctness — spec

## Problem / why
The credit/plan system has three genuine correctness bugs (not policy choices) that leak revenue and paywalled features. They must be closed before pricing-v2 ships, since pricing-v2 assumes the metering underneath it is trustworthy. Source: `docs/reports/code-quality-report.md` findings H1, H2, M1, M2.

- **H1** — credit deduction is not atomic: `findUnique` then read-modify-write inside a `$transaction` with no row lock (the "lock" comment is false). N concurrent generations get charged once → free AI compute.
- **H2** — `hasFeature` fails open: `x !== 'none'` is `true` for a `false` flag, so every boolean plan feature (removeBranding, whiteLabel, exportHTML…) passes on FREE. Small blast radius today (2 callers) but a paywall hole the moment anything new gates on it.
- **M1/M2** — AI routes charge inconsistently: some run the AI call then bill best-effort with no pre-spend balance gate (0-credit user still generates); others charge before the op and never refund on failure (failed generation still billed).

## Goal
Make credit metering correct and consistent across all modern AI routes: charging is atomic (no concurrent double-spend), feature gates deny by default, and every AI route uses one charging model — **check balance up front, then charge only on success**. A failed generation costs the user nothing; a 0-credit user cannot generate.

## Scope OUT (non-goals)
- **M7 (FREE `publishedPages: 20` > PRO `10`)** — this is a config *number*, not a bug. pricing-v2 (queue #4) redefines all plan limits (Free = 1 site, Pro = 3). Leave the values untouched here; pricing-v2 owns them.
- **The 3 `regenerate-*` routes** — their broken credit gating is fixed in the separate `regen-modernization` spec, which rewrites those files wholesale. Do not touch them here (avoids two specs editing the same files).
- No new pricing, plan tiers, or credit-cost changes. Purely correctness of the existing mechanism.
- No refund/reservation machinery (that's charging model (2), explicitly not chosen — see Constraints).

## Constraints
- **Charging model = check-then-charge-on-success** (chosen over charge-then-refund). Pattern for every modern AI route: verify balance up front → run AI → charge only if it succeeded. Matches big-platform norm (OpenAI/Anthropic bill on delivered usage); refund path deliberately avoided as unnecessary complexity given calls are cheap/fast and H1 closes the concurrency hole.
- H1 fix must be a single atomic DB operation — conditional `updateMany … { credits: { decrement } }` guarded so it only succeeds when balance suffices, then assert affected count === 1. No read-then-write.
- H2 fix must make boolean feature checks deny-by-default (a `false`/absent flag = feature off).
- Keep changes minimal and self-contained — this is the "one small PR before pricing-v2" bundle, not a refactor.
- No CI gate exists; run `tsc` + `test:run` green locally before the branch is considered done.

## References
- `src/lib/creditSystem.ts:167-220` — H1 non-atomic deduction (the false "lock" comment)
- `src/lib/planManager.ts:403` — H2 `hasFeature` `!== 'none'` fail-open; `hasTrackingPixels` comment already documents the bug
- `src/lib/middleware/planCheck.ts:261-293` — M2 `withAICredits` charge-before/never-refund
- `src/app/api/audience/product/strategy/route.ts:222-224` (+ service strategy, both generate-copy, `v2/*`) — M1 bill-after best-effort, no pre-gate
- **World-class charging pattern to imitate:** the `social`/`outreach`/`email-sequences` copy rails — auth + owner + atomic tx + ledger (report §7). Use their credit-handling shape as the template for the standardized AI-route pattern.

## Open exploration questions
- Full list of modern AI routes that spend credits (`audience/{product,service}/{strategy,generate-copy}`, `v2/scrape-website`, `v2/understand`, any others) — each must adopt check-then-charge.
- Does `checkCredits()` already do a pre-spend balance check, and where is it called vs. skipped?
- All current callers of `hasFeature` (report says 2) — confirm none rely on the fail-open behavior.
- Is `consumeCredits`/`UsageEvent` ledger write in the same tx as the decrement, or separate?

## Candidate human gates
- The H1 atomic-decrement change touches live billing DB writes — sign-off before merge.
- Any change to the `UserUsage`/`UsageEvent` write path — verify no double-ledger or missed-ledger regression.

## Acceptance criteria
- [ ] Concurrent-generation test: N simultaneous spend calls on a balance of 1 credit → exactly 1 succeeds, N−1 rejected; no negative balance.
- [ ] Credit deduction is a single atomic conditional update asserting affected-rows === 1; the false "lock" comment is gone.
- [ ] `hasFeature` returns `false` for a `false`/absent boolean flag on FREE; a gated feature no longer passes for free users. Regression test covers the `!== 'none'` case.
- [ ] Every modern AI route (`audience/*`, `v2/*`) checks balance before the AI call and charges only on success; a 0-credit user is rejected before any AI spend; a failed generation charges nothing. Test per route family.
- [ ] Plan limit *values* (M7) unchanged — pricing-v2 still owns them.
- [ ] `tsc` + `test:run` green.

## Pilot / smallest slice
Not multi-phase — this is itself the thin slice. Suggested internal order if the implementer wants a gate: (1) H1 atomic decrement + concurrency test, (2) H2 gate fix + test, (3) M1/M2 route standardization. Ship as one bundle.
