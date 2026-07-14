# Pricing v2 — Implementation Plan

> **Worktree:** `C:\Users\susha\lessgo-ai\.claude\worktrees\feature-social-posts`
> **Branch:** `feature/pricing-v2` (off main `138e35b1`, zero divergence)
> All Files-touched paths are repo-relative; implementers/reviewers operate inside the worktree above.
> Spec: `docs/task/pricing-v2.spec.md`

## Overview

Rework pricing for public beta: fix the incoherent `PLAN_CONFIGS` (FREE currently beats PRO on published pages), enforce what the config promises (badge, forms cap, site limits), rebuild the pricing page (Free / Pro $29·$290 / Founding LTD 60-seat / Agency-contact), and add the new commerce machinery — one-time FREE credits, LTD lifetime 600-credit pool, $9/100 top-ups via Stripe `mode:'payment'`, cohort counter, comped-Pro admin path. Schema changes and Stripe work are isolated behind hard human gates; config/enforcement/UI land first ungated.

## Progress log

> **STATUS 2026-07-12: phases 1–8 done+committed on feature/pricing-v2; phase 9 deferred. main merged in (merge eaa17dd7); re-green PASS (prisma generate clean, tsc 0, test:run 2496 pass/0 fail, build 0). Ships DARK behind PRICING_V2_COMMERCE (default off). READY-TO-MERGE (feature→main = human gate). Pending founder actions (non-blocking): Stripe test-mode setup+IDs+webhook review+verify (docs/temp/pricing-v2-stripe-gate.md); prod grants naayom/Kundius (docs/temp/pricing-v2-prod-grants-gate.md).**


- phase 1 PLAN_CONFIGS rewrite: done (commit c853007d, review loops 1)
- phase 2 enforcement (badge, forms cap, limit verification): done (commit e38e23e5, review loops 1; scope-expanded to renderPublishedExport + verify-dns; hasFeature fail-open bug avoided). NON-BLOCKING carryover → unresolved Q#7: pre-phase-1 FREE UserPlan rows keep legacy DB formSubmissions/publishedPages limits until re-created — resolve at phase-4 gate.
- phase 3 pricing page rebuild: done (commit fa1bb1e7, review loops 1; LTD CTA disabled pending phase 7)
- phase 4 schema — UserPlan LTD + credit pool: done (commit 908b32f4, review loops 1; 4 additive cols applied to dev DB via schema-to-schema diff [--from-migrations needed a shadow DB, not configured; schema-to-schema touches no DB → strictly safer, identical SQL]; abort-guard passed = exactly 4 ADD COLUMN). Gate APPROVED 2026-07-12. Q7 RESOLVED = (A) Leave legacy FREE rows → **phase-5 constraint: do NOT bulk-migrate existing creditsLimit to 0** (additive check keeps them at 30/mo, generous-OK). Main-merge (data-capture+template-factory now on main) → do BEFORE final merge; folders union cleanly.
- phase 5 credit semantics (one-time / pool / top-up logic + read surfaces): done (commit e8273da5, review loops 1; +CreditBadge scope-add). Reviewer traced deduct-tx + Q7 in source. Non-blocking deferred: pool-guard concurrency (pre-existing non-locking pattern, row-lock later), CreditBadge "300/200" cosmetic for topped-up PRO, grantLifetimeDeal not self-idempotent (phase-6 webhook dedupes).
- phase 6 Stripe test-mode (LTD, top-ups, Pro price/trial): CODE done+shipped (commit 00617e09, review loops 1; INERT, kill-switch PRICING_V2_COMMERCE default OFF). ⏸ PAUSED for user test-mode verification: create test products/prices → supply IDs → review webhook logic → stripe-CLI verify (see docs/temp/pricing-v2-stripe-gate.md). GO-LIVE checklist carryovers: (1) log/flag same-user double-LTD-charge for refund (webhook silently skips 2nd paid session), (2) grantLifetimeDeal update→upsert hardening, (3) top-up read-then-write dedupe has no unique constraint.
- phase 7 cohort counter wiring + purchase CTAs: done (commit 7746865a, review loops 1; inert behind kill-switch, cohort math parity with phase 6 confirmed). Non-blocking: LTD display prices hardcoded in 2 places (ltd-availability + implied by Stripe IDs) — centralize later.
- phase 8 admin comped-Pro + naayom/Kundius migration: ROUTE done (commit a6e57a8c, review loops 1). ⏸ PROD-GRANTS still a human gate: naayom comped_pro; Kundius ltd cohort=0 pricePaid=30000 (see docs/temp/pricing-v2-prod-grants-gate.md). Not executed.
- phase 9 (optional) Pro→Free downgrade grace: DEFERRED (per plan + orchestrator; re-plan+re-gate before implementing).
- phase 9 (optional) Pro→Free downgrade grace: pending

