// lib/billing/stripeClient.ts — the client-side wrappers for the three Stripe
// session routes (billing-beta phase 6). Before this, call sites hand-rolled
// their own fetch (`pricing/page.tsx:215`, the old `billing/page.tsx:109`).
//
// ⚠️ CLIENT-SAFE: no prisma, no server-only import. Config comes from
// `planConfigs.ts` (prisma-free by phase 1).
//
// ⚠️ These helpers NEVER redirect. They return a typed result and let the caller
// decide (so a caller can toast, and so tests can assert up to the fetch
// boundary without a live Stripe hop).
//
// ⚠️ MONTHLY ONLY (decision 10). `PLAN_CONFIGS[PRO].price.annual` is a PER-MONTH
// figure (24) and the real $290/yr lives only on the public pricing page — so
// in-app checkout is monthly and no annual figure is rendered anywhere in the app.
// `billingInterval` is still SENT: the route REQUIRES it and 400s without it
// (create-checkout-session/route.ts:36-41). "Monthly only" = no interval CHOICE,
// not a missing argument.

import { PlanTier } from '../planConfigs';

export type StripeSessionResult =
  /** Caller should navigate to `url`. */
  | { ok: true; url: string }
  /** Top-ups are switched off server-side (PRICING_V2_COMMERCE !== 'true' → 404). */
  | { ok: false; reason: 'disabled' }
  /** The portal 400s for a user with no Stripe customer id (never paid). */
  | { ok: false; reason: 'no_billing_account'; message?: string }
  | { ok: false; reason: 'error'; message?: string };

async function readBody(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function urlOrError(body: any): StripeSessionResult {
  if (body?.url) return { ok: true, url: body.url as string };
  return { ok: false, reason: 'error', message: body?.error ?? body?.message };
}

/**
 * Pro subscription checkout — monthly, the only interval offered in-app.
 * The route rejects any tier but PRO (create-checkout-session/route.ts:44-49).
 */
export async function startCheckout(): Promise<StripeSessionResult> {
  try {
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: PlanTier.PRO, billingInterval: 'monthly' }),
    });
    const body = await readBody(res);
    if (!res.ok) {
      return { ok: false, reason: 'error', message: body?.error ?? body?.message };
    }
    return urlOrError(body);
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

/**
 * One-time credit top-up. 404 is NOT an error here — it is the
 * `PRICING_V2_COMMERCE` kill-switch (create-topup-session/route.ts:14-16), and
 * the caller must say so rather than showing a generic failure.
 */
export async function startTopup(): Promise<StripeSessionResult> {
  try {
    const res = await fetch('/api/stripe/create-topup-session', { method: 'POST' });
    if (res.status === 404) return { ok: false, reason: 'disabled' };
    const body = await readBody(res);
    if (!res.ok) {
      return { ok: false, reason: 'error', message: body?.error ?? body?.message };
    }
    return urlOrError(body);
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}

/**
 * Stripe customer portal — payment method, invoices, cancellation.
 * 400 means "no stripeCustomerId" (create-portal-session/route.ts:24-29). The UI
 * greys the control on `hasBillingAccount === false`, so a 400 here is the
 * residual race/edge — surface it, never swallow it.
 */
export async function openPortal(): Promise<StripeSessionResult> {
  try {
    const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
    const body = await readBody(res);
    if (res.status === 400) {
      return { ok: false, reason: 'no_billing_account', message: body?.error };
    }
    if (!res.ok) {
      return { ok: false, reason: 'error', message: body?.error ?? body?.message };
    }
    return urlOrError(body);
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message };
  }
}
