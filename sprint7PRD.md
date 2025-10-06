# Sprint 7 PRD: Pricing Plans & Landing Page Analytics

**Sprint Duration:** TBD
**Sprint Goals:**
1. Implement pricing/subscription system with usage-based quotas
2. Add landing page analytics for published pages

---

## 🎯 Objective 1: Pricing Plans & Monetization

### Product Vision
Transform Lessgo from a free tool to a sustainable SaaS business by implementing a tiered pricing model that:
- Aligns pricing with value delivered (time saved, pages created)
- Protects against AI cost abuse through credit-based quotas
- Creates clear upgrade incentives based on usage limits

### Value Proposition Analysis

**Current Platform Capabilities:**
- AI-powered landing page generation (2-phase: strategy + copy)
- 157 pre-built UIBlock components across 21 section types
- Visual editor with inline editing, theme system, form builder
- Publishing infrastructure with custom slugs
- Form submission handling with integrations
- Token-based project access

**User Value:**
- **Time savings:** 10-20 hours → 30 minutes per landing page
- **Cost savings:** $500-2,000 (traditional copywriter + designer) → $0-39/month
- **Quality:** Conversion-optimized copy with strategic frameworks
- **Iteration speed:** Minutes vs. days for revisions

**Cost Structure:**
- AI generation (primary cost): ~$0.035 per full page generation
- Section regeneration: ~$0.007 per operation
- Element regeneration: ~$0.0015 per operation
- Database/hosting: ~$1-3 per user/month
- Support: ~$2-5 per Pro user/month

---

## 📊 Pricing Tiers

### Free Tier - "Launch"
**Price:** $0/month

**Limits:**
- 30 AI credits/month
- 1 published page
- 3 draft projects
- 100 form submissions/month
- Basic color themes (5 presets)
- Standard fonts (10 themes)

**Features:**
- All core generation features
- Visual editor access
- Device preview
- Form builder (basic)
- Lessgo.ai branding on published pages
- Community support

**Cost to Serve:** ~$0.10 (AI) + $1.00 (infrastructure) = $1.10/user/month
**Goal:** User acquisition, product validation, conversion funnel entry point

---

### Pro Tier - "Grow"
**Price:** $39/month (or $29/month billed annually)

**Limits:**
- 200 AI credits/month
- 10 published pages
- Unlimited drafts
- 1,000 form submissions/month
- 3 custom domains

**Features:**
- All Free tier features +
- **Remove Lessgo.ai branding**
- **Custom domain support**
- Full color system (unlimited custom colors)
- All font themes (40+ combinations)
- **Form integrations** (ConvertKit, Mailchimp, Webhooks)
- **Analytics dashboard** (views, submissions, conversions)
- Priority email support (24-hour response)
- Export analytics data

**Cost to Serve:** ~$0.70 (AI) + $1.00 (infra) + $3.00 (support) = $4.70/user/month
**Margin:** $34.30/user (88% margin at $39)
**Target Persona:** Solo founders, small businesses, indie makers

---

### Agency Tier - "Scale"
**Price:** $129/month (or $99/month billed annually)

**Limits:**
- 1,000 AI credits/month
- Unlimited published pages
- Unlimited drafts
- 10,000 form submissions/month
- Unlimited custom domains

**Features:**
- All Pro tier features +
- **White-label** (remove all branding, add agency branding)
- **Client workspaces** (separate project management)
- **Export HTML/CSS** (download full page code)
- Advanced integrations (Zapier, API webhooks)
- Team collaboration (up to 5 users)
- Priority support (6-hour response)
- Advanced analytics (heatmaps, funnel analysis)
- Usage reports per client
- Dedicated account manager (on request)

**Cost to Serve:** ~$3.50 (AI) + $3.00 (infra) + $5.00 (support) = $11.50/user/month
**Margin:** $117.50/user (91% margin at $129)
**Target Persona:** Agencies, freelancers, consultants building for clients

---

### Enterprise Tier - "Custom"
**Price:** Starting at $299/month (custom pricing)

**Features:**
- Everything in Agency +
- Custom AI credit limits
- Dedicated support & SLA guarantees
- Custom integrations
- Training & onboarding sessions
- Volume discounts
- Custom contract terms
- Unlimited team members
- SSO/SAML authentication
- Advanced security features

**Target Persona:** Large teams, high-volume users, enterprises

---

## 🪙 Credit-Based Quota System

### Why Credits?

**Problem:** Without credit system, users can abuse regeneration features:
- Generate 1 page (uses 1 "generation" quota)
- Regenerate sections/elements 1000 times (no cost tracking)
- Result: $30-50+ in untracked AI costs

**Solution:** Unified credit system that tracks ALL AI operations

### Credit Costs

| Operation | Avg Tokens | AI Cost | Credit Cost |
|-----------|-----------|---------|-------------|
| Full page generation | 7,000 | $0.035 | **10 credits** |
| Section regeneration | 1,500 | $0.007 | **2 credits** |
| Element regeneration | 300 | $0.0015 | **1 credit** |
| Field inference | 500 | $0.002 | **1 credit** |
| Field validation (per field) | 100 | $0.0005 | **0 credits** (free) |

### Credit Allocation Examples

**Free Tier (30 credits):**
- 3 full pages, OR
- 1 full page + 10 section regens, OR
- 1 full page + 5 section regens + 10 element regens, OR
- 30 element regenerations

**Pro Tier (200 credits):**
- 20 full pages, OR
- 10 full pages + 50 section regens, OR
- Flexible mix of operations

**Agency Tier (1,000 credits):**
- 100 full pages, OR
- 50 full pages + 250 section regens, OR
- Highly flexible usage

### Credit Top-Ups (À La Carte)

**Add-on packs for when users exceed monthly quota:**
- $5 for 50 credits
- $10 for 100 credits (5% discount)
- $20 for 250 credits (20% discount)

---

## 🔐 Abuse Prevention & Rate Limiting

### Current State (CRITICAL ISSUE)

**Protected endpoints:**
✅ `/api/generate-landing` - Rate limited (5 req/min)
✅ `/api/infer-fields` - Rate limited (5 req/min)
✅ `/api/regenerate-content` - Rate limited (5 req/min)
✅ `/api/validate-fields` - Rate limited (5 req/min)

**Unprotected endpoints (MUST FIX):**
❌ `/api/regenerate-section` - NO rate limiting
❌ `/api/regenerate-element` - NO rate limiting

### Required Protection Layers

#### 1. API Rate Limiting (Per-Minute)

```typescript
// Apply to ALL AI endpoints
const RATE_LIMITS_BY_TIER = {
  FREE: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  },
  PRO: {
    maxRequests: 10,
    windowMs: 60000,
  },
  AGENCY: {
    maxRequests: 20,
    windowMs: 60000,
    burstAllowance: 50, // 50 requests per 5 minutes
  }
};
```

