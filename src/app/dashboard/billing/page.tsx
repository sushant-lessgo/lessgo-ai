'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AppIcon } from '@/components/ui/icon';
import { AppTooltip } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { CREDIT_COSTS } from '@/lib/creditCosts';
import { PLAN_CONFIGS, PlanStatus, PlanTier } from '@/lib/planConfigs';
import { openPortal, startCheckout, startTopup } from '@/lib/billing/stripeClient';

/**
 * Billing & plan — the lean beta view (billing-beta phase 6). It replaced a
 * 325-line pre-ui-foundation page (stock Tailwind + lucide) whose upgrade button
 * just pushed to `/pricing` and which showed a per-op counter list + a dead
 * "Usage history coming soon" stub. The full billing console (invoices, payment
 * method, usage history) is deliberately NOT built: the STRIPE PORTAL already
 * covers payment method + invoices + cancellation, so this view links to it
 * instead of re-implementing it (spec gate b).
 *
 * ⚠️ CONFIG-DRIVEN: every price/credit number renders from `PLAN_CONFIGS` /
 * `CREDIT_COSTS`. Do not re-inline literals — a same-value re-inline is caught
 * only by the fabricated-config probe in `page.test.tsx`.
 *
 * ⚠️ MONTHLY ONLY (decision 10): `PLAN_CONFIGS[PRO].price.annual` is a PER-MONTH
 * figure (24) and the real $290/yr exists only on `/pricing`. NO annual dollar
 * figure may be rendered in-app — it would be either wrong ($24) or invented.
 *
 * ⚠️ "Next charge" is gated on `PRO && !lifetimeDeal && live status`. For FREE and
 * LTD users `currentPeriodEnd` is a usage-period ROLLOVER and no charge ever
 * happens — labelling it a charge date would be a money-facing lie (decision 4).
 *
 * ⚠️ Manage billing gates on `hasBillingAccount`, NEVER on tier (decision 5): a
 * churned ex-payer is FREE but must keep reaching invoices/cancellation, and an
 * admin-granted PRO has no Stripe customer id and would just 400.
 *
 * ⚠️ Balance comes from `/api/billing/usage` + `/api/billing/plan` (as the old
 * page did). It deliberately does NOT fetch `/api/credits/balance` — `CreditBadge`
 * is the ONLY fetcher of that route (single-fetcher rule).
 *
 * APP-CHROME ONLY: `app-*` utilities + ui-foundation primitives. No lucide, no
 * stock palette keys (see src/components/ui/README.md isolation rules).
 */

interface PlanInfo {
  tier: string;
  status: string;
  creditsLimit: number;
  creditPool?: number;
  lifetimeDeal?: boolean;
  /** Phase-6 additive field — the ONLY correct gate for the portal CTA. */
  hasBillingAccount?: boolean;
  currentPeriodEnd: string | null;
  isTrialing: boolean;
  trialEnd: string | null;
}

interface UsageStats {
  credits: {
    used: number;
    remaining: number;
    limit: number;
    poolRemaining?: number;
    totalAvailable?: number;
  };
}

/** Cost rows, in display order. Labels are UI copy; every NUMBER is config.
 *  Mirrors CreditBadge/OutOfCreditsModal — `IVOC_RESEARCH` is dead, never shown. */
const SHOWN_COSTS: ReadonlyArray<{ op: keyof typeof CREDIT_COSTS; label: string }> = [
  { op: 'FULL_PAGE_GENERATION', label: 'Full page generation' },
  { op: 'SECTION_REGENERATION', label: 'Section regeneration' },
  { op: 'ELEMENT_REGENERATION', label: 'Element variation' },
];

/** Statuses in which a subscription actually bills again. */
const LIVE_STATUSES: ReadonlyArray<string> = [PlanStatus.ACTIVE, PlanStatus.TRIALING];

function SuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('success') !== 'true') return null;

  // BOTH the subscription checkout and the top-up return here (their success
  // URLs are identical bar the session id), so this copy must be true of either
  // — and it must not mention a trial: pricing-v2 has no trials (14-day refund).
  return (
    <div
      data-testid="billing-success-banner"
      className="mb-6 flex items-start gap-2 rounded-app-card border border-app-border bg-app-success-bg p-4"
    >
      <AppIcon name="check_circle" size={18} className="mt-0.5 shrink-0 text-app-success" />
      <div>
        <p className="text-sm font-semibold text-app-ink">Payment complete</p>
        <p className="mt-0.5 text-[13px] text-app-muted">
          Thanks — your purchase went through. Your plan and credits below update within a few
          seconds; refresh if they still look stale.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, testId }: { label: string; value: React.ReactNode; testId?: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]" data-testid={testId}>
      <span className="text-app-muted">{label}</span>
      <span className="font-semibold text-app-ink">{value}</span>
    </div>
  );
}

