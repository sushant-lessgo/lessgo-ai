// api/billing/usage/route.ts - Get user's usage statistics
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUsageStats } from '@/lib/creditSystem';
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
      // No usage data yet - return defaults
      return NextResponse.json({
        period: new Date().toISOString().slice(0, 7),
        credits: {
          used: 0,
          remaining: 30,
          limit: 30,
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
