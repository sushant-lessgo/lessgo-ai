# billing-beta — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\billing-beta`
- **Branch:** `feature/billing-beta` (verified)
- **Tier:** full
- **Inputs:** `docs/task/billing-beta.spec.md` (scope authority) · `docs/task/billing-beta.scout.md` (findings authority — §-refs below point there)
- **Green gates per phase and before merge:** `tsc` · `npm run test:run` · `npm run lint` · `npm run build`

## Overview

Monetization has zero in-app UI: no credit balance, no plan display, no upgrade path, and blocked
AI ops fail silently. This slice ships the lean beta floor — blocker first (credit counter +
block-with-upgrade messaging on the AI ops that already gate), then the sidebar plan widget, a lean
Billing & plan view with Upgrade / Top-up / Stripe-portal CTAs, and credit costs surfaced at the
actions that spend them. Presentation + wiring only: all values render from `PLAN_CONFIGS` /
`CREDIT_COSTS`; no backend, credit-math, `checkCredits()`, or Stripe-wiring changes — with ONE
ruled additive exception: a read-only `hasBillingAccount` field on `/api/billing/plan` (decision 5).

## Progress log

- phase 1 config extraction (prisma-free constants): done (commit 1262dbe2, review loops 1, verdict ship)
- phase 2 insufficient-credits normalizer: done (commit b74023aa, review loops 2, verdict ship) — scout §F Pattern-A error found+corrected at source; fixture had echoed the wrong belief
- phase 3 dashboard header credit counter: done (commit 35d53d42, review loops 1, verdict ship) — config-driven proven by review mutation probe (10→7, DOM followed); e2e registered in authed allowlist + execution evidenced
  - carried to phase 8: (a) CreditBadge panel's Upgrade link is mouse-unreachable (pre-existing: mouseleave + sideOffset gap) — fix via close-delay or sideOffset=0; (b) add jsdom vitest that vi.mocks creditCosts with fabricated values to prove the component READS the module (catches same-value re-inline, which no e2e can); (c) audit sentence wrongly claims text-sm dropped (CreditBadge.tsx:150) — stock fontSize utilities are fine, fix the sentence
- phase 4 gating message + upgrade path (beta blocker): pending
- phase 5 editor header credit counter: pending
- phase 6 lean Billing & plan view + CTAs + sidebar widget: pending
- phase 7 costs-at-action: pending
- phase 8 docs + hardening sweep: pending

## Key decisions (resolved up front)

1. **Prisma-import problem (scout §B)** — extract prisma-free constants into two new modules:
   `src/lib/planConfigs.ts` (`PlanTier`, `PlanStatus`, `PlanConfig`, `PLAN_CONFIGS`,
   `getPlanConfig`) and `src/lib/creditCosts.ts` (`CREDIT_COSTS` + its type). `planManager.ts` and
   `creditSystem.ts` import + **re-export** them so all 38 existing importers are untouched. Move
   the load-bearing comments with the code (FREE `credits:20` divergence note at planManager:71-74,
   socialPosts migration-sync note at :37-39). Do NOT add Stripe price ids; do NOT reconcile FREE
   `credits:20` vs DB `creditsLimit=0`. Values byte-identical — this phase is a pure move.
   ⚠️ `tsconfig.json` has `isolatedModules: true` → the `PlanConfig` **interface** cannot go
   through a value re-export; use `export type { PlanConfig } from './planConfigs'` (the
   `PlanTier`/`PlanStatus` enums re-export fine as values).
2. **402 normalizer (scout §F)** — one client-side `parseInsufficientCredits(status, body)` in
   `src/lib/billing/insufficientCredits.ts` accepting all three shapes (Pattern A
   `{success:false, error:{code:'insufficient_credits', message}}`, Pattern B
   `{error, code:'INSUFFICIENT_CREDITS'}`, checkAIAccess = B + `details:{required, available}`),
   extracting `{required?, available?}` (regex the "Required: N, Available: M" message where no
   structured fields). Route response shapes are Scope OUT — untouched. The social 403 upgrade
   wall stays its own convention — untouched.
