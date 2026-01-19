'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const examples = [
  '14-day free trial, no credit card required',
  'Free plan with 100 requests/month',
  'Get instant access to all features',
  '30-day money-back guarantee',
];

export default function OfferStep() {
  const offer = useGenerationStore((s) => s.offer);
  const setOffer = useGenerationStore((s) => s.setOffer);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const [localOffer, setLocalOffer] = useState(offer);

  const isValid = localOffer.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOffer(localOffer.trim());
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do visitors get?
        </h1>
        <p className="mt-2 text-gray-600">
          Describe your offer to help us craft compelling copy
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer" className="text-gray-700">Your offer</Label>
        <Textarea
          id="offer"
          placeholder="14-day free trial, no credit card required"
          value={localOffer}
          onChange={(e) => setLocalOffer(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Examples:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setLocalOffer(ex)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50
                         hover:text-brand-accentPrimary border border-transparent
                         hover:border-orange-200 transition-all duration-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                   transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        Continue
      </Button>
    </form>
  );
}
