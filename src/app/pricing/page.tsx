'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Check, Zap } from 'lucide-react';

// Founding LTD cohort counter — STATIC placeholder shown when the live
// `/api/billing/ltd-availability` route reports `enabled:false` (kill-switch
// PRICING_V2_COMMERCE off). When enabled, the live counter replaces this.
const LTD_SEATS_LEFT_PLACEHOLDER = '20 of 20 left';

// Shape returned by /api/billing/ltd-availability. `enabled:false` => keep the
// static placeholder (phase-3 behavior); no live buy button.
type LtdAvailability = {
  enabled: boolean;
  soldOut?: boolean;
  currentCohort?: number | null;
  currentPriceUsd?: number | null;
  currentRemaining?: number;
  seatsPerCohort?: number;
  cohorts?: { cohort: number; seatsTotal: number; remaining: number; priceUsd: number }[];
};

// Agency is contact-only (spec decision 7) — no self-serve checkout.
const AGENCY_CONTACT_EMAIL = 'hello@lessgo.ai';

type Tier = {
  name: string;
  tier: 'FREE' | 'PRO' | 'LTD' | 'AGENCY';
  // How the price block renders per tier (toggle only affects PRO).
  kind: 'free' | 'subscription' | 'onetime' | 'contact';
  description: string;
  creditsLabel: string;
  features: string[];
  limits: string[];
  cta: string;
  ctaDisabled?: boolean;
  popular?: boolean;
  // subscription
  priceMonthly?: number;
  priceAnnualPerYear?: number;
  // onetime (LTD)
  ltdNote?: string;
  ltdSeats?: string;
};

const PRICING_TIERS: Tier[] = [
  {
    name: 'Free',
    tier: 'FREE',
    kind: 'free',
    description: 'The trial is the product. No card required.',
    creditsLabel: '20 one-time credits',
    features: [
      '1 site on a lessgo.site subdomain',
      '20 one-time credits (no monthly refill)',
      'Website import (scrape) + audience research included',
      'Basic analytics',
      'Up to 25 form submissions / month',
    ],
    limits: [
      '“Made with Lessgo AI” badge',
      'No custom domains',
      'No integrations',
    ],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    kind: 'subscription',
    description: 'For founders shipping real sites.',
    creditsLabel: '200 credits / month',
    priceMonthly: 29,
    priceAnnualPerYear: 290,
    features: [
      '3 sites with custom domains',
      '200 credits / month',
      'No Lessgo AI badge',
      'Full analytics dashboard',
      'Form integrations (ConvertKit, etc.)',
      'Testimonials + blog',
      '14-day money-back guarantee',
    ],
    limits: [],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Founding LTD',
    tier: 'LTD',
    kind: 'onetime',
    description: 'Everything in Pro, forever. 60 seats, then it never returns.',
    creditsLabel: '600-credit lifetime pool',
    ltdNote: '$69 → $99 → $129 as seats fill',
    ltdSeats: LTD_SEATS_LEFT_PLACEHOLDER,
    features: [
      'Pro features as they exist today — for life',
      '600-credit lifetime pool (not monthly)',
      '3 sites with custom domains',
      'No Lessgo AI badge',
      'Beta-only — 60 seats total, never comes back',
    ],
    limits: [],
    cta: 'Coming at launch',
    ctaDisabled: true,
    popular: false,
  },
  {
    name: 'Agency',
    tier: 'AGENCY',
    kind: 'contact',
    description: 'Team, white-label, done-for-you.',
    creditsLabel: 'Custom',
    features: [
      'Everything in Pro',
      'Multiple sites & seats',
      'Done-for-you custom template',
      'Priority support',
    ],
    limits: [],
    cta: 'Talk to us',
    popular: false,
  },
];