3. **Reuse, don't rebuild (scout §G)** — adapt `OutOfCreditsModal` + `CreditBadge` (both dead
   code today). CreditBadge: `app-*` reskin, replace hardcoded costs at :179-191 with
   `CREDIT_COSTS` reads, keep its pool-aware math + 30s polling; it stays the ONLY balance
   fetcher (no third one — editor counter reuses the same component). OutOfCreditsModal: reskin +
   make copy config-driven (its `$39/mo`, "14-day free trial", "Free plan: 30 credits/month" are
   ALL stale vs pricing-v2 — replace from `PLAN_CONFIGS`, drop trial language).
   **`daysUntilReset` is dropped for this slice**: the bus carries only `{required, available}`,
   and adding a balance fetch to the modal would create a second fetcher (contradicting the
   CreditBadge-only rule). ⚠️ Passing `undefined` alone is NOT enough — the prop currently
   **defaults to `0`** (`OutOfCreditsModal.tsx:19`), which would render "refresh in 0 days".
   The rewrite must drop the default AND gate the wait-for-reset block on the prop being a
   real number — an explicit beta simplification, noted at the gate-(a) copy review. Wizard
   `status:'credits'` lane is the reference implementation and is NOT touched.
4. **Data gaps (scout §A)** — sites-used: sidebar already gets it server-side via
   `dashboard/layout.tsx:56-62` (`SidebarPlan`) — no new route, no layout change; the lean view
   does not show a sites count (widget owns it). PM last4 + cancel-at-period-end: no server
   source → **portal-only, not built**. `currentPeriodEnd`: for FREE and LTD users it is a
   usage-period rollover, NOT a charge date — labeling it "next charge" would be a money-facing
   falsehood. Show the "Next charge" row ONLY when `tier === 'PRO' && !lifetimeDeal` and status
   is a live subscription state (`ACTIVE`/`TRIALING`-equivalent per `PlanStatus`); otherwise omit
   the row entirely.
5. **Manage-billing gate (scout §D) — RULED additive field, not a tier proxy.** The portal
   route's real 400 condition is `!userPlan.stripeCustomerId`
   (`create-portal-session/route.ts:24-29`). A tier-based proxy breaks two real users: a
   churned/downgraded ex-payer (FREE tier WITH a customer id — must reach invoices/cancellation)
   and an admin-granted PRO (`api/admin/grant-plan` — no customer id, button would 400). So:
   add `hasBillingAccount: !!plan.stripeCustomerId` to `src/app/api/billing/plan/route.ts`
   (additive, read-only, within "reads + links only"). "Manage billing" is live when
   `hasBillingAccount`, else greyed with tooltip ("No billing account yet — upgrade first"), per
   the greyed-placeholder principle. A residual 400 → error toast, never silent. Top-up: button
   live; a 404 from the `PRICING_V2_COMMERCE` kill-switch → toast "Top-ups aren't enabled yet"
   (no reliable client-side probe for the flag; see Q2, non-blocking).
6. **layout.tsx trap (scout §C)** — this slice adds **zero** reads to `dashboard/layout.tsx`.
   Counters are client components fetching `/api/credits/balance` on demand. Never `getUserPlan()`
   in passive chrome. Scope note: `DashboardTopBar` returns `null` on `/dashboard/[token]/*`
   (:49-52 — the project workspace owns its own header), so the phase-3 counter does NOT appear
   there. Accepted for beta: dashboard list pages get the phase-3 counter; the editing context
   gets the phase-5 counter; the project-workspace header gets none.
7. **ui-foundation** — `app-*` utilities only for all touched chrome; `Spinner` for loading (no
   skeleton primitive exists); icons: use the **already-subset** `credit_card` /
   `workspace_premium` — **no new ligature in this slice** (so no `icons.txt` edit and no
   font-subset regen under `public/fonts/material-symbols-rounded/`). The three isolation guards
   (published-css sha256, tailwind config-freeze test, `e2e/ui-isolation.spec.ts`) must stay
   green every phase.
8. **No app-wide toast root (scout §G)** — don't invent one. Editor gating surfaces via a
   dedicated modal host (`CreditsBlockedHost` mounting `OutOfCreditsModal`) inside the editor's
   existing `ToastProvider` tree, driven by a tiny module-level subscribe/emit bus (same idiom as
   the editor toast singleton). Dashboard uses its existing `ToastProvider`; onboarding uses an
   inline notice.
