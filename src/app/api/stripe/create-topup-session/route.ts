export const dynamic = 'force-dynamic';

// api/stripe/create-topup-session/route.ts — $9 / 100-credit one-time top-up.
//
// Kill-switch gated (PRICING_V2_COMMERCE). Top-ups are repeatable; webhook
// idempotency is keyed on the Stripe session id (see webhooks/route.ts).
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { createOneTimeCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';

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

    const priceId = STRIPE_PRICES.TOPUP_100;
    if (!priceId) {
      logger.error('Top-up price ID not configured');
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
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

    const session = await createOneTimeCheckoutSession({
      userId,
      userEmail,
      priceId,
      kind: 'topup',
      successUrl,
      cancelUrl,
    });

    logger.info(`Top-up checkout session created for user ${userId}:`, {
      sessionId: session.id,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    logger.error('Error creating top-up checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: error.message },
      { status: 500 }
    );
  }
}
