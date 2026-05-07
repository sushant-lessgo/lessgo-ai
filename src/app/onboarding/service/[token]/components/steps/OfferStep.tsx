'use client';

import { useState, useEffect } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePostHog } from 'posthog-js/react';

const examples = [
  'Free 30-min brand audit, no obligation',
  '15-min strategy call to scope the project',
  'Free 1-page brand teardown delivered in 48hrs',
];

export default function OfferStep() {
  const posthog = usePostHog();
  const offer = useServiceGenerationStore((s) => s.offer);
  const setOffer = useServiceGenerationStore((s) => s.setOffer);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [local, setLocal] = useState(offer);
  const trimmed = local.trim();
  const isValid = trimmed.length >= 10;

  useEffect(() => {
    posthog?.capture('service_onboarding_step_view', {
      step: 'offer',
      stepIndex: 3,
      projectType: 'service',
    });
  }, [posthog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOffer(trimmed);
    posthog?.capture('service_onboarding_step_submit', {
      step: 'offer',
      projectType: 'service',
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What do they get when they reach out?
        </h1>
        <p className="mt-2 text-gray-600">
          The free thing on the other side of the call — a teardown, a
          strategy hour, an audit. Specific beats generic.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer" className="text-gray-700">
          Your offer <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="offer"
          placeholder="Free 30-min brand audit, no obligation"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="min-h-[80px]"
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{local.length}/300</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setLocal(ex)}
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
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Continue
      </Button>
    </form>
  );
}
