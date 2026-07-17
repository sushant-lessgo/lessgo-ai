---
tier: full
tier-why: billing/Stripe/credits surface + cross-surface reach (dashboard chrome + editor/onboarding gating + API error contracts). Presentation + wiring over shipped backend, but money + cross-lane touch → needs full pipeline.
---

# billing-beta — spec  (Dashboard redesign · Slice 3 — LEAN BETA)

## Problem / why
Monetization has **zero in-app UI**: no credit balance, no plan display, no upgrade path, and
blocked AI ops fail silently (`plan-credits-surface` P0.7 beta blocker). Pricing-v2 shipped the
pricing page + backend enforcement + Stripe Checkout/portal/top-up/LTD sessions, but a user
inside the app can't see credits/plan or recover from a block. No paid beta user can be
onboarded confidently without this.

**Descope decision (2026-07-16):** the handoff's full Billing & plan console (2g — usage meters,
inline payment method, change-plan comparison cards, invoice list) is **more than beta needs and
rebuilds what Stripe's billing portal already provides free.** This slice ships the **lean beta
floor**; the full 2g console is **deferred to post-beta**. This slice **absorbs + supersedes the
held `plan-credits-surface.spec.md`** and the S3 line in the dashboard risk-cut.

## Goal
A user can see their plan + credit balance in-app, upgrade / top-up / manage billing, and — when
a credit-gated AI op is blocked — get a clear message with an upgrade/top-up path instead of a
silent failure. Payment method / invoices / cancellation are handled by Stripe's billing portal,
not rebuilt.

## Approach (decided)
- **Descope to beta floor**, defer full 2g console post-beta.
- **Config-driven, never hardcoded.** All tiers/prices/limits render from `planManager`
  `PLAN_CONFIGS`; credit costs from `creditSystem.ts`. Pricing is a business decision the founder
  changes at any time → UI must update with **no code change**. Handoff 2g = layout/visual only
  (its Starter/€/visitor numbers are illustrative — ignore); pricing-v2 = content truth.
- **Stripe portal for the heavy stuff.** Payment method, invoices, cancellation → redirect to the
  existing `create-portal-session`. Show only a light read-only summary inline if trivial.

## Scope IN (lean beta floor)
- **Plan + credit display**:
  - Sidebar **plan widget** made real (replaces the greyed S1 widget): tier + sites-used +
    Upgrade CTA, from `billing/plan`.
  - **Credit balance counter** in the dashboard header (source: `UserUsage` via `credits/balance`).
    Editor-side counter included **if cheap + non-invasive** (coordinate w/ editor-shell; presentation only).
- **Lean "Billing & plan" nav view** (the sidebar destination): plan summary + credit balance +
  Upgrade / Top-up CTAs + **"Manage billing" → Stripe portal**. Reuse 2g's plan-card *visual* for
  the upgrade CTA. NOT the full console.
- **Upgrade / Top-up / Downgrade** → existing Stripe sessions (`create-checkout-session`,
  `create-topup-session`; downgrade via portal). LTD/Agency surfaced only as pricing-v2 dictates
  (LTD is a beta acquisition offer on the pricing page — in-app change-plan is Free↔Pro + top-up).
- **"What costs what"**: surface credit costs at/near the AI actions that spend them
  (FULL_PAGE_GEN=10, SECTION_REGEN=2, ELEMENT_REGEN=1, IVOC_RESEARCH=3, SCRAPE_WEBSITE=1), from
  `creditSystem.ts` (not hardcoded copies).
- **Gating message (beta blocker)**: when a credit-gated AI op is blocked (balance 0), show a
  clear message + upgrade/top-up link at the block point (editor / onboarding), not a silent fail.
  Align with pricing-v2 "block AI ops only".
- Built on `ui-foundation` tokens/primitives.

## Scope OUT (non-goals)
- **Full 2g Billing & plan console** — usage meters, inline payment method, change-plan comparison
  cards, downloadable invoice list → **post-beta** (own spec later).
