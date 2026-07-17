# billing-beta — scout findings (3 scouts, 2026-07-17)

WORKDIR = `C:\Users\susha\lessgo-ai\.claude\worktrees\billing-beta` · branch `feature/billing-beta` (from main @ b7044a1c).
Baseline verified green: `tsc` exit 0. (`next-env.d.ts` had to be copied in — gitignored/generated.)

## A. Data sources (read path)

| Route | File | Auth | Response shape | Consumers |
|---|---|---|---|---|
| `/api/credits/balance` | `src/app/api/credits/balance/route.ts` | Clerk, 401 | `{used, remaining, limit, percentUsed, daysUntilReset, nextResetDate, tier, monthlyRemaining, poolRemaining, totalAvailable}` | `src/components/billing/CreditBadge.tsx:33` |
| `/api/billing/plan` | `src/app/api/billing/plan/route.ts:22-48` | Clerk, 401 | `{tier, status, creditsLimit, creditPool, lifetimeDeal, ltdCohort, currentPeriodStart/End, isTrialing, trialStart/End, features:{publishedPagesLimit, customDomainsLimit, removeBranding, formIntegrations, analytics, prioritySupport, trackingPixels}}` | `dashboard/billing/page.tsx:82`, `SeoSettingsModal.tsx:142` |
| `/api/billing/usage` | `src/app/api/billing/usage/route.ts` | Clerk, 401 | `{period, credits:{used,remaining,limit,percentUsed,monthlyRemaining,poolRemaining,totalAvailable}, operations:{...}, tokens:{...}, estimatedCost}` | `dashboard/billing/page.tsx:83` |
| `/api/billing/ltd-availability` | `src/app/api/billing/ltd-availability/route.ts` | **public**, revalidate 60 | `{enabled:false}` when `PRICING_V2_COMMERCE!=='true'`; else `{enabled, soldOut, currentCohort, currentPriceUsd, currentRemaining, seatsPerCohort:20, cohorts:[...]}` | `pricing/page.tsx:150` |

No SWR/React-Query layer — every consumer is a raw `fetch` in `useEffect`.

### Gaps vs what the widget/lean view needs
- **sites used** — NOT returned anywhere (only `features.publishedPagesLimit`). S1 layout already computes it via `prisma.userPlan` + a count — see §C.
- **payment-method last4** — no server source at all (`UserPlan` has only `stripeCustomerId`/`stripeSubscriptionId`). → **portal-only, do not build.**
- **plan display name / price** — only in `PLAN_CONFIGS`, not returned by `billing/plan`.
- **cancel-at-period-end** — not on the model. → portal-only.
- `currentPeriodEnd` is usable as next-charge date.
- A widget needs ≥2 fetches today (plan + balance).

## B. Config (the config-driven acceptance criterion)

- `PLAN_CONFIGS` — `src/lib/planManager.ts:63`, `Record<PlanTier, PlanConfig>`; `PlanConfig` :23-60 = `{tier, name, price:{monthly,annual}, credits, limits:{publishedPages,draftProjects,customDomains,formSubmissions,teamMembers,socialPosts}, features:{...}, rateLimit:{...}}`. `-1` = unlimited. **No Stripe price ids in it.**
  - FREE `credits: 20` is a **display** value that intentionally diverges from DB `creditsLimit=0` (pool-backed) — comment at :71-74. Do not "reconcile" this.
- `CREDIT_COSTS` — `src/lib/creditSystem.ts:7-26` `as const`: `FULL_PAGE_GENERATION:10, SECTION_REGENERATION:2, ELEMENT_REGENERATION:1, FIELD_INFERENCE:1, FIELD_VALIDATION:0, UNDERSTAND:1, IVOC_RESEARCH:3, STRATEGY_GENERATION:2, UIBLOCK_SELECT:1, GENERATE_COPY:3, SCRAPE_WEBSITE:1, PRIVACY_POLICY_GENERATION:2, OUTREACH_SCRAPE:1`.
  - CLAUDE.md's `FULL_PAGE_GEN`/`SECTION_REGEN` names are **stale** — real keys are the `_GENERATION`/`_REGENERATION` forms.
  - `IVOC_RESEARCH` is a **dead** cost constant (Tavily + `/api/market-insights` removed in scale-08). Do not surface it.
