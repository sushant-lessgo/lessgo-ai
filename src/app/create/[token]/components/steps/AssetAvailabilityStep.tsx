'use client';

import { useState, useEffect } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { useSimplifiedOnboardingV3 } from '@/hooks/useSimplifiedOnboarding';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquareQuote, Building2, TrendingUp } from 'lucide-react';
import type { AssetAvailability } from '@/types/generation';

interface AssetOption {
  key: keyof AssetAvailability;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const assetOptions: AssetOption[] = [
  {
    key: 'hasTestimonials',
    icon: <MessageSquareQuote className="w-5 h-5" />,
    label: 'Customer testimonials',
    description: 'Reviews, quotes, or success stories from customers',
  },
  {
    key: 'hasSocialProof',
    icon: <Building2 className="w-5 h-5" />,
    label: 'Social proof',
    description: 'Company logos, user counts, or media mentions',
  },
  {
    key: 'hasConcreteResults',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Concrete results',
    description: 'Specific stats, metrics, or case study data',
  },
];

export default function AssetAvailabilityStep() {
  const isV3 = useSimplifiedOnboardingV3();
  const assetAvailability = useGenerationStore((s) => s.assetAvailability);
  const setAssetAvailability = useGenerationStore((s) => s.setAssetAvailability);
  const setIVOCLoading = useGenerationStore((s) => s.setIVOCLoading);
  const setStrategyLoading = useGenerationStore((s) => s.setStrategyLoading);
  const setSimplifiedV3 = useGenerationStore((s) => s.setSimplifiedV3);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const [assets, setAssets] = useState<AssetAvailability>(
    assetAvailability || {
      hasTestimonials: false,
      hasSocialProof: false,
      hasConcreteResults: false,
    }
  );

  // Set V3 mode in store when component mounts
  useEffect(() => {
    setSimplifiedV3(isV3);
  }, [isV3, setSimplifiedV3]);

  const toggleAsset = (key: keyof AssetAvailability) => {
    setAssets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    setAssetAvailability(assets);

    if (isV3) {
      // V3: Skip research, go directly to strategy
      setStrategyLoading(true);
    } else {
      // V2: Prime research step
      setIVOCLoading(true);
    }

    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do you have ready?
        </h1>
        <p className="mt-2 text-gray-600">
          Check the assets you can provide (you can add them later too)
        </p>
      </div>

      <div className="space-y-3">
        {assetOptions.map((option) => (
          <label
            key={option.key}
            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200
                       hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all duration-200"
          >
            <Checkbox
              checked={assets[option.key]}
              onCheckedChange={() => toggleAsset(option.key)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{option.icon}</span>
                <span className="font-medium text-gray-900">{option.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{option.description}</p>
            </div>
          </label>
        ))}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Don&apos;t have these yet? No problem — we&apos;ll write draft copy and mark anything
        that needs your real data.
      </p>

      <Button
        onClick={handleContinue}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                   transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
