// api/credits/balance/route.ts - Get user's credit balance
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCreditBalance } from '@/lib/creditSystem';
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

    const balance = await getCreditBalance(userId);

    return NextResponse.json(balance);
  } catch (error: any) {
    logger.error('Error fetching credit balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch credit balance',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
