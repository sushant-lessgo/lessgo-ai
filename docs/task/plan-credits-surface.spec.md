# plan-credits-surface — spec

> Source: `docs/reports/app-ui-ux-assessment.md` P0.7, §2 theme 5. Beta blocker. Depends on shipped pricing-v2 (`docs/task/pricing-v2.spec.md`).

## Problem / why
Monetization has **zero in-app UI**. No credits counter, no plan display, no upgrade path, no gating messages anywhere (dashboard, editor, settings). Pricing-v2 shipped the pricing page + backend credit enforcement, but a user in the app can't see how many credits they have, what tier they're on, or what an action costs — and a blocked AI op fails without a clear path forward. No paid user can be onboarded confidently without this.

## Goal
A user can see their credit balance and plan inside the app, understand what actions cost, and — when blocked by running out — get a clear message with an upgrade/top-up path instead of a silent failure.

## Scope IN
- **Credits counter**: remaining balance visible in-app (dashboard header and/or editor), source of truth = `UserUsage`.
- **"What costs what"**: surface credit costs at/near the actions that spend them (FULL_PAGE_GEN=10, SECTION_REGEN=2, ELEMENT_REGEN=1, IVOC_RESEARCH=3, SCRAPE_WEBSITE=1).
- **Plan display**: current tier (Free/Pro/LTD) visible in-app (settings at minimum — note `/dashboard/settings` is currently persona-picker-only; also flagged in dashboard-lifecycle).
- **Gating message**: when a credit-gated AI op is blocked (balance 0), show a clear message + upgrade/top-up link — not a silent failure. Align enforcement with pricing-v2's "block AI ops only".
- **Upgrade/top-up entry**: link from the in-app surface to checkout (Pro sub / one-time top-up).

## Scope OUT (non-goals)
- Pricing page + tiers + Stripe wiring + backend enforcement — already shipped in pricing-v2.
- Full billing/usage-history console, invoices, receipts.
- Plan up/downgrade *logic* (pricing-v2 owns) — this only links to it.
- Settings-page rebuild beyond adding the plan/credits view (dashboard-lifecycle / settings own the rest).

## Constraints
- Read balance/plan from the shipped `UserUsage` + `planManager.ts` config — do not re-implement credit math.
- Credit costs must stay in sync with `src/lib/creditSystem.ts` (single source), not hardcoded copies.
- Beta floor = counter + costs + block-with-upgrade message; everything else is nice-to-have.

## References
- `src/lib/planManager.ts` (`PLAN_CONFIGS`), `src/lib/creditSystem.ts` (costs), `UserUsage`/`UserPlan` models.
- `checkCredits()` gate (where AI ops block).
- `docs/task/pricing-v2.spec.md` (shipped backend); `docs/architecture/pricingSystem.md`.
- Report P0.7.

## Open exploration questions
- Where is `UserUsage` balance read for the current user (existing hook/endpoint)?
- Where does `checkCredits()` block, and what does the failure currently return to the client (to hang a gating message on)?
- Best in-app anchor for the counter (dashboard header, editor toolbar, or both)?
- Where is `/dashboard/settings` and how to add a plan/credits view there?

## Candidate human gates
- None hard (read-only display + link to existing checkout). Confirm the gating-message copy/upgrade path before it faces paying users.

## Acceptance criteria
- [ ] Credit balance is visible in-app and matches `UserUsage`.
- [ ] Action credit costs are surfaced near where they're spent.
- [ ] Current plan/tier is visible in-app.
- [ ] A blocked AI op (0 credits) shows a clear message + upgrade/top-up link, not a silent fail.
- [ ] Upgrade/top-up link reaches the existing checkout.

## Pilot / smallest slice
Slice 1 (blocker): balance counter + block-with-upgrade message on the AI ops that already gate. Slice 2: costs-at-action + plan display in settings. Gate: a free user who runs out of credits sees why and where to upgrade.