- ⚠️ **Neither file is client-importable**: both do `import { prisma } from '@/lib/prisma'` at module scope (planManager.ts:2, creditSystem.ts:2), no `server-only` marker → importing from a client component drags Prisma into the client bundle (bundling error). **The config-driven criterion therefore requires extracting the prisma-free constants into a shared module** (e.g. `src/lib/planConfigs.ts` + credit-cost constants) that both server and client can import, with `planManager`/`creditSystem` re-exporting. This is the single biggest structural decision in this slice.

## C. Dashboard shell (S1) + ui-foundation

| Thing | Path |
|---|---|
| Sidebar | `src/components/dashboard/AppSidebar.tsx` |
| **Greyed plan widget** | `AppSidebar.tsx:154-171` — greyed Upgrade span at :167-169 (`cursor-not-allowed opacity-60`, `aria-disabled`, comment "S3 — no upgrade route yet"); em-dash fallbacks at :158/:165 |
| Dashboard header | `src/components/dashboard/DashboardTopBar.tsx` — counter anchor = the `flex-1` spacer at :62, left of the greyed bell |
| Shell feeding both | `src/app/dashboard/layout.tsx` — plan data already flows via `AppSidebarProps.plan` (:26-44 `SidebarPlan {planName, used, limit}`), computed at `layout.tsx:54-64` |

⚠️ **Load-bearing (layout.tsx:45-53):** that read deliberately uses `prisma.userPlan.findUnique`, **NOT** `getUserPlan()` — the latter is get-or-create and would seed the once-ever FREE credit pool on every dashboard page view. **Any credit read added to this layout must obey the same rule.**

### ui-foundation (merged in main)
- README: `src/components/ui/README.md` (thorough — read it).
- Primitives, all `@/components/ui/*`: `card.tsx`, `button.tsx` (`default`=primary blue, `cta`=coral), `badge.tsx` (`status`/`success`/`danger`/`postBeta`/`magic`), `icon.tsx` (`AppIcon`, Material Symbols by ligature), `nav-item.tsx`, `tooltip.tsx` (`AppTooltip`), `popover.tsx`, `toast.tsx`, `spinner.tsx`, `tabs.tsx`, `segmented-control.tsx`. **There is no `skeleton.tsx`** — `Spinner` is the loading primitive.
- Tokens are **not** a tokens file — namespaced `app-*` keys in root `tailwind.config.js` `theme.extend`.
- **Hard constraints:** style app chrome with `app-*` utilities ONLY (stock Tailwind keys feed template rendering); new icons require appending to `public/fonts/material-symbols-rounded/icons.txt` + regenerating the subset (`credit_card`, `workspace_premium` already in use); greyed treatment = shared `.app-coming` class + `<Coming>` wrapper (`ui/coming.tsx`), `aria-disabled` not `disabled`.
- **Three isolation guards must stay green:** published-css sha256, tailwind config-freeze test, `e2e/ui-isolation.spec.ts`.

## D. Stripe session routes

| Route | Body in | Response | Notes |
|---|---|---|---|
| `api/stripe/create-checkout-session` | `{tier, billingInterval}`; `tier` **must** be `PlanTier.PRO` (:44-49 else 400); interval `'monthly'\|'annual'` | `{sessionId, url}` | No kill-switch. success→`/dashboard/billing?session_id=…&success=true`; cancel→`/pricing?canceled=true` |
| `api/stripe/create-topup-session` | none (empty POST) | `{sessionId, url}` | ⚠️ **kill-switch: `PRICING_V2_COMMERCE!=='true'` → 404** (:14-16). Fixed `STRIPE_PRICES.TOPUP_100`. cancel→`/dashboard/billing?canceled=true`. **Zero callers today.** |
| `api/stripe/create-portal-session` | none | `{url}` (no sessionId) | ⚠️ **400 `'No active subscription found'` when no `stripeCustomerId`** (:24-29) — **a FREE user who never paid CANNOT open the portal.** The lean view must NOT offer "Manage billing" unconditionally. |
| `api/stripe/create-ltd-session` | — | — | exists |