9. **Modal CTA = LINK ONLY (ruled; was Q1).** The out-of-credits modal's primary CTA is a plain
   link to `/dashboard/billing`. No in-modal Stripe calls, no `startTopup`, no `stripeClient.ts`
   dependency in phase 4. The spec's "clear message + upgrade/top-up link" is satisfied by
   linking to the view that carries both CTAs; this keeps `stripeClient.ts` in phase 6, avoids
   the kill-switch toast path in a tree with no dashboard `ToastProvider`, and preserves
   blocker-first ordering.
10. **In-app beta = MONTHLY ONLY (ruled).** `PLAN_CONFIGS[PRO].price` is
    `{ monthly: 29, annual: 24 }` (`planManager.ts:103-104`) — `annual` is a **per-month**
    figure; the $290/yr number is hardcoded ONLY at `pricing/page.tsx:77`
    (`priceAnnualPerYear: 290`), NOT in config. Rendering `annual` in-app would show $24, and
    inventing 290 (or 24×12=288) in the UI is a hardcoded/false money-facing number — and
    adding `priceAnnualPerYear` to `PLAN_CONFIGS` is a config-value change, explicitly Scope
    OUT. So: the in-app upgrade CTA calls `create-checkout-session` with
    `billingInterval:'monthly'` only; render `price.monthly` only; do NOT render an annual
    figure anywhere in-app. Optional: a one-line "Want annual? See /pricing" link (the public
    pricing page renders 290 correctly and is Scope OUT); if it isn't one line, omit it.
    Annual reconciliation → Deferred list.

---

## Phase 1 — config extraction (prisma-free constants)

