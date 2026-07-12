export const dynamic = 'force-dynamic';

// api/billing/usage/route.ts - Get user's usage statistics
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUsageStats } from '@/lib/creditSystem';
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

    const stats = await getUsageStats(userId);

    if (!stats) {
      // No usage data yet — return defaults derived from the plan (pool-aware).
      // pricing-v2: FREE has monthly limit 0 with a persistent pool, so we can't
      // hardcode 30/30 anymore — read the plan's real monthly limit + pool.
      const plan = await getUserPlan(userId);
      const poolRemaining = plan.creditPool ?? 0;
      return NextResponse.json({
        period: new Date().toISOString().slice(0, 7),
        credits: {
          used: 0,
          remaining: plan.creditsLimit,
          limit: plan.creditsLimit,
          percentUsed: 0,
          monthlyRemaining: plan.creditsLimit,
          poolRemaining,
          totalAvailable: plan.creditsLimit + poolRemaining,
        },
        operations: {
          fullPageGenerations: 0,
          sectionRegenerations: 0,
          elementRegenerations: 0,
          fieldInferences: 0,
        },
        tokens: {
          total: 0,
          input: 0,
          output: 0,
        },
        estimatedCost: 0,
      });
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    logger.error('Error fetching usage stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage stats',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
