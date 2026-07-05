Sprint 8 Objective 1: Pricing System Implementation Plan                                                                          │
     │                                                                                                                                   │
     │ Context: Implement Stripe-based pricing with 4 tiers (Free, Pro, Agency, Enterprise). Build foundation for all but limit feature  │
     │ implementation to Free & Pro.                                                                                                     │
     │                                                                                                                                   │
     │ User Decisions:                                                                                                                   │
     │ - No existing users → No migration needed                                                                                         │
     │ - 14-day free trial with card required                                                                                            │
     │ - Hard credit reset monthly (no rollover)                                                                                         │
     │ - Annual discount: 25% ($29/mo vs $39/mo)                                                                                         │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 1: Database & Core Infrastructure (Priority 0)                                                                              │
     │                                                                                                                                   │
     │ 1.1 Database Schema                                                                                                               │
     │                                                                                                                                   │
     │ - Add UserPlan model to Prisma schema                                                                                             │
     │   - Plan tier (FREE, PRO, AGENCY, ENTERPRISE)                                                                                     │
     │   - Stripe integration fields (customerId, subscriptionId)                                                                        │
     │   - Credit limits & feature flags                                                                                                 │
     │   - Trial period tracking                                                                                                         │
     │ - Add UserUsage model                                                                                                             │
     │   - Monthly period tracking (YYYY-MM)                                                                                             │
     │   - Credit system (used/remaining/limit)                                                                                          │
     │   - AI operation counters (page gen, section regen, element regen)                                                                │
     │   - Token & cost tracking                                                                                                         │
     │ - Add UsageEvent model                                                                                                            │
     │   - Detailed event logging (type, credits, tokens, cost)                                                                          │
     │   - Request tracking (endpoint, duration, success/errors)                                                                         │
     │ - Run migration: npx prisma db push                                                                                               │
     │ - Create default plan assignment on user signup                                                                                   │
     │                                                                                                                                   │
     │ 1.2 Plan Management Utilities                                                                                                     │
     │                                                                                                                                   │
     │ - Create src/lib/planManager.ts                                                                                                   │
     │   - Plan tier constants & configs                                                                                                 │
     │   - Default plan assignment logic                                                                                                 │
     │   - Plan feature checking utilities                                                                                               │
     │   - Plan upgrade/downgrade logic                                                                                                  │
     │   - Trial period management                                                                                                       │
     │                                                                                                                                   │
     │ 1.3 Credit System Core                                                                                                            │
     │                                                                                                                                   │
     │ - Create src/lib/creditSystem.ts                                                                                                  │
     │   - Credit cost constants (page: 10, section: 2, element: 1, inference: 1)                                                        │
     │   - Credit balance checking middleware                                                                                            │
     │   - Credit deduction logic with transactions                                                                                      │
     │   - Monthly credit reset logic                                                                                                    │
     │   - Usage event logging                                                                                                           │
     │                                                                                                                                   │
     │ 1.4 Rate Limiting Enhancement                                                                                                     │
     │                                                                                                                                   │
     │ - Extend src/lib/rateLimit.ts with tier-based configs                                                                             │
     │   - FREE: 5 req/min                                                                                                               │
     │   - PRO: 10 req/min                                                                                                               │
     │   - AGENCY: 20 req/min                                                                                                            │
     │ - Add rate limiting to /api/regenerate-section (CRITICAL - currently unprotected)                                                 │
     │ - Add rate limiting to /api/regenerate-element (CRITICAL - currently unprotected)                                                 │
     │ - Add tier-aware rate limit middleware                                                                                            │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 2: Stripe Integration (Priority 0)                                                                                          │
     │                                                                                                                                   │
     │ 2.1 Stripe Setup                                                                                                                  │
     │                                                                                                                                   │
     │ - Install Stripe SDK: npm install stripe @stripe/stripe-js                                                                        │
     │ - Create Stripe account & get API keys                                                                                            │
     │ - Configure webhook endpoint secret                                                                                               │
     │ - Create Stripe products & prices in dashboard:                                                                                   │
     │   - Pro Monthly: $39/mo                                                                                                           │
     │   - Pro Annual: $348/yr ($29/mo)                                                                                                  │
     │                                                                                                                                   │
     │ 2.2 Checkout Flow                                                                                                                 │
     │                                                                                                                                   │
     │ - Create src/app/api/stripe/create-checkout-session/route.ts                                                                      │
     │   - Accept tier & billing interval (monthly/annual)                                                                               │
     │   - Create Stripe checkout session                                                                                                │
     │   - Include trial period (14 days)                                                                                                │
     │   - Store session metadata (userId, tier)                                                                                         │
     │ - Create src/app/api/stripe/create-portal-session/route.ts                                                                        │
     │   - Customer portal for managing billing                                                                                          │
     │                                                                                                                                   │
     │ 2.3 Webhook Handler                                                                                                               │
     │                                                                                                                                   │
     │ - Create src/app/api/stripe/webhooks/route.ts                                                                                     │
     │   - Handle checkout.session.completed → Create UserPlan                                                                           │
     │   - Handle customer.subscription.created → Activate plan                                                                          │
     │   - Handle customer.subscription.updated → Update plan                                                                            │
     │   - Handle customer.subscription.deleted → Downgrade to free                                                                      │
     │   - Handle invoice.payment_succeeded → Reset credits                                                                              │
     │   - Handle invoice.payment_failed → Mark past_due                                                                                 │
     │   - Verify webhook signature                                                                                                      │
     │   - Idempotency handling                                                                                                          │
     │                                                                                                                                   │
     │ 2.4 Plan Enforcement Middleware                                                                                                   │
     │                                                                                                                                   │
     │ - Create src/lib/middleware/planCheck.ts                                                                                          │
     │   - Check credit balance before AI operations                                                                                     │
     │   - Return 402 Payment Required if exhausted                                                                                      │
     │   - Add plan features checking                                                                                                    │
     │   - Block features outside user's tier                                                                                            │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 3: AI Endpoint Protection (Priority 0)                                                                                      │
     │                                                                                                                                   │
     │ 3.1 Inject Credit Checks into AI Endpoints                                                                                        │
     │                                                                                                                                   │
     │ - Modify /api/generate-landing (10 credits)                                                                                       │
     │   - Check credits before generation                                                                                               │
     │   - Deduct credits after success                                                                                                  │
     │   - Log usage event                                                                                                               │
     │ - Modify /api/regenerate-section (2 credits)                                                                                      │
     │   - Add rate limiting (currently missing!)                                                                                        │
     │   - Add credit check                                                                                                              │
     │   - Deduct & log                                                                                                                  │
     │ - Modify /api/regenerate-element (1 credit)                                                                                       │
     │   - Add rate limiting (currently missing!)                                                                                        │
     │   - Add credit check                                                                                                              │
     │   - Deduct & log                                                                                                                  │
     │ - Modify /api/infer-fields (1 credit)                                                                                             │
     │   - Add credit check                                                                                                              │
     │   - Deduct & log                                                                                                                  │
     │ - Keep /api/validate-fields free (no credit cost)                                                                                 │
     │                                                                                                                                   │
     │ 3.2 Feature Gates                                                                                                                 │
     │                                                                                                                                   │
     │ - Published page limit enforcement                                                                                                │
     │   - FREE: 1, PRO: 10, AGENCY: unlimited                                                                                           │
     │ - Custom domain limit check                                                                                                       │
     │   - FREE: 0, PRO: 3, AGENCY: unlimited                                                                                            │
     │ - Form integrations gate (Pro+)                                                                                                   │
     │ - Analytics access gate (Free: basic, Pro: full)                                                                                  │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 4: User-Facing UI (Priority 0)                                                                                              │
     │                                                                                                                                   │
     │ 4.1 Pricing Page                                                                                                                  │
     │                                                                                                                                   │
     │ - Create /pricing route                                                                                                           │
     │ - Build pricing table component                                                                                                   │
     │   - 4 tiers (Free, Pro, Agency, Enterprise)                                                                                       │
     │   - Annual/monthly toggle (show 25% savings)                                                                                      │
     │   - Feature comparison matrix                                                                                                     │
     │   - Trial badge on Pro tier                                                                                                       │
     │ - Add FAQ section                                                                                                                 │
     │ - Link to checkout flow                                                                                                           │
     │                                                                                                                                   │
     │ 4.2 Credit Display Widgets                                                                                                        │
     │                                                                                                                                   │
     │ - Create src/components/billing/CreditBadge.tsx                                                                                   │
     │   - Display in editor header: "🪙 145/200 credits"                                                                                │
     │   - Show reset date: "Resets in 12 days"                                                                                          │
     │   - Color-coded warnings (80% = yellow, 100% = red)                                                                               │
     │ - Add pre-operation confirmation modal                                                                                            │
     │   - "Regenerate Section - Uses 2 credits"                                                                                         │
     │   - Cancel/Confirm buttons                                                                                                        │
     │ - Create "Out of Credits" modal                                                                                                   │
     │   - Upgrade to Pro CTA                                                                                                            │
     │   - Buy credit pack option (future)                                                                                               │
     │   - Wait for reset countdown                                                                                                      │
     │                                                                                                                                   │
     │ 4.3 Billing Dashboard                                                                                                             │
     │                                                                                                                                   │
     │ - Create /dashboard/billing route                                                                                                 │
     │ - Display current plan card (tier, status, renewal date)                                                                          │
     │ - Show credit usage:                                                                                                              │
     │   - Progress bar (used/limit)                                                                                                     │
     │   - Operation breakdown (pages: 5, sections: 20, elements: 45)                                                                    │
     │   - Monthly trend chart                                                                                                           │
     │ - Add upgrade/downgrade buttons                                                                                                   │
     │ - Link to Stripe customer portal                                                                                                  │
     │ - Show billing history (invoices)                                                                                                 │
     │                                                                                                                                   │
     │ 4.4 Dashboard Integration                                                                                                         │
     │                                                                                                                                   │
     │ - Add credit badge to /edit/[token] header                                                                                        │
     │ - Add "Upgrade" button in sidebar                                                                                                 │
     │ - Add plan indicator to /dashboard page                                                                                           │
     │ - Modify ProjectCard to show published page count vs limit                                                                        │
     │ - Add analytics access based on plan                                                                                              │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 5: Admin & Monitoring (Priority 1)                                                                                          │
     │                                                                                                                                   │
     │ 5.1 Admin Dashboard                                                                                                               │
     │                                                                                                                                   │
     │ - Create /admin route (protected)                                                                                                 │
     │ - Display revenue metrics:                                                                                                        │
     │   - MRR (Monthly Recurring Revenue)                                                                                               │
     │   - Total revenue                                                                                                                 │
     │   - Plan distribution chart                                                                                                       │
     │   - Churn rate                                                                                                                    │
     │ - User plan management:                                                                                                           │
     │   - Override user plan                                                                                                            │
     │   - Adjust credits (customer service)                                                                                             │
     │   - View usage patterns                                                                                                           │
     │ - Cost tracking:                                                                                                                  │
     │   - Total AI spend                                                                                                                │
     │   - Cost per user by tier                                                                                                         │
     │   - Margin analysis                                                                                                               │
     │                                                                                                                                   │
     │ 5.2 Usage Alerts                                                                                                                  │
     │                                                                                                                                   │
     │ - Create email alert system                                                                                                       │
     │   - 80% credit usage warning                                                                                                      │
     │   - 100% credit exhausted                                                                                                         │
     │   - Trial ending (2 days before)                                                                                                  │
     │   - Payment failed notification                                                                                                   │
     │ - Log anomalous usage patterns                                                                                                    │
     │ - Admin alerts for high-cost users                                                                                                │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ PHASE 6: Testing & Edge Cases (Priority 0)                                                                                        │
     │                                                                                                                                   │
     │ 6.1 Stripe Testing                                                                                                                │
     │                                                                                                                                   │
     │ - Test checkout flow with test cards                                                                                              │
     │ - Test webhook events with Stripe CLI                                                                                             │
     │ - Test trial period activation/expiration                                                                                         │
     │ - Test subscription upgrades/downgrades                                                                                           │
     │ - Test payment failures & retries                                                                                                 │
     │ - Test subscription cancellations                                                                                                 │
     │                                                                                                                                   │
     │ 6.2 Credit System Testing                                                                                                         │
     │                                                                                                                                   │
     │ - Test credit deduction accuracy                                                                                                  │
     │ - Test race conditions (concurrent requests)                                                                                      │
     │ - Test credit exhaustion blocking                                                                                                 │
     │ - Test monthly credit reset                                                                                                       │
     │ - Test usage event logging                                                                                                        │
     │                                                                                                                                   │
     │ 6.3 Edge Cases                                                                                                                    │
     │                                                                                                                                   │
     │ - Handle webhook delivery failures (retry logic)                                                                                  │
     │ - Handle credit deduction failures (rollback)                                                                                     │
     │ - Handle Stripe API downtime (graceful degradation)                                                                               │
     │ - Handle existing sessions during plan changes                                                                                    │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Files to Create (New)                                                                                                             │
     │                                                                                                                                   │
     │ Database:                                                                                                                         │
     │ - Update prisma/schema.prisma (3 new models)                                                                                      │
     │                                                                                                                                   │
     │ Utilities:                                                                                                                        │
     │ - src/lib/planManager.ts (~200 lines)                                                                                             │
     │ - src/lib/creditSystem.ts (~300 lines)                                                                                            │
     │ - src/lib/middleware/planCheck.ts (~150 lines)                                                                                    │
     │                                                                                                                                   │
     │ API Routes:                                                                                                                       │
     │ - src/app/api/stripe/create-checkout-session/route.ts (~150 lines)                                                                │
     │ - src/app/api/stripe/create-portal-session/route.ts (~80 lines)                                                                   │
     │ - src/app/api/stripe/webhooks/route.ts (~400 lines)                                                                               │
     │                                                                                                                                   │
     │ Pages:                                                                                                                            │
     │ - src/app/pricing/page.tsx (~300 lines)                                                                                           │
     │ - src/app/dashboard/billing/page.tsx (~400 lines)                                                                                 │
     │ - src/app/admin/page.tsx (~500 lines) [Priority 1]                                                                                │
     │                                                                                                                                   │
     │ Components:                                                                                                                       │
     │ - src/components/billing/CreditBadge.tsx (~100 lines)                                                                             │
     │ - src/components/billing/OutOfCreditsModal.tsx (~150 lines)                                                                       │
     │ - src/components/billing/PreOperationConfirm.tsx (~100 lines)                                                                     │
     │ - src/components/pricing/PricingTable.tsx (~300 lines)                                                                            │
     │ - src/components/pricing/PricingFAQ.tsx (~150 lines)                                                                              │
     │                                                                                                                                   │
     │ Total New Code: ~3,300 lines                                                                                                      │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Files to Modify (Existing)                                                                                                        │
     │                                                                                                                                   │
     │ 1. src/lib/rateLimit.ts - Add tier-based configs                                                                                  │
     │ 2. src/app/api/generate-landing/route.ts - Add credit checks                                                                      │
     │ 3. src/app/api/regenerate-section/route.ts - Add rate limit + credits                                                             │
     │ 4. src/app/api/regenerate-element/route.ts - Add rate limit + credits                                                             │
     │ 5. src/app/api/infer-fields/route.ts - Add credit checks                                                                          │
     │ 6. src/app/edit/[token]/page.tsx - Add credit badge                                                                               │
     │ 7. src/components/dashboard/ProjectCard.tsx - Show limits                                                                         │
     │ 8. src/app/dashboard/page.tsx - Show plan info                                                                                    │
     │                                                                                                                                   │
     │ Total Modified Files: ~8 files                                                                                                    │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Environment Variables Required                                                                                                    │
     │                                                                                                                                   │
     │ # Stripe                                                                                                                          │
     │ STRIPE_SECRET_KEY=sk_test_...                                                                                                     │
     │ STRIPE_PUBLISHABLE_KEY=pk_test_...                                                                                                │
     │ STRIPE_WEBHOOK_SECRET=whsec_...                                                                                                   │
     │                                                                                                                                   │
     │ # Stripe Product IDs (after creating in dashboard)                                                                                │
     │ STRIPE_PRO_MONTHLY_PRICE_ID=price_...                                                                                             │
     │ STRIPE_PRO_ANNUAL_PRICE_ID=price_...                                                                                              │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Implementation Order                                                                                                              │
     │                                                                                                                                   │
     │ 1. Day 1-2: Phase 1 (Database + Core utilities)                                                                                   │
     │ 2. Day 3-4: Phase 2 (Stripe integration)                                                                                          │
     │ 3. Day 5-6: Phase 3 (AI endpoint protection) - CRITICAL                                                                           │
     │ 4. Day 7-9: Phase 4 (User-facing UI)                                                                                              │
     │ 5. Day 10: Phase 6 (Testing)                                                                                                      │
     │ 6. Day 11-12: Phase 5 (Admin dashboard) - If time permits                                                                         │
     │                                                                                                                                   │
     │ Estimated Total Time: 10-12 days                                                                                                  │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Critical Security Notes                                                                                                           │
     │                                                                                                                                   │
     │ 1. Webhook signature verification - Must validate Stripe signatures                                                               │
     │ 2. Idempotency - Use database transactions for credit deductions                                                                  │
     │ 3. Race conditions - Lock user records during credit operations                                                                   │
     │ 4. API key security - Never expose Stripe secret keys to frontend                                                                 │
     │ 5. Rate limiting - Apply to ALL AI endpoints (currently 2 are unprotected!)                                                       │
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Success Criteria                                                                                                                  │
     │                                                                                                                                   │
     │ - ✅ All 4 tiers defined in database                                                                                               