- **No rebuild of payment method / invoices / cancellation** — Stripe portal owns these.
- **No backend/pricing changes** — `PLAN_CONFIGS`, credit math, Stripe wiring, enforcement already
  shipped (pricing-v2). This slice reads + links only; does not re-implement credit math or change
  `checkCredits()` logic (only surfaces its block to the user).
- No pricing-page changes (public pricing page already shipped).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged**; sidebar plan widget builds on **`dashboard-workspace-ia`
  (S1)** shell (makes its greyed widget real) — coordinate ordering.
- **Config-driven** (see Approach) — no hardcoded tiers/prices/limits/costs; single source =
  `planManager` + `creditSystem`.
- **Cross-surface coordination**: gating message + editor credit counter touch editor/onboarding —
  presentation only (error message + link), NOT editor store/selection/canvas internals; coordinate
  with `editor-shell-redesign` + Lane 3.
- Read balance/plan from shipped `UserUsage`/`UserPlan`; do not duplicate credit math.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/task/pricing-v2.spec.md` — locked pricing model (content truth); shipped backend surface.
- `docs/task/plan-credits-surface.spec.md` — held spec this **absorbs/supersedes** (beta floor def).
- `src/lib/planManager.ts` (`PLAN_CONFIGS`), `src/lib/creditSystem.ts` (costs), `UserUsage`/`UserPlan`.
- `src/app/dashboard/billing/page.tsx` — existing billing page (325 lines) to replace with lean view.
- APIs: `billing/plan`, `billing/usage`, `credits/balance`, `billing/ltd-availability`; Stripe
  `create-checkout-session` / `create-topup-session` / `create-portal-session`.
- `checkCredits()` — the AI-op gate to hang gating messages on.
- Handoff `Lessgo Dashboard.dc.html` 2g — plan-card / upgrade-CTA **visuals only** (numbers illustrative).
- `docs/architecture/pricingSystem.md`.

## Open exploration questions (feeds scout)
- Where is `UserUsage` balance read for the current user (existing hook/endpoint)? Best in-app
  anchor for the counter.
- Where does `checkCredits()` block, and what does the failure return to the client (to hang the
  gating message on)? Which AI-op routes gate (regen content/section/element, scrape, IVOC).
- Does `billing/plan` expose enough for the plan widget + lean view (tier, sites used, next charge,
  PM last4)? Gaps → portal-only.
- Current `/dashboard/billing/page.tsx` shape — replace vs adapt into the lean view.
- LTD/top-up in-app: which CTAs make sense for existing beta users vs pricing-page-only.

## Candidate human gates
- **Gating-message copy + upgrade path** — confirm before it faces paying users (plan-credits-surface note).
- Confirm Stripe portal covers payment method + invoices + cancel to the beta bar (so the console defer is safe).

## Acceptance criteria
- [ ] Plan/tier + credit balance visible in-app (sidebar widget + dashboard header counter),
      matching `UserUsage`/`billing/plan`.
- [ ] Lean "Billing & plan" view: plan summary + credits + Upgrade/Top-up CTAs + "Manage billing"→portal.
- [ ] Upgrade / Top-up reach existing Stripe Checkout; Manage billing reaches Stripe portal.
- [ ] AI action credit costs surfaced near where spent (from `creditSystem.ts`).
- [ ] Blocked AI op (0 credits) shows a clear message + upgrade/top-up link, not a silent fail.
- [ ] All tiers/prices/limits/costs rendered from config — changing `PLAN_CONFIGS` updates UI with
      no code change; no € "Starter"/visitor numbers from the handoff.
- [ ] No changes to credit math / `checkCredits()` logic / Stripe wiring / `PLAN_CONFIGS` values.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Beta floor first (the blocker): credit counter + block-with-upgrade message on the AI ops that
already gate. Then: plan widget + lean Billing & plan view + Upgrade/Top-up/portal CTAs +
costs-at-action. Gate: a free user who runs out of credits sees why + where to upgrade, and can
complete an upgrade via Stripe.
