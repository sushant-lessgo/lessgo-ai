# Stripe Integration Setup Guide

This guide walks you through setting up Stripe for the Lessgo pricing system.

## Phase 2 Implementation Complete

✅ Stripe SDK installed
✅ Checkout session endpoint
✅ Customer portal endpoint
✅ Webhook handler (all events)
✅ Stripe utility functions

---

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up or log in
3. Switch to **Test Mode** (toggle in top right)

---

## Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

3. Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

---

## Step 3: Create Products & Prices

### Create Pro Monthly Product

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: Lessgo Pro (Monthly)
   - **Description**: Professional plan with 200 AI credits/month
   - **Pricing**: $39.00 USD / month
   - **Recurring**: Monthly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)
5. Add to `.env.local`:
```bash
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_id_here
```

### Create Pro Annual Product

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: Lessgo Pro (Annual)
   - **Description**: Professional plan with 200 AI credits/month (billed annually)
   - **Pricing**: $348.00 USD / year
   - **Recurring**: Yearly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)
5. Add to `.env.local`:
```bash
STRIPE_PRO_ANNUAL_PRICE_ID=price_your_id_here
```

---

## Step 4: Set Up Webhooks

### Install Stripe CLI (for local testing)

**Windows:**
```bash
# Using Chocolatey
choco install stripe-cli

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**Mac/Linux:**
```bash
brew install stripe/stripe-cli/stripe
```

### Configure Webhook Endpoint

1. Login to Stripe CLI:
```bash
stripe login
```

2. Forward webhooks to local dev server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

3. Copy the webhook signing secret (starts with `whsec_`)
4. Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Production Webhook Setup

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL:
   ```
   https://yourdomain.com/api/stripe/webhooks
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.trial_will_end`

5. Copy the **Signing secret** and add to production env vars

---

## Step 5: Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable customer portal
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to view invoices
   - ✅ Allow customers to cancel subscriptions
4. **Cancellation behavior**:
   - Select "Cancel immediately"
   - Or "At period end" (recommended)

---

## Step 6: Set Trial Period

Trial period is configured in the checkout session:
- **Duration**: 14 days (hardcoded in `create-checkout-session/route.ts`)
- **Card required**: Yes (payment method collected upfront)
- **Automatic conversion**: Yes (charges after trial ends)

To modify trial duration, edit:
```typescript
// src/app/api/stripe/create-checkout-session/route.ts
trialDays: 14 // Change this value
```

---

## Step 7: Test the Integration

### Test Checkout Flow

1. Start your dev server:
```bash
npm run dev
```

2. Start Stripe webhook forwarding:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

3. Navigate to `/pricing` page
4. Click "Upgrade to Pro"
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

### Test Webhook Events

Trigger test events manually:
```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test subscription created
stripe trigger customer.subscription.created

# Test subscription cancelled
stripe trigger customer.subscription.deleted
```

### Verify Database Changes

Check that the following tables are updated:
- `UserPlan` - tier upgraded, Stripe IDs stored
- `UserUsage` - credits reset
- `UsageEvent` - No events yet (credits haven't been used)

---

## Step 8: Production Deployment

### Set Environment Variables

Add all Stripe keys to your production environment (Vercel/hosting):

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
```

### Switch to Live Mode

1. Go to Stripe Dashboard
2. Toggle from **Test mode** to **Live mode**
3. Create new products with live prices
4. Set up live webhook endpoint
5. Update environment variables with live keys

---

## API Endpoints Created

### `/api/stripe/create-checkout-session` (POST)
Creates Stripe checkout session for Pro tier subscription.

**Request:**
```json
{
  "tier": "PRO",
  "billingInterval": "monthly" | "annual"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### `/api/stripe/create-portal-session` (POST)
Creates customer portal session for managing billing.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### `/api/stripe/webhooks` (POST)
Handles all Stripe webhook events.

**Handled Events:**
- `checkout.session.completed` - User completed checkout
- `customer.subscription.created` - Subscription activated
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment successful, reset credits
- `invoice.payment_failed` - Payment failed, mark past_due
- `customer.subscription.trial_will_end` - Trial ending soon

---

## Webhook Event Flow

### New Subscription Flow
1. User clicks "Upgrade to Pro"
2. Redirect to Stripe Checkout
3. User enters card (required for trial)
4. `checkout.session.completed` → Log event
5. `customer.subscription.created` → Upgrade plan, start trial
6. Trial period active (14 days)
7. `customer.subscription.trial_will_end` → Send notification (3 days before)
8. `invoice.payment_succeeded` → Convert to paid, reset credits
9. `customer.subscription.updated` → Update status to active

### Subscription Update Flow
1. User opens customer portal
2. Changes plan or cancels
3. `customer.subscription.updated` → Update plan status
4. If cancelled: `customer.subscription.deleted` → Downgrade to FREE

### Monthly Billing Flow
1. Billing date arrives
2. Stripe charges card
3. `invoice.payment_succeeded` → Reset credits for new month
4. Credits: 200 available again

### Payment Failure Flow
1. Billing date arrives
2. Card declined
3. `invoice.payment_failed` → Mark account past_due
4. Stripe retries payment (automatic)
5. If success: `invoice.payment_succeeded` → Restore access
6. If all retries fail: `customer.subscription.deleted` → Downgrade to FREE

---

## Testing Scenarios

### ✅ Scenario 1: New Pro Subscription
1. User on FREE tier (30 credits)
2. Clicks "Upgrade to Pro"
3. Completes checkout with test card
4. Trial starts (14 days)
5. User gets 200 credits immediately
6. Can use all Pro features
7. After 14 days: First payment charged
8. Credits reset to 200

### ✅ Scenario 2: Trial Cancellation
1. User in trial period
2. Opens customer portal
3. Cancels subscription
4. Trial continues until end date
5. At trial end: Downgrade to FREE (30 credits)

### ✅ Scenario 3: Failed Payment
1. User's card expires
2. Stripe attempts charge
3. Payment fails
4. Account marked past_due
5. User still has access (grace period)
6. Stripe retries 3 more times
7. If all fail: Downgrade to FREE

### ✅ Scenario 4: Annual Upgrade
1. User subscribes to annual plan ($348/year)
2. Gets 200 credits/month
3. Credits reset monthly (12 resets)
4. Annual billing (single charge)

---

## Security Checklist

- ✅ Webhook signature verification enabled
- ✅ API keys stored in environment variables
- ✅ Webhook secret validated on every request
- ✅ User authentication required for checkout
- ✅ Customer portal requires valid Stripe customer ID
- ✅ No sensitive data in client-side code
- ✅ HTTPS required in production

---

## Monitoring & Debugging

### View Logs
```bash
# Stripe webhook events
stripe logs tail

# Your app logs
# Check your logger output for "Stripe webhook:" entries
```

### Common Issues

**Issue: Webhook signature verification fails**
- Solution: Make sure `STRIPE_WEBHOOK_SECRET` matches CLI output or dashboard secret

**Issue: Price ID not found**
- Solution: Check that price IDs in `.env.local` match Stripe dashboard

**Issue: Customer portal error "No subscription found"**
- Solution: User must have active subscription first (check `UserPlan.stripeCustomerId`)

**Issue: Credits not resetting**
- Solution: Check `invoice.payment_succeeded` webhook is firing and received

---

## Next Steps

After Stripe integration is working:

1. **Phase 3**: Add credit checks to AI endpoints
2. **Phase 4**: Build user-facing pricing page and billing dashboard
3. **Phase 5**: Add admin dashboard for monitoring
4. **Phase 6**: Email notifications for trials, payments, etc.

---

## Support Resources

- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
