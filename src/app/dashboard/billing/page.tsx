'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Zap,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface PlanInfo {
  tier: string;
  status: string;
  creditsLimit: number;
  currentPeriodEnd: string | null;
  isTrialing: boolean;
  trialEnd: string | null;
}

interface UsageStats {
  period: string;
  credits: {
    used: number;
    remaining: number;
    limit: number;
  };
  operations: {
    fullPageGenerations: number;
    sectionRegenerations: number;
    elementRegenerations: number;
    fieldInferences: number;
  };
}

function SuccessMessage() {
  const searchParams = useSearchParams();

  if (searchParams.get('success') !== 'true') {
    return null;
  }

  return (
    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-green-800">
        <Check className="w-5 h-5" />
        <span className="font-semibold">Subscription activated!</span>
      </div>
      <p className="text-sm text-green-700 mt-1">
        Your trial has started. You won't be charged until the trial ends.
      </p>
    </div>
  );
}

export default function BillingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const fetchData = async () => {
      try {
        const [planRes, usageRes] = await Promise.all([
          fetch('/api/billing/plan'),
          fetch('/api/billing/usage'),
        ]);

        if (planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData);
        }

        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsage(usageData);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, router]);

  const openCustomerPortal = async () => {
    setIsPortalLoading(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const percentUsed = usage
    ? (usage.credits.used / usage.credits.limit) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Success Message */}
      <Suspense fallback={null}>
        <SuccessMessage />
      </Suspense>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Usage</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Current Plan Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>

          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {plan?.tier || 'FREE'}
            </div>
            {plan?.isTrialing && plan?.trialEnd && (
              <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Zap className="w-4 h-4" />
                Trial ends {new Date(plan.trialEnd).toLocaleDateString()}
              </div>
            )}
            {plan?.currentPeriodEnd && !plan?.isTrialing && (
              <p className="text-sm text-gray-600">
                Renews {new Date(plan.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Credits</span>
              <span className="font-semibold text-gray-900">
                {plan?.creditsLimit === -1
                  ? 'Unlimited'
                  : plan?.creditsLimit || 30}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span
                className={`font-semibold ${
                  plan?.status === 'active'
                    ? 'text-green-600'
                    : plan?.status === 'trialing'
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {plan?.status || 'active'}
              </span>
            </div>
          </div>

          {plan?.tier === 'FREE' ? (
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Upgrade to Pro
            </button>
          ) : (
            <button
              onClick={openCustomerPortal}
              disabled={isPortalLoading}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPortalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Credit Usage Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Credit Usage</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {usage?.credits.remaining || 0}
              </span>
              <span className="text-gray-600">
                / {usage?.credits.limit || 30} credits
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  percentUsed >= 100
                    ? 'bg-red-500'
                    : percentUsed >= 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>

            <p className="text-sm text-gray-600">
              {usage?.credits.used || 0} credits used this month
            </p>
          </div>

          {usage && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Page generations</span>
                <span className="font-semibold text-gray-900">
                  {usage.operations.fullPageGenerations}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Section regenerations</span>
                <span className="font-semibold text-gray-900">
                  {usage.operations.sectionRegenerations}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Element regenerations</span>
                <span className="font-semibold text-gray-900">
                  {usage.operations.elementRegenerations}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Field inferences</span>
                <span className="font-semibold text-gray-900">
                  {usage.operations.fieldInferences}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage History (Future Enhancement) */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Usage History</h2>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        <p className="text-gray-600 text-center py-8">
          Detailed usage history coming soon
        </p>
      </div>
    </div>
  );
}