**No shared client helper exists** — only ad-hoc call sites at `pricing/page.tsx:215` (checkout) and `billing/page.tsx:109` (portal). A small shared helper is a reasonable add.

## E. Existing billing page — `src/app/dashboard/billing/page.tsx` (325 lines, `'use client'`)

Fetches plan+usage in one `useEffect` (:81-84); `openCustomerPortal()` :105-123. Renders: success banner (:45-63) · Current Plan card (:163-235) · Credit Usage card (:238-309) · dead "Usage History coming soon" (:313-322). **Stock Tailwind + lucide → pre-ui-foundation, violates the `app-*`-only rule.** Hardcodes `router.push('/pricing')` for FREE upgrade (:211); no top-up CTA.

**Verdict: replace, salvaging 3 things** — (a) the pool-aware math at :133-150 (`monthlyLimit>0` guard, `creditsLabel` tier logic — correct and non-obvious; FREE/LTD have `limit=0` with credits in the pool); (b) `openCustomerPortal()` verbatim; (c) the `?success=true` banner (both checkout AND topup return URLs land here). Rest (usage-history stub, per-op counter list, progress bar) is Scope-OUT 2g material.

## F. The gate: `checkCredits()` + block responses

`checkCredits(userId, creditsRequired) => Promise<{allowed, remaining, required}>` — `src/lib/creditSystem.ts:138`. `remaining` = period `creditsRemaining` + `userPlan.creditPool`. Never throws, never writes a ledger row; callers own the HTTP shape. Dev bypass `DEV_BYPASS_CREDITS=true` → `remaining:999999` (:143). **On internal error it fails closed** (`allowed:false, remaining:0`, :160-163) — indistinguishable from a real 0 balance, so a solvent user can be misreported as broke. Doc comment :126-137 is a rule: **never gate `/api/saveDraft` or `/api/publish`.**

### ⚠️ THREE incompatible 402 body shapes (the core client problem)
1. **Pattern A** (pre-check + post-`consumeCredits`, both 402) — `{success:false, error:{code:"insufficient_credits", message:"Insufficient credits. Required: N, Available: M"}}`
   Routes: `v2/understand` (UNDERSTAND, :163/:270) · `v2/scrape-website` (SCRAPE_WEBSITE, :227/:364) · `audience/{product,service,work}/strategy` (=2) · `audience/{product,service,work}/generate-copy` (=3) · `outreach/[token]` (:382) · `generate-privacy-policy` · `audience/work/regenerate-story`
2. **Pattern B** (`requireAICredits`/`createErrorResponse`, `src/lib/middleware/planCheck.ts:90,193,208`) — `{error:"Insufficient credits. Required: N, Available: M", code:"INSUFFICIENT_CREDITS"}`
   Routes: `regenerate-section` (:27, SECTION_REGENERATION=2) · `regenerate-element` (ELEMENT_REGENERATION=1) · `generate-privacy-policy` · `regenerate-story`
3. **`checkAIAccess`** (`planCheck.ts:243`) — Pattern B **plus** `details:{required, available}` (:265-274)

Plus `api/social/[token]/posts/route.ts:233` deliberately uses **403, never 402** for its upgrade wall (separate convention — leave alone).

→ **A single client handler needs a normalizer** that accepts all three shapes. This is presentation-layer and in scope; changing the routes' shapes is NOT (spec Scope OUT).