Everything else depends on this. Pure move + re-export; zero value changes. (Reviewer-confirmed
necessary: `OutOfCreditsModal` sits behind a client bus with no server ancestor, and
`edit/[token]/page.tsx` is `'use client'` — prop-drilling can't reach either consumer.)

**Steps**
1. Create `src/lib/planConfigs.ts`: move `PlanTier`, `PlanStatus`, `PlanConfig`, `PLAN_CONFIGS`,
   `getPlanConfig` out of `planManager.ts` verbatim (incl. comments). No prisma/logger imports.
2. Create `src/lib/creditCosts.ts`: move `CREDIT_COSTS` (creditSystem.ts:7-26, `as const`) +
   derived operation type verbatim. No prisma import.
3. `planManager.ts` / `creditSystem.ts`: import from the new modules and re-export the same names.
   ⚠️ `isolatedModules: true` — the `PlanConfig` interface MUST use
   `export type { PlanConfig } from './planConfigs'`; `export { PlanTier, PlanStatus, … }` works
   for the enums/values. All 38 importers (scout list) compile unchanged.
4. Vitest: pin key values (`FULL_PAGE_GENERATION:10`, `SECTION_REGENERATION:2`,
   `ELEMENT_REGENERATION:1`, FREE `credits:20`, PRO price `monthly:29` and `annual:24` — the
   `annual` field is a per-month figure, pin it AS-IS; decision 10) so a future edit to the
   moved file is a conscious act. This phase is a pure move — values byte-identical; do NOT
   "fix" annual to 290. Before writing, check `src/lib/planManager.test.ts` /
   `creditSystem.test.ts` (if present) for existing value pins — extend/de-dupe rather than
   duplicate. (No "re-export identity" assertion — a re-export can't fail it.)

**Files touched**
- `src/lib/planConfigs.ts` (new)
- `src/lib/creditCosts.ts` (new)
- `src/lib/planConfigs.test.ts` (new)
- `src/lib/planManager.ts`
- `src/lib/creditSystem.ts`

**Verification** — `tsc` exit 0; `npm run test:run` green (incl. new test); `npm run lint`;
`npm run build` (proves no bundling regression). Diff review: moved blocks byte-identical.

## Phase 2 — insufficient-credits normalizer

**Steps**
1. `src/lib/billing/insufficientCredits.ts` (client-safe, no prisma):
   - `parseInsufficientCredits(status: number, body: unknown): { required?: number; available?: number } | null`
     — `null` unless the body matches one of the three shapes (decision 2); tolerate non-402
     status only when the code field matches (belt-and-braces), else require 402.
   - `class InsufficientCreditsError extends Error { required?; available? }` for typed throws.
2. Vitest with fixture bodies for Pattern A, Pattern B, checkAIAccess-with-details, a 500 body
   (→ null), and the social 403 wall body (→ null — must NOT match).

**Files touched**
- `src/lib/billing/insufficientCredits.ts` (new)
- `src/lib/billing/insufficientCredits.test.ts` (new)

**Verification** — `tsc`; `npm run test:run`; `npm run lint`.

## Phase 3 — dashboard header credit counter (beta floor, part 1)

**Steps**
1. Reskin `src/components/billing/CreditBadge.tsx`: `app-*` utilities + `AppIcon`/`AppTooltip`
   (drop lucide + stock Tailwind); keep pool-aware math (:60-77), polling, low/out states.
   Replace hardcoded costs (:179-191) with rows rendered from `CREDIT_COSTS`
   (`FULL_PAGE_GENERATION`, `SECTION_REGENERATION`, `ELEMENT_REGENERATION`; do NOT surface the
   dead `IVOC_RESEARCH`). Upgrade link → `/dashboard/billing` (was `/pricing`). Icons: subset
   `credit_card`/`workspace_premium` only — no new ligature (decision 7).
2. Mount `<CreditBadge />` in `src/components/dashboard/DashboardTopBar.tsx` right of the
   `flex-1` spacer (:62), left of the greyed bell. (Absent on `/dashboard/[token]/*` where the
   top bar returns null — accepted, decision 6.)
3. **Register the new spec in `playwright.config.ts`**: `authed.testMatch` (:59-74) is an
   explicit ALLOWLIST — the in-file warning (:52-56) exists because two prior tracks shipped
   unregistered specs that silently never ran. Add `/billing-beta\.spec\.ts/` to the `authed`
   project's `testMatch` array. Without this, every e2e assertion in phases 3/4/6 is theatre.
4. New `e2e/billing-beta.spec.ts` (authed, reuse `auth.setup.ts` session — no seeding needed for
   THIS test): dashboard header shows the counter with a numeric balance; tooltip cost rows match
   `CREDIT_COSTS` imported via relative path from `src/lib/creditCosts` (prisma-free after
   phase 1 → node-importable in Playwright) — this is the deterministic config-driven check.
   Include the `HAS_AUTH_ENV` skip guard used by the other authed specs.

**Files touched**
- `src/components/billing/CreditBadge.tsx`
- `src/components/dashboard/DashboardTopBar.tsx`
- `e2e/billing-beta.spec.ts` (new)
- `playwright.config.ts`

**Verification** — `tsc`; `test:run`; `lint`; `npm run build`; `npm run test:e2e` — new spec +
`ui-isolation.spec.ts` + tailwind config-freeze test green. **Confirm in the Playwright run
output that `billing-beta.spec.ts` actually EXECUTED under the `authed` project** (not just that
the suite is green). Manual: counter matches `/api/credits/balance` for the dev user.

## Phase 4 — gating message + upgrade path (beta floor, part 2 — THE blocker) 🚧 HUMAN GATE

**Steps**
1. Adapt `src/components/billing/OutOfCreditsModal.tsx`: `app-*` reskin; ALL numbers/copy from
   config — PRO name/credits/price from `PLAN_CONFIGS[PlanTier.PRO]`, FREE credit note from
   `PLAN_CONFIGS[PlanTier.FREE].credits`, costs from `CREDIT_COSTS`; delete trial language
   (pricing-v2 = no trials, 14d refund). `daysUntilReset`: **drop the `= 0` default at :19 AND
   gate the wait-for-reset block on the prop being a defined number** — passing `undefined`
   alone would still render "refresh in 0 days" via the default (decision 3 — no second balance
   fetcher; the block never renders this slice). Removing that block orphans the lucide `Clock`
   import — delete it (and any other now-unused imports) so `lint` doesn't bounce the phase.
   Primary CTA = plain **link** to `/dashboard/billing` — no Stripe calls in the modal
   (decision 9).
2. New `src/lib/billing/creditsBlockedBus.ts`: minimal module-level subscribe/emit for
   `{required, available}` events (editor-toast singleton idiom; no store change, no new
   toast root).
3. New `src/components/billing/CreditsBlockedHost.tsx` (`'use client'`): subscribes to the bus,
   renders `OutOfCreditsModal`.
4. `src/hooks/editStore/aiActions.ts`: at the **THREE** credit-gated fetch error paths — the
   file has exactly three `fetch` calls: `regenerateSection` (:98, `/api/regenerate-section`,
   error handling ~:98-115), `regenerateStorySection` (:313, `/api/audience/work/regenerate-story`,
   Pattern B, error path ~:324-326), and `regenerateElementWithVariations` (:543,
   `/api/regenerate-element`, error path ~:557) — run
   `parseInsufficientCredits(res.status, errorData)`; on match, emit on the bus and throw
   `InsufficientCreditsError` (still recorded in `aiGeneration.errors` — behavior superset, no
   store-shape change). Non-credit errors: unchanged.
   ⚠️ `regenerateElement` (:451-490) is a **mock stub** — `await new Promise(r => setTimeout(r, 1500))`,
   no network, no credit spend; :482 is just its catch block. Do NOT touch it. Its only caller
   is `MainContent.tsx:308/314`, which therefore is NOT a spend affordance (relevant to
   phase 7 too).
   ⚠️ The ~:557 path currently throws on `response.status` WITHOUT reading the body — the
   implementer must add an `await response.json()` (try/catch-wrapped) there before the
   normalizer can see anything; the other two paths already have `errorData`.
5. Mount `<CreditsBlockedHost />` in `src/app/edit/[token]/page.tsx` inside `<ToastProvider>` (:44).
6. Onboarding `src/app/onboarding/[token]/components/EntryInputStep.tsx` — **replace the
   misleading generic error with a credits notice.** Current behavior at :120-129: the
   `if (res.status !== 402)` branch only skips the `trackFailure('scrape_failed')` ANALYTICS
   event; `setError(...)` at :129 ALWAYS runs, so a 402 today shows a generic "Couldn't read
   that site…" — misleading, not swallowed. Change: on `parseInsufficientCredits` match, show an
   inline notice ("Not enough credits — need N, have M") + link to `/dashboard/billing` instead
   of the generic error. **Leave the 402 analytics suppression exactly as-is** — do NOT unify
   the branches; logging credit blocks as `scrape_failed` would corrupt the data-capture funnel.
   Also note: the existing fallback reads `json?.message`, which never matches Pattern A's
   nested `{error:{message}}` — extract the message via the normalizer, not ad-hoc reads.
7. Wizard lane (`status:'credits'`): NOT touched — already correct.
8. Vitest: OutOfCreditsModal renders `PLAN_CONFIGS`/`CREDIT_COSTS` values (jsdom, assert against
   imported config, not literals; assert wait-for-reset block absent when `daysUntilReset`
   undefined — this pins the dropped-default fix in step 1); aiActions mocked-fetch test — 402
   Pattern-B body → bus emit + `InsufficientCreditsError`; 500 → no emit.
9. **e2e wiring proof** — extend `e2e/billing-beta.spec.ts` (authed; registered in phase 3).
   `page.route` stubs the RESPONSE, not the page — reaching an element toolbar requires a real
   project with rendered content. **Seeding path (same idiom as `e2e/media-picker.spec.ts:56-75`):**
   serial mode, `beforeAll` creates the project via `/api/user/persona` → `/api/start`, then
   `seedDraft(api, token, cfg)` (reuse `e2e/helpers/seedDraft.ts` + `AUDIENCES`), shared token
   across tests, `HAS_AUTH_ENV` skip guard, `afterAll` cleanup deletes the project. Then:
   `await page.route('**/api/regenerate-element*', route => route.fulfill({ status: 402, ... Pattern-B body with details:{required, available} }))`
   (route-stub idiom per `media-picker.spec.ts:181`), open `/edit/[token]`, **click a text
   element (e.g. the hero headline) to raise `ElementToolbar`, and trigger its variations
   action** (`ElementToolbar.tsx:110` — the only real caller of
   `regenerateElementWithVariations`, which hits `/api/regenerate-element`). Assert the modal
   is VISIBLE with the required/available values and an upgrade link pointing at
   `/dashboard/billing`. This is the only check that proves `CreditsBlockedHost` is mounted,
   subscribed, and rendering — the two vitests cover the ends but not the wiring, and the
   silent-fail this slice exists to kill would otherwise ship unverified. (Phase 3's counter
   test needs only the authed session — no seeding there.)

**Files touched**
- `src/components/billing/OutOfCreditsModal.tsx`
- `src/components/billing/OutOfCreditsModal.test.tsx` (new)
- `src/components/billing/CreditsBlockedHost.tsx` (new)
- `src/lib/billing/creditsBlockedBus.ts` (new)
- `src/hooks/editStore/aiActions.ts`
- `src/hooks/editStore/aiActions.credits.test.ts` (new)
- `src/app/edit/[token]/page.tsx`
- `src/app/onboarding/[token]/components/EntryInputStep.tsx`
- `e2e/billing-beta.spec.ts`

**Verification** — `tsc`; `test:run` (existing i18n/aiActions tests must stay green); `lint`;
`build`; `npm run test:e2e` — the new 402-stub scenario green (modal visible + values + link).
Manual (dev, `DEV_BYPASS_CREDITS` unset, a 0-credit user): element regen in editor → modal with
correct numbers; onboarding scrape → inline credits notice (and PostHog shows NO `scrape_failed`
for it); upgrade link lands on `/dashboard/billing`.

**🚧 HUMAN GATE (spec gate a) — COPY ONLY, destination provisional:** founder signs off
gating-message copy + upgrade path before this faces paying users. Present the final modal +
inline-notice copy verbatim, including the wait-for-reset omission (decision 3). The CTA links to
`/dashboard/billing`, which at this point is still the OLD billing page — a real (if ugly)
destination, never a broken link; phase 6 replaces it. The gate does NOT review the destination.

## Phase 5 — editor header credit counter

**Steps**
1. Drop `<CreditBadge />` into `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
   right-side cluster at :324 (with existing `app-divider` separator idiom). Self-fetching — no
   store touch. Do NOT "fix" the deliberate `useEditStore.getState().toggleLeftPanel?.()`
   inconsistency at :265 (header comment says preserve).

**Files touched**
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`

**Verification** — `tsc`; `lint`; `build`. Manual: counter renders in `/edit/[token]` header, no
layout shift at h-14; regen updates balance within the 30s poll.

## Phase 6 — lean Billing & plan view + CTAs + sidebar widget 🚧 HUMAN GATE

Kept as ONE phase (considered splitting view vs CTAs): the CTAs ARE the page's content — a
CTA-less intermediate view would ship dead buttons or omit the slice's core value, and
`stripeClient.ts` is three thin fetch wrappers, not a review burden. One coherent review unit.

**Steps**
1. `src/app/api/billing/plan/route.ts`: add `hasBillingAccount: !!plan.stripeCustomerId` to the
   response — the route's local variable is `plan` (route.ts:20), NOT `userPlan` (decision 5 —
   ruled additive read-only field; nothing else in the route changes).
2. New `src/lib/billing/stripeClient.ts` (client helper — none exists today):
   `startCheckout()` → `create-checkout-session` `{tier: 'PRO', billingInterval: 'monthly'}` →
   redirect `url` — **monthly only, no interval parameter** (decision 10);
   `startTopup()` → `create-topup-session`, 404 → typed `disabled` result;
   `openPortal()` → `create-portal-session`, 400 → typed error. No new response parsing beyond
   these routes' documented shapes.
3. Replace `src/app/dashboard/billing/page.tsx` with the lean view (`app-*` primitives: `Card`,
   `Button`, `Badge`, `Spinner`), salvaging exactly three things from the old page: pool-aware
   credit math (:133-150), `openCustomerPortal()` semantics (now via stripeClient), and the
   `?success=true` banner (checkout AND top-up land here). Content:
   - **Plan summary card**: plan name/price from `PLAN_CONFIGS[tier]` + status / `lifetimeDeal`
     from `billing/plan`. "Next charge" row (`currentPeriodEnd`) ONLY when
     `tier === 'PRO' && !lifetimeDeal` with live subscription status; omit the row for FREE/LTD
     (decision 4 — rollover date is not a charge). Handoff 2g plan-card visual only — no € /
     "Starter" / visitor numbers.
   - **Credit balance**: from `credits/balance`, pool-aware label logic.
   - **Upgrade CTA** (FREE users): Pro at `PLAN_CONFIGS[PRO].price.monthly` → `startCheckout()`.
     **Monthly only — render NO annual figure anywhere in-app** (decision 10:
     `price.annual` is a per-month 24, and 290 exists only in `pricing/page.tsx` — Scope OUT).
     Optional one-line "Want annual? See /pricing" link; omit if not one line. In-app
     change-plan = Free↔Pro only; LTD stays pricing-page-only; downgrade via portal.
   - **Top-up CTA**: `startTopup()`; kill-switch 404 → toast (decision 5).
   - **Manage billing**: live iff `hasBillingAccount` (decision 5 — NOT a tier proxy: churned
     ex-payer stays live, admin-granted PRO without a customer id is greyed); greyed-with-tooltip
     otherwise; residual 400 → toast.
   - **Credit costs list** from `CREDIT_COSTS` (same rows as phase 3, no `IVOC_RESEARCH`).
   - Dropped (2g/post-beta): usage-history stub, per-op counters, meters, invoices, PM display.
4. `src/components/dashboard/AppSidebar.tsx`: make the greyed Upgrade (:167-169) a real
   `<Link href="/dashboard/billing">` (drop `cursor-not-allowed`/`opacity-60`/`aria-disabled` +
   the S3 comment). Data flow unchanged (decision 4) — no `layout.tsx` edit.
5. Extend `e2e/billing-beta.spec.ts`: billing view renders plan name + Pro **monthly** price
   matching `PLAN_CONFIGS[PRO].price.monthly` (relative import), and **no annual dollar figure
   is rendered** (decision 10 — neither $24 nor a computed yearly number); costs list matches
   `CREDIT_COSTS`; sidebar Upgrade is an enabled link to `/dashboard/billing`; Manage-billing
   state matches the test user's `hasBillingAccount` (assert via a `billing/plan` response read
   in the test, not a tier assumption); no "Next charge" row for a non-PRO test user. No live
   Stripe redirect assertions (no network money ops in e2e) — assert up to the fetch boundary.

