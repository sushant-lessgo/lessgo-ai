export const dynamic = 'force-dynamic';

// api/stripe/create-ltd-session/route.ts — Founding LTD one-time checkout.
//
// Kill-switch gated (PRICING_V2_COMMERCE). Server-side sold-out check picks the
// lowest un-filled cohort (<20 seats sold); the definitive seat re-check happens
// in the webhook (grantLifetimeDeal is once-only via the lifetimeDeal flag).
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createOneTimeCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';

const COHORT_SEATS = 20;

// Per-cohort price ID from env (via STRIPE_PRICES).
const COHORT_PRICE: Record<number, string> = {
  1: STRIPE_PRICES.LTD_COHORT_1,
  2: STRIPE_PRICES.LTD_COHORT_2,
  3: STRIPE_PRICES.LTD_COHORT_3,
};

export async function POST(req: NextRequest) {
  // Kill-switch: commerce disabled unless explicitly enabled.
  if (process.env.PRICING_V2_COMMERCE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }
    const userEmail = user.emailAddresses[0].emailAddress;

    // Reject buyers who already hold a lifetime deal (also the webhook idempotency guard).
    const existing = await prisma.userPlan.findUnique({
      where: { userId },
      select: { lifetimeDeal: true },
    });
    if (existing?.lifetimeDeal) {
      return NextResponse.json(
        { error: 'You already hold a Founding lifetime deal.' },
        { status: 409 }
      );
    }

    // Find the lowest cohort (1→2→3) that still has open seats.
    let currentCohort: number | null = null;
    for (const c of [1, 2, 3]) {
      const sold = await prisma.userPlan.count({
        where: { lifetimeDeal: true, ltdCohort: c },
      });
      if (sold < COHORT_SEATS) {
        currentCohort = c;
        break;
      }
    }

    if (currentCohort === null) {
      return NextResponse.json(
        { error: 'Founding lifetime deal is sold out.' },
        { status: 410 }
      );
    }

    const priceId = COHORT_PRICE[currentCohort];
    if (!priceId) {
      logger.error('LTD price ID not configured for cohort:', { cohort: currentCohort });
      return NextResponse.json(
        { error: 'Pricing configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;
    const successUrl = `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

    const session = await createOneTimeCheckoutSession({
      userId,
      userEmail,
      priceId,
      kind: 'ltd',
      cohort: currentCohort,
      successUrl,
      cancelUrl,
    });

    logger.info(`LTD checkout session created for user ${userId}:`, {
      sessionId: session.id,
      cohort: currentCohort,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    logger.error('Error creating LTD checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: error.message },
      { status: 500 }
    );
  }
}