#### 2. Credit Quota Enforcement

- Check credit balance before EVERY AI operation
- Return 402 (Payment Required) if credits exhausted
- Track credits used per operation type
- Reset credits on billing cycle renewal

#### 3. Session-Based Throttling

```typescript
const SESSION_LIMITS = {
  FREE: {
    maxRegenPerSession: 5,
    cooldownMs: 10000, // 10 seconds between regens
  },
  PRO: {
    maxRegenPerSession: 20,
    cooldownMs: 5000, // 5 seconds
  },
  AGENCY: {
    maxRegenPerSession: 50,
    cooldownMs: 2000, // 2 seconds
  }
};
```

#### 4. Frontend Debouncing

- Disable regenerate buttons for 3 seconds after click
- Show loading state during operation
- Display credit cost before operation ("This will use 2 credits")

---

## 💾 Database Schema Changes

### New Tables

#### UserPlan
```prisma
model UserPlan {
  id              String   @id @default(cuid())
  userId          String   @unique

  // Plan details
  tier            String   @default("FREE") // FREE, PRO, AGENCY, ENTERPRISE
  status          String   @default("active") // active, cancelled, past_due

  // Billing
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?

  // Credit limits
  creditsLimit    Int      @default(30)

  // Feature limits
  publishedPagesLimit Int   @default(1)
  customDomainsLimit  Int   @default(0)
  formSubmissionsLimit Int  @default(100)
  teamMembersLimit    Int   @default(1)

  // Features enabled
  removeBranding  Boolean  @default(false)
  customDomains   Boolean  @default(false)
  formIntegrations Boolean @default(false)
  exportHTML      Boolean  @default(false)
  whiteLabel      Boolean  @default(false)
  analytics       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([stripeCustomerId])
}
```

#### UserUsage
```prisma
model UserUsage {
  id            String   @id @default(cuid())
  userId        String
  period        String   // "2024-03" (YYYY-MM)

  // AI operation counts
  fullPageGens  Int      @default(0)
  sectionRegens Int      @default(0)
  elementRegens Int      @default(0)
  fieldInference Int     @default(0)

  // Token tracking (for analytics)
  totalTokens   Int      @default(0)
  inputTokens   Int      @default(0)
  outputTokens  Int      @default(0)

  // Credit system
  creditsUsed   Int      @default(0)
  creditsLimit  Int      @default(30)
  creditsRemaining Int   @default(30)

  // Cost tracking (internal analytics)
  estimatedCost Float    @default(0)

  // Published resource counts
  publishedPages Int     @default(0)
  draftProjects  Int     @default(0)
  formSubmissions Int    @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, period])
  @@index([userId])
  @@index([period])
}
```

#### UsageEvent
```prisma
model UsageEvent {
  id          String   @id @default(cuid())
  userId      String

  // Event details
  eventType   String   // "page_generation", "section_regen", "element_regen", etc.
  creditsUsed Int
  tokensUsed  Int?
  estimatedCost Float?

  // Context
  projectId   String?
  sectionId   String?
  metadata    Json?    // Store additional context

  // Request tracking
  endpoint    String?
  duration    Int?     // milliseconds
  success     Boolean  @default(true)
  errorMessage String?

  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([eventType])
  @@index([createdAt])
}
```

---

## 🛠️ Technical Implementation

### Phase 1: Plan System Foundation (P0 - Must Have)

#### 1.1 User Plan Management
- [ ] Create UserPlan model and migration
- [ ] Add plan tier enum (FREE, PRO, AGENCY, ENTERPRISE)
- [ ] Create default plan assignment on user signup
- [ ] Build plan checking middleware
- [ ] Create plan upgrade/downgrade logic

#### 1.2 Credit System Core
- [ ] Create UserUsage model and migration
- [ ] Implement credit deduction logic
- [ ] Add credit balance checking middleware
- [ ] Build credit reset logic (monthly billing cycle)
- [ ] Create UsageEvent logging system

#### 1.3 Rate Limiting Enhancement
- [ ] Add rate limiting to `/api/regenerate-section`
- [ ] Add rate limiting to `/api/regenerate-element`
- [ ] Implement tier-based rate limit configs
- [ ] Add session-based throttling
- [ ] Create rate limit status endpoint

#### 1.4 Stripe Integration
- [ ] Set up Stripe account and API keys
- [ ] Install Stripe SDK and webhooks
- [ ] Create checkout session endpoint
- [ ] Implement subscription creation flow
- [ ] Handle webhook events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Build customer portal integration (manage billing)

#### 1.5 Feature Gates
- [ ] Create feature checking utilities
- [ ] Add published page limit enforcement
- [ ] Add custom domain limit enforcement
- [ ] Add form submission limit tracking
- [ ] Gate branding removal behind Pro tier
- [ ] Gate integrations behind Pro tier
- [ ] Gate HTML export behind Agency tier

### Phase 2: User Experience (P0 - Must Have)

#### 2.1 Pricing Page
- [ ] Design pricing table component
- [ ] Create `/pricing` route
- [ ] Add tier comparison matrix
- [ ] Implement plan selection flow
- [ ] Add FAQ section
- [ ] Link to checkout

#### 2.2 Credit Display & Management
- [ ] Add credit balance widget to editor header
- [ ] Show credit cost before operations
- [ ] Display remaining credits
- [ ] Add "low credits" warning (80% used)
- [ ] Add "out of credits" modal with upgrade CTA
- [ ] Build credit top-up flow

#### 2.3 Billing Dashboard
- [ ] Create `/dashboard/billing` route
- [ ] Display current plan and status
- [ ] Show credit usage (current period)
- [ ] Display operation breakdown
- [ ] Add upgrade/downgrade buttons
- [ ] Link to Stripe customer portal
- [ ] Show billing history

#### 2.4 Usage Analytics (User-Facing)
- [ ] Create `/dashboard/usage` route
- [ ] Display monthly credit usage chart
- [ ] Show operation type breakdown
- [ ] Display project-level usage
- [ ] Add export usage data button

### Phase 3: Admin & Monitoring (P1 - Should Have)

#### 3.1 Admin Dashboard
- [ ] Create admin-only routes
- [ ] Display total revenue metrics
- [ ] Show plan distribution (Free/Pro/Agency)
- [ ] Display MRR and churn rate
- [ ] Add user plan override controls
- [ ] Create credit adjustment tool (customer service)

#### 3.2 Cost Monitoring
- [ ] Build cost tracking dashboard
- [ ] Display total AI spend
- [ ] Show cost per user by tier
- [ ] Track margin per plan
- [ ] Alert on anomalous usage patterns