**Files touched**
- `src/app/api/billing/plan/route.ts`
- `src/lib/billing/stripeClient.ts` (new)
- `src/app/dashboard/billing/page.tsx`
- `src/components/dashboard/AppSidebar.tsx`
- `e2e/billing-beta.spec.ts`

**Verification** — `tsc`; `test:run`; `lint`; `build`; `npm run test:e2e` (new assertions +
`ui-isolation` + `dashboard-shell` green). Manual (Stripe test mode): FREE → Upgrade → Checkout
(monthly) → `?success=true` banner; paid user → portal opens; top-up path per flag;
churned-test-user check if a FREE+customerId fixture is available (else portal-route 400 toast
path by hand).

**🚧 HUMAN GATE (spec gate b):** confirm Stripe portal covers payment method + invoices +
cancellation to the beta bar (walk the portal in test mode) — validates the 2g-console defer AND
the `hasBillingAccount` Manage-billing rule.

## Phase 7 — costs-at-action

**Steps**
1. Cost hints (from `CREDIT_COSTS`, never literals) at the visible spend affordances:
   - `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` (:110 variations action) —
     `ELEMENT_REGENERATION` (e.g. AppTooltip "1 credit").
   - `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` (:404 variations action) — same.
   - `src/app/onboarding/[token]/components/EntryInputStep.tsx` — import/scrape affordance:
     "Costs 1 credit" from `SCRAPE_WEBSITE`/`UNDERSTAND`.
   Section-regen has no dedicated visible button today (only `MainContent.tsx:302` handler) — no
   hint to hang there; its cost stays discoverable via the CreditBadge tooltip + billing view.
   ⚠️ `MainContent.tsx:308/314` calls the `regenerateElement` STUB (mock, no network, no credit
   spend — see phase 4 step 4) — it is NOT a spend affordance; no cost hint there.