// Credit costs — pulled from CREDIT_COSTS in src/lib/creditSystem.ts.
// Kept in sync manually; if those change, update here.
const CREDIT_COST_LINES = [
  ['Full page generation', 10],
  ['Website import (scrape)', 1],
  ['Audience research', 3],
  ['Section regeneration', 2],
  ['Element variation', 1],
] as const;

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  // LTD availability — defaults to disabled so we render the static placeholder
  // until the route confirms the kill-switch is on.
  const [ltdAvail, setLtdAvail] = useState<LtdAvailability>({ enabled: false });
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/ltd-availability')
      .then((r) => r.json())
      .then((data: LtdAvailability) => {
        if (!cancelled && data) setLtdAvail(data);
      })
      .catch(() => {
        // Network/parse failure → keep the safe placeholder default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCta = async (tier: Tier) => {
    if (tier.tier === 'FREE') {
      router.push(isSignedIn ? '/dashboard' : '/sign-up?redirect=/dashboard');
      return;
    }

    if (tier.tier === 'AGENCY') {
      window.location.href = `mailto:${AGENCY_CONTACT_EMAIL}?subject=${encodeURIComponent(
        'Lessgo AI — Agency plan'
      )}`;
      return;
    }

    if (tier.tier === 'LTD') {
      // Placeholder (kill-switch off) or sold out → no checkout.
      if (!ltdAvail.enabled || ltdAvail.soldOut) return;

      // Signed-out → same redirect-to-checkout pattern as the Pro button below.
      if (!isSignedIn) {
        router.push('/sign-in?redirect=/pricing');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/stripe/create-ltd-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'No checkout URL received');
        }
      } catch (error) {
        console.error('LTD checkout error:', error);
        alert('Failed to start checkout. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    // PRO — existing checkout flow (price IDs updated later in phase 6).
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO', billingInterval }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  // CTA label + disabled state. Only LTD is dynamic (driven by availability);
  // every other tier keeps its static config.
  const ctaStateFor = (tier: Tier): { label: string; disabled: boolean } => {
    if (tier.tier !== 'LTD') {
      return { label: tier.cta, disabled: !!tier.ctaDisabled };
    }
    if (!ltdAvail.enabled) {
      // Kill-switch off → phase-3 placeholder: disabled "Coming at launch".
      return { label: 'Coming at launch', disabled: true };
    }
    if (ltdAvail.soldOut) {
      return { label: 'Founding closed — never returns', disabled: true };
    }
    return { label: `Claim your seat — $${ltdAvail.currentPriceUsd}`, disabled: false };
  };

  const renderPrice = (tier: Tier) => {
    switch (tier.kind) {
      case 'free':
        return (
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-gray-900">$0</span>
            <span className="text-gray-600 ml-2">forever</span>
          </div>
        );
      case 'subscription': {
        const monthly = tier.priceMonthly ?? 0;
        const annualPerYear = tier.priceAnnualPerYear ?? 0;
        if (billingInterval === 'annual') {
          return (
            <>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">${annualPerYear}</span>
                <span className="text-gray-600 ml-2">/year</span>
              </div>
              <p className="text-sm text-green-600 mt-1 font-medium">
                2 months free vs. monthly
              </p>
            </>
          );
        }
        return (
          <>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">${monthly}</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">or ${annualPerYear}/yr (2 months free)</p>
          </>
        );
      }
      case 'onetime': {
        // Kill-switch off (or fetch pending/failed) → static phase-3 placeholder.
        if (!ltdAvail.enabled) {
          return (
            <>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$69</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{tier.ltdNote}</p>
              <p className="text-sm font-semibold text-amber-600 mt-1">{tier.ltdSeats}</p>
            </>
          );
        }
        // All 60 seats claimed — the offer never returns.
        if (ltdAvail.soldOut) {
          return (
            <>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">Sold out</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">All 60 founding seats are claimed.</p>
              <p className="text-sm font-semibold text-amber-600 mt-1">
                Founding closed — never returns
              </p>
            </>
          );
        }
        // Live counter for the current (lowest-open) cohort.
        return (
          <>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">${ltdAvail.currentPriceUsd}</span>
              <span className="text-gray-600 ml-2">one-time</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{tier.ltdNote}</p>
            <p className="text-sm font-semibold text-amber-600 mt-1">
              {ltdAvail.currentRemaining} of {ltdAvail.seatsPerCohort} left at $
              {ltdAvail.currentPriceUsd}
            </p>
          </>
        );
      }
      case 'contact':
      default:
        return (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">Talk to us</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free — no card, no trial clock. Upgrade when you&apos;re ready to ship.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingInterval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                2 mo free
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
          {PRICING_TIERS.map((tier) => {
            const ctaState = ctaStateFor(tier);
            const showLoading = isLoading && (tier.tier === 'PRO' || tier.tier === 'LTD');
            return (
            <div
              key={tier.tier}
              className={`relative rounded-2xl border-2 p-8 ${
                tier.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm">{tier.description}</p>
              </div>

              <div className="mb-6 min-h-[92px]">{renderPrice(tier)}</div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  {tier.creditsLabel}
                </div>
              </div>

              <button
                onClick={() => handleCta(tier)}
                disabled={isLoading || ctaState.disabled}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-6 ${
                  ctaState.disabled
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300'
                }`}
              >
                {showLoading ? 'Loading...' : ctaState.label}
              </button>

              <div className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
                {tier.limits.map((limit, idx) => (
                  <div key={idx} className="flex items-start gap-3 opacity-50">
                    <span className="text-gray-400">×</span>
                    <span className="text-sm text-gray-500">{limit}</span>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>

        {/* Top-up footnote (real top-up CTA lives on the billing page) */}
        <p className="text-center text-sm text-gray-500 mb-16">
          Need more credits? Top-ups are $9 for 100 credits — buy them any time from your
          billing dashboard.
        </p>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                There&apos;s no trial clock — the Free plan <em>is</em> the trial. Build a real
                site, generate copy, publish it on a lessgo.site subdomain, all without a card.
                Upgrade to Pro whenever you need custom domains or more credits.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What are credits?
              </h3>
              <p className="text-gray-600">
                Credits power AI generation. Typical costs:
              </p>
              <ul className="mt-2 space-y-1 text-gray-600">
                {CREDIT_COST_LINES.map(([label, cost]) => (
                  <li key={label} className="flex justify-between max-w-xs">
                    <span>{label}</span>
                    <span className="font-medium text-gray-900">
                      {cost} credit{cost === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-gray-600">
                Free gives you 20 one-time credits — enough to import a site, research your
                audience, and generate a full page with room to iterate. Pro refills 200 every
                month.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do unused Pro credits roll over?
              </h3>
              <p className="text-gray-600">
                No — your 200 monthly credits reset each billing cycle. Any top-up credits you
                buy don&apos;t expire and carry over.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I get a refund on Pro?
              </h3>
              <p className="text-gray-600">
                Yes. Pro comes with a 14-day money-back guarantee — if it&apos;s not for you,
                email us within 14 days of your first payment and we&apos;ll refund it, no
                questions asked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What&apos;s the Founding LTD deal?
              </h3>
              <p className="text-gray-600">
                A one-time payment for Pro features as they exist today — for life — plus a
                600-credit lifetime pool. It&apos;s a beta-only offer: 60 seats total, priced
                $69 → $99 → $129 as they fill, and it never comes back. Checkout opens at
                launch.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Which AI model does Lessgo AI use?
              </h3>
              <p className="text-gray-600">
                We route generation to the best available model for the job and upgrade it over
                time — so your copy keeps getting better without you changing anything.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What currency is pricing in?
              </h3>
              <p className="text-gray-600">
                All prices are in US dollars (USD).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes. Cancel Pro anytime from your billing dashboard — you keep access until the
                end of the current period, then drop back to Free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