### Client callers today
- **`regenerate-section`** → `src/hooks/editStore/aiActions.ts:98`. Reads `errorData.error`, throws (:114-115); catch :252-266 logs + pushes raw message into `state.aiGeneration.errors`, rethrows. **No status inspection — 402 indistinguishable from 500. No toast fires.**
- **`regenerate-element`/variations** → `aiActions.ts:482`, `:557`; catches :591/:632 push to `aiGeneration.errors`.
- **`v2/scrape-website` + `v2/understand`** → `src/app/onboarding/[token]/components/EntryInputStep.tsx:120` — the only place branching on `if (res.status !== 402)`, i.e. **402 is silently suppressed there.**
- **`audience/*/strategy` + `generate-copy`** → wizard maps 402 → first-class `status:'credits'`: `modules/wizard/generation/thing.ts:359`, `trust.ts:296`, `work.llm.ts:91` (`status===402 || /credit/i.test(error)`); consumed by `hooks/useWizardStore.ts:256` (`strategyCreditsError`), surfaced in `GeneratingSlot.tsx`/`StepBuilding.tsx`. **This lane already works end-to-end — it is the reference implementation.**

Net: **editor lane silently swallows credit failures; wizard lane handles them properly; onboarding entry suppresses 402.**

## G. Reusable / dead assets (big wins)

- **`src/components/billing/OutOfCreditsModal.tsx:14`** — a styled out-of-credits modal that **already exists and has ZERO import sites** (documented in `src/components/README.md:18`). Dead code; the natural hook for the gating message.
- **`src/components/billing/CreditBadge.tsx`** (198 lines) — pool-aware balance + 30s polling + low/out states + upgrade link, fed by `/api/credits/balance`. **Rendered nowhere.** Stock-Tailwind (`bg-red-50`, lucide) → needs `app-*` reskin. ⚠️ **hardcodes credit costs at :179-191 (10/2/1)** — directly violates the config-driven criterion; must read from `CREDIT_COSTS`. **Adapt this rather than write a third balance-fetcher.**
- Toast: `src/app/edit/[token]/components/ui/useToast.ts` → `useToast().showToast(msg, 'success'|'error'|'info')`, root `ToastProvider.tsx`, backed by `src/components/ui/toast.tsx`. Hand-rolled module-level singleton (`bindToastRoot`), **editor-scoped**; `src/app/dashboard/layout.tsx` mounts its own. **There is no app-wide toast root.**
- Modal queue: `src/hooks/useModalManager.ts`.
- Upgrade-wall precedent: `src/app/dashboard/social/[token]/components/SocialPostsPanel.tsx:256` (comment says it follows OutOfCreditsModal's idiom).
- Editor header: `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` (h-14). Right-side clusters at `:288` and `:324` (`app-divider` separators at :328) — dropping a counter into the :324 cluster is cheap + additive. **No store touch needed** (counter self-fetches). ⚠️ The file already imports `useEditStore` (:36) and reaches through `useEditStore.getState().toggleLeftPanel?.()` at :265 — a **deliberate** inconsistency its header comment says to preserve. **Do NOT "fix" it while adding the counter.**

## H. Out-of-scope defects found (backlog, NOT this slice — spec Scope OUT bans backend/credit changes)

1. **`regenerate-element/route.ts:130-145` ignores the `consumeCredits` result** — spreads `consumption.remaining` into a 200 and returns variations regardless. A failed post-check or `charge_conflict` ⇒ **free AI output**. Every Pattern-A sibling discards output and 402s. Same class at `outreach/[token]/route.ts:412`.
2. **`api/regenerate-content/route.ts` has NO credit gating at all** (zero `credit` matches) — an ungated AI-spend route.
3. `charge_conflict` (solvent user lost the race, `creditSystem.ts:359`) → correctly 500 in Pattern A, but Pattern B / `regenerate-element` can't distinguish it.
4. `checkCredits()` failing closed on internal error misreports solvent users as broke.
