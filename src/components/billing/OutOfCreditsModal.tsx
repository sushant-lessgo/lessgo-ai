'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/ui/icon';
import { CREDIT_COSTS } from '@/lib/creditCosts';
import { PLAN_CONFIGS, PlanTier } from '@/lib/planConfigs';

/**
 * OutOfCreditsModal — what a user sees when an AI op is refused for credits
 * (billing-beta phase 4). Rendered by `CreditsBlockedHost` off the
 * `creditsBlockedBus`; before this phase a blocked op failed SILENTLY.
 *
 * ⚠️ CONFIG-DRIVEN COPY: every number here comes from `PLAN_CONFIGS` /
 * `CREDIT_COSTS`. The pre-phase-4 version hardcoded "$39/mo", "14-day free
 * trial" and "Free plan: 30 credits/month" — all three were FALSE against
 * pricing-v2, in the one dialog whose entire job is asking for money. Do not
 * re-inline numbers, and do not reintroduce trial language (pricing-v2 has no
 * trials — it has a 14-day refund).
 *
 * ⚠️ Only the MONTHLY price is rendered (decision 10): `price.annual` is a
 * per-month figure and the $290/yr number exists only on the public pricing
 * page, so any annual figure shown here would be invented.
 *
 * ⚠️ LINK ONLY (decision 9): the CTA navigates to `/dashboard/billing`, which
 * owns the Upgrade / Top-up / portal CTAs. No Stripe calls from this modal.
 *
 * ⚠️ `daysUntilReset` has NO default (it used to default to `0`, which rendered
 * "refresh in 0 days" whenever it was omitted). Nothing passes it this slice —
 * the bus carries only `{required, available}` and adding a balance fetch here
 * would create a second fetcher alongside CreditBadge (decision 3). The block
 * is kept, gated, for the phase that has a real number.
 *
 * APP-CHROME ONLY: `app-*` utilities + AppIcon. No lucide, no stock palette keys.
 */

const PRO = PLAN_CONFIGS[PlanTier.PRO];

/** Cost hints, in display order. Labels are UI copy; every NUMBER is config.
 *  Mirrors CreditBadge's list — `IVOC_RESEARCH` is dead and never surfaced. */
const SHOWN_COSTS: ReadonlyArray<{ op: keyof typeof CREDIT_COSTS; label: string }> = [
  { op: 'FULL_PAGE_GENERATION', label: 'Full page generation' },
  { op: 'SECTION_REGENERATION', label: 'Section regeneration' },
  { op: 'ELEMENT_REGENERATION', label: 'Element variation' },
];

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Absent when the route's 402 body carried no numbers — copy degrades, never lies. */
  creditsRequired?: number;
  creditsAvailable?: number;
  /** Unused this slice; see the header note. No default on purpose. */
  daysUntilReset?: number;
}

export function OutOfCreditsModal({
  isOpen,
  onClose,
  creditsRequired,
  creditsAvailable,
  daysUntilReset,
}: OutOfCreditsModalProps) {
  if (!isOpen) return null;

  const hasNumbers = typeof creditsRequired === 'number' && typeof creditsAvailable === 'number';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/60 p-4 font-app-sans"
      data-testid="out-of-credits-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="out-of-credits-title"
    >
      <div className="relative w-full max-w-md rounded-app-modal border border-app-border bg-app-surface shadow-app-modal">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-testid="out-of-credits-close"
          className="absolute right-4 top-4 rounded-app-badge p-0.5 text-app-muted transition-colors hover:bg-app-canvas hover:text-app-ink"
        >
          <AppIcon name="close" size={18} />
        </button>

        {/* Header */}
        <div className="border-b border-app-divider p-7">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-app-pill bg-app-danger-bg">
            <AppIcon name="credit_card" size={26} className="text-app-danger" />
          </div>
          <h2
            id="out-of-credits-title"
            className="mb-2 text-center text-xl font-bold text-app-ink"
          >
            Not enough credits
          </h2>
          <p className="text-center text-[13px] text-app-muted" data-testid="out-of-credits-detail">
            {hasNumbers ? (
              <>
                This needs{' '}
                <span className="font-semibold text-app-ink" data-testid="credits-required">
                  {creditsRequired}
                </span>{' '}
                credit{creditsRequired === 1 ? '' : 's'} — you have{' '}
                <span className="font-semibold text-app-ink" data-testid="credits-available">
                  {creditsAvailable}
                </span>{' '}
                left.
              </>
            ) : (
              <>You don&apos;t have enough credits left for this.</>
            )}
          </p>
        </div>

        <div className="space-y-5 p-7">
          {/* Upgrade — the primary path. All numbers from PLAN_CONFIGS. */}
          <div className="rounded-app-card border border-app-tint-edge bg-app-tint-soft p-5">
            <div className="mb-4 flex items-start gap-3">
              <AppIcon
                name="workspace_premium"
                size={22}
                className="mt-0.5 shrink-0 text-app-primary"
              />
              <div>
                <h3 className="mb-1 text-sm font-bold text-app-ink">Upgrade to {PRO.name}</h3>
                <p className="mb-3 text-[13px] text-app-muted" data-testid="upgrade-blurb">
                  {PRO.credits} AI credits every month, {PRO.limits.publishedPages} published
                  pages, and custom domains.
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-app-ink" data-testid="pro-price">
                    ${PRO.price.monthly}
                  </span>
                  <span className="text-[13px] text-app-muted">/month</span>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              data-testid="out-of-credits-upgrade-link"
              className="block w-full rounded-app-ctl bg-app-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-app-primary-hover"
            >
              See plans &amp; top-ups
            </Link>
          </div>

          {/* Wait for reset — gated: no caller passes a real number this slice. */}
          {typeof daysUntilReset === 'number' && (
            <div className="rounded-app-card border border-app-border p-5" data-testid="wait-for-reset">
              <h3 className="mb-1 text-sm font-bold text-app-ink">Wait for reset</h3>
              <p className="text-[13px] text-app-muted">
                Your monthly credits refresh in{' '}
                <span className="font-semibold text-app-ink">
                  {daysUntilReset} day{daysUntilReset === 1 ? '' : 's'}
                </span>
                .
              </p>
            </div>
          )}

          {/* Credit costs — rendered from CREDIT_COSTS, never hardcoded. */}
          <div className="rounded-app-card bg-app-canvas p-4">
            <p className="mb-2 text-[11px] text-app-faint">Credit costs:</p>
            <div className="space-y-1 text-[11.5px] text-app-muted">
              {SHOWN_COSTS.map(({ op, label }) => {
                const cost = CREDIT_COSTS[op];
                return (
                  <div
                    key={op}
                    data-testid="modal-credit-cost-row"
                    data-cost-op={op}
                    className="flex justify-between"
                  >
                    <span>{label}</span>
                    <span className="font-semibold text-app-ink">
                      {cost} credit{cost === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