│
     │ - ✅ Free & Pro features fully implemented                                                                                         
│
     │ - ✅ Agency & Enterprise foundation laid (models, but no features)                                                                 
│
     │ - ✅ Stripe checkout works end-to-end                                                                                              
│
     │ - ✅ Credit system accurately tracks all AI operations                                                                             
│
     │ - ✅ Rate limiting applied to ALL AI endpoints                                                                                     
│
     │ - ✅ Users can upgrade/downgrade/cancel via portal                                                                                 
│
     │ - ✅ Webhooks handle all subscription events                                                                                       
│
     │ - ✅ Credit badge shows real-time balance                                                                                          
│
     │ - ✅ Zero credit leakage (all operations tracked)                                                                                  
│
     │                                                                                                                                   │
     │ ---                                                                                                                               │
     │ Unresolved Questions                                                                                                              │
     │                                                                                                                                   │
     │ None - all clarified via user responses.            

     ====================

     Testing guide

     ● Manual Testing Guide - Pricing System

  Complete step-by-step guide to test all features of the pricing system.

  ---
  Prerequisites

  Before starting, ensure:
  1. ✅ Dev server is running: npm run dev
  2. ✅ Database is accessible (Prisma migrations applied)
  3. ✅ Stripe CLI is installed and configured
  4. ✅ Environment variables are set in .env.local

  ---
  Part 1: Stripe Setup & Webhook Testing

  Step 1: Start Stripe Webhook Forwarding

  # In a separate terminal
  stripe login
  stripe listen --forward-to localhost:3000/api/stripe/webhooks

  Expected Output:
  > Ready! Your webhook signing secret is whsec_xxxxx

  Action: Copy the webhook secret to .env.local:
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx

  Step 2: Verify Stripe Products Exist

  1. Go to https://dashboard.stripe.com/test/products
  2. Ensure you have created:
    - Pro Monthly: $39/month
    - Pro Annual: $348/year
  3. Copy Price IDs to .env.local:
  STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
  STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx

  Step 3: Restart Dev Server

  # Stop and restart to load new env vars
  npm run dev

  ---
  Part 2: Database State Testing

  Test 2.1: Verify Default Plan Creation

  Scenario: New user should get FREE plan automatically.

  Steps:
  1. Sign up as a new user via Clerk
  2. Open database viewer (Prisma Studio):
  npx prisma studio
  3. Navigate to UserPlan table
  4. Find your user by userId (Clerk ID)

  Expected Results:
  ✅ UserPlan record exists
  ✅ tier = "FREE"
  ✅ creditsLimit = 30
  ✅ publishedPagesLimit = 1
  ✅ status = "active"
  ✅ stripeCustomerId = null

  Test 2.2: Verify Usage Record Creation

  Steps:
  1. In Prisma Studio, navigate to UserUsage table
  2. Find record for current period (e.g., "2025-01")

  Expected Results:
  ✅ UserUsage record exists
  ✅ creditsUsed = 0
  ✅ creditsRemaining = 30
  ✅ creditsLimit = 30
  ✅ period = "2025-01" (current month)

  If No Record: It will be created on first AI operation.

  ---
  Part 3: Credit System Testing

  Test 3.1: Check Credit Balance (API)

  Steps:
  1. Open browser DevTools (F12) → Network tab
  2. Navigate to: http://localhost:3000/api/credits/balance
  3. Check response

  Expected Response:
  {
    "used": 0,
    "remaining": 30,
    "limit": 30,
    "percentUsed": 0,
    "daysUntilReset": 15,
    "nextResetDate": "2025-02-01T00:00:00.000Z",
    "tier": "FREE"
  }

  Test 3.2: Generate Landing Page (10 Credits)

  Steps:
  1. Go to onboarding flow: http://localhost:3000
  2. Fill out business details
  3. Click "Generate Landing Page"
  4. Wait for generation to complete

  Monitor:
  - Check terminal logs for credit deduction
  - Watch for: "Deducted 10 credits from user..."

  Verify in Database:
  1. Open Prisma Studio → UserUsage table
  2. Refresh data

  Expected Results:
  ✅ creditsUsed = 10
  ✅ creditsRemaining = 20
  ✅ fullPageGens = 1

  Verify in Response:
  Check browser DevTools → Network tab → Response from /api/generate-landing:
  {
    "content": {...},
    "creditsUsed": 10,
    "creditsRemaining": 20
  }

  Test 3.3: Regenerate Section (2 Credits)

  Steps:
  1. In the editor (/edit/[token]), hover over a section
  2. Click the section toolbar → "Regenerate Section"
  3. Wait for regeneration

  Expected Results:
  ✅ creditsUsed = 12 (10 + 2)
  ✅ creditsRemaining = 18
  ✅ sectionRegens = 1

  Test 3.4: Regenerate Element (1 Credit)

  Steps:
  1. Click on any text element
  2. Click "Generate Variations" in toolbar
  3. Select a variation

  Expected Results:
  ✅ creditsUsed = 13
  ✅ creditsRemaining = 17
  ✅ elementRegens = 1

  Test 3.5: Test Credit Exhaustion

  Steps:
  1. Note your current credits (e.g., 17 remaining)
  2. Try to generate a landing page (needs 10 credits)
  3. Repeat until you have < 10 credits left
  4. Try one more page generation

  Expected Results:
  ✅ Request blocked BEFORE generation
  ✅ HTTP 402 status code
  ✅ Error message: "Insufficient credits"
  ✅ Response includes:
  {
    "error": "Insufficient credits. Required: 10, Available: 5",
    "code": "INSUFFICIENT_CREDITS"
  }

  Verify in Database:
  ✅ Credits NOT deducted (operation didn't run)
  ✅ No new UsageEvent logged

  ---
  Part 4: Pricing Page Testing

  Test 4.1: View Pricing Page

  Steps:
  1. Navigate to: http://localhost:3000/pricing
  2. Verify all tiers are visible

  Expected Results:
  ✅ 4 pricing cards displayed:
     - Launch (FREE): $0
     - Pro: $39/mo (or $29/mo annual)
     - Scale: $129/mo (Coming Soon)
     - Custom: $299/mo (Coming Soon)
  ✅ "Most Popular" badge on Pro tier
  ✅ Annual/Monthly toggle works
  ✅ Discount badge shows "25% off" on annual

  Test 4.2: Monthly vs Annual Pricing

  Steps:
  1. Click "Annual" toggle
  2. Check Pro tier pricing

  Expected Results:
  ✅ Price changes to $29/month
  ✅ Shows "(save $120)" calculation
  ✅ Billed annually text appears

  Test 4.3: Start Free Trial Flow

  Steps:
  1. Ensure you're logged in
  2. Click "Start Free Trial" on Pro tier
  3. Monitor browser console and network

  Expected:
  ✅ POST request to /api/stripe/create-checkout-session
  ✅ Request body:
  {
    "tier": "PRO",
    "billingInterval": "monthly"
  }
  ✅ Response includes checkout URL
  ✅ Browser redirects to Stripe Checkout

  ---
  Part 5: Stripe Checkout Testing

  Test 5.1: Complete Checkout with Trial

  Steps:
  1. On Stripe Checkout page, enter test card:
    - Card: 4242 4242 4242 4242
    - Expiry: Any future date (e.g., 12/25)
    - CVC: Any 3 digits (e.g., 123)
    - ZIP: Any 5 digits (e.g., 12345)
  2. Enter email and name
  3. Click "Subscribe"

  Expected:
  ✅ Checkout completes successfully
  ✅ Redirects to: /dashboard/billing?session_id=cs_xxx&success=true
  ✅ Success banner shows: "Subscription activated!"

  Test 5.2: Verify Webhook Events

  Check Stripe CLI Terminal:
  ✅ checkout.session.completed [200]
  ✅ customer.subscription.created [200]

  Check App Logs:
  ✅ "Checkout completed for user..."
  ✅ "Subscription created for user..."
  ✅ "Upgraded user xxx to PRO"
  ✅ "Started 14-day trial for user..."

  Test 5.3: Verify Database After Checkout

  Prisma Studio → UserPlan:
  ✅ tier = "PRO"
  ✅ status = "trialing"
  ✅ isTrialing = true
  ✅ trialStart = (timestamp)
  ✅ trialEnd = (14 days from now)
  ✅ creditsLimit = 200
  ✅ stripeCustomerId = "cus_xxxxx"
  ✅ stripeSubscriptionId = "sub_xxxxx"
  ✅ currentPeriodEnd = (30 days from now)

  Prisma Studio → UserUsage:
  ✅ creditsLimit = 200 (updated from 30)
  ✅ creditsRemaining = 200 (reset)
  ✅ creditsUsed = 0 (reset)

  ---
  Part 6: Credit Badge Testing

  Test 6.1: View Credit Badge

  Steps:
  1. Navigate to editor: /edit/[token]
  2. Look for credit badge in header

  Expected:
  ✅ Badge shows: "200/200" (or current balance)
  ✅ Badge is GREEN (< 80% used)
  ✅ Coin icon visible

  Test 6.2: Hover Tooltip

  Steps:
  1. Hover over credit badge
  2. Wait for tooltip to appear

  Expected Tooltip Content:
  ✅ Title: "AI Credits"
  ✅ Tier badge: "PRO"
  ✅ Progress bar showing usage
  ✅ "Used: X / 200"
  ✅ "Resets in X days"
  ✅ Credit costs reference table

  Test 6.3: Low Credits Warning

  Steps:
  1. Use credits until < 20% remaining (use > 160 credits)
  2. Hover on badge

  Expected:
  ✅ Badge color changes to YELLOW
  ✅ Tooltip shows warning banner
  ✅ "Running low on credits" message
  ✅ "Upgrade to Pro" link visible

  Test 6.4: Out of Credits State

  Steps:
  1. Use all 200 credits (generate 20 pages)
  2. Check badge

  Expected:
  ✅ Badge color changes to RED
  ✅ Shows alert icon instead of coin
  ✅ Shows "0/200"
  ✅ Tooltip shows "Out of credits! Upgrade for more."

  ---
  Part 7: Out of Credits Modal Testing

  Test 7.1: Trigger Modal

  Steps:
  1. With 0 credits remaining
  2. Try to generate a landing page

  Expected:
  ✅ Request fails with 402 error
  ✅ Modal appears automatically
  ✅ Shows: "Out of AI Credits"
  ✅ Displays: "You need 10 credits but only have 0"

  Test 7.2: Modal Content

  Verify Modal Contains:
  ✅ Option 1: Upgrade to Pro
     - $39/month pricing
     - "14-day free trial included"
     - Blue "Start Free Trial" button
  ✅ Option 2: Wait for Reset
     - "Resets in X days" countdown
     - "Free plan: 30 credits/month"
  ✅ Credit costs reference table
  ✅ Close button (X) in top right

  Test 7.3: Modal Actions

  Test Close:
  1. Click X button
  2. Modal disappears

  Test Upgrade:
  1. Click "Start Free Trial"
  2. Redirects to /pricing

  ---
  Part 8: Billing Dashboard Testing

  Test 8.1: View Billing Dashboard

  Steps:
  1. Navigate to: http://localhost:3000/dashboard/billing

  Expected Layout:
  ✅ Title: "Billing & Usage"
  ✅ Two main cards:
     1. Current Plan Card
     2. Credit Usage Card
  ✅ Usage History section (placeholder)

  Test 8.2: Current Plan Card (Pro Trial)

  Expected Content:
  ✅ Plan name: "PRO"
  ✅ Trial badge: "Trial ends [date]"
  ✅ Monthly Credits: 200
  ✅ Status: "trialing" (in blue)
  ✅ Button: "Manage Subscription"

  Test 8.3: Credit Usage Card

  Expected Content:
  ✅ Large number: Credits remaining
  ✅ Text: "/ 200 credits"
  ✅ Progress bar (color-coded)
  ✅ "X credits used this month"
  ✅ Operation breakdown:
     - Page generations: X
     - Section regenerations: X
     - Element regenerations: X
     - Field inferences: X

  Test 8.4: Open Customer Portal

  Steps:
  1. Click "Manage Subscription" button
  2. Watch network requests

  Expected:
  ✅ POST to /api/stripe/create-portal-session
  ✅ Response includes portal URL
  ✅ Browser redirects to Stripe Customer Portal
  ✅ Can see subscription details
  ✅ Can update payment method
  ✅ Can cancel subscription

  In Stripe Portal:
  ✅ Shows Pro plan ($39/month)
  ✅ Shows trial end date
  ✅ Shows next billing date
  ✅ Can click "Cancel subscription"

  ---
  Part 9: Subscription Lifecycle Testing

  Test 9.1: Cancel Subscription During Trial

  Steps:
  1. In Stripe Customer Portal, click "Cancel subscription"
  2. Confirm cancellation
  3. Return to app

  Monitor Stripe CLI:
  ✅ customer.subscription.updated [200]
  ✅ customer.subscription.deleted [200]

  Check App Logs:
  ✅ "Subscription deleted for user..."
  ✅ "Successfully downgraded user to FREE"

  Verify Database:
  ✅ UserPlan.tier = "FREE"
  ✅ UserPlan.status = "active"
  ✅ UserPlan.isTrialing = false
  ✅ UserPlan.stripeCustomerId = null
  ✅ UserPlan.stripeSubscriptionId = null
  ✅ UserPlan.creditsLimit = 30

  Test 9.2: Simulate Trial End (Conversion to Paid)

  Use Stripe CLI to simulate:
  stripe trigger customer.subscription.trial_will_end

  Expected Webhook:
  ✅ customer.subscription.trial_will_end [200]
  ✅ Log: "Trial ending soon for user..."

  Simulate Payment Success:
  stripe trigger invoice.payment_succeeded

  Expected:
  ✅ invoice.payment_succeeded [200]
  ✅ Log: "Payment succeeded for user..."
  ✅ Log: "Successfully reset credits for user..."

  Verify Database:
  ✅ UserPlan.status = "active" (changed from "trialing")
  ✅ UserPlan.isTrialing = false
  ✅ UserUsage credits reset to 200

  Test 9.3: Simulate Payment Failure

  Steps:
  stripe trigger invoice.payment_failed

  Expected:
  ✅ invoice.payment_failed [200]
  ✅ Log: "Payment failed for user..."
  ✅ Log: "Marked user as past_due"

  Verify Database:
  ✅ UserPlan.status = "past_due"

  Test 9.4: Monthly Credit Reset

  Simulate next billing cycle:
  stripe trigger invoice.payment_succeeded

  Verify Database:
  ✅ New UserUsage record created for next period
  ✅ creditsUsed = 0
  ✅ creditsRemaining = 200
  ✅ All operation counters = 0

  ---
  Part 10: Feature Gates Testing

  Test 10.1: Published Pages Limit (FREE)

  Steps:
  1. Downgrade to FREE tier (cancel subscription)
  2. Publish your first landing page
  3. Try to publish a second page

  Expected:
  ✅ First publish: SUCCESS
  ✅ Second publish: BLOCKED
  ✅ HTTP 403 status
  ✅ Error message: "Published pages limit reached"
  ✅ Message: "Your plan allows up to 1 published page(s). Upgrade to publish more."

  Test 10.2: Published Pages Limit (PRO)

  Steps:
  1. Upgrade to PRO
  2. Publish 10 different pages
  3. Try to publish 11th page

  Expected:
  ✅ Pages 1-10: SUCCESS
  ✅ Page 11: BLOCKED
  ✅ Error: "Limit reached"
  ✅ Current: 10, Limit: 10

  ---
  Part 11: Rate Limiting Testing

  Test 11.1: FREE Tier Rate Limit (5 req/min)

  Steps:
  1. Ensure you're on FREE tier
  2. Rapidly click "Regenerate Section" 6 times within 1 minute

  Expected:
  ✅ Requests 1-5: SUCCESS (200)
  ✅ Request 6: BLOCKED (429 Too Many Requests)
  ✅ Response: "Rate limit exceeded"
  ✅ Headers include:
     - X-RateLimit-Limit: 5
     - X-RateLimit-Remaining: 0
     - Retry-After: (seconds until reset)

  Test 11.2: PRO Tier Rate Limit (10 req/min)

  Steps:
  1. Upgrade to PRO
  2. Rapidly make 11 requests within 1 minute

  Expected:
  ✅ Requests 1-10: SUCCESS
  ✅ Request 11: BLOCKED (429)
  ✅ X-RateLimit-Limit: 10

  ---
  Part 12: End-to-End User Journey

  Journey 1: New User → Trial → Paid

  Steps:
  1. Sign up as new user
  2. Generate 1 landing page (uses 10 credits)
  3. Check: 20/30 credits remaining
  4. Run out of credits (generate 2 more pages)
  5. See "Out of Credits" modal
  6. Click "Upgrade to Pro"
  7. Complete Stripe checkout with trial
  8. Return to dashboard
  9. See "Trial ends in 14 days"
  10. Check credits: 200/200
  11. Generate 10 more pages (uses 100 credits)
  12. Check: 100/200 remaining
  13. Wait 14 days (simulate with webhook)
  14. Trial converts to paid
  15. Card charged $39
  16. Check: Still 100/200 (no reset yet)
  17. Wait for next billing cycle
  18. Credits reset to 200/200

  Simulation Commands:
  # Simulate trial end + conversion
  stripe trigger customer.subscription.updated

  # Simulate monthly billing
  stripe trigger invoice.payment_succeeded

  Journey 2: User Cancels During Trial

  Steps:
  1. Start trial
  2. Use 50 credits
  3. Cancel subscription in Stripe portal
  4. Check credits: 150/200 (still has trial access)
  5. Trial ends (14 days)
  6. Auto-downgrade to FREE
  7. Credits reset to 30/30

  ---
  Part 13: Error Handling Testing

  Test 13.1: Invalid Stripe Price ID

  Steps:
  1. Set invalid price ID in .env.local:
  STRIPE_PRO_MONTHLY_PRICE_ID=price_invalid
  2. Try to upgrade

  Expected:
  ✅ Stripe API returns error
  ✅ User sees: "Pricing configuration error"
  ✅ Log: "Stripe price ID not configured"

  Test 13.2: Webhook Signature Failure

  Steps:
  1. Set wrong webhook secret
  2. Send test webhook

  Expected:
  ✅ HTTP 400 Bad Request
  ✅ Log: "Webhook signature verification failed"
  ✅ Event NOT processed

  Test 13.3: Database Connection Failure

  Steps:
  1. Stop database
  2. Try to check credit balance

  Expected:
  ✅ HTTP 500 Internal Server Error
  ✅ Log: "Error getting user plan"
  ✅ Graceful error message to user

  ---
  Testing Checklist

  Use this checklist to track your testing progress:

  Database & Infrastructure

  - Default FREE plan created on signup
  - UserUsage record created automatically
  - Credit balance API returns correct data
  - Plan info API returns correct data

  Credit System

  - Page generation deducts 10 credits
  - Section regen deducts 2 credits
  - Element regen deducts 1 credit
  - Field inference deducts 1 credit
  - Credit exhaustion blocks operations (402)
  - UsageEvent logs all operations
  - Credits reset on billing cycle

  Stripe Integration

  - Checkout session created successfully
  - Checkout completes with test card
  - Webhook events received and processed
  - Trial period activated correctly
  - Customer portal opens
  - Subscription cancellation works
  - Payment success resets credits
  - Payment failure marks past_due

  User Interface

  - Pricing page displays all 4 tiers
  - Monthly/annual toggle works
  - Credit badge shows in editor
  - Credit badge color changes correctly
  - Credit badge tooltip shows details
  - Out of Credits modal appears on 402
  - Billing dashboard shows plan info
  - Billing dashboard shows usage stats
  - Upgrade buttons work

  Feature Gates

  - Published pages limit enforced (FREE: 1)
  - Published pages limit enforced (PRO: 10)
  - Updates to existing pages allowed

  Rate Limiting

  - FREE tier: 5 requests/minute enforced
  - PRO tier: 10 requests/minute enforced
  - 429 error returned when exceeded
  - Rate limit headers included

  Edge Cases

  - Invalid Stripe config handled
  - Webhook signature validation works
  - Database errors handled gracefully
  - Concurrent credit deductions work
  - Race conditions prevented

  ---
  Common Issues & Solutions

  Issue: Webhook events not received

  Solution:
  1. Check Stripe CLI is running
  2. Verify webhook secret in .env.local
  3. Restart dev server after changing env vars

  Issue: "Price ID not configured" error

  Solution:
  1. Go to Stripe Dashboard → Products
  2. Copy Price ID (starts with price_)
  3. Add to .env.local
  4. Restart server

  Issue: Credits not resetting

  Solution:
  1. Manually trigger webhook:
  stripe trigger invoice.payment_succeeded
  2. Check logs for "Successfully reset credits"
  3. Verify UserUsage table in Prisma Studio

  Issue: Rate limiting not working

  Solution:
  1. Clear rate limit store (restart server)
  2. Check X-RateLimit-* headers in response
  3. Verify tier-based limits in code

  ---
  Next Steps After Testing

  Once testing is complete:

  1. Fix Any Bugs Found
    - Document issues
    - Create fixes
    - Re-test
  2. Switch to Production Mode
    - Create live Stripe products
    - Get live API keys
    - Set up production webhook endpoint
    - Update env vars on hosting platform
  3. Monitor in Production
    - Watch Stripe dashboard
    - Check server logs
    - Monitor credit usage patterns
    - Track conversion rates

  Testing complete? You're ready to launch! 🚀