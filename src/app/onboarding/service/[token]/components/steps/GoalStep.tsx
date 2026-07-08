'use client';

import { useEffect, useState } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Gift } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import type { ServiceGoal } from '@/types/service';
import { SERVICE_GOAL_TO_INTENT } from '@/modules/brief/bridge';
import GoalParamFields, {
  intentHasParamFields,
  intentParamSatisfied,
} from '@/components/onboarding/shared/GoalParamFields';

// Phase 8: three goals are offered — book-call (default), request-quote, and
// lead-magnet. Other goals (apply / download-portfolio / subscribe-newsletter)
// stay defined in the enum but are not surfaced here.
interface GoalOption {
  id: Extract<ServiceGoal, 'book-call' | 'request-quote' | 'lead-magnet'>;
  title: string;
  description: string;
  Icon: typeof Calendar;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'book-call',
    title: 'Book a discovery call',
    description:
      'The page guides visitors toward booking a no-obligation conversation with you.',
    Icon: Calendar,
  },
  {
    id: 'request-quote',
    title: 'Request a quote',
    description:
      'Visitors ask for a custom, scoped estimate — best when every engagement is priced individually.',
    Icon: FileText,
  },
  {
    id: 'lead-magnet',
    title: 'Get the free resource',
    description:
      "Capture interested leads with a free resource. You'll see submissions in your dashboard and send the resource yourself — auto-delivery is on the roadmap.",
    Icon: Gift,
  },
];

export default function GoalStep() {
  const posthog = usePostHog();
  const goal = useServiceGenerationStore((s) => s.goal);
  const setGoal = useServiceGenerationStore((s) => s.setGoal);
  const goalParam = useServiceGenerationStore((s) => s.goalParam);
  const setGoalParam = useServiceGenerationStore((s) => s.setGoalParam);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);

  const [selected, setSelected] = useState<GoalOption['id']>(
    (goal as GoalOption['id']) ?? 'book-call'
  );

  useEffect(() => {
    // Default the store to the current selection so a user who hits Continue
    // immediately still has a goal set.
    setGoal(selected);
    posthog?.capture('service_onboarding_step_view', {
      step: 'goal',
      stepIndex: 2,
      audienceType: 'service',
      goal: selected,
    });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: GoalOption['id']) => {
    if (id !== selected) setGoalParam({}); // stale params don't cross goals
    setSelected(id);
    setGoal(id);
  };

  // Goal-slot param capture (scale-05 phase 1) — e.g. book-call shows an
  // optional scheduling-link field. Composed into Brief.goal at save.
  const selectedIntent = SERVICE_GOAL_TO_INTENT[selected];
  const showParamFields = intentHasParamFields(selectedIntent);
  const canProceed = intentParamSatisfied(selectedIntent, goalParam);

  const handleContinue = () => {
    posthog?.capture('service_onboarding_step_submit', {
      step: 'goal',
      audienceType: 'service',
      goal: selected,
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
          Pick the single most important action. It shapes the call-to-action
          copy and the form we suggest.
        </p>
      </div>

      <div className="space-y-3">
        {GOAL_OPTIONS.map(({ id, title, description, Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`w-full text-left rounded-xl border-2 p-5 flex items-start gap-4 transition-colors ${
                active
                  ? 'border-brand-accentPrimary bg-brand-accentPrimary/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  active ? 'bg-brand-accentPrimary/10' : 'bg-gray-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? 'text-brand-accentPrimary' : 'text-gray-500'
                  }`}
                />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {showParamFields && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <GoalParamFields
            intent={selectedIntent}
            value={goalParam}
            onChange={setGoalParam}
          />
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={!canProceed}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
