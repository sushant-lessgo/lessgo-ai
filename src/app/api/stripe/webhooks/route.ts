// api/stripe/webhooks/route.ts - Handle Stripe webhook events
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { verifyWebhookSignature, getTierFromPriceId } from '@/lib/stripe';
import {
  upgradePlan,
  downgradePlan,
  updatePlanStatus,
  updateBillingPeriod,
  startTrial,
  endTrial,
  PlanTier,
  PlanStatus,
} from '@/lib/planManager';
import { resetCredits } from '@/lib/creditSystem';

// Disable body parsing - we need the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get raw body
    const body = await req.text();

    // Get Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (error: any) {
      logger.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    logger.info(`Received Stripe webhook: ${event.type}`, {
      eventId: event.id,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({ received: true });

  } catch (error: any) {
    logger.error('Webhook handler error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * User completed checkout - may be in trial or active
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as PlanTier;

    if (!userId || !tier) {
      logger.error('Missing metadata in checkout session:', session.id);
      return;
    }

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    logger.info(`Checkout completed for user ${userId}:`, {
      sessionId: session.id,
      customerId,
      subscriptionId,
      tier,
    });

    // Subscription details will be handled by subscription.created event
    // Just log for now
  } catch (error) {
    logger.error('Error handling checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.created
 * New subscription created - set up user plan
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    const tier = subscription.metadata?.tier as PlanTier;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    const customerId = subscription.customer as string;
    const status = subscription.status;
    const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    const isTrialing = status === 'trialing';

    logger.info(`Subscription created for user ${userId}:`, {
      subscriptionId: subscription.id,
      tier,
      status,
      isTrialing,
    });

    // Determine tier from price if not in metadata
    let finalTier = tier;
    if (!finalTier && subscription.items.data[0]) {
      const priceId = subscription.items.data[0].price.id;
      finalTier = getTierFromPriceId(priceId) as PlanTier;
    }

    if (!finalTier) {
      logger.error('Could not determine tier for subscription:', subscription.id);
      return;
    }

    // Upgrade user plan
    await upgradePlan(userId, finalTier, {
      customerId,
      subscriptionId: subscription.id,
      currentPeriodStart,
      currentPeriodEnd,
    });

    // If in trial, set trial dates
    if (isTrialing && subscription.trial_start && subscription.trial_end) {
      const trialStart = new Date(subscription.trial_start * 1000);
      const trialEnd = new Date(subscription.trial_end * 1000);

      await startTrial(
        userId,
        finalTier,
        Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    logger.info(`Successfully set up plan for user ${userId}`);
  } catch (error) {
    logger.error('Error handling customer.subscription.created:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated
 * Subscription changed - update plan status/tier
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    const status = subscription.status;
    const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

    logger.info(`Subscription updated for user ${userId}:`, {
      subscriptionId: subscription.id,
      status,
    });

    // Update plan status based on subscription status
    let planStatus: PlanStatus;
    switch (status) {
      case 'active':
        planStatus = PlanStatus.ACTIVE;
        // If trial just ended, handle trial end
        if (subscription.trial_end && subscription.trial_end * 1000 < Date.now()) {
          await endTrial(userId, true); // Convert to paid
        }
        break;
      case 'trialing':
        planStatus = PlanStatus.TRIALING;
        break;
      case 'canceled':
        planStatus = PlanStatus.CANCELLED;
        break;
      case 'past_due':
        planStatus = PlanStatus.PAST_DUE;
        break;
      case 'incomplete':
        planStatus = PlanStatus.INCOMPLETE;
        break;
      default:
        planStatus = PlanStatus.ACTIVE;
    }

    // Update plan status
    await updatePlanStatus(userId, planStatus);

    // Update billing period
    await updateBillingPeriod(userId, currentPeriodStart, currentPeriodEnd);

    logger.info(`Successfully updated plan for user ${userId}`);
  } catch (error) {
    logger.error('Error handling customer.subscription.updated:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted
 * Subscription cancelled - downgrade to free
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    logger.info(`Subscription deleted for user ${userId}:`, {
      subscriptionId: subscription.id,
    });

    // Downgrade to FREE tier
    await downgradePlan(userId, PlanTier.FREE);

    logger.info(`Successfully downgraded user ${userId} to FREE`);
  } catch (error) {
    logger.error('Error handling customer.subscription.deleted:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_succeeded
 * Payment successful - reset credits for new billing cycle
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      // Not a subscription invoice
      return;
    }

    // Get subscription to find userId
    const { stripe } = await import('@/lib/stripe');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscriptionId);
      return;
    }

    logger.info(`Payment succeeded for user ${userId}:`, {
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
    });

    // Reset credits for new billing period
    await resetCredits(userId);

    logger.info(`Successfully reset credits for user ${userId}`);
  } catch (error) {
    logger.error('Error handling invoice.payment_succeeded:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed
 * Payment failed - mark account as past due
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      return;
    }

    const { stripe } = await import('@/lib/stripe');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscriptionId);
      return;
    }

    logger.warn(`Payment failed for user ${userId}:`, {
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
    });

    // Update plan status to past_due
    await updatePlanStatus(userId, PlanStatus.PAST_DUE);

    // TODO: Send email notification to user about payment failure

    logger.info(`Marked user ${userId} as past_due`);
  } catch (error) {
    logger.error('Error handling invoice.payment_failed:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.trial_will_end
 * Trial ending soon - notify user (3 days before)
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logger.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    logger.info(`Trial ending soon for user ${userId}:`, {
      subscriptionId: subscription.id,
      trialEnd,
    });

    // TODO: Send email notification about trial ending
    // Can implement email service integration here

    logger.info(`Trial ending notification logged for user ${userId}`);
  } catch (error) {
    logger.error('Error handling customer.subscription.trial_will_end:', error);
    throw error;
  }
}