#### 3.3 Usage Alerts
- [ ] Email alert at 80% credit usage
- [ ] Email alert at 100% credit usage
- [ ] Email alert before billing renewal
- [ ] Slack integration for admin alerts
- [ ] Alert on high-cost users (potential abuse)

### Phase 4: Enhancements (P2 - Nice to Have)

#### 4.1 Advanced Features
- [ ] Team collaboration system
- [ ] Client workspace management (Agency tier)
- [ ] White-label customization UI
- [ ] HTML/CSS export functionality
- [ ] Advanced form integrations (Zapier)
- [ ] API access with key management

#### 4.2 Optimization
- [ ] Implement Redis for rate limiting (replace in-memory)
- [ ] Add caching for plan/usage checks
- [ ] Optimize credit deduction queries
- [ ] Add usage data aggregation jobs
- [ ] Implement credit rollover (bonus feature)

---

## 🎨 UI/UX Requirements

### Pricing Page Design
- Clear tier differentiation with visual hierarchy
- Annual billing toggle (show savings: "Save 25%")
- Feature comparison table (checkmarks for included features)
- Social proof (testimonials, user count)
- FAQ section addressing common objections
- Risk reversal (14-day money-back guarantee)

### Credit System UX
- **Credit balance widget** in editor header:
  ```
  🪙 145/200 credits
  Resets in 12 days
  ```
- **Pre-operation confirmation:**
  ```
  Regenerate Section
  This will use 2 credits
  [Cancel] [Regenerate]
  ```
- **Out of credits modal:**
  ```
  Out of AI Credits
  You've used all 200 credits this month.

  Options:
  - Upgrade to Agency (1,000 credits)
  - Buy credit pack ($10 for 100 credits)
  - Wait 12 days for reset
  ```

### Billing Dashboard
- Current plan card with status badge
- Usage progress bars (credits, pages, forms)
- Operation history table (last 30 days)
- Quick actions: Upgrade, Manage Billing, Add Credits

---

## 📈 Success Metrics

### Business Metrics
- **Conversion Rate:** Free → Pro (Target: 5-10%)
- **MRR:** Monthly recurring revenue (Target: $5,000 by Month 3)
- **Churn Rate:** Monthly cancellations (Target: <5%)
- **ARPU:** Average revenue per user (Target: $25)
- **LTV:CAC Ratio:** Lifetime value vs. acquisition cost (Target: >3:1)

### Technical Metrics
- **Credit deduction accuracy:** 100% (no missed charges)
- **Rate limit effectiveness:** <1% abuse incidents
- **API error rate:** <0.5% on billing operations
- **Page load time:** Billing dashboard <2s
- **Webhook success rate:** >99%

### User Metrics
- **Credits exhaustion rate:** % of users hitting limit (Target: 60% Pro users)
- **Upgrade trigger:** Primary reason for upgrading (track in analytics)
- **Feature usage:** Most valuable gated features
- **Support tickets:** Billing-related issues (Target: <10%)

---

## 🚧 Technical Risks & Mitigations

### Risk 1: Stripe Webhook Failures
**Impact:** Users pay but don't get access
**Mitigation:**
- Implement webhook retry logic (exponential backoff)
- Manual reconciliation script (run daily)
- Alert system for failed webhooks
- Fallback: Users can contact support with receipt

### Risk 2: Credit Tracking Race Conditions
**Impact:** Users exceed credit limit or get double-charged
**Mitigation:**
- Use database transactions for credit deductions
- Implement optimistic locking
- Add idempotency keys to operations
- Build credit audit log for reconciliation

### Risk 3: Plan Migration Complexity
**Impact:** Existing users confused during rollout
**Mitigation:**
- Grandfather existing users on "Legacy Free" plan
- Email campaign explaining changes
- Grace period (30 days) before enforcement
- In-app announcements and tutorials

### Risk 4: AI Cost Overruns
**Impact:** Credit calculations underestimate actual costs
**Mitigation:**
- Log actual token usage vs. estimated credits
- Weekly cost analysis and adjustment
- Safety buffer (20%) in credit calculations
- Alert if actual cost exceeds 80% of revenue

---

## 🎯 Objective 2: Landing Page Analytics

### Product Vision
Validate Lessgo's core value proposition ("conversion-optimized landing pages") by providing users with clear, actionable analytics that:
- Prove their pages convert better than industry averages
- Identify optimization opportunities
- Enable data-driven iteration
- Lay foundation for future agentic AI optimization

### Why Analytics is Critical

**The Value Validation Loop:**
```
Generate Page → Publish → Track Metrics → Prove Value → Justify Subscription
                                    ↓
                          (Future: AI auto-optimization)
```

**Without analytics:**
- Users can't validate if "conversion-optimized" is true
- No data to improve pages
- No differentiation from competitors
- Can't justify Pro tier pricing

