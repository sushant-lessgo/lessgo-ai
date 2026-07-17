'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { AppIcon } from '@/components/ui/icon';
import { Popover, PopoverTrigger, AppPopoverPanel } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { CREDIT_COSTS } from '@/lib/creditCosts';

/**
 * CreditBadge — THE credit-balance surface for app chrome (billing-beta phase 3).
 *
 * ⚠️ SINGLE FETCHER RULE: this is the ONLY component that fetches
 * `/api/credits/balance`. The editor counter (phase 5) and any future counter reuse
 * THIS component — never add a second balance fetcher (and never read the plan in
 * passive chrome / `dashboard/layout.tsx`).
 *
 * ⚠️ CONFIG-DRIVEN COSTS: the cost rows render from `CREDIT_COSTS`
 * (`src/lib/creditCosts.ts`). They were hardcoded (10/2/1) before phase 3 — changing
 * the config must change this UI with no code edit. Do not re-inline numbers.
 * `IVOC_RESEARCH` is deliberately NOT surfaced (dead constant — backend removed in
 * scale-08).
 *
 * APP-CHROME ONLY: `app-*` utilities + AppIcon/app-popover primitives. No lucide, no
 * stock Tailwind palette keys (those feed template rendering — see
 * `src/components/ui/README.md` isolation rules).
 */

interface CreditBalance {
  used: number;
  remaining: number;
  limit: number;
  percentUsed: number;
  daysUntilReset: number;
  nextResetDate: Date;
  tier: string;
  // pricing-v2 pool-aware fields (same /api/credits/balance shape).
  monthlyRemaining?: number;
  poolRemaining?: number;
  totalAvailable?: number;
}

/**
 * The costs surfaced in the tooltip panel, in display order. Labels are UI copy;
 * every NUMBER comes from CREDIT_COSTS. Keep this list short — it is a hint, not
 * the full price table.
 */
const SHOWN_COSTS: ReadonlyArray<{ op: keyof typeof CREDIT_COSTS; label: string }> = [
  { op: 'FULL_PAGE_GENERATION', label: 'Full page generation' },
  { op: 'SECTION_REGENERATION', label: 'Section regeneration' },
  { op: 'ELEMENT_REGENERATION', label: 'Element variation' },
];

export function CreditBadge() {
  const { isSignedIn } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/credits/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data);
        }
      } catch (error) {
        console.error('Failed to fetch credit balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  if (!isSignedIn) return null;

  if (isLoading) {
    return (
      <div className="flex h-8 w-8 items-center justify-center" aria-label="Loading credits">
        <Spinner size={16} thickness={2} />
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  // pricing-v2: mirror the billing dashboard — headline = total available (monthly
  // remaining + persistent pool). FREE/LTD have monthlyLimit 0 with credits in the
  // pool, so the "/limit" and %-bar are only meaningful when monthlyLimit > 0.
  const monthlyLimit = balance.limit ?? 0;
  const totalAvailable =
    balance.totalAvailable ??
    (balance.monthlyRemaining ?? balance.remaining ?? 0) + (balance.poolRemaining ?? 0);
  const hasMonthly = monthlyLimit > 0;
  // Only drive severity colors off usage when there IS a monthly allotment;
  // otherwise treat "empty pool" (0 available) as the out state.
  const isOut = hasMonthly ? balance.percentUsed >= 100 : totalAvailable <= 0;
  const isLow = hasMonthly ? balance.percentUsed >= 80 : totalAvailable <= 2;

  const severityClasses = isOut
    ? 'border-app-review-border bg-app-danger-bg text-app-danger'
    : isLow
    ? 'border-app-review-border bg-app-review-bg text-app-review-text'
    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-hover';

  const barClasses = isOut ? 'bg-app-danger' : isLow ? 'bg-app-review-text' : 'bg-app-primary';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="credit-badge"
          aria-label={`AI credits: ${totalAvailable} available`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={`flex items-center gap-1.5 rounded-app-pill border px-2.5 py-1.5 font-app-sans text-[13px] font-semibold transition-colors ${severityClasses}`}
        >
          <AppIcon name="credit_card" size={17} />
          <span data-testid="credit-badge-value">
            {hasMonthly ? `${totalAvailable}/${monthlyLimit}` : totalAvailable}
          </span>
        </button>
      </PopoverTrigger>

      <AppPopoverPanel
        width={288}
        align="end"
        data-testid="credit-badge-panel"
        // Hover-opened: keep it open while the pointer is over the panel itself.
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        // Hover-opened popovers must not steal focus from the trigger.
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="p-3.5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-app-ink">AI Credits</h3>
          <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
            {balance.tier}
          </span>
        </div>

        <div className="space-y-3">
          {hasMonthly ? (
            <>
              {/* Monthly allotment progress bar (only when there is one) */}
              <div>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-app-muted">Used</span>
                  <span className="font-semibold text-app-ink">
                    {balance.used} / {monthlyLimit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-app-pill bg-app-track">
                  <div
                    className={`h-2 rounded-app-pill transition-all ${barClasses}`}
                    style={{ width: `${Math.min(balance.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
              {(balance.poolRemaining ?? 0) > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-app-muted">Bonus pool</span>
                  <span className="font-semibold text-app-ink">
                    {balance.poolRemaining} credits
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-between text-[13px]">
              <span className="text-app-muted">Available</span>
              <span className="font-semibold text-app-ink">
                {totalAvailable} credit{totalAvailable === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {/* Reset Info (monthly allotment only — pool credits don't reset) */}
          {hasMonthly && (
            <p className="border-t border-app-divider pt-2 text-[13px] text-app-muted">
              Resets in {balance.daysUntilReset} day{balance.daysUntilReset !== 1 ? 's' : ''}
            </p>
          )}

          {/* Low Balance Warning */}
          {isLow && (
            <div className="rounded-app-ctl border border-app-review-border bg-app-review-bg p-3">
              <p className="mb-2 text-[13px] text-app-review-text">
                {isOut ? 'Out of credits! Upgrade for more.' : 'Running low on credits'}
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-app-primary-deep underline"
              >
                <AppIcon name="workspace_premium" size={16} />
                Upgrade to Pro
              </Link>
            </div>
          )}

          {/* Credit costs — rendered from CREDIT_COSTS, never hardcoded. */}
          <div className="border-t border-app-divider pt-2">
            <p className="mb-2 text-[11px] text-app-faint">Credit costs:</p>
            <div className="space-y-1 text-[11.5px] text-app-muted">
              {SHOWN_COSTS.map(({ op, label }) => {
                const cost = CREDIT_COSTS[op];
                return (
                  <div
                    key={op}
                    data-testid="credit-cost-row"
                    data-cost-op={op}
                    className="flex justify-between"
                  >
                    <span>{label}</span>
                    <span className="font-semibold text-app-ink" data-testid="credit-cost-value">
                      {cost} credit{cost === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppPopoverPanel>
    </Popover>
  );
}