## Open-item decisions (locked into this plan)

1. **Free credits hit 0 mid-edit → block AI ops only.** `checkCredits()` already gates only AI routes (regen/generate/scrape/IVOC); save (`/api/saveDraft`) and publish never call it. Phase 2 verifies this stays true and adds no new gate on save.
2. **Pro unused monthly credits → no rollover.** Monthly allotment resets to 200 at renewal (existing `resetCredits` behavior). Top-up credits are the exception: they live in the persistent pool (phase 5) and survive rollover.
3. **Pro→Free downgrade with live custom-domain sites → sites stay live, editing locked over-limit, 30-day grace.** Isolated as **phase 9, optional/late** — it does NOT block beta. Interim behavior (acceptable): no unpublish path exists anyway, so sites stay live; new publishes/domains are blocked by FREE limits naturally.
4. **LTD Stripe structure → ONE product ("Lessgo Founding LTD"), THREE prices ($69/$99/$129), cohort carried in each price's metadata (`cohort: 1|2|3`).** Justification: one webhook mapping (product id → LTD kind, price id → cohort + amount), prices are Stripe's native primitive for tiering a single offer, and the cohort counter derives from our own `UserPlan` rows (source of truth per spec) — Stripe structure stays dumb. Three separate products would triple env-var/webhook wiring for zero benefit.

## Design notes (read before implementing phases 4–6)

**Credit model = monthly allotment + persistent pool.** Today `UserUsage` (per `YYYY-MM` period) is seeded from `userPlan.creditsLimit` — pure monthly, no carryover, no top-up. New model:

- Add `creditPool Int @default(0)` on `UserPlan` (phase 4): a balance that never resets.
- Available credits = current-period `creditsRemaining` + `creditPool`. Deduct monthly first, then pool.
- FREE: `creditsLimit = 0` (monthly), pool seeded **20** at plan creation → one-time, never refills. (Note: `getUserUsage`'s lazy per-period seed from `creditsLimit` means `creditsLimit=0` is what makes "one-time" true — new periods seed 0 monthly, pool carries the balance.)
- PRO: `creditsLimit = 200` monthly (resets via existing webhook `resetCredits` AND via the lazy period seed), pool holds top-ups only.
- LTD: represented as `tier = PRO` + `lifetimeDeal = true` (+ `ltdCohort`, `ltdPricePaid`), `creditsLimit = 0` monthly, pool seeded **600**. No subscription → `invoice.payment_succeeded` never fires for them (existing `subscriptionId` guard in the webhook already protects this; phase 5 verifies).
- Comped Pro (naayom): `tier = PRO`, `creditsLimit = 200`, **no Stripe IDs, no pool workaround** — the lazy period seed in `getUserUsage` (creditSystem.ts:98-109) refills 200/mo automatically without any subscription or `resetCredits`. (Phase 8.)
- Top-up: `+100` to `creditPool`, no plan change. Works for any tier.

**Pool must be visible on EVERY read surface, not just the deduct path.** With FREE `creditsLimit=0`, any reader that reports raw `creditsRemaining`/`creditsLimit` shows "0 of 0" and `percentUsed = used/0` → NaN/Infinity. Phase 5 therefore updates all balance readers (`getCreditBalance`, `getUsageStats`, `/api/credits/balance`, `/api/billing/plan`, `/api/billing/usage`, billing dashboard) to expose `monthlyRemaining` + `poolRemaining` + `totalAvailable` and guard zero-limit division.

This avoids rewriting the period-row machinery: `getUserUsage`/`resetCredits` keep their semantics; check/deduct/read paths learn about the pool, plus one new `addPoolCredits()`.

**Ordering caveat:** after phase 1 lands but before phase 5, FREE briefly means "20 credits/month refilling". Beta isn't public yet; acceptable interim, called out here deliberately.

---

## Phase 1 — PLAN_CONFIGS rewrite (no gate)

**Goal:** make `src/lib/planManager.ts` config match the spec table; fix FREE>PRO inversions.

Steps:
1. FREE (name stays 'Launch' or rename 'Free' — implementer pick, keep `tier` key stable): `credits: 20`; limits `publishedPages: 1`, `draftProjects: 3`, `customDomains: 0`, `formSubmissions: 25`, `teamMembers: 1`; features: `customDomains: false`, `removeBranding: false`, `analytics: 'basic'`, rest false.
2. Add a code comment on `PLAN_CONFIGS.FREE.credits`: the display value 20 **intentionally diverges** from DB `creditsLimit=0` — the 20 lives in `UserPlan.creditPool` (one-time, phase 5), monthly limit is deliberately 0. Do NOT "fix" this back.
3. PRO: `price: { monthly: 29, annual: 24 }` (annual = per-month equivalent of $290/yr, matching the existing convention where `annual` < `monthly`; pricing page displays "$290/yr"); `credits: 200`; limits `publishedPages: 3`, `customDomains: 3`, `draftProjects: -1`, `formSubmissions: 1000`; features: `removeBranding/customDomains/formIntegrations/prioritySupport/trackingPixels: true`, `analytics: 'full'`, `exportHTML` unchanged.
4. Leave AGENCY/ENTERPRISE configs present but untouched (pricing page shows "Talk to us"; no self-serve path).
5. Leave trial helpers (`startTrial`/`endTrial`) in place but note in a comment they are unused (spec decision 3). Do NOT delete.
6. Update `src/lib/planManager.test.ts` expectations to the new numbers; add an explicit regression assertion: `PLAN_CONFIGS.FREE.limits.publishedPages < PLAN_CONFIGS.PRO.limits.publishedPages`.

**Files touched:**
- `src/lib/planManager.ts`
- `src/lib/planManager.test.ts`

**Verification:** `npx tsc --noEmit`; `npm run test:run` (planManager suite green; watch for other suites reading config).

---

## Phase 2 — Enforcement: badge, forms cap, limit verification (no gate)

**Goal:** the config from phase 1 is actually enforced at runtime.

Steps:
1. **Badge:** add `removeBranding?: boolean` to `generateStaticHTML()` options (`src/lib/staticExport/htmlGenerator.ts`); wrap the unconditional `renderLessgoBadge()` injection at ~L376 in a check (default = show badge, i.e. fail-closed to branded). In `src/app/api/publish/route.ts`, look up the owner's plan (`hasFeature(userId, 'removeBranding')`) and pass it through. Applies on publish/republish — existing published pages get the badge on next republish (acceptable; no backfill).
2. **Forms cap:** in `src/app/api/forms/submit/route.ts`, after resolving the published page's owner userId, count this-period `FormSubmission` rows for pages owned by that user (query via `publishedPage.userId` join; period = current month), then `checkLimit(ownerId, 'formSubmissions', count)`. Over limit → 429/403 with a stable error code; do NOT break the visitor-facing form UX silently (return JSON error the embedded handler can show). Keep the existing IP rate-limit.
3. **Published-sites limit:** no code change expected — `publish/route.ts` L200-214 already gates the create branch via `checkLimit('publishedPages', …)`; phase-1 numbers (FREE 1 / PRO 3) flow through. Verify by reading, add/extend a unit test if a publish-route test exists.
4. **Custom domains:** no code change expected — `/api/domains/add` already gates via `hasFeature('customDomains')` + `checkLimit('customDomains')`; FREE `customDomains: false` from phase 1 closes it. Verify by reading.
5. **AI-ops-only at 0 credits (decision 1):** verify `checkCredits` is called on AI routes only and NOT on `saveDraft`/`publish`; add a short comment in `creditSystem.ts` documenting the decision.

**Files touched:**
- `src/lib/staticExport/htmlGenerator.ts`
- `src/app/api/publish/route.ts`
- `src/app/api/forms/submit/route.ts`
- `src/lib/creditSystem.ts` (comment only)
- (tests) `src/app/api/forms/submit/route.test.ts` — create if absent; or nearest existing pattern
- **[scope-expansion, approved by orchestrator]** `src/lib/staticExport/renderPublishedExport.ts` — publish/route renders via this shared helper, not `generateStaticHTML` directly; thread `removeBranding` through its 3 call sites.
- **[scope-expansion]** `src/app/api/domains/verify-dns/route.ts` — same badge wiring on custom-domain go-live republish (uses `page.userId`).
- **NOTE:** do NOT use `hasFeature('removeBranding')` — it fails OPEN for boolean-false features (`false !== 'none'` → true), stripping the badge for FREE too. Use fail-closed `getPlanConfig(tier).features.removeBranding === true`. (Same footgun `hasTrackingPixels` avoids. Backlog: `hasFeature` fail-open affects all boolean-false checks app-wide.)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npm run build` (badge lives in the static-export path — published-CSS/assets pipeline must stay green); manual: publish as FREE → badge present; flip plan to PRO in dev DB → republish → badge gone. Dual-renderer note: badge is injected post-render in `htmlGenerator`, not a block — no `.tsx`/`.published.tsx` pair involved, but confirm the editor/preview never showed the badge (it shouldn't) so no parity drift.

---

## Phase 3 — Pricing page rebuild (no gate)

**Goal:** `src/app/pricing/page.tsx` shows the v2 story: Free / Pro / Founding LTD / Agency.

Steps:
1. Rewrite `PRICING_TIERS` (4 cards): **Free** ($0, 1 site on lessgo.site subdomain, 20 one-time credits, badge, basic analytics, forms ~25/mo, scrape+IVOC allowed); **Pro** ($29/mo · $290/yr, 3 sites + custom domains, 200 credits/mo, no badge, full features, 14-day money-back guarantee); **Founding LTD** (= Pro forever, 600-credit lifetime pool, "$69 → $99 → $129, 60 seats, never returns", cohort counter placeholder "X of 20 left" — static/stubbed until phase 7); **Agency** ("Talk to us", mailto/contact CTA, no self-serve).
2. Keep monthly/annual toggle (2-months-free framing). Pro checkout button keeps existing PRO flow (price IDs change in phase 6; page just calls the same route).
3. LTD card CTA: disabled/"Coming at launch" until phase 7 wires checkout — do not ship a dead buy button.
4. Rewrite FAQ + guarantee copy: no trials, free tier is the trial, 14-day refund, USD-only, credits explained (what costs what — pull numbers from `CREDIT_COSTS`), "never name an AI model" (say "best available model").
5. Product name in copy = **"Lessgo AI"** (memory rule), badge string stays "Made with Lessgo" per spec table.

**Files touched:**
- `src/app/pricing/page.tsx`

**Verification:** `npx tsc --noEmit`; `npm run build`; manual visual pass at `/pricing` (4 cards, toggle, FAQ). No tests exist for this page; don't add.

---

## Phase 4 — Schema: UserPlan LTD + credit pool — **HUMAN GATE (schema)**

**Goal:** persistence for LTD identity and the persistent credit pool.

**GATE PROTOCOL (hard stop):** before touching `prisma/schema.prisma`, write a ping to `docs/temp/message.md` describing the exact columns + migration SQL and **STOP** until the user signs off. After sign-off, migration flow is **`prisma migrate diff` → `prisma db execute` → `prisma migrate resolve --applied`** — **NEVER `prisma migrate dev`** (dev DB has drift). Migration folder timestamp MUST sort AFTER data-capture's migration.

Steps:
1. Add to `UserPlan`: `lifetimeDeal Boolean @default(false)`, `ltdCohort Int?`, `ltdPricePaid Int?` (cents), `creditPool Int @default(0)`.
2. Generate migration SQL via `prisma migrate diff --from-schema-datasource --to-schema-datamodel`, review (4 additive columns, no destructive ops), apply via `db execute`, mark with `migrate resolve --applied`.
3. `npx prisma generate`.
4. No code consumes the columns yet (phase 5 does) — keep this phase schema-only so the gate is small and reviewable.

**Files touched:**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_pricing_v2_ltd_pool/migration.sql` (new)
- `docs/temp/message.md` (gate ping)

**Verification:** user sign-off recorded; `npx prisma generate` clean; `npx tsc --noEmit`; `npm run test:run` (no behavior change expected); confirm migration timestamp > data-capture's migration folder.

---

## Phase 5 — Credit semantics: one-time / pool / top-up logic + ALL read surfaces (no gate; depends on 4)

**Goal:** implement the credit model from Design notes — write path AND every balance-read surface.

Steps:
1. `src/lib/creditSystem.ts` — write/check path:
   - `checkCredits()`: available = period `creditsRemaining` + `userPlan.creditPool`.
   - `deductCredits()`: **explicitly replace the guard at ~L183** — it currently throws when `creditsRemaining < creditsToDeduct`, which for FREE (`creditsRemaining=0`) throws BEFORE the pool is ever consulted. New guard = combined check `creditsRemaining + creditPool >= creditsToDeduct`; then inside the existing `$transaction`, drain monthly first, decrement `UserPlan.creditPool` for the remainder. `UsageEvent` records total as today. Same treatment in `consumeCredits()`.
   - New `addPoolCredits(userId, amount, reason)`: atomic increment on `creditPool` + `UsageEvent` ledger entry (new `UsageEventType` e.g. `CREDIT_TOPUP` / `LTD_GRANT`).
   - `resetCredits()`: untouched — must never touch `creditPool`. Add a test proving pool survives a reset.
2. `src/lib/creditSystem.ts` — read path:
   - `getCreditBalance()` (~L430): return `monthlyRemaining`, `poolRemaining`, `totalAvailable` (= sum), and guard the `percentUsed` division when `creditsLimit === 0` (return 0 or null, never NaN/Infinity).
   - `getUsageStats()` (~L458): same pool-aware totals + zero-limit guard.
3. API read surfaces — expose the new shape:
   - `src/app/api/credits/balance/route.ts`: return `monthlyRemaining`/`poolRemaining`/`totalAvailable` (keep old fields for back-compat if anything else reads them — grep consumers).
   - `src/app/api/billing/plan/route.ts` (~L25 returns raw `creditsLimit`): include pool + total so FREE doesn't render "0 credits".
   - `src/app/api/billing/usage/route.ts`: pool-aware totals.
4. UI: `src/app/dashboard/billing/page.tsx` — render pool distinctly ("20 one-time credits" for FREE, "600 lifetime credits" for LTD, "200/mo + N bonus" for topped-up PRO); no NaN%/∞% progress bars when monthly limit is 0.
5. `src/lib/planManager.ts`:
   - Plan creation/default path for FREE: `creditsLimit = 0`, seed `creditPool = 20` (one-time). Audit `getUserPlan()`'s lazy-create and any signup hook that creates `UserPlan` — the seed must happen exactly once (creation), never on read.
   - PRO upgrade (`upgradePlan`): `creditsLimit = 200`, pool untouched.
   - New `grantLifetimeDeal(userId, cohort, pricePaidCents)`: tier=PRO, `lifetimeDeal=true`, `ltdCohort`, `ltdPricePaid`, `creditsLimit=0`, `addPoolCredits(600)`. Used by phase 6 webhook + phase 8 admin.
   - `downgradePlan(FREE)`: sets `creditsLimit=0`; does NOT re-seed the 20 pool (no farming free credits via up/down cycles).
6. Webhook safety check (read-only this phase): confirm `handlePaymentSucceeded`'s `subscriptionId` guard means LTD users (no subscription) never get `resetCredits`; add comment.
7. Tests: FREE no-refill across period rollover (new period row seeds `creditsRemaining=0`, pool persists); mixed deduct (monthly then pool) including the FREE case (monthly=0, pool>0 → deduct succeeds where the old L183 guard would have thrown); pool survives `resetCredits`; LTD grant = 600 available; `getCreditBalance` for FREE returns `totalAvailable=20` with no NaN/Infinity.

**Files touched:**
- `src/lib/creditSystem.ts`
- `src/lib/planManager.ts`
- `src/lib/planManager.test.ts`
- `src/lib/creditSystem.test.ts` (create if absent)
- `src/app/api/credits/balance/route.ts`
- `src/app/api/billing/plan/route.ts`
- `src/app/api/billing/usage/route.ts`
- `src/app/dashboard/billing/page.tsx`
- `src/app/api/stripe/webhooks/route.ts` (comment only)
- **[scope-addition, orchestrator-approved]** `src/components/billing/CreditBadge.tsx` — read surface showing "0/0" for FREE; now reads `totalAvailable`/pool shape.

**Verification:** `npx tsc --noEmit`; `npm run test:run` (all new test scenarios green); manual dev checks: **FREE account → `/api/credits/balance` shows 20 (not 0)** and billing dashboard shows "one-time credits" with sane percentages; burn credits → AI op blocked at 0 total, save still works (decision 1).

---

## Phase 6 — Stripe test-mode: LTD, top-ups, Pro changes — **HUMAN GATE (Stripe)**

**Goal:** one-time-payment commerce for LTD + top-ups; Pro subscription updated.

**GATE PROTOCOL:** ALL Stripe work is **TEST MODE ONLY** — no live keys, no live products — until a separate, later human gate flips to live. The human gate here covers: (a) user creates test-mode products/prices per decision 4 (1 LTD product / 3 prices w/ `cohort` metadata; 1 top-up product / $9 price) and supplies the price IDs, (b) user reviews webhook grant logic before merge. Ping via `docs/temp/message.md` and stop for the IDs before wiring env.

Steps:
1. `src/lib/stripe.ts`: add `STRIPE_PRICES` entries `LTD_COHORT_1/2/3`, `TOPUP_100` from new env vars; add `createOneTimeCheckoutSession()` (`mode: 'payment'`, metadata `{ userId, kind: 'ltd'|'topup', cohort? }`).
2. New route `src/app/api/stripe/create-ltd-session/route.ts`: auth'd; server-side sold-out check — current cohort = lowest cohort with `count(UserPlan where lifetimeDeal && ltdCohort = c) < 20`; all full → 410 sold-out; reject if caller already `lifetimeDeal`; create payment session for that cohort's price. (Race at the 20th seat: re-check in webhook; overflow → grant anyway + flag for manual refund — 60-seat scale, keep it simple.)
3. New route `src/app/api/stripe/create-topup-session/route.ts`: auth'd; payment session for `TOPUP_100`.
4. Webhook `src/app/api/stripe/webhooks/route.ts`: in `checkout.session.completed`, branch on `session.mode === 'payment'` + `metadata.kind`: `ltd` → `grantLifetimeDeal(userId, cohort, amount_total)`; `topup` → `addPoolCredits(userId, 100, 'topup')`.
5. **Webhook idempotency (concrete mechanism):**
   - LTD: dedupe via `lifetimeDeal === true` check before grant (natural once-only flag).
   - Top-ups are repeatable, so that guard does NOT apply. Mechanism: persist the Stripe `session.id` (and `event.id` for audit) in the `UsageEvent.context` JSON written by `addPoolCredits` (e.g. `{ stripeSessionId, stripeEventId }`); BEFORE granting, query `UsageEvent` for `eventType = CREDIT_TOPUP` with matching `stripeSessionId` in context — found → skip grant, return 200. No unique constraint exists on `UsageEvent`, so this is a read-then-write dedupe; Stripe retries are seconds apart and volume is tiny — acceptable at this scale.
6. Pro subscription changes: `create-checkout-session/route.ts` — remove `trialDays: 14` (decision: no trials, refund instead); `stripe.ts` `createCheckoutSession()` drops `subscription_data.trial_period_days` when undefined. New $29/$290 **test-mode** price IDs go in the existing `STRIPE_PRO_MONTHLY/ANNUAL_PRICE_ID` env vars (env values only — no code change beyond trial removal).
7. Document new env vars in `.env.example` (or wherever Stripe env is documented — implementer locates; if none, add comment block in `stripe.ts`).
8. Kill-switch: gate LTD/top-up routes behind env flag `PRICING_V2_COMMERCE=true` (default off) so merge ≠ exposure.

**Files touched:**
- `src/lib/stripe.ts`
- `src/app/api/stripe/create-ltd-session/route.ts` (new)
- `src/app/api/stripe/create-topup-session/route.ts` (new)
- `src/app/api/stripe/create-checkout-session/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `.env.example` (or `stripe.ts` env comment)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual test-mode flow with Stripe test cards + `stripe listen` CLI: LTD purchase → `lifetimeDeal=true`, cohort set, pool=600, no subscription; top-up → pool +100; **replay the same `checkout.session.completed` event (stripe CLI resend) for BOTH ltd and topup → no double grant, pool unchanged on replay**; 20-seat sold-out returns 410; Pro checkout has no trial. **All against test keys.**

---

## Phase 7 — Cohort counter + purchase CTAs on pricing page (no gate; depends on 6)

**Goal:** live "N of 20 left" counter and working LTD/top-up buttons.

Steps:
1. New public route `src/app/api/billing/ltd-availability/route.ts`: returns per-cohort remaining seats + current price (source of truth = `UserPlan` lifetimeDeal counts per spec decision 2). Cache-friendly (revalidate ~60s); no auth; no PII.
2. `src/app/pricing/page.tsx`: fetch availability, render counter ("14 of 20 left at $69"), wire LTD CTA → `create-ltd-session`, sold-out cohort → show next cohort/price, all sold → "Founding closed — never returns". Add top-up mention/CTA where it fits (billing page is the natural home; pricing page = footnote line). Respect `PRICING_V2_COMMERCE` flag: off → phase-3 placeholder behavior.
3. Signed-in vs signed-out: signed-out LTD click → sign-up redirect then back (reuse existing Pro-checkout pattern from the page's L122 handler).

**Files touched:**
- `src/app/api/billing/ltd-availability/route.ts` (new)
- `src/app/pricing/page.tsx`

**Verification:** `npx tsc --noEmit`; `npm run build`; manual: counter reflects a test-mode LTD purchase from phase 6; sold-out rendering forced by temporarily seeding 20 rows in dev DB.

---

## Phase 8 — Admin comped-Pro + naayom/Kundius migration — **HUMAN GATE (prod data)**

**Goal:** repeatable comped/LTD grant path; grandfather the two existing customers.

Steps:
1. New route `src/app/api/admin/grant-plan/route.ts` gated by `requireAdmin()` (`src/lib/admin.ts` pattern): body `{ userId | email, grant: 'comped_pro' | 'ltd', cohort?, pricePaid? }`.
   - `comped_pro` → `tier=PRO`, `status='comped'`, **no Stripe IDs**, `creditsLimit=200`. This refills 200/mo automatically WITHOUT a subscription: `getUserUsage` (creditSystem.ts:98-109) lazily seeds each new period's `UserUsage` row from `userPlan.creditsLimit` — no `resetCredits`/webhook involvement needed. (No pool workaround; pool stays 0.)
   - `ltd` → `grantLifetimeDeal()` from phase 5 (`creditsLimit=0`, pool 600).
2. **HUMAN GATE:** running the grants against prod (naayom = comped Pro; Kundius = `lifetimeDeal` Pro, `ltdPricePaid` = 30000 cents, `ltdCohort = 0` = pre-cohort bespoke, so the public counter — which counts cohorts 1–3 — ignores it). Ping `docs/temp/message.md` with the exact two calls; user executes/approves. Building the route itself is not gated.
3. Note the spec's bespoke offer (custom template + lifetime Pro from $300) is served by the same `ltd`/`ltdCohort=0` path — no extra machinery.

**Files touched:**
- `src/app/api/admin/grant-plan/route.ts` (new)
- `docs/temp/message.md` (gate ping for prod execution)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; dev-DB dry run of both grant shapes — comped user's NEXT-period `UserUsage` row seeds 200 (proves the subscription-free auto-refill); prod execution only after user sign-off; after prod run, verify Kundius invisible to cohort counter.

---

## Phase 9 — OPTIONAL / DEFERRED: Pro→Free downgrade grace (does NOT block beta; re-plan + re-gate before implementing)

**Goal:** decision 3 — downgraded Pro with live custom-domain sites: sites stay live, editing locked over-limit, 30-day grace.

**Status: deliberately deferred.** At beta launch there are ~0 Pro subscribers who can churn, and no unpublish path exists (sites stay live by default already). This phase is a sketch only — when picked up it MUST be re-planned in detail and re-gated (schema gate applies if any new column is added; prefer the no-schema variant below).

Steps (sketch — refine at pickup):
1. On `handleSubscriptionDeleted` → grace anchor. Prefer deriving from Stripe `currentPeriodEnd` (no schema change); a `downgradedAt` column would inherit the **phase-4 schema human-gate protocol**.
2. Edit/publish routes: if user over FREE limits, block edits to over-limit projects after grace expiry; sites remain served (blob/KV untouched).
3. Grace-period messaging in dashboard.

**Files touched (provisional):**
- `src/app/api/stripe/webhooks/route.ts`
- `src/app/api/publish/route.ts`
- `src/app/api/saveDraft/route.ts`
- `src/components/dashboard/` (banner component TBD)

**Verification:** TBD at pickup; `npx tsc --noEmit` + `npm run test:run` minimum.

---

## Phase sequencing summary

- **1 → 2 → 3**: ungated, land immediately, independent of schema/Stripe.
- **4 (GATE)** → **5**: schema then semantics + read surfaces.
- **6 (GATE)** → **7**: Stripe test-mode then UI wiring.
- **8 (GATE on prod execution)**: anytime after 5.
- **9**: optional, deferred, re-plan + re-gate before implementation.

## Unresolved questions

1. FREE tier display name: keep 'Launch' or rename 'Free'?
2. Comped-Pro credit shape: plan now recommends `creditsLimit=200` monthly auto-refill (lazy period seed, no Stripe needed) — confirm, or prefer one-time pool instead?
3. Kundius `ltdCohort = 0` (hidden from public counter) — ok?
4. Pro annual config as `annual: 24`/mo-equivalent (displays $290/yr) — ok, or store 290 and change display convention?
5. Top-up CTA placement: billing page only, or also pricing page footnote?
6. `PRICING_V2_COMMERCE` kill-switch default-off at merge — confirm.
7. Existing FREE users with old 30-credit monthly rows: migrate to 20-pool, or leave until natural rollover? (few users; plan assumes leave)