**With analytics:**
- Tangible proof of value (5% conversion vs. 2% industry avg)
- Actionable insights ("Add testimonials before pricing")
- Competitive advantage (most builders don't offer analytics)
- Foundation for agentic AI optimization (Sprint 8+)

---

## 📊 Analytics Architecture

### Hybrid Approach: PostHog + Custom Dashboard

**Decision:** Leverage existing PostHog integration + build custom user-facing dashboard

```
Published Landing Page (/p/[slug])
         ↓
   PostHog SDK (client-side tracking)
         ↓
   PostHog Cloud (real-time event storage)
         ↓
   ┌─────────────┬──────────────────┐
   │             │                  │
PostHog       Daily Sync        Your Database
Dashboard      (Cron Job)      (PageAnalytics)
(Internal)                    (User Dashboard)
```

### Why Hybrid?

| Capability | PostHog | Custom DB |
|------------|---------|-----------|
| **Real-time event tracking** | ✅ Primary | ❌ |
| **Session replay** | ✅ Only source | ❌ |
| **Internal analysis** | ✅ Advanced | ❌ |
| **User-facing dashboard** | ❌ Complex | ✅ Simple |
| **Custom metrics** | ❌ Limited | ✅ Flexible |
| **Plan enforcement** | ❌ | ✅ Required |
| **White-label** | ❌ | ✅ Agency tier |

**Benefits:**
- ✅ Zero additional tool cost (already using PostHog)
- ✅ Quick MVP implementation (SDK already integrated)
- ✅ Session replay (invaluable UX insights)
- ✅ Custom UI for users (full control)
- ✅ Privacy compliant (EU hosting, GDPR ready)
- ✅ Advanced features ready (funnels, A/B testing)

---

## 📈 Core Metrics (MVP)

### What We Track

#### 1. **Page Views**
- Total views per page
- Unique visitors (cookie-based)
- Views over time (30-day trend)
- Device breakdown (desktop/mobile/tablet)

#### 2. **Form Submissions**
- Total submissions per page
- Submissions per form
- Submission trend over time
- Form-specific conversion rates

#### 3. **Conversion Rate**
- Overall: Submissions / Views
- By traffic source
- By device type
- By time period

#### 4. **Traffic Sources**
- Referrer domains
- UTM parameters (source, medium, campaign)
- Direct traffic
- Top 5 sources by volume

#### 5. **Engagement Metrics**
- Time on page (average & median)
- Bounce rate (exits without action)
- CTA click rates
- Section view rates

#### 6. **User Journey**
- Entry point
- Sections viewed
- CTAs clicked
- Form interactions
- Conversion or exit

### Events Tracked via PostHog

```typescript
// Event schema
interface LandingPageEvent {
  // Core events
  'landing_page_view'           // Page load
  'landing_page_exit'           // Page unload (with time_on_page)
  'landing_page_form_submit'    // Form submission
  'landing_page_cta_click'      // CTA button click
  'landing_page_section_view'   // Section enters viewport

  // Properties
  page_slug: string;
  page_type: 'published';

  // Context
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Device
  $device_type: 'Desktop' | 'Mobile' | 'Tablet';
  $browser: string;
  $current_url: string;

  // Event-specific
  time_on_page?: number;        // milliseconds
  form_id?: string;
  cta_text?: string;
  cta_section?: string;
  section_id?: string;
  section_type?: string;
}
```

---

## 💾 Database Schema

### PageAnalytics (Aggregated Daily Data)

```prisma
model PageAnalytics {
  id              String   @id @default(cuid())
  slug            String   // Published page slug
  date            DateTime @db.Date

  // Core metrics (aggregated from PostHog)
  views           Int      @default(0)
  uniqueVisitors  Int      @default(0)
  formSubmissions Int      @default(0)
  conversionRate  Float    @default(0) // Calculated: submissions/views

  // Engagement metrics
  avgTimeOnPage   Int?     // Seconds
  medianTimeOnPage Int?    // Seconds
  bounceRate      Float?   // % who left without action
  ctaClicks       Int      @default(0)

  // Traffic sources (top 5 per day, JSON format)
  topReferrers    Json?    // {"google.com": 234, "twitter.com": 156, ...}
  topUtmSources   Json?    // {"producthunt": 189, "twitter": 145, ...}

  // Device breakdown
  desktopViews    Int      @default(0)
  mobileViews     Int      @default(0)
  tabletViews     Int      @default(0)

  // Conversion by device
  desktopConversions Int   @default(0)
  mobileConversions  Int   @default(0)
  tabletConversions  Int   @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([slug, date])
  @@index([slug, date])
  @@index([date])
  @@index([slug])
}
```

### SectionAnalytics (Future - Sprint 8+)

```prisma
model SectionAnalytics {
  id          String   @id @default(cuid())
  slug        String
  sectionId   String
  sectionType String
  date        DateTime @db.Date

  // Section-specific metrics
  views       Int      @default(0)  // Section entered viewport
  avgTimeInView Int?   // Time spent viewing this section
  ctaClicks   Int      @default(0)  // CTAs within this section
  conversions Int      @default(0)  // Forms submitted from this section

  // Engagement score (calculated)
  engagementScore Float? // Composite metric for AI optimization

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([slug, sectionId, date])
  @@index([slug, date])
  @@index([sectionType])
}
```

### FormAnalytics (Future - Sprint 8+)

```prisma
model FormAnalytics {
  id              String   @id @default(cuid())
  slug            String
  formId          String
  date            DateTime @db.Date

  // Form funnel metrics
  impressions     Int      @default(0) // Form viewed
  starts          Int      @default(0) // User interacted with first field
  submissions     Int      @default(0) // Form completed

  // Conversion rates
  startRate       Float    @default(0) // starts/impressions
  completionRate  Float    @default(0) // submissions/starts
  conversionRate  Float    @default(0) // submissions/impressions

  // Field-level abandonment (JSON)
  fieldDropoffs   Json?    // {"email": 23, "phone": 45, ...}

  // Average time to complete
  avgCompletionTime Int?   // Seconds

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([slug, formId, date])
  @@index([slug, date])
}
```

---

## 🛠️ Technical Implementation

### Phase 1: PostHog Event Tracking (P0 - Must Have)

#### 1.1 Published Page Tracking Setup

```typescript
// src/app/p/[slug]/page.tsx - Add PostHog tracking
'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function PublishedPage({ params, searchParams }) {
  const slug = params.slug;

  useEffect(() => {
    // Track page view
    posthog.capture('landing_page_view', {
      page_slug: slug,
      page_type: 'published',
      referrer: document.referrer,
      utm_source: searchParams?.utm_source || null,
      utm_medium: searchParams?.utm_medium || null,
      utm_campaign: searchParams?.utm_campaign || null,
    });

    // Track time on page (send on exit)
    const startTime = Date.now();
    const handleExit = () => {
      posthog.capture('landing_page_exit', {
        page_slug: slug,
        time_on_page: Date.now() - startTime,
      });
    };

    window.addEventListener('beforeunload', handleExit);
    return () => {
      handleExit();
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [slug, searchParams]);

  return (
    // ... page content
  );
}
```

**Tasks:**
- [ ] Add PostHog initialization to published pages
- [ ] Track `landing_page_view` event on page load
- [ ] Track `landing_page_exit` with time on page
- [ ] Capture UTM parameters from URL
- [ ] Extract device type from PostHog's auto-capture

#### 1.2 Form Submission Tracking

```typescript
// src/components/forms/FormComponent.tsx
const handleFormSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Track submission attempt
  posthog.capture('landing_page_form_submit', {
    page_slug: slug,
    form_id: formId,
    form_fields: Object.keys(formData),
    form_field_count: Object.keys(formData).length,
  });

  // ... rest of submission logic
};
```

**Tasks:**
- [ ] Add tracking to form submission handler
- [ ] Track form ID and field metadata
- [ ] Track submission success/failure

#### 1.3 CTA Click Tracking

```typescript
// src/modules/UIBlocks/Button.tsx
<button
  data-lessgo-cta
  data-cta-id={elementId}
  onClick={() => {
    posthog.capture('landing_page_cta_click', {
      page_slug: slug,
      cta_text: buttonText,
      cta_section: sectionId,
      cta_position: index,
    });

    // ... rest of click logic
  }}
>
  {buttonText}
</button>
```

**Tasks:**
- [ ] Add tracking to all CTA buttons
- [ ] Capture button text and section context
- [ ] Track click position in page

#### 1.4 Section View Tracking

```typescript
// src/app/p/[slug]/components/SectionTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export function SectionTracker({
  slug,
  sectionId,
  sectionType,
  children
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            posthog.capture('landing_page_section_view', {
              page_slug: slug,
              section_id: sectionId,
              section_type: sectionType,
            });
            hasTracked.current = true;
          }
        });
      },
      { threshold: 0.5 } // 50% visible
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [slug, sectionId, sectionType]);

  return (
    <div ref={sectionRef} data-section-id={sectionId}>
      {children}
    </div>
  );
}
```

**Tasks:**
- [ ] Create SectionTracker component
- [ ] Wrap all sections in published pages
- [ ] Use Intersection Observer for viewport tracking
- [ ] Track once per section per session

---

### Phase 2: Data Aggregation (P0 - Must Have)

#### 2.1 PostHog API Integration

```typescript
// src/lib/posthog-api.ts
import { posthog } from 'posthog-js';

interface PostHogInsightParams {
  event: string;
  date_from: string;
  date_to: string;
  properties?: Record<string, any>;
}

export async function fetchPostHogInsight(params: PostHogInsightParams) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;

  const response = await fetch(
    `https://eu.i.posthog.com/api/projects/${projectId}/insights/trend/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: [{
          id: params.event,
          name: params.event,
          type: 'events',
          properties: params.properties || {},
        }],
        date_from: params.date_from,
        date_to: params.date_to,
        interval: 'day',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`PostHog API error: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPageAnalytics(slug: string, dateFrom: string, dateTo: string) {
  // Fetch all relevant events for this page
  const [views, exits, submissions, clicks, sectionViews] = await Promise.all([
    fetchPostHogInsight({
      event: 'landing_page_view',
      date_from: dateFrom,
      date_to: dateTo,
      properties: { page_slug: slug },
    }),
    fetchPostHogInsight({
      event: 'landing_page_exit',
      date_from: dateFrom,
      date_to: dateTo,
      properties: { page_slug: slug },
    }),
    fetchPostHogInsight({
      event: 'landing_page_form_submit',
      date_from: dateFrom,
      date_to: dateTo,
      properties: { page_slug: slug },
    }),
    fetchPostHogInsight({
      event: 'landing_page_cta_click',
      date_from: dateFrom,
      date_to: dateTo,
      properties: { page_slug: slug },
    }),
    fetchPostHogInsight({
      event: 'landing_page_section_view',
      date_from: dateFrom,
      date_to: dateTo,
      properties: { page_slug: slug },
    }),
  ]);

  return { views, exits, submissions, clicks, sectionViews };
}
```

