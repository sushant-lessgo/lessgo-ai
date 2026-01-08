export const dynamic = 'force-dynamic';

// api/stripe/create-checkout-session/route.ts - Create Stripe checkout session
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';
import { PlanTier } from '@/lib/planManager';

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

    const user = await currentUser();
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const userEmail = user.emailAddresses[0].emailAddress;

    // Parse request body
    const body = await req.json();
    const { tier, billingInterval } = body;

    // Validate inputs
    if (!tier || !billingInterval) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billingInterval' },
        { status: 400 }
      );
    }

    // Only Pro tier is supported for now (as per Phase 2 spec)
    if (tier !== PlanTier.PRO) {
      return NextResponse.json(
        { error: 'Only PRO tier is available for checkout' },
        { status: 400 }
      );
    }

    // Get price ID based on billing interval
    let priceId: string;
    if (billingInterval === 'monthly') {
      priceId = STRIPE_PRICES.PRO_MONTHLY;
    } else if (billingInterval === 'annual') {
      priceId = STRIPE_PRICES.PRO_ANNUAL;
    } else {
      return NextResponse.json(
        { error: 'Invalid billing interval. Must be "monthly" or "annual"' },
        { status: 400 }
      );
    }

    // Validate price ID is configured
    if (!priceId) {
      logger.error('Stripe price ID not configured:', { tier, billingInterval });
      return NextResponse.json(
        { error: 'Pricing configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const successUrl = `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

    // Create Stripe checkout session with 14-day trial
    const session = await createCheckoutSession({
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
      trialDays: 14, // As specified: 14-day free trial with card required
    });

    logger.info(`Checkout session created for user ${userId}:`, {
      sessionId: session.id,
      tier,
      billingInterval,
      priceId,
    });

    // Return session URL for redirect
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    logger.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
