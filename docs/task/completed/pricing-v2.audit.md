# Pricing v2 — Implementation Audit

## Phase 1 — PLAN_CONFIGS rewrite

**Files changed**
- `src/lib/planManager.ts` (worktree feature/pricing-v2)
- `src/lib/planManager.test.ts` (worktree feature/pricing-v2)

**planManager.ts**
- FREE: renamed `name` 'Launch' → 'Free'; `credits` 30 → 20; limits `publishedPages` 20→1, `customDomains` 1→0, `formSubmissions` 100→25 (draftProjects 3 / teamMembers 1 unchanged); feature `customDomains` true→false. Added block comment on `credits` documenting the intentional divergence from DB `creditsLimit=0` (20 lives in `creditPool`, later phase — do not "fix").
- PRO: `price.monthly` 39→29, `price.annual` 29→24 ($290/yr equiv, annual<monthly convention preserved); limit `publishedPages` 10→3 (customDomains 3, draftProjects -1, formSubmissions 1000, credits 200 already matched). `exportHTML` left unchanged (false).
- AGENCY / ENTERPRISE: untouched.
- `startTrial` / `endTrial`: left in place; added comments marking them unused per spec decision 3. Not deleted.

**planManager.test.ts**
- Added `PLAN_CONFIGS pricing v2 numbers` describe block asserting the new FREE and PRO numbers, plus the required regression assertion `FREE.limits.publishedPages < PRO.limits.publishedPages`.
- Existing trackingPixels tests unchanged (still green).

**Verification**
- `npx tsc --noEmit`: clean, no errors.
- `npx vitest run src/lib/planManager.test.ts`: 10 passed.
- `npm run test:run` (full): 147 files passed / 1 skipped; 2254 tests passed / 3 skipped. No other suite reading PLAN_CONFIGS broke.

**Deviations / notes**
- Picked `name: 'Free'` (plan allowed either 'Launch' or 'Free'). `tier` key stayed `PlanTier.FREE`.
- No out-of-scope files needed. DB `creditsLimit` seeding / creditPool logic intentionally NOT touched (later phases).

**Open risks**
- Interim state (called out in plan): between phase 1 and phase 5, FREE `credits:20` config flows into `createDefaultPlan` writing `creditsLimit=20` → briefly "20/mo refilling" until schema/pool phases land. Acceptable per plan (beta not public).

---

## Phase 2 — Enforcement (badge, forms cap, limit verification)

**Files changed**
- `src/lib/staticExport/htmlGenerator.ts`
- `src/app/api/forms/submit/route.ts`
- `src/app/api/forms/submit/route.test.ts`
- `src/lib/creditSystem.ts` (comment only)

**Per file**

- `htmlGenerator.ts`: added `removeBranding?: boolean` to `StaticHTMLOptions` (fail-closed: default false ⇒ badge shown). Threaded through `buildHTMLDocument` params; badge line is now `${removeBranding ? '' : renderLessgoBadge()}`. Inert until a caller passes `true`.
- `forms/submit/route.ts`: imported `checkLimit`. Inside the `if (userId)` try, before form-config lookup/create, counts the owner's current-UTC-month `FormSubmission` rows (`userId` = page owner) and calls `checkLimit(userId, 'formSubmissions', count)`. Over limit ⇒ 429 `{ error: 'form_submission_limit_reached' }` (stable code the embedded handler can surface). Per-IP rate-limit (`withFormRateLimit`) untouched.
- `forms/submit/route.test.ts`: extended mocks (`formSubmission.count`, `@/lib/planManager` `checkLimit`); added a 3-test `describe` for the cap (month-window query shape, 429-over-limit + no create, under-limit proceeds). 7 tests pass.
- `creditSystem.ts`: doc comment on `checkCredits` recording decision 1 — the gate + `requireCredits`/`consumeCredits` wrappers are invoked ONLY by AI-spend routes; `saveDraft`/`publish` never call it; do not add a credit gate to save/publish. No behavior change.

**Steps 3 & 4 — verify-only (NO code change)**
- Step 3 (published-sites limit): `publish/route.ts` L200-214 already gates the create branch via `checkLimit('publishedPages', currentPublishedCount)` → 403. Phase-1 numbers (FREE 1 / PRO 3) flow through `getUserPlan`'s `publishedPagesLimit`. No publish-route test file exists → none added (plan said extend only if present).
- Step 4 (custom domains): `src/app/api/domains/add/route.ts` L55 `hasFeature(userId, 'customDomains')` + L62 `checkLimit('customDomains')`. Phase-1 `customDomains:false`/`customDomains:0` close FREE. Read only (file not in scope).
- Step 5 (AI-ops-only): grep of `requireCredits`/`consumeCredits`/`checkCredits` under `src/app/api` = AI routes only (regenerate-section/-element, v2/scrape-website, v2/understand, audience {product,service}/{strategy,generate-copy}, generate-privacy-policy, outreach). `saveDraft` + `publish` absent. Decision 1 holds.