**Tasks:**
- [ ] Set up PostHog Personal API key
- [ ] Create API client for PostHog Insights API
- [ ] Implement event aggregation queries
- [ ] Add error handling and retries

#### 2.2 Daily Sync Cron Job

```typescript
// src/app/api/cron/sync-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPageAnalytics } from '@/lib/posthog-api';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Get all published pages
    const publishedPages = await prisma.publishedPage.findMany({
      select: { slug: true },
    });

    console.log(`Syncing analytics for ${publishedPages.length} pages...`);

    // Sync each page
    for (const page of publishedPages) {
      try {
        const analytics = await fetchPageAnalytics(
          page.slug,
          dateStr,
          dateStr
        );

        // Calculate metrics
        const views = analytics.views.data?.[0] || 0;
        const uniqueVisitors = analytics.views.unique_visitors || 0;
        const submissions = analytics.submissions.data?.[0] || 0;
        const conversionRate = views > 0 ? (submissions / views) : 0;

        // Calculate time on page
        const exitEvents = analytics.exits.events || [];
        const timeOnPageValues = exitEvents
          .map((e: any) => e.properties?.time_on_page)
          .filter((t: number) => t > 0);
        const avgTimeOnPage = timeOnPageValues.length > 0
          ? Math.round(timeOnPageValues.reduce((a: number, b: number) => a + b, 0) / timeOnPageValues.length / 1000)
          : null;

        // Aggregate referrers
        const referrers: Record<string, number> = {};
        analytics.views.events?.forEach((e: any) => {
          const ref = e.properties?.referrer;
          if (ref) referrers[ref] = (referrers[ref] || 0) + 1;
        });

        // Aggregate UTM sources
        const utmSources: Record<string, number> = {};
        analytics.views.events?.forEach((e: any) => {
          const source = e.properties?.utm_source;
          if (source) utmSources[source] = (utmSources[source] || 0) + 1;
        });

        // Device breakdown
        const devices = { desktop: 0, mobile: 0, tablet: 0 };
        analytics.views.events?.forEach((e: any) => {
          const deviceType = e.properties?.$device_type?.toLowerCase();
          if (deviceType in devices) {
            devices[deviceType as keyof typeof devices]++;
          }
        });

        // Upsert to database
        await prisma.pageAnalytics.upsert({
          where: {
            slug_date: {
              slug: page.slug,
              date: yesterday,
            },
          },
          create: {
            slug: page.slug,
            date: yesterday,
            views,
            uniqueVisitors,
            formSubmissions: submissions,
            conversionRate,
            avgTimeOnPage,
            topReferrers: referrers,
            topUtmSources: utmSources,
            desktopViews: devices.desktop,
            mobileViews: devices.mobile,
            tabletViews: devices.tablet,
          },
          update: {
            views,
            uniqueVisitors,
            formSubmissions: submissions,
            conversionRate,
            avgTimeOnPage,
            topReferrers: referrers,
            topUtmSources: utmSources,
            desktopViews: devices.desktop,
            mobileViews: devices.mobile,
            tabletViews: devices.tablet,
            updatedAt: new Date(),
          },
        });

        console.log(`✓ Synced ${page.slug}: ${views} views, ${submissions} conversions`);
      } catch (error) {
        console.error(`✗ Error syncing ${page.slug}:`, error);
        // Continue with next page
      }
    }

    return NextResponse.json({
      success: true,
      synced: publishedPages.length,
      date: dateStr,
    });

  } catch (error) {
    console.error('Sync analytics error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error },
      { status: 500 }
    );
  }
}
```

**Tasks:**
- [ ] Create cron endpoint for daily sync
- [ ] Set up Vercel Cron Job (runs daily at 2am)
- [ ] Implement PostHog → Database aggregation logic
- [ ] Add error handling and retry logic
- [ ] Create admin notification on sync failures

#### 2.3 Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-analytics",
    "schedule": "0 2 * * *"
  }]
}
```

**Tasks:**
- [ ] Add cron configuration to vercel.json
- [ ] Set CRON_SECRET environment variable
- [ ] Test cron job manually via API call
- [ ] Monitor first automated run

---

### Phase 3: User-Facing Dashboard (P0 - Must Have)

#### 3.1 Analytics Dashboard Page

```typescript
// src/app/dashboard/analytics/[slug]/page.tsx
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

