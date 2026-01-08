export const dynamic = 'force-dynamic';

// api/billing/plan/route.ts - Get user's plan information
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserPlan } from '@/lib/planManager';
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