**Deviations**
- `checkLimit` fails closed (`allowed:false`) on an internal plan-lookup error — a transient DB error could 429 a legit submission (lost lead). Kept existing `checkLimit` semantics (conservative per plan wording); noted as a risk. `getUserPlan` lazily creates a plan so this is rare.
- `forms/submit` cap uses UTC calendar-month window (`Date.UTC(year, month, 1)`), matching a "this-current-month" reading; no per-plan billing-anchor alignment (submissions cap is a soft abuse guard, not credit accounting).

**BLOCKER — badge wiring (step 1) is INCOMPLETE, needs an out-of-scope file**
- The plan's step 1 says `publish/route.ts` should `hasFeature(userId,'removeBranding')` and pass it into `generateStaticHTML`. In reality `publish/route.ts` does NOT call `generateStaticHTML` directly — it calls `renderPublishedExport()` (`src/lib/staticExport/renderPublishedExport.ts`), which builds the `generateStaticHTML` options at 3 call sites (root, subpages, locale docs) and is ALSO the shared path for custom-domain go-live (`domains/verify-dns`).
- To thread `removeBranding` end-to-end I would need to add a field to `RenderPublishedExportInput` and pass it at all 3 call sites, then compute `hasFeature` in `publish/route.ts` (and ideally verify-dns). `renderPublishedExport.ts` is NOT in Phase 2's Files-touched list → per hard rules I did NOT edit it or `publish/route.ts`. The `htmlGenerator.ts` option is in place and safe (defaults to branded), so no regression — badges still render on every publish. Suppression is simply not yet activated.
- Recommendation to orchestrator: add `src/lib/staticExport/renderPublishedExport.ts` (and confirm `publish/route.ts`) to the scope, OR run a small follow-up phase, to complete badge suppression. Note the verify-dns republish path is Pro-only (custom domains) — if only publish/route.ts is wired and verify-dns isn't, a custom-domain go-live republish would re-add the badge for a Pro page, so verify-dns should be wired too.

**Verification**
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 2256 passed / 1 failed — the failure is ONLY the pre-existing `src/lib/i18n/i18nHonesty.test.ts` 5s-timeout flake; re-ran it in isolation → 15/15 pass. Forms-submit suite: 7/7.
- `npm run build`: succeeded (published-CSS/assets pipeline green; `/pricing` and `/p/*` static-export paths build).

**Dual-renderer / parity**
- Badge is injected post-render in `htmlGenerator` (not a block component) → no `.tsx`/`.published.tsx` pair; editor/preview never rendered a badge, so no parity drift.

### Phase 2 — badge wiring completed (approved scope expansion)

Orchestrator approved adding 3 files to Phase 2 to make badge suppression work end-to-end.

