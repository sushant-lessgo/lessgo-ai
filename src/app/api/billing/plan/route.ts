export const dynamic = 'force-dynamic';

// api/billing/plan/route.ts - Get user's plan information
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserPlan, PLAN_CONFIGS, PlanTier } from '@/lib/planManager';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const plan = await getUserPlan(userId);

    return NextResponse.json({
      tier: plan.tier,
      status: plan.status,
      creditsLimit: plan.creditsLimit,
      // pricing-v2: persistent pool + LTD identity. FREE has creditsLimit=0 and its
      // 20 one-time credits live in creditPool, so a reader that shows only
      // creditsLimit would render "0 credits" — expose the pool + lifetime flags.
      creditPool: plan.creditPool ?? 0,
      lifetimeDeal: plan.lifetimeDeal ?? false,
      ltdCohort: plan.ltdCohort ?? null,
      // billing-beta phase 6 (decision 5): does this user have a Stripe customer
      // record at all? The portal route 400s without one
      // (create-portal-session/route.ts:24-29), and TIER IS NOT A PROXY for it:
      // a churned ex-payer is FREE *with* a customer id (must still reach
      // invoices/cancellation), and an admin-granted PRO (api/admin/grant-plan)
      // has none (a live button would 400). Boolean only — never expose the id.
      hasBillingAccount: !!plan.stripeCustomerId,
      currentPeriodStart: plan.currentPeriodStart,
      currentPeriodEnd: plan.currentPeriodEnd,
      isTrialing: plan.isTrialing,
      trialStart: plan.trialStart,
      trialEnd: plan.trialEnd,
      features: {
        publishedPagesLimit: plan.publishedPagesLimit,
        customDomainsLimit: plan.customDomainsLimit,
        removeBranding: plan.removeBranding,
        formIntegrations: plan.formIntegrations,
        analytics: plan.analytics,
        prioritySupport: plan.prioritySupport,
        // Derived from config, not the DB row (no such column) — same source as
        // the server gate hasTrackingPixels().
        trackingPixels: PLAN_CONFIGS[plan.tier as PlanTier]?.features.trackingPixels ?? false,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching plan:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch plan',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
