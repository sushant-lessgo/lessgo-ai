'use client';

import { useRouter } from 'next/navigation';
import { X, Zap, Clock, TrendingUp } from 'lucide-react';

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRequired: number;
  creditsAvailable: number;
  daysUntilReset?: number;
}

export function OutOfCreditsModal({
  isOpen,
  onClose,
  creditsRequired,
  creditsAvailable,
  daysUntilReset = 0,
}: OutOfCreditsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 border-b">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Out of AI Credits
          </h2>
          <p className="text-gray-600 text-center">
            You need {creditsRequired} credit{creditsRequired !== 1 ? 's' : ''} but only have{' '}
            {creditsAvailable} remaining this month.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Options */}
          <div className="space-y-4">
            {/* Option 1: Upgrade */}
            <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
              <div className="flex items-start gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upgrade to Pro</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get 200 AI credits/month + unlimited drafts, 10 published pages, and more.
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">$39</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">14-day free trial included</p>
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Option 2: Wait */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Wait for Reset</h3>
                  <p className="text-sm text-gray-600">
                    Your credits will refresh in{' '}
                    <span className="font-semibold text-gray-900">
                      {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Free plan: 30 credits/month
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">Credit costs:</p>
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
    </div>
  );
}