**Additional files changed**
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/app/api/publish/route.ts`
- `src/app/api/domains/verify-dns/route.ts`

**Per file**
- `renderPublishedExport.ts`: added `removeBranding?: boolean` to `RenderPublishedExportInput`, destructured it, and threaded it into `generateStaticHTML` options at ALL 3 call sites (root, subpages, locale docs). Absent/false ⇒ badge shown (fail-closed).
- `publish/route.ts`: resolve the OWNER's (`userId`) `removeBranding` flag before `renderPublishedExport` and pass it through.
- `verify-dns/route.ts`: same resolution for the custom-domain go-live republish, using the OWNER `page.userId` (not the acting admin's id), passed into `renderPublishedExport`.

**IMPORTANT deviation — did NOT use `hasFeature('removeBranding')`**
The plan/coordinator specified `hasFeature(userId, 'removeBranding')`, but `hasFeature` FAILS OPEN for boolean-false features: its test is `x === true || x !== 'none'`, and for a boolean `false`, `false !== 'none'` is `true` ⇒ returns `true`. So `hasFeature('removeBranding')` would return true for FREE and STRIP THE BADGE FOR EVERYONE — the exact opposite of the spec ("badge on FREE, gone on PRO/LTD"). This is the same documented footgun that `hasTrackingPixels` was created to avoid (see planManager.ts comment ~L425-431). (The custom-domain `hasFeature('customDomains')` gate survives only because a separate `checkLimit('customDomains', 0)` closes FREE; the badge has no such backstop.)

Instead I used the config-derived, fail-closed pattern (same as `hasTrackingPixels`): `getPlanConfig(ownerPlan.tier).features.removeBranding === true`, wrapped in try/catch defaulting to `false` (branded). `planManager.ts` is NOT in scope, so I did NOT add a helper there — the resolution is inlined in the two route files with an explanatory comment. Recommend a future `hasRemoveBranding()` helper in planManager.ts to DRY this, but that's out of this phase's scope.

**Re-verification (full)**
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 2257 passed / 3 skipped, 0 failures (the i18n 5s-timeout flake did not recur this run; it remains the only known flake). Forms-submit cap suite still 7/7.
- `npm run build`: succeeded (published-CSS/assets + static-export paths green).

**Net Phase 2 result:** badge now suppressed end-to-end for Pro/LTD owners on publish/republish AND custom-domain go-live; FREE keeps the badge; fail-closed to branded on any lookup error. Forms cap, credit-gate comment, and limit verifications unchanged from the earlier Phase 2 work above.

---

## Phase 3 — Pricing page rebuild

**Files changed:**
- `src/app/pricing/page.tsx` (rewrite)

### What changed
Rewrote `PRICING_TIERS` from the old 4-card set (Launch/Pro/Scale/Custom) to the v2 story: **Free / Pro / Founding LTD / Agency**. Grid stays 4-up. Display-only work — no API routes, planManager, creditSystem, or Stripe touched.

- **Free** ($0 forever): 1 site on lessgo.site subdomain, 20 one-time credits (no monthly refill), scrape + audience research included, basic analytics, up to 25 form submissions/mo. Limits shown: "Made with Lessgo" badge, no custom domains, no integrations. CTA "Start free" → `/dashboard` if signed in, else `/sign-up?redirect=/dashboard`.
- **Pro** (popular): monthly view "$29/month" + "or $290/yr (2 months free)"; annual view "$290/year" + "2 months free vs. monthly". 200 credits/mo, 3 sites + custom domains, no badge, full analytics, integrations, testimonials + blog, 14-day money-back guarantee. CTA "Upgrade to Pro" keeps the EXISTING flow — same `POST /api/stripe/create-checkout-session` with `{ tier: 'PRO', billingInterval }`. Untouched signed-out redirect to `/sign-in?redirect=/pricing`.
- **Founding LTD**: one-time "$69" + note "$69 → $99 → $129 as seats fill" + static seat counter. 600-credit lifetime pool, Pro-forever framing, "60 seats total, never comes back". CTA **disabled** ("Coming at launch") — greyed/`cursor-not-allowed`, `handleCta` no-ops for LTD. Wiring deferred to phase 7.
- **Agency**: "Talk to us"; CTA opens `mailto:hello@lessgo.ai` with subject "Lessgo AI — Agency plan". No self-serve.

Toggle kept (2-months-free framing; badge changed from "25% off" to "2 mo free"). Top-up is a footnote line only ("$9 for 100 credits … from your billing dashboard") — no button, per plan.

FAQ fully rewritten: no trials (Free is the trial), credits explained with a per-op cost table pulled from `CREDIT_COSTS` (full page 10 / scrape 1 / research 3 / section 2 / element 1), Pro no-rollover (top-ups carry over), 14-day refund, Founding LTD explainer, "best available model" (never names a model), USD-only, cancel-anytime. Product name in prose = "Lessgo AI"; badge string kept as "Made with Lessgo" per spec.

### Copy decisions made (in-scope)
- **Cohort placeholder text** = `"20 of 20 left"` (constant `LTD_SEATS_LEFT_PLACEHOLDER`). Conservative/static — no live counter until phase 7; chose full-inventory framing so nothing implies false scarcity pre-launch.
- **Agency contact email** = `hello@lessgo.ai` (constant `AGENCY_CONTACT_EMAIL`). Chose a generic inbox on the product domain; adjust if a dedicated address is preferred.
- **Credit cost table** hardcoded as a display mirror of `CREDIT_COSTS` (labels + numbers) with a comment noting manual sync — the page is a client component and importing the server-side lib into static copy adds no value; numbers match creditSystem.ts.
- **Annual display**: shows `$290/year` (spec's stated yearly price) rather than deriving from the config's per-month `annual` value, matching the spec Tiers table verbatim.

### Deviations
- Removed the old `comingSoon` badge pattern; LTD instead uses the disabled-CTA state ("Coming at launch") per plan step 3. No dead/live buy button shipped.

### Verification
- `npx tsc --noEmit`: clean.
- `npm run build`: succeeded; `/pricing` prerendered as static (○), 5.33 kB.
- No tests exist for this page; none added (per plan).

### Open risks
- LTD CTA is disabled pending **phase 7** (live counter + checkout wiring). Seat count is a static placeholder.
- Credit-cost table is a manual mirror of `CREDIT_COSTS` — if those numbers change, this copy must be updated by hand.
- `hello@lessgo.ai` agency inbox assumed; confirm it exists/routes.

---

## Phase 4 — Schema: UserPlan LTD + credit pool

**Files changed:**
- `prisma/schema.prisma` — added 4 additive columns to `UserPlan`.
- `prisma/migrations/20260712120000_pricing_v2_ltd_pool/migration.sql` (new).

**Schema change:** added to `UserPlan` model only:
```
lifetimeDeal  Boolean @default(false)
ltdCohort     Int?
ltdPricePaid  Int? // cents
creditPool    Int     @default(0)
```

**Migration method (deviation from plan wording, honored orchestrator hard condition):**
The plan and orchestrator instruction named `prisma migrate diff --from-migrations ./prisma/migrations ...`. That command requires a `--shadow-database-url` to replay the migrations dir; no shadow DB is configured (`.env`/`.env.local` have none, and pointing a shadow at the Neon dev DB would be destructive). To satisfy the underlying intent — drift-free, additive-only SQL — I diffed schema-to-schema instead: committed `HEAD:prisma/schema.prisma` → edited `prisma/schema.prisma` via `prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel <new> --script`. This touches NO database, so dev-DB out-of-band drift cannot leak in (strictly safer than both `--from-migrations` and `--from-schema-datasource`), and produces identical additive SQL. Abort-guard applied to the output.

**Abort-guard: PASSED.** Emitted SQL is exactly 4 `ADD COLUMN`s on `UserPlan`, no `DROP`/`RENAME`/`CREATE TABLE`/`ALTER ... DROP`, no extra columns:
```sql
-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "creditPool" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lifetimeDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ltdCohort" INTEGER,
ADD COLUMN     "ltdPricePaid" INTEGER;
```

**Apply results:**
- `prisma db execute --file .../migration.sql` → `Script executed successfully.` (exit 0).
- `prisma migrate resolve --applied 20260712120000_pricing_v2_ltd_pool` → `Migration ... marked as applied.` (exit 0), against Neon `neondb` (dev).
- `prisma generate` → clean (client now has the 4 fields).

**Verification:**
- `npx tsc --noEmit` → clean (exit 0).
- `npm run test:run` → 2256 passed, 1 failed = known i18n 5s-timeout flake only; re-ran `src/lib/i18n/i18nHonesty.test.ts` isolated → 15/15 passed. No behavior change from this phase.
- New migration folder `20260712120000_pricing_v2_ltd_pool` sorts LAST in `prisma/migrations` (after `20260710202106_cold_outreach`).

**Deviations:** migration-diff method changed to schema-to-schema (see above); strictly safer, same output. No `.ts` touched (schema-only, as required).

**Open risks:** none for this phase. Phase 5 consumes the columns.

---

## Phase 5 — Credit semantics (one-time / pool / top-up + read surfaces)

**Files changed:**
- `src/lib/creditSystem.ts`
- `src/lib/planManager.ts`
- `src/lib/creditSystem.test.ts` (new)
- `src/lib/planManager.test.ts`
- `src/app/api/credits/balance/route.ts`
- `src/app/api/billing/plan/route.ts`
- `src/app/api/billing/usage/route.ts`
- `src/app/dashboard/billing/page.tsx`
- `src/app/api/stripe/webhooks/route.ts` (comment only)

### What changed, per file

**`src/lib/creditSystem.ts`**
- New `UsageEventType` values `CREDIT_TOPUP='credit_topup'`, `LTD_GRANT='ltd_grant'` (DB `eventType` is a plain String → no migration).
- `checkCredits()`: available = period `creditsRemaining` + `userPlan.creditPool`; `remaining` now reports the combined total.
- `deductCredits()`: replaced the old guard (`usage.creditsRemaining < creditsToDeduct`, which threw for FREE/LTD before the pool was consulted) with a combined guard `creditsRemaining + creditPool >= creditsToDeduct`. Inside the existing `$transaction` it drains monthly FIRST (`fromMonthly = min(remaining, deduct)`), takes the remainder from the pool via `creditPool: { decrement }`, and returns total-available remaining. `creditsUsed` still records the full deducted amount.
- `consumeCredits()`: unchanged — it delegates to `checkCredits` + `deductCredits`, so it inherits pool awareness (verified by tests).
- New `addPoolCredits(userId, amount, reason, metadata?)`: atomic `creditPool: { increment }` + a `UsageEvent` ledger row (`creditsUsed = -amount` to denote a grant; `metadata` carries optional Stripe dedupe keys for phase 6).
- `getCreditBalance()`: added `monthlyRemaining`, `poolRemaining`, `totalAvailable`; `percentUsed` guarded (`creditsLimit > 0 ? … : 0`). Legacy fields (`used/remaining/limit/percentUsed/daysUntilReset/nextResetDate/tier`) kept for back-compat.
- `getUsageStats()`: `credits` block gains `percentUsed` (guarded), `monthlyRemaining`, `poolRemaining`, `totalAvailable`.
- `resetCredits()`: **untouched** — still only upserts `UserUsage`; never reads/writes `creditPool`. Proven by a test asserting `prisma.userPlan.update` is not called.

**`src/lib/planManager.ts`**
- `createDefaultPlan()` (FREE creation, the ONLY seed site): writes `creditsLimit: 0` + `creditPool: config.credits` (20) — one-time seed.
- `upgradePlan()`: PRO writes `creditsLimit: config.credits` (200); `creditPool` deliberately not written (top-ups survive upgrade).
- `downgradePlan()`: FREE forces `creditsLimit: 0`; does NOT touch `creditPool` (no free-credit farming via up/down cycles).
- New `grantLifetimeDeal(userId, cohort, pricePaidCents)`: tier=PRO + `lifetimeDeal=true` + `ltdCohort`/`ltdPricePaid` + PRO feature limits + `creditsLimit: 0`, then `addPoolCredits(userId, 600, LTD_GRANT, {cohort, pricePaidCents})`. Uses a dynamic `import('./creditSystem')` to avoid a top-level circular dependency (creditSystem imports getUserPlan from planManager).

**Read-shape (new fields exposed):**
- `getCreditBalance` / `/api/credits/balance`: `monthlyRemaining`, `poolRemaining`, `totalAvailable` (+ legacy fields, `percentUsed` guarded).
- `getUsageStats` / `/api/billing/usage`: `credits.{monthlyRemaining, poolRemaining, totalAvailable, percentUsed}`. The null-default branch now derives from the plan (pool-aware) instead of hardcoded 30/30.
- `/api/billing/plan`: added `creditPool`, `lifetimeDeal`, `ltdCohort`.
- `dashboard/billing/page.tsx`: credit label per tier ("20 one-time credits" FREE / "600 lifetime credits" LTD / "200/mo + N bonus" topped-up PRO); big number = `totalAvailable`; monthly progress bar only rendered when `monthlyLimit > 0` (no NaN%/∞% bar for pool-only tiers).

**`src/app/api/stripe/webhooks/route.ts` (comment only):** documented that the `!subscriptionId` early-return in `handlePaymentSucceeded` protects LTD/top-up (one-time, no subscription) buyers from `resetCredits`, which must never touch the pool.

### Confirmations
- **resetCredits does NOT touch the pool** — code unchanged + a test proves `userPlan.update` is never called during a reset.
- **Q7 respected** — only the plan-CREATION path (`createDefaultPlan`) sets `creditsLimit=0`+pool=20; no bulk migration of existing rows. Regression test proves an existing FREE row (`creditsRemaining=30`, `creditPool=0`) still resolves to 30 available (additive check leaves it generous, not bricked).

### Tests
- `npx tsc --noEmit`: clean.
- `npx vitest run src/lib/creditSystem.test.ts src/lib/planManager.test.ts`: 24 passed.
- Full `npm run test:run`: 2270 passed, 3 skipped, 1 failed — the failure was ONLY the known i18n 5s-timeout flake (`i18nHonesty.test.ts`), which passes when re-run isolated (15/15). No other regressions.
- New scenarios covered: checkCredits combines monthly+pool; FREE (monthly 0, pool 20) deduct succeeds where old guard threw; mixed monthly-then-pool; monthly-only (no pool write); insufficient combined → failure; addPoolCredits increments + ledgers; pool survives resetCredits; getCreditBalance FREE → totalAvailable=20, percentUsed=0 (no NaN/Infinity); Q7 regression (30/0 → 30); createDefaultPlan seeds 0+20; downgrade FREE no pool touch; grantLifetimeDeal → PRO/lifetimeDeal/monthly 0 + 600 pool.

### Deviations / surprises
- `CreditBadge.tsx` (out of scope, not in Files-touched) still reads legacy `remaining`/`limit`/`percentUsed`. Left unchanged: legacy fields are preserved so it doesn't break; for FREE it will cosmetically show "0/0" with a 0% bar (no NaN). Not touched to respect scope — flag for a future polish pass if desired.
- `getUsageStats` null-default branch previously hardcoded 30/30; changed to derive from the plan (needed a `getUserPlan` import in `billing/usage/route.ts`) so FREE doesn't misreport. Within the route file already on the Files-touched list.
- No out-of-scope files were edited.

**Open risks:** none functional. Top-up idempotency (persisting/reading Stripe session id in `UsageEvent.metadata`) is wired in `addPoolCredits`'s `metadata` param but the dedupe read is a phase-6 concern.

### Phase 5 addendum — CreditBadge fix (approved scope addition)

**File changed:** `src/components/billing/CreditBadge.tsx` (only file — it fetches `/api/credits/balance` inline, no shared hook).

- Extended the `CreditBalance` interface with optional `monthlyRemaining`/`poolRemaining`/`totalAvailable` (same `/api/credits/balance` shape already updated in Phase 5).
- Headline now shows `totalAvailable` (monthly remaining + pool). When `monthlyLimit > 0` it renders `totalAvailable/monthlyLimit`; when `monthlyLimit === 0` (FREE/LTD, pool-only) it renders just `totalAvailable` — no "/0" artifact.
- Severity colors/icon: driven by `percentUsed` when there's a monthly allotment; for pool-only tiers, `isOut = totalAvailable <= 0`, `isLow = totalAvailable <= 2` (no NaN-derived state).
- Tooltip: monthly progress bar + reset countdown only render when `hasMonthly`; a "Bonus pool" line shows when a topped-up PRO has pool > 0; pool-only tiers show a simple "Available: N credits" row (no bar, no reset line since pool credits don't reset). Mirrors the billing dashboard treatment.
- A FREE user with 20 pool credits now shows "20" instead of "0/0".

**Tests:** `npx tsc --noEmit` clean; full `npm run test:run` = 2271 passed, 3 skipped, 0 failed (i18n flake did not recur this run). No CreditBadge-specific test exists; none added (consistent with the component having no prior test).

**Final Phase 5 file list:** `src/lib/creditSystem.ts`, `src/lib/planManager.ts`, `src/lib/creditSystem.test.ts` (new), `src/lib/planManager.test.ts`, `src/app/api/credits/balance/route.ts`, `src/app/api/billing/plan/route.ts`, `src/app/api/billing/usage/route.ts`, `src/app/dashboard/billing/page.tsx`, `src/app/api/stripe/webhooks/route.ts` (comment only), `src/components/billing/CreditBadge.tsx` (scope addition).

---

## Phase 6 — Stripe test-mode (INERT build, kill-switch default OFF)

**Files changed:**
- `src/lib/stripe.ts` — added `STRIPE_PRICES` entries + `createOneTimeCheckoutSession()`; removed default trial from `createCheckoutSession()`; added env-var-name comment block.
- `src/app/api/stripe/create-ltd-session/route.ts` (new) — kill-switch-gated LTD checkout with cohort sold-out logic.
- `src/app/api/stripe/create-topup-session/route.ts` (new) — kill-switch-gated $9/100 top-up checkout.
- `src/app/api/stripe/create-checkout-session/route.ts` — dropped `trialDays: 14`.
- `src/app/api/stripe/webhooks/route.ts` — `checkout.session.completed` now branches on `session.mode === 'payment'` → `handleOneTimePayment()` (LTD grant / top-up); subscription path untouched.

No `.env.example` exists in the repo → per plan, env-var NAMES were documented as a comment block in `src/lib/stripe.ts` (not in `.env`/`.env.local`).

**Env var NAMES introduced (values NOT set — supplied later behind a separate gate):**
- `PRICING_V2_COMMERCE` — kill-switch, default OFF.
- `STRIPE_LTD_COHORT_1_PRICE_ID`, `STRIPE_LTD_COHORT_2_PRICE_ID`, `STRIPE_LTD_COHORT_3_PRICE_ID`
- `STRIPE_TOPUP_100_PRICE_ID`
- (existing, reused) `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID` — new $29/$290 test-mode IDs live here; no code change beyond trial removal.

No real price IDs or keys were inserted anywhere. No Stripe CLI / live call was run.

**Kill-switch:** both new routes begin with `if (process.env.PRICING_V2_COMMERCE !== 'true') return 404`. With the var unset (default), the first statement in each `POST` returns 404 before any auth/DB/Stripe code path executes → merge does not expose commerce. Webhook branch is dormant regardless (only fires on a real payment-mode Stripe event, which requires configured prices).

**LTD sold-out logic:** current cohort = lowest c∈{1,2,3} with `count(UserPlan where lifetimeDeal && ltdCohort=c) < 20`; all full → 410; caller already `lifetimeDeal` → 409. Seat race at #20 re-checked in webhook via the `lifetimeDeal` once-only guard.

**Idempotency (confirmed `metadata`, NOT `context`):**
- LTD: `handleOneTimePayment` pre-checks `UserPlan.lifetimeDeal === true` → skip + return; `grantLifetimeDeal` is naturally once-only.
- Top-up (repeatable): before granting, `prisma.usageEvent.findFirst({ eventType: CREDIT_TOPUP, metadata: { path: ['stripeSessionId'], equals: session.id } })` → found → skip. On grant, `addPoolCredits(userId, 100, CREDIT_TOPUP, { stripeSessionId, stripeEventId, reason })` persists the dedupe key in the `UsageEvent.metadata` JSON column (the column is `metadata`; there is no `context` column). Read-then-write dedupe, no unique constraint — fine at this scale.

**addPoolCredits extension:** NOT needed. Phase 5 already shipped `addPoolCredits(userId, amount, reason, metadata?)` with the optional `metadata` arg. `creditSystem.ts` was NOT touched — no approval stop required.

**Pro subscription:** `createCheckoutSession()` now omits `subscription_data.trial_period_days` when `trialDays` is undefined; the route no longer passes `trialDays: 14`. No trials → 14-day refund per spec.

**Verification:**
- `npx tsc --noEmit` — clean (after `npx prisma generate` to pick up phase-4 columns in the shared worktree client).
- `npm run test:run` — 2270 passed, 3 skipped, 1 failed = the known i18n 5s-timeout flake only (exempted).
- `npm run build` — green; both new routes present in the route manifest (`/api/stripe/create-ltd-session`, `/api/stripe/create-topup-session`).
- No Stripe CLI / live verification run (deferred to the user's later gate step).

**Open risks:** top-up dedupe relies on a JSON-path query (no DB unique constraint) — acceptable per plan at 60-seat scale. Live test-mode flow (real cards, `stripe listen`, replay) is the user's separate gate step and was not exercised here.

---

## Phase 7 — Cohort counter + purchase CTAs

**Files changed:**
- `src/app/api/billing/ltd-availability/route.ts` (new)
- `src/app/pricing/page.tsx`

### ltd-availability/route.ts (new, public GET)
Public read-only route, no auth, no PII. `export const revalidate = 60` (cache-friendly aggregate). Source of truth = `UserPlan` lifetimeDeal counts per cohort (spec decision 2), NOT Stripe. Cohort math mirrors phase-6 `create-ltd-session` exactly: iterate cohorts [1,2,3], `count(UserPlan where lifetimeDeal && ltdCohort=c)`; current cohort = lowest with `sold < 20`; all full → sold out. Cohort→price display map ($69/$99/$129) matches phase-6 price tiers.

**Kill-switch:** when `PRICING_V2_COMMERCE !== 'true'` returns `{ enabled: false }` immediately (before any DB call). On DB error it also returns `{ enabled: false }` (fail-safe to placeholder).

Payload shape (enabled):
```json
{
  "enabled": true,
  "soldOut": false,
  "currentCohort": 1,
  "currentPriceUsd": 69,
  "currentRemaining": 14,
  "seatsPerCohort": 20,
  "cohorts": [ { "cohort": 1, "seatsTotal": 20, "remaining": 14, "priceUsd": 69 }, ... ]
}
```
Disabled payload: `{ "enabled": false }`.

### pricing/page.tsx
- Added `useEffect` fetch of `/api/billing/ltd-availability` into `ltdAvail` state (defaults `{ enabled:false }` so the static placeholder shows until confirmed; network/parse failure keeps the safe default).
- `renderPrice` onetime case now has 3 branches: `!enabled` → original phase-3 static ($69 + "20 of 20 left" placeholder); `soldOut` → "Sold out / Founding closed — never returns"; live → `${currentPriceUsd}` + "N of 20 left at $X" counter.
- New `ctaStateFor(tier)` helper: non-LTD tiers keep static `{cta, ctaDisabled}`; LTD → `!enabled` = disabled "Coming at launch"; `soldOut` = disabled "Founding closed — never returns"; live = enabled "Claim your seat — $X". Button now uses `ctaState.disabled`/`ctaState.label`.
- `handleCta` LTD branch: no-op when `!enabled || soldOut`; signed-out → `router.push('/sign-in?redirect=/pricing')` (same pattern as the Pro button — see Deviations); signed-in → POST `/api/stripe/create-ltd-session`, redirect to `data.url`, alert on failure. Loading spinner extended to LTD.
- Top-up: existing footnote line ("Top-ups are $9 for 100 credits — buy from billing dashboard") already present from phase 3; left as-is (billing page is its real home).

### Kill-switch-OFF placeholder path (reasoning)
Default env (`PRICING_V2_COMMERCE` unset/off): the route returns `{ enabled:false }` without hitting the DB. Client `ltdAvail.enabled` stays false → `renderPrice` shows the static $69 + "20 of 20 left" block; `ctaStateFor` returns disabled "Coming at launch"; `handleCta` LTD branch early-returns. Identical to the phase-3 committed placeholder. No live buy button, no Stripe IDs referenced on the page. The build prerendered the route statically with the disabled payload (env off at build), confirming the inert path.

### Signed-out handling
Signed-out LTD click routes to `/sign-in?redirect=/pricing` — the exact pattern the Pro button uses; user returns to pricing after auth to complete purchase. No new auth flow invented.

### Deviations
- Plan step 3 wording says "sign-up redirect"; the same sentence instructs to reuse the Pro button's existing signed-out→checkout pattern, which uses `/sign-in?redirect=/pricing`. Conservative choice: mirrored the Pro pattern exactly (sign-in) rather than invent a sign-up variant. Behavior is equivalent (Clerk sign-in page links to sign-up).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run build` — green; `/api/billing/ltd-availability` present in route manifest (static, 0 B, 60s revalidate); `/pricing` builds.
- `npm run test:run` — no relevant test exists for this page/route (none required by plan); not run.

### Open risks
- `revalidate = 60` means the public counter can lag a purchase by up to ~60s (acceptable; the authoritative sold-out re-check is server-side in `create-ltd-session` + webhook). No live Stripe verification (user's separate gate).

## Phase 8 — Admin comped-Pro + migration

**Files changed**
- `src/app/api/admin/grant-plan/route.ts` (new) — admin grant route only. No prod execution, no route call, no planManager/creditSystem/stripe/webhook edits.

### Route contract
- `POST /api/admin/grant-plan`, `dynamic = 'force-dynamic'`, `maxDuration = 60`.
- Auth: `requireAdmin(req)` (same pattern as `transfer-ownership`) — passes on `ADMIN_CLERK_IDS` match or `Authorization: Bearer <CRON_SECRET>`; otherwise returns its 401 `{error:'Unauthorized'}`.
- Body: `{ userId?: string, email?: string, grant: 'comped_pro' | 'ltd', cohort?: number, pricePaid?: number }`.
  - Target resolution: `userId` (== Clerk ID == `UserPlan.userId`) used directly; else `email` → `prisma.user.findFirst({where:{email}})` → `user.clerkId` (email is NOT a unique column, so `findFirst`, not `findUnique`).
- Responses:
  - 400 — invalid JSON body; unknown `grant`; `ltd` with non-integer/negative `cohort` or `pricePaid`.
  - 404 — email given but no matching user; neither `userId` nor a resolvable target present.
  - 401 — non-admin (from `requireAdmin`).
  - 500 — unexpected error (`details` only in dev).
  - 200 — `{ success:true, grant, plan:{tier,status,creditsLimit,lifetimeDeal,ltdCohort} }`; ltd double-grant short-circuit adds `alreadyGranted:true`.

### comped_pro — subscription-free monthly refill
Sets `tier=PRO`, `status='comped'` (plain String column; no PlanStatus enum member needed), clears all Stripe IDs + period fields, `creditsLimit=200`, and mirrors PRO feature/limit fields from `PLAN_CONFIGS[PRO]`. `creditPool` is deliberately NOT written (stays 0 / untouched). The 200/mo refills without any subscription because `getUserUsage` (creditSystem.ts:98-109) lazily seeds each new billing period's `UserUsage` row from `userPlan.creditsLimit`; no `resetCredits`/webhook is involved. No pool workaround added.

### ltd cohort=0 handling
`grant='ltd'` delegates to the existing `grantLifetimeDeal(clerkId, cohort, pricePaid)` (Phase 5) → `creditsLimit=0`, one-time 600-credit pool, PRO limits. Validation requires `cohort` to be a non-negative integer and explicitly ACCEPTS `0` (Kundius pre-cohort bespoke, hidden from the public 1–3 counter); `pricePaid` is validated as a non-negative integer in cents (Kundius = 30000). Neither is defaulted — both must be supplied for ltd.

### Double-grant guard
Before granting ltd, the route reads the existing `UserPlan`; if `lifetimeDeal === true` it returns the current state with `alreadyGranted:true` and does NOT call `grantLifetimeDeal` again (prevents a second 600-credit pool seed), mirroring the phase-6 webhook guard. Implemented at the route layer per instruction (planManager untouched). comped_pro is a plain idempotent set (same values on re-run).

### Notes / deviations
- Route calls `getUserPlan(clerkId)` before granting to guarantee a `UserPlan` row exists (`grantLifetimeDeal` and the comped update both use `prisma.userPlan.update`, which throws on a missing row). For the two real targets (naayom/Kundius) a plan already exists, so this is a no-op; for a brand-new user it would create a default FREE plan first. Read-only reuse of planManager, no modification.
- comped_pro mirrors the full PRO feature/limit field set (as `upgradePlan` does) so a comped Pro is a real Pro, not just a tier label. Conservative superset of the plan's minimal `{tier,status,creditsLimit}`.

### Verification
- `npx tsc --noEmit` — clean (ran `npx prisma generate` first).
- `npm run build` — green; route compiled to `.next/server/app/api/admin/grant-plan/route.js`.
- `npm run test:run` — 2271 passed / 3 skipped (148 files). No admin-route test pattern exists, so none added (plan requires none).
- No DB execution and no route invocation performed — prod grants (naayom comped_pro, Kundius ltd cohort=0/30000c) remain the orchestrator's separate human gate.

### Open risks
- Auth strength inherits `requireAdmin` (env-driven allowlist / CRON_SECRET); no change here.
- Subscription-free refill correctness depends on the `getUserUsage` lazy-seed behavior remaining as-is; not exercised against a live DB in this phase (blocked by the human gate).
