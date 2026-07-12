'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Coins, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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

export function CreditBadge() {
  const { isSignedIn } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

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

  if (!isSignedIn || isLoading) {
    return null;
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

  const getColor = () => {
    if (isOut) return 'text-red-600 bg-red-50 border-red-200';
    if (isLow) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getIcon = () => {
    if (isOut) return <AlertCircle className="w-4 h-4" />;
    return <Coins className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${getColor()}`}
      >
        {getIcon()}
        <span className="text-sm font-semibold">
          {hasMonthly ? `${totalAvailable}/${monthlyLimit}` : totalAvailable}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">AI Credits</h3>
            <span className="text-xs text-gray-500 uppercase font-semibold">
              {balance.tier}
            </span>
          </div>

          <div className="space-y-3">
            {hasMonthly ? (
              <>
                {/* Monthly allotment progress bar (only when there is one) */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Used</span>
                    <span className="font-semibold text-gray-900">
                      {balance.used} / {monthlyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        balance.percentUsed >= 100
                          ? 'bg-red-500'
                          : balance.percentUsed >= 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(balance.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
                {(balance.poolRemaining ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bonus pool</span>
                    <span className="font-semibold text-gray-900">
                      {balance.poolRemaining} credits
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-gray-900">
                  {totalAvailable} credit{totalAvailable === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {/* Reset Info (monthly allotment only — pool credits don't reset) */}
            {hasMonthly && (
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                <TrendingUp className="w-4 h-4" />
                <span>
                  Resets in {balance.daysUntilReset} day{balance.daysUntilReset !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Low Balance Warning */}
            {isLow && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  {isOut
                    ? 'Out of credits! Upgrade for more.'
                    : 'Running low on credits'}
                </p>
                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-yellow-900 hover:text-yellow-700 underline"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}

            {/* Credit Costs */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Credit costs:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Full page generation</span>
                  <span className="font-semibold">10 credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Section regeneration</span>
                  <span className="font-semibold">2 credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Element variation</span>
                  <span className="font-semibold">1 credit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
