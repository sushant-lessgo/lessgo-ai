'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Check, Zap } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Launch',
    tier: 'FREE',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for getting started',
    credits: 30,
    features: [
      '30 AI credits/month',
      '1 published landing page',
      '3 draft projects',
      'Basic analytics',
      'Community support',
    ],
    limits: [
      'No custom domains',
      'Lessgo branding',
      'No form integrations',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: { monthly: 39, annual: 29 },
    description: 'For serious founders',
    credits: 200,
    features: [
      '200 AI credits/month',
      '10 published landing pages',
      'Unlimited drafts',
      '3 custom domains',
      'Remove Lessgo branding',
      'Form integrations (ConvertKit, etc.)',
      'Full analytics dashboard',
      'Priority support',
      '14-day free trial',
    ],
    limits: [],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Scale',
    tier: 'AGENCY',
    price: { monthly: 129, annual: 99 },
    description: 'For agencies & teams',
    credits: 1000,
    features: [
      '1,000 AI credits/month',
      'Unlimited published pages',
      'Unlimited drafts',
      'Unlimited custom domains',
      'White-label mode',
      'Export HTML',
      'Form integrations',
      'Full analytics',
      '5 team members',
      'Priority support',
    ],
    limits: [],
    cta: 'Coming Soon',
    popular: false,
    comingSoon: true,
  },
  {
    name: 'Custom',
    tier: 'ENTERPRISE',
    price: { monthly: 299, annual: 299 },
    description: 'Enterprise-grade solution',
    credits: -1,
    features: [
      'Unlimited AI credits',
      'Unlimited everything',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees',
      'On-premise option',
      'Advanced security',
      'Custom contracts',
    ],
    limits: [],
    cta: 'Contact Sales',
    popular: false,
    comingSoon: true,
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleUpgrade = async (tier: string) => {
    if (tier === 'FREE') {
      router.push('/dashboard');
      return;
    }

    if (!isSignedIn) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    if (tier !== 'PRO') {
      // Coming soon or contact sales
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'PRO',
          billingInterval,
        }),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
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
                25% off
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
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

              {tier.comingSoon && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Coming Soon
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm">{tier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    ${billingInterval === 'monthly' ? tier.price.monthly : tier.price.annual}
                  </span>
                  {tier.price.monthly > 0 && (
                    <span className="text-gray-600 ml-2">/month</span>
                  )}
                </div>
                {billingInterval === 'annual' && tier.price.annual !== tier.price.monthly && (
                  <p className="text-sm text-gray-500 mt-1">
                    ${tier.price.annual * 12}/year (save ${(tier.price.monthly - tier.price.annual) * 12})
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  {tier.credits === -1 ? 'Unlimited AI Credits' : `${tier.credits} AI Credits/month`}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(tier.tier)}
                disabled={isLoading || tier.comingSoon}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-6 ${
                  tier.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
                    : tier.comingSoon
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300'
                }`}
              >
                {isLoading ? 'Loading...' : tier.cta}
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
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What are AI credits?
              </h3>
              <p className="text-gray-600">
                AI credits power all content generation. Full page generation costs 10 credits,
                section regeneration costs 2 credits, and element variations cost 1 credit each.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do unused credits roll over?
              </h3>
              <p className="text-gray-600">
                No, credits reset at the start of each billing cycle. This keeps pricing simple
                and predictable.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Cancel anytime from your billing dashboard. You'll keep access until the end
                of your current billing period, then automatically downgrade to the free plan.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens during the 14-day trial?
              </h3>
              <p className="text-gray-600">
                Pro trial gives you full access to 200 credits and all Pro features. We'll ask
                for your card upfront but won't charge until the trial ends. Cancel anytime
                during the trial with no charge.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes! Upgrade anytime to get more credits and features. Downgrades take effect at
                the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
