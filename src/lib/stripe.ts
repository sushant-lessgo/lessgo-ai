// lib/stripe.ts - Stripe utility functions and client initialization
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Initialize Stripe client
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
} as const;

// Price ID to tier mapping
export function getTierFromPriceId(priceId: string): 'PRO' | null {
  if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_ANNUAL) {
    return 'PRO';
  }
  return null;
}

// Billing interval from price ID
export function getBillingIntervalFromPriceId(priceId: string): 'monthly' | 'annual' | null {
  if (priceId === STRIPE_PRICES.PRO_MONTHLY) return 'monthly';
  if (priceId === STRIPE_PRICES.PRO_ANNUAL) return 'annual';
  return null;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  trialDays = 14,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
          tier: getTierFromPriceId(priceId) || 'PRO',
        },
      },
      metadata: {
        userId,
        tier: getTierFromPriceId(priceId) || 'PRO',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    logger.info(`Created Stripe checkout session for user ${userId}`);
    return session;
  } catch (error) {
    logger.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

/**
 * Create customer portal session
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    logger.info(`Created Stripe portal session for customer ${customerId}`);
    return session;
  } catch (error) {
    logger.error('Error creating Stripe portal session:', error);
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    logger.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    logger.info(`Cancelled subscription ${subscriptionId}`);
    return subscription;
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, params);
    logger.info(`Updated subscription ${subscriptionId}`);
    return subscription;
  } catch (error) {
    logger.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch (error) {
    logger.error('Error retrieving customer:', error);
    return null;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error: any) {
    logger.error('Webhook signature verification failed:', error);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Format Stripe amount (cents to dollars)
 */
export function formatAmount(amountInCents: number, currency: string = 'usd'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Get price details
 */
export async function getPriceDetails(priceId: string): Promise<{
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
} | null> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return {
      amount: price.unit_amount || 0,
      currency: price.currency,
      interval: (price.recurring?.interval || 'month') as string,
      intervalCount: price.recurring?.interval_count || 1,
    };
  } catch (error) {
    logger.error('Error retrieving price details:', error);
    return null;
  }
}
