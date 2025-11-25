// api/stripe/create-portal-session/route.ts - Create Stripe customer portal session
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { createPortalSession } from '@/lib/stripe';
import { getUserPlan } from '@/lib/planManager';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's plan to find Stripe customer ID
    const userPlan = await getUserPlan(userId);

    if (!userPlan.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Create return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const returnUrl = `${baseUrl}/dashboard/billing`;

    // Create Stripe portal session
    const session = await createPortalSession({
      customerId: userPlan.stripeCustomerId,
      returnUrl,
    });

    logger.info(`Portal session created for user ${userId}`);

    // Return portal URL for redirect
    return NextResponse.json({
      url: session.url,
    });

  } catch (error: any) {
    logger.error('Error creating portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