export default async function AnalyticsPage({
  params
}: {
  params: { slug: string }
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Verify user owns this page
  const publishedPage = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    include: {
      project: {
        select: { userId: true },
      },
    },
  });

  if (!publishedPage || publishedPage.project.userId !== userId) {
    notFound();
  }

  // Fetch last 30 days of analytics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analytics = await prisma.pageAnalytics.findMany({
    where: {
      slug: params.slug,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Calculate totals
  const totals = {
    views: analytics.reduce((sum, day) => sum + day.views, 0),
    uniqueVisitors: analytics.reduce((sum, day) => sum + day.uniqueVisitors, 0),
    submissions: analytics.reduce((sum, day) => sum + day.formSubmissions, 0),
    conversionRate: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
  };

  if (totals.views > 0) {
    totals.conversionRate = (totals.submissions / totals.views) * 100;
  }

  // Calculate weighted average time on page
  const timeOnPageValues = analytics
    .filter(d => d.avgTimeOnPage !== null)
    .map(d => ({ time: d.avgTimeOnPage!, weight: d.views }));

  if (timeOnPageValues.length > 0) {
    const totalWeight = timeOnPageValues.reduce((sum, d) => sum + d.weight, 0);
    const weightedSum = timeOnPageValues.reduce((sum, d) => sum + (d.time * d.weight), 0);
    totals.avgTimeOnPage = Math.round(weightedSum / totalWeight);
  }

  // Aggregate traffic sources (top 5)
  const allReferrers: Record<string, number> = {};
  const allUtmSources: Record<string, number> = {};

  analytics.forEach(day => {
    if (day.topReferrers) {
      const refs = day.topReferrers as Record<string, number>;
      Object.entries(refs).forEach(([ref, count]) => {
        allReferrers[ref] = (allReferrers[ref] || 0) + count;
      });
    }
    if (day.topUtmSources) {
      const sources = day.topUtmSources as Record<string, number>;
      Object.entries(sources).forEach(([source, count]) => {
        allUtmSources[source] = (allUtmSources[source] || 0) + count;
      });
    }
  });

  const topReferrers = Object.entries(allReferrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topUtmSources = Object.entries(allUtmSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AnalyticsDashboard
      slug={params.slug}
      analytics={analytics}
      totals={totals}
      topReferrers={topReferrers}
      topUtmSources={topUtmSources}
    />
  );
}
```

**Tasks:**
- [ ] Create analytics dashboard route
- [ ] Implement user ownership verification
- [ ] Fetch and aggregate 30-day data
- [ ] Calculate totals and weighted averages
- [ ] Build responsive layout

#### 3.2 Dashboard UI Components

**MetricsCards Component:**
```typescript
export function MetricsCards({ totals, previousPeriod }) {
  return (
    <div className="grid grid-cols-4 gap-6">
      <MetricCard
        title="Page Views"
        value={totals.views.toLocaleString()}
        change={calculateChange(totals.views, previousPeriod.views)}
        icon={<EyeIcon />}
      />
      <MetricCard
        title="Unique Visitors"
        value={totals.uniqueVisitors.toLocaleString()}
        change={calculateChange(totals.uniqueVisitors, previousPeriod.uniqueVisitors)}
        icon={<UsersIcon />}
      />
      <MetricCard
        title="Conversions"
        value={totals.submissions.toLocaleString()}
        change={calculateChange(totals.submissions, previousPeriod.submissions)}
        icon={<CheckCircleIcon />}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${totals.conversionRate.toFixed(2)}%`}
        change={calculateChange(totals.conversionRate, previousPeriod.conversionRate)}
        icon={<TrendingUpIcon />}
        highlight={true}
      />
    </div>
  );
}
```

**TrendChart Component:**
```typescript
'use client';

import { Line } from 'react-chartjs-2';

export function TrendChart({ analytics }) {
  const data = {
    labels: analytics.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Views',
        data: analytics.map(d => d.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Conversions',
        data: analytics.map(d => d.formSubmissions),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
      <Line data={data} options={chartOptions} />
    </div>
  );
}
```

**TrafficSourcesTable Component:**
```typescript
export function TrafficSourcesTable({ topReferrers, topUtmSources, totalViews }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>

      <div className="space-y-3">
        {topReferrers.map(([referrer, count]) => (
          <div key={referrer} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">{cleanReferrer(referrer)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {count.toLocaleString()} ({((count / totalViews) * 100).toFixed(1)}%)
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(count / totalViews) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**DeviceBreakdown Component:**
```typescript
export function DeviceBreakdown({ analytics }) {
  const totals = {
    desktop: analytics.reduce((sum, d) => sum + d.desktopViews, 0),
    mobile: analytics.reduce((sum, d) => sum + d.mobileViews, 0),
    tablet: analytics.reduce((sum, d) => sum + d.tabletViews, 0),
  };

  const total = totals.desktop + totals.mobile + totals.tablet;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>

      <div className="space-y-4">
        <DeviceBar
          icon={<DesktopIcon />}
          label="Desktop"
          count={totals.desktop}
          percentage={(totals.desktop / total) * 100}
          color="blue"
        />
        <DeviceBar
          icon={<MobileIcon />}
          label="Mobile"
          count={totals.mobile}
          percentage={(totals.mobile / total) * 100}
          color="green"
        />
        <DeviceBar
          icon={<TabletIcon />}
          label="Tablet"
          count={totals.tablet}
          percentage={(totals.tablet / total) * 100}
          color="purple"
        />
      </div>
    </div>
  );
}
```

**ConversionFunnel Component:**
```typescript
export function ConversionFunnel({ totals }) {
  const funnel = [
    { label: 'Page Views', count: totals.views, percentage: 100 },
    { label: 'Engaged Visitors', count: Math.round(totals.views * 0.4), percentage: 40 },
    { label: 'Form Views', count: Math.round(totals.views * 0.2), percentage: 20 },
    { label: 'Submissions', count: totals.submissions, percentage: totals.conversionRate },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>

      <div className="space-y-4">
        {funnel.map((stage, index) => (
          <FunnelStage
            key={stage.label}
            label={stage.label}
            count={stage.count}
            percentage={stage.percentage}
            dropoff={index > 0 ? funnel[index - 1].percentage - stage.percentage : 0}
            isLast={index === funnel.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
```

**InsightsPanel Component:**
```typescript
export function InsightsPanel({ analytics, totals }) {
  const insights = generateInsights(analytics, totals);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <LightbulbIcon className="w-5 h-5 text-yellow-500" />
        Insights & Recommendations
      </h3>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0">
              {insight.type === 'warning' && <AlertTriangleIcon className="w-5 h-5 text-orange-500" />}
              {insight.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
              {insight.type === 'info' && <InfoIcon className="w-5 h-5 text-blue-500" />}
            </div>
            <div>
              <p className="font-medium text-gray-900">{insight.title}</p>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              {insight.action && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                  {insight.action} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateInsights(analytics, totals) {
  const insights = [];

  // Low conversion rate
  if (totals.conversionRate < 2) {
    insights.push({
      type: 'warning',
      title: 'Low conversion rate detected',
      description: `Your conversion rate (${totals.conversionRate.toFixed(2)}%) is below industry average (2-3%). Consider adding social proof or simplifying your form.`,
      action: 'Optimize Page',
    });
  }

  // High mobile traffic but low mobile conversion
  const mobileViews = analytics.reduce((sum, d) => sum + d.mobileViews, 0);
  const mobilePercentage = (mobileViews / totals.views) * 100;
  if (mobilePercentage > 40) {
    insights.push({
      type: 'info',
      title: 'High mobile traffic',
      description: `${mobilePercentage.toFixed(0)}% of your visitors are on mobile. Ensure your page is mobile-optimized.`,
      action: 'Preview Mobile',
    });
  }

  // Best performing traffic source
  // ... more insight logic

  return insights;
}
```

**Tasks:**
- [ ] Build MetricsCards component with trend indicators
- [ ] Create TrendChart with Chart.js/Recharts
- [ ] Build TrafficSourcesTable with visual bars
- [ ] Create DeviceBreakdown component
- [ ] Build ConversionFunnel visualization
- [ ] Implement InsightsPanel with AI-generated recommendations
- [ ] Add responsive design (mobile-friendly)
- [ ] Implement date range selector (7d/30d/90d/all)

---

### Phase 4: Plan Integration (P0 - Must Have)

#### 4.1 Analytics Access Gates

```typescript
// Feature gating by plan tier
const ANALYTICS_FEATURES_BY_PLAN = {
  FREE: {
    basicMetrics: true,           // Views, conversions, conversion rate
    trafficSources: false,
    deviceBreakdown: false,
    funnel: false,
    insights: false,
    dateRange: '7d',               // Last 7 days only
    export: false,
  },
  PRO: {
    basicMetrics: true,
    trafficSources: true,
    deviceBreakdown: true,
    funnel: true,
    insights: true,
    dateRange: '90d',              // Last 90 days
    export: true,                  // Export CSV
  },
  AGENCY: {
    basicMetrics: true,
    trafficSources: true,
    deviceBreakdown: true,
    funnel: true,
    insights: true,
    dateRange: 'all',              // All time
    export: true,
    whiteLabel: true,              // White-label reports
    sessionReplay: true,           // Access to PostHog session replays
  },
};
```

**Tasks:**
- [ ] Gate advanced analytics behind Pro tier
- [ ] Add upgrade prompts for locked features
- [ ] Limit date range based on plan
- [ ] Gate CSV export behind Pro tier
- [ ] Gate session replay access behind Agency tier

#### 4.2 Analytics Link in Dashboard

```typescript
// src/components/dashboard/ProjectCard.tsx - Add analytics button
<div className="flex gap-2">
  <Button onClick={() => router.push(`/edit/${project.tokenId}`)}>
    Edit
  </Button>

  {project.publishedPage && (
    <>
      <Button
        variant="outline"
        onClick={() => window.open(`/p/${project.publishedPage.slug}`, '_blank')}
      >
        View Live
      </Button>

      <Button
        variant="ghost"
        onClick={() => router.push(`/dashboard/analytics/${project.publishedPage.slug}`)}
      >
        📊 Analytics
      </Button>
    </>
  )}
</div>
```

**Tasks:**
- [ ] Add "Analytics" button to published project cards
- [ ] Add analytics link in published page preview
- [ ] Create analytics navigation in dashboard sidebar
- [ ] Add analytics overview on main dashboard (top 3 pages)

---

## 🎨 UI/UX Requirements

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard     Landing Page Analytics         │
│                                                          │
│  📄 your-product-name             Last 30 Days ▼       │
│  https://lessgo.ai/p/your-product-name                  │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Page Views   │ Visitors     │ Conversions  │ Conv Rate    │
│   2,847      │   1,923      │    143       │   5.02%      │
│   +12% ↗     │   +8% ↗      │   +23% ↗     │   +1.2% ↗    │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────┐
│  📈 Performance Over Time                                │
│  [Line chart showing views and conversions over 30 days] │
└─────────────────────────────────────────────────────────┘

┌────────────────────────┬────────────────────────────────┐
│  🚦 Traffic Sources     │  📱 Device Breakdown          │
│                         │                                │
│  Google    847 (29.7%)  │  Desktop  1,704 (59.8%) ████  │
│  Twitter   623 (21.9%)  │  Mobile     912 (32.0%) ██    │
│  Direct    412 (14.5%)  │  Tablet     231 (8.1%)  █     │
│  PH        289 (10.2%)  │                                │
│  Other     676 (23.7%)  │                                │
└────────────────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🎯 Conversion Funnel                                    │
│                                                          │
│  Page View      2,847  ━━━━━━━━━━━━━━━━━━  100%        │
│                         ↘ 73.9% drop                    │
│  Engaged          743  ━━━━━━━━━━━━        26.1%        │
│                         ↘ 43.3% drop                    │
│  Form Start       421  ━━━━━━━             14.8%        │
│                         ↘ 66.0% drop                    │
│  Submit           143  ━━━━                 5.0%         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  💡 Insights & Recommendations                           │
│                                                          │
│  ⚠️  High form abandonment (66%)                         │
│      Consider simplifying your form or adding trust     │
│      signals. [Optimize Form →]                         │
│                                                          │
│  ✅  Twitter traffic converts best (8.2%)                │
│      Focus your marketing efforts on Twitter.           │
│      [View Twitter Strategy →]                          │
│                                                          │
│  ℹ️  Mobile conversion 40% lower than desktop           │
│      Check your mobile user experience.                 │
│      [Preview Mobile →]                                 │
└─────────────────────────────────────────────────────────┘

[Export CSV]  [View in PostHog]  [Share Report]
```

### Key UX Principles

1. **Show Value Immediately** - Big numbers at the top
2. **Provide Context** - Industry benchmarks, period-over-period changes
3. **Make it Actionable** - Every insight has a recommended action
4. **Visual Hierarchy** - Most important metrics prominent
5. **Progressive Disclosure** - Basic → Advanced features by tier
6. **Mobile Responsive** - Stack components on small screens

---

## 🚀 Future Enhancements (Post-Sprint 7)

### Phase 2: Section-Level Analytics (Sprint 8)
- [ ] Track engagement per section
- [ ] Heatmaps showing click patterns
- [ ] Scroll depth analysis
- [ ] Section performance comparison
- [ ] AI suggestions for low-performing sections

### Phase 3: A/B Testing (Sprint 9)
- [ ] Create page variants
- [ ] Traffic splitting (50/50)
- [ ] Statistical significance testing
- [ ] Auto-declare winner
- [ ] Variant history and comparison

### Phase 4: Agentic AI Optimization (Sprint 10+)
- [ ] AI analyzes section performance
- [ ] Auto-generate improvement hypotheses
- [ ] One-click A/B test creation
- [ ] Continuous optimization loop
- [ ] Predictive analytics (forecast conversions)

### Phase 5: Advanced Features
- [ ] Session replay integration (Pro/Agency tier)
- [ ] Form field-level analytics
- [ ] Goal tracking (custom events)
- [ ] Multi-page funnel analysis
- [ ] Cohort analysis (user segments)
- [ ] Real-time dashboard (WebSocket updates)
- [ ] White-label analytics (Agency tier)
- [ ] PDF report generation
- [ ] Email digests (weekly/monthly)

---

## 📈 Success Metrics

### Business Metrics
- **Analytics Engagement:** % of users who view analytics (Target: 60%)
- **Analytics-Driven Upgrades:** % of Pro upgrades from analytics page (Target: 20%)
- **Data Validation:** % of users with conversion rates >2% (Target: 70%)

### Technical Metrics
- **Event Tracking Reliability:** % of events successfully captured (Target: >99%)
- **Sync Job Success Rate:** % of successful daily syncs (Target: >99.5%)
- **Dashboard Load Time:** Time to interactive (Target: <2s)
- **PostHog API Latency:** Average response time (Target: <500ms)

### User Metrics
- **Insights Acted Upon:** % of users who click insight CTAs (Target: 30%)
- **Time in Analytics:** Average session duration on analytics page (Target: >3min)
- **Data Export Usage:** % of Pro users who export data (Target: 15%)

---

## 🔧 Environment Variables

```bash
# PostHog Configuration (Already configured)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_POSTHOG_PROJECT_ID=12345

# PostHog Personal API Key (New - for backend queries)
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxxxxxxxxxxxxxxx

# Cron Job Secret (New)
CRON_SECRET=your-random-secret-here
```

---

## 🚧 Technical Risks & Mitigations

### Risk 1: PostHog Rate Limits
**Impact:** Sync job fails if hitting API limits
**Mitigation:**
- Batch queries where possible
- Implement exponential backoff retry logic
- Cache PostHog responses (1 hour TTL)
- Use PostHog's data warehouse (future)

### Risk 2: Data Sync Delays
**Impact:** Dashboard shows stale data (up to 24 hours old)
**Mitigation:**
- Show "Last updated" timestamp clearly
- Add "Refresh now" button for real-time data (rate limited)
- Consider real-time mode for Pro tier (PostHog webhooks)

### Risk 3: PostHog Event Volume
**Impact:** Exceeding free tier limits (1M events/month)
**Mitigation:**
- Monitor event volume weekly
- Implement sampling for high-traffic pages (>10K views/day)
- Upgrade PostHog plan if needed (~$28/month for 10M events)
- Cost is offset by subscription revenue

### Risk 4: Cookie Blocking/DNT
**Impact:** Undercounting visitors due to privacy tools
**Mitigation:**
- Respect DNT headers (ethical analytics)
- First-party cookie domain (lessgo.ai)
- Server-side event tracking (fallback)
- Disclose in privacy policy

### Risk 5: Attribution Accuracy
**Impact:** Referrer data missing or inaccurate
**Mitigation:**
- Use UTM parameters as primary attribution
- Educate users on UTM tagging
- Provide UTM builder tool
- Show "Direct/None" category for unknown sources

---

## 📋 Sprint Acceptance Criteria

### Objective 1: Pricing System
- [ ] All three tiers (Free, Pro, Agency) fully implemented
- [ ] Credit system accurately tracks ALL AI operations
- [ ] Rate limiting applied to ALL AI endpoints
- [ ] Stripe checkout flow works end-to-end
- [ ] Plan enforcement prevents unauthorized feature access
- [ ] Billing dashboard displays accurate usage data
- [ ] Users can upgrade/downgrade plans successfully
- [ ] Webhook handling is robust (tested with Stripe CLI)
- [ ] Admin can override plans and adjust credits
- [ ] Zero critical bugs in payment flow

### Objective 2: Landing Page Analytics
- [ ] PostHog events tracked on all published pages (view, exit, form submit, CTA click, section view)
- [ ] Daily cron job successfully syncs PostHog data to database
- [ ] User-facing analytics dashboard shows accurate metrics (views, conversions, conversion rate)
- [ ] Dashboard displays traffic sources and device breakdown
- [ ] Conversion funnel visualizes user journey
- [ ] Insights panel provides actionable recommendations
- [ ] Analytics gated by plan tier (Free: basic, Pro: advanced, Agency: all features)
- [ ] "Analytics" button visible on published project cards
- [ ] Dashboard loads in <2 seconds
- [ ] No PII collected (GDPR compliant)

---

## 📝 Open Questions

1. **Grace Period:** Should existing users get grandfathered? For how long?
2. **Refunds:** Prorated refunds on downgrades, or credit forward?
3. **Credit Rollover:** Allow unused credits to roll over to next month?
4. **Enterprise Pricing:** Fixed pricing or custom quotes only?
5. **Free Trial:** Offer Pro tier free trial (7 or 14 days)?
6. **Annual Billing:** What discount? (Suggested: 25% = $29 vs $39/mo)
7. **Localized Pricing:** USD only, or PPP-adjusted pricing?

---

## 📅 Estimated Timeline

**Phase 1 (P0):** 2-3 weeks
- Plan system, credit tracking, Stripe integration, rate limiting

**Phase 2 (P0):** 1-2 weeks
- UI/UX for pricing page, billing dashboard, credit widgets

**Phase 3 (P1):** 1 week
- Admin tools, monitoring, alerts

**Phase 4 (P2):** 2-3 weeks
- Advanced features (white-label, export, team collaboration)

**Total Estimated:** 6-9 weeks for full implementation

---

## 🔗 Related Documents
- CLAUDE.md (project overview)
- Database schema: `prisma/schema.prisma`
- Rate limiting: `src/lib/rateLimit.ts`
- Existing API routes: `src/app/api/*`

---

**Document Status:** Draft v1.0 - Pricing section complete, Analytics section pending
**Last Updated:** 2025-09-30
**Next Steps:** Discuss analytics requirements