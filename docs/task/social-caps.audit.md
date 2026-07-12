# social-caps — phase 7 (gating/caps + upgrade wall) audit

Branch: `feature/social-caps`. Implements plan §Phase 7 of `docs/task/social-posts.plan.md`.
No schema change (phase-2 migration already carries `SocialPost` + `UserPlan.socialPostsLimit`).

## Files changed
- `src/lib/planManager.ts` — added `socialPosts` to `PlanConfig['limits']` + all 4 tiers; wrote `socialPostsLimit` in ALL FIVE limit-column writers; added durable writer-completeness guard comment.
- `src/modules/social/gating.ts` (new) — pure window/boundary helpers + thin `countSocialPostGenerations` DB fn.
- `src/modules/social/gating.test.ts` (new) — window selection, month-boundary math, where-clause construction, D6 id-space guard, per-tier limit values.
- `src/app/api/social/[token]/posts/route.ts` — inserted the cap gate in POST before generation.
- `src/app/api/social/[token]/posts/route.test.ts` (new) — over-limit 4xx + no-persist; under-limit proceeds+persists.
- `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx` — upgrade wall (Free lifetime) / quiet soft-cap note (paid monthly) on `limit_reached`.

## Per-file

### `src/lib/planManager.ts`
- Added `socialPosts: number` to the nested `limits` sub-object of `PlanConfig`, with a
  comment tying the values to the phase-2 backfill SQL.
- Set the value per tier: FREE 10, PRO 300, AGENCY -1, ENTERPRISE -1 — equal to the
  migration `20260710105655_social_posts` backfill (verified against the phase-2 audit).
- Wrote `socialPostsLimit: config.limits.socialPosts` in **all five** limit-column writers
  via one `replace_all` on the shared `teamMembersLimit: config.limits.teamMembers,` anchor:
  `createDefaultPlan`, `upgradePlan`, `downgradePlan`, `startTrial`, **and `grantLifetimeDeal`**
  (the pricing-v2 LTD grant — context-shift requirement: LTD grants get PRO-level limits, so
  they now also get socialPosts=300 since `grantLifetimeDeal` uses `PLAN_CONFIGS[PRO]`).
- Added a durable ⚠️ guard comment above `createDefaultPlan` naming all five writers and
  noting `tsc` cannot enforce completeness on a Prisma `update`.
- `checkLimit` reads `userPlan['socialPostsLimit']` unmodified (keys on Clerk id — D6);
  `-1` short-circuits to `allowed:true` (AGENCY/ENTERPRISE unlimited).
- Did NOT route the boolean-feature footgun: this is a numeric limit read from the DB column,
  not `hasFeature`. No fail-open path introduced.

### `src/modules/social/gating.ts` (new)
- `getSocialPostWindow(tier)` → `'lifetime'` for FREE, `'monthly'` otherwise.
- `currentPeriod()` / `monthStartFor(period)` — local-time "YYYY-MM" mirroring the unexported
  `creditSystem.getCurrentPeriod` (re-implemented, not imported — it is private). Calendar-month
  boundary, intentionally distinct from Stripe-anniversary credit resets (soft cap, not billed).
- `buildSocialPostCountWhere(clerkId, window)` — pure `Prisma.UsageEventWhereInput` builder:
  `{ userId: clerkId, eventType: SOCIAL_POST_GENERATION }` + monthly adds `createdAt.gte`.
- `countSocialPostGenerations(clerkId, window)` — `prisma.usageEvent.count` over the append-only
  ledger. Every param NAMED `clerkId` (D6) so an internal id handoff reads wrong at the call site.

### `src/app/api/social/[token]/posts/route.ts`
- New step 3b (after the demo early-return and the `clerkId` null-guard, before brand-data load):
  `getUserPlan(clerkId)` → tier → window → `countSocialPostGenerations(clerkId, window)` →
  `checkLimit(clerkId, 'socialPosts', currentCount)`. On `!allowed` → **403** with
  `{ success:false, error:'limit_reached', remaining:0, tier, window }` and NO persist.
- Gate is BEFORE any generation/`$transaction`, keyed on the CLERK id (D6). Demo-bearer path
  returns earlier (never reaches the gate — demo posts are free + uncounted). Deleting library
  posts cannot restore allowance (ledger is append-only). No `consumeCredits` / `UserUsage` writes.
- TOCTOU acknowledged (two concurrent POSTs at 9/10 both pass) — accepted for a soft cap.
- Kill-switch (`NEXT_PUBLIC_SOCIAL_POSTS_DISABLED`) left untouched — caps sit beneath it.

### `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx`
- Added `limitHit` state; `generate()` now checks `data.error === 'limit_reached'` BEFORE the
  generic `readableError` mapping (works regardless of the 403 status).
- Render: `window === 'monthly'` → quiet amber inline note ("resets next month"); else (Free
  lifetime) → a blocking blue upgrade card with an "Upgrade to Pro" CTA → `router.push('/pricing')`.
  Local component; the shared billing components (`OutOfCreditsModal`) were NOT edited, only its
  visual idiom mirrored.

## Deviations
- **Status code = 403, not 200.** Plan step 4 says "no 402" and shows the JSON body without a
  status. The orchestrator's task gate explicitly requires an over-limit **4xx**. Chose 403
  (a 4xx that is not 402) — conservative reconciliation of both. The UI keys the wall off
  `error === 'limit_reached'`, not the status, so the choice is UI-agnostic. Logged here.
- **Added `window` to the `limit_reached` body** (not named in the plan) so the panel can pick
  the blocking wall (lifetime/Free) vs the quiet note (monthly/paid) without re-deriving the tier
  mapping client-side. Additive, conservative.
- **Fifth writer `grantLifetimeDeal`.** The plan (written 2026-07-10) named four writers;
  pricing-v2 later added `grantLifetimeDeal`. Per the task's context-shift note, LTD grants must
  get the PRO socialPosts limit — the `replace_all` covered it (it uses `PLAN_CONFIGS[PRO]`).

## Tests added
- `gating.test.ts` (7 tests): window selection per tier; `monthStartFor` boundary (July index,
  Jan→0, Dec year-rollover); where-clause lifetime vs monthly; **D6 id-space swap guard**
  (asserts the where carries exactly the passed Clerk id + the `SOCIAL_POST_GENERATION` enum
  string — fails if an internal id or bare string is threaded); **per-tier limit values**
  (FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1 from `PLAN_CONFIGS`, guarding SQL↔TS drift).
- `route.test.ts` (2 tests): over-limit → 403 `limit_reached`, `$transaction`/`findUnique` never
  called, gate keyed on `'clerk_123'`; under-limit (env-mock) → `success:true, persisted:true`,
  `$transaction` called once with a 2-element array (SocialPost create + UsageEvent ledger create).

## Verification
- `npx tsc --noEmit`: clean except the known pre-existing unrelated error
  `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (not touched here).
- New tests isolated: 12 passed (2 files).
- `npm run test:run`: **158 files passed | 1 skipped; 2508 tests passed | 11 skipped.** No
  failures; the documented i18nHonesty 5s-timeout flake did not surface (no re-run needed).
- `npm run build`: green (exit 0); `/dashboard/social/[token]` + both API routes register.
- Writer-completeness grep: `socialPostsLimit` appears in `createDefaultPlan`, `upgradePlan`,
  `downgradePlan`, `startTrial`, `grantLifetimeDeal`, plus the `checkLimit` read path (via the
  `${limitType}Limit` lookup) and the interface + tier configs.

## Open risks
- **HUMAN GATE (plan §Phase 7):** the `planManager.ts` plan-limits edit is a billing surface —
  user sign-off on the values (FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1, equal to the phase-2
  backfill) and enforcement semantics, explicitly covering the `startTrial` + `grantLifetimeDeal`
  writes, is required before merge/deploy. Implemented as planned; not user-confirmed here.
- Real-user manual cap verification (env-mock, real signed-in user: 10 → 11th blocked; deleting
  library posts does not unblock; Pro row = 300 unaffected; credits pool unchanged) is a manual
  step deferred to the plan's verification checklist.
- TOCTOU soft-cap overshoot (accepted, no locking) as noted above.