export default function BillingPage() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<null | 'checkout' | 'topup' | 'portal'>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [planRes, usageRes] = await Promise.all([
          fetch('/api/billing/plan'),
          fetch('/api/billing/usage'),
        ]);
        if (planRes.ok && !cancelled) setPlan(await planRes.json());
        if (usageRes.ok && !cancelled) setUsage(await usageRes.json());
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheckout = useCallback(async () => {
    setBusy('checkout');
    const result = await startCheckout();
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    toast("Couldn't start checkout. Please try again.", { variant: 'error' });
    setBusy(null);
  }, [toast]);

  const handleTopup = useCallback(async () => {
    setBusy('topup');
    const result = await startTopup();
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    // A 404 is the kill-switch, not a fault — say so instead of "try again".
    toast(
      result.reason === 'disabled'
        ? "Top-ups aren't enabled yet. They're coming shortly."
        : "Couldn't start the top-up. Please try again.",
      { variant: result.reason === 'disabled' ? 'info' : 'error' },
    );
    setBusy(null);
  }, [toast]);

  const handlePortal = useCallback(async () => {
    setBusy('portal');
    const result = await openPortal();
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    // Residual 400 (the button is greyed when hasBillingAccount is false) —
    // surface it; the old page's alert() was the only thing standing between the
    // user and silence.
    toast(
      result.reason === 'no_billing_account'
        ? 'No billing account yet — upgrade first.'
        : "Couldn't open the billing portal. Please try again.",
      { variant: 'error' },
    );
    setBusy(null);
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={28} thickness={3} label="Loading billing" />
      </div>
    );
  }

  const tier = (plan?.tier as PlanTier) ?? PlanTier.FREE;
  const config = PLAN_CONFIGS[tier] ?? PLAN_CONFIGS[PlanTier.FREE];
  const lifetimeDeal = Boolean(plan?.lifetimeDeal);
  const hasBillingAccount = Boolean(plan?.hasBillingAccount);

  // ── Salvaged pool-aware math (old page :133-150). Non-obvious and correct:
  // FREE/LTD have monthly limit 0 with their credits in the persistent pool, so
  // a naive used/limit is NaN and a naive "N/mo" reads as zero credits.
  const monthlyLimit = usage?.credits.limit ?? 0;
  const pool = plan?.creditPool ?? usage?.credits.poolRemaining ?? 0;
  const totalAvailable =
    usage?.credits.totalAvailable ?? (usage?.credits.remaining ?? 0) + pool;

  const creditsLabel = (() => {
    if (lifetimeDeal) return `${pool} lifetime credits`;
    if (tier === PlanTier.FREE) return `${pool} one-time credits`;
    if (monthlyLimit === -1) return 'Unlimited';
    if (pool > 0) return `${monthlyLimit}/mo + ${pool} bonus`;
    return `${monthlyLimit}/mo`;
  })();

  // Decision 4: only a live PRO subscription actually charges again.
  const showNextCharge =
    tier === PlanTier.PRO &&
    !lifetimeDeal &&
    LIVE_STATUSES.includes(plan?.status ?? '') &&
    Boolean(plan?.currentPeriodEnd);

  // Tier-aware CTA (carried from the phase-4 gate): "Upgrade to Pro" must never
  // be shown to someone already on Pro. Paid users get the top-up path instead.
  const canUpgrade = tier === PlanTier.FREE;
  const PRO = PLAN_CONFIGS[PlanTier.PRO];

  return (
    <div className="mx-auto max-w-4xl p-8 font-app-sans">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>

      <h1 className="mb-1 text-2xl font-bold text-app-ink">Billing &amp; plan</h1>
      <p className="mb-7 text-[13px] text-app-muted">
        Your plan, your AI credits, and everything payment-related.
      </p>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* ── Plan summary ─────────────────────────────────────────────── */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-app-ink">Current plan</h2>
            <AppIcon name="workspace_premium" size={18} className="text-app-faint" />
          </div>

          <div className="mb-5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-app-ink" data-testid="billing-plan-name">
              {config.name}
            </span>
            {!lifetimeDeal && (
              <span className="text-[13px] text-app-muted" data-testid="billing-plan-price">
                ${config.price.monthly}/month
              </span>
            )}
            {lifetimeDeal && (
              <Badge variant="status" data-testid="billing-lifetime-badge">
                Lifetime
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <Row
              label="Status"
              testId="billing-status"
              value={
                <Badge
                  variant={plan?.status === PlanStatus.ACTIVE ? 'success' : 'status'}
                  className="capitalize"
                >
                  {plan?.status ?? PlanStatus.ACTIVE}
                </Badge>
              }
            />
            <Row label="Credits" value={creditsLabel} testId="billing-credits-label" />
            {/* Omitted entirely for FREE/LTD — their period end is a rollover, not a charge. */}
            {showNextCharge && (
              <Row
                label="Next charge"
                testId="billing-next-charge"
                value={new Date(plan!.currentPeriodEnd!).toLocaleDateString()}
              />
            )}
          </div>
        </Card>

        {/* ── Credit balance ───────────────────────────────────────────── */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-app-ink">AI credits</h2>
            <AppIcon name="credit_card" size={18} className="text-app-faint" />
          </div>

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-app-ink" data-testid="billing-credits-total">
              {totalAvailable}
            </span>
            <span className="text-[13px] text-app-muted">available</span>
          </div>

          <p className="mb-4 text-[13px] text-app-muted">
            {monthlyLimit > 0
              ? `${usage?.credits.used ?? 0} of ${monthlyLimit} monthly credits used${
                  pool > 0 ? ` · ${pool} bonus in pool` : ''
                }`
              : lifetimeDeal
              ? 'Lifetime credits — they never expire.'
              : "One-time credits — they don't refill."}
          </p>

          {/* Costs — rendered from CREDIT_COSTS, never hardcoded. */}
          <div className="border-t border-app-divider pt-3">
            <p className="mb-2 text-[11px] text-app-faint">Credit costs:</p>
            <div className="space-y-1 text-[12px] text-app-muted">
              {SHOWN_COSTS.map(({ op, label }) => {
                const cost = CREDIT_COSTS[op];
                return (
                  <div
                    key={op}
                    data-testid="billing-cost-row"
                    data-cost-op={op}
                    className="flex justify-between"
                  >
                    <span>{label}</span>
                    <span className="font-semibold text-app-ink" data-testid="billing-cost-value">
                      {cost} credit{cost === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <Card className="p-6">
        {canUpgrade ? (
          <div className="mb-5 rounded-app-card border border-app-tint-edge bg-app-tint-soft p-5">
            <h3 className="mb-1 text-sm font-bold text-app-ink">Upgrade to {PRO.name}</h3>
            <p className="mb-4 text-[13px] text-app-muted" data-testid="upgrade-blurb">
              {PRO.credits} AI credits every month, {PRO.limits.publishedPages} published pages, and
              custom domains.
            </p>
            <div className="mb-4 flex items-baseline gap-1.5">
              {/* MONTHLY ONLY — no annual figure anywhere in-app (decision 10). */}
              <span className="text-2xl font-bold text-app-ink" data-testid="pro-price">
                ${PRO.price.monthly}
              </span>
              <span className="text-[13px] text-app-muted">/month</span>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={busy !== null}
              data-testid="upgrade-cta"
              className="w-full"
            >
              {busy === 'checkout' ? 'Opening checkout…' : `Upgrade to ${PRO.name}`}
            </Button>
            <p className="mt-3 text-[12px] text-app-faint">
              Billed monthly.{' '}
              <Link href="/pricing" className="font-semibold text-app-primary underline">
                Annual and lifetime plans
              </Link>
            </p>
          </div>
        ) : (
          // A paid user must never be told to "upgrade to the plan you're on"
          // (carried from the phase-4 gate) — top-ups are their credit path.
          <p className="mb-5 text-[13px] text-app-muted" data-testid="current-plan-note">
            You&apos;re on {config.name}. Need more credits before your next refill? Top up below.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            variant={canUpgrade ? 'secondary' : 'default'}
            onClick={handleTopup}
            disabled={busy !== null}
            data-testid="topup-cta"
          >
            <AppIcon name="credit_card" size={17} />
            {busy === 'topup' ? 'Opening…' : 'Top up credits'}
          </Button>

          {hasBillingAccount ? (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={busy !== null}
              data-testid="manage-billing-cta"
            >
              {busy === 'portal' ? 'Opening…' : 'Manage billing'}
            </Button>
          ) : (
            // Greyed, never omitted (greyed-placeholder principle). NOT <Coming>:
            // this isn't unbuilt — it's unavailable to THIS user until they have a
            // Stripe customer id, and the tooltip must say why. `aria-disabled`,
            // not `disabled`, so the tooltip still receives pointer events.
            <AppTooltip label="No billing account yet — upgrade first">
              <span
                data-testid="manage-billing-disabled"
                aria-disabled="true"
                tabIndex={-1}
                className="app-coming inline-flex h-9 select-none items-center rounded-app-ctl border border-app-border-input px-4 text-sm font-semibold"
                onClickCapture={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Manage billing
              </span>
            </AppTooltip>
          )}
        </div>

        <p className="mt-4 text-[12px] text-app-faint">
          Payment method, invoices, and cancellation are handled in the Stripe billing portal.
        </p>
      </Card>
    </div>
  );
}
