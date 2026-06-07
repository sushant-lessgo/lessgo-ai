'use client';

import { useEffect } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

// Pilot lockdown: goal is fixed to 'book-call'. Render a confirmation card +
// Continue. Other goals (request-quote, apply, download-portfolio,
// subscribe-newsletter) ship in Phase 9+.
export default function GoalStep() {
  const posthog = usePostHog();
  const setGoal = useServiceGenerationStore((s) => s.setGoal);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  useEffect(() => {
    setGoal('book-call');
    posthog?.capture('service_onboarding_step_view', {
      step: 'goal',
      stepIndex: 2,
      audienceType: 'service',
      goal: 'book-call',
    });
  }, [setGoal, posthog]);

  const handleContinue = () => {
    posthog?.capture('service_onboarding_step_submit', {
      step: 'goal',
      audienceType: 'service',
      goal: 'book-call',
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What should the page get visitors to do?
        </h1>
        <p className="mt-2 text-gray-600">
          For the pilot we&apos;re focusing on one CTA — booking a discovery
          call. Other goals open up soon.
        </p>
      </div>

      <div className="rounded-xl border-2 border-brand-accentPrimary bg-brand-accentPrimary/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-accentPrimary/10 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-brand-accentPrimary" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">
            Book a discovery call
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            The page guides visitors toward booking a no-obligation
            conversation with you.
          </p>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