2. Presentation only — no handler/store logic changes.
3. Extend the phase-4 modal test or add a small vitest only if a hint gets its own component;
   otherwise covered by the CreditBadge/billing-view config assertions already landed.

**Files touched**
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/onboarding/[token]/components/EntryInputStep.tsx`

**Verification** — `tsc`; `lint`; `build`. Manual: hover each affordance → cost shown; change a
`CREDIT_COSTS` value locally → hint updates (revert).

## Phase 8 — docs + hardening sweep

**Steps**
1. `src/components/README.md`: remove the "OutOfCreditsModal has zero import sites" dead-code
   note (:18) — both billing components are now live.
2. `docs/architecture/pricingSystem.md`: short section — client-facing config lives in
   `planConfigs.ts`/`creditCosts.ts` (prisma-free, re-exported by planManager/creditSystem);
   402-shape normalizer location; `hasBillingAccount` field; the
   never-import-planManager-client-side rule; in-app upgrade = monthly-only (decision 10).
3. `CLAUDE.md`: fix the stale credit-cost key names in the Billing section
   (`FULL_PAGE_GEN` → `FULL_PAGE_GENERATION`, `SECTION_REGEN` → `SECTION_REGENERATION`,
   `ELEMENT_REGEN` → `ELEMENT_REGENERATION`) and point config at
   `planConfigs.ts`/`creditCosts.ts`. One-paragraph docs edit only.
4. Full sweep: `tsc`, `test:run`, `lint`, `npm run build`, `npm run test:e2e` (all specs incl.
   the three isolation guards).

**Files touched**
- `src/components/README.md`
- `docs/architecture/pricingSystem.md`
- `CLAUDE.md`

**Verification** — all green gates; docs match shipped behavior.

---

## Deferred / found en route (backlog — NOT this slice; spec bans backend changes)

From scout §H — file against the code-quality backlog (do NOT fix here):
1. `regenerate-element/route.ts:130-145` ignores `consumeCredits` result → free AI output on
   failed post-check / `charge_conflict`. Same class at `outreach/[token]/route.ts:412`.
2. `api/regenerate-content/route.ts` has NO credit gating — ungated AI-spend route.
3. Pattern-B routes can't distinguish `charge_conflict` (solvent user loses race) from
   insufficient credits.
4. `checkCredits()` fails closed on internal error → solvent user misreported as broke (our
   gating message inherits this ambiguity; acceptable for beta, note in copy review).
5. **In-app annual upgrade deferred** (decision 10): `PLAN_CONFIGS[PRO].price.annual` is a
   per-month figure (24); the $290/yr number lives ONLY in `pricing/page.tsx:77`
   (`priceAnnualPerYear: 290`). Reconciling them (e.g. adding `priceAnnualPerYear` to
   `PLAN_CONFIGS`) is a `PLAN_CONFIGS`-value change — Scope OUT here.
6. `aiActions.ts` `regenerateElement` (:451-490) is a mock stub (setTimeout, no network) wired
   to `MainContent.tsx:308/314` — a fake affordance; real single-element regen goes through
   `regenerateElementWithVariations`. Worth killing or wiring post-beta.

Also noted: `IVOC_RESEARCH` is a dead cost constant (backend removed scale-08) — left in config,
never surfaced; 402 response-shape unification (3 shapes → 1) is a natural post-beta cleanup;
"wait for reset" in OutOfCreditsModal (needs a `daysUntilReset` source) is a post-beta add.

## Resolved rulings (was unresolved)

- **Q1 (top-up in modal):** RULED — modal CTA is a link to `/dashboard/billing` only; no in-modal
  Stripe. See decision 9.
- **Annual in-app:** RULED — monthly only; annual stays on `/pricing`. See decision 10.

## Unresolved questions (none block implementation)

1. Top-up kill-switch: runtime-404 toast OK, or want a tiny public "commerce enabled" probe
   (would be a new route — currently Scope OUT)? Default = toast; en-route.
2. Editor + dashboard counters poll every 30s (existing CreditBadge behavior) — fine for beta?
   Default = yes; en-route.
3. e2e test user billing state: does the shared Clerk e2e account have a `stripeCustomerId`?
   (Phase-6 Manage-billing assertion reads `billing/plan` at runtime and pins to whatever it
   returns, so this self-resolves; asking only to know which branch gets exercised.) En-route.
4. "Want annual? See /pricing" one-liner in the billing view — include or omit? Default =
   include if literally one line; en-route (decision 10).
