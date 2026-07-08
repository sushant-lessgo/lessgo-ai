'use client';

import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import { landingGoals, landingGoalLabels, type LandingGoal } from '@/types/generation';
import { LANDING_GOAL_TO_INTENT } from '@/modules/brief/bridge';
import OptionCard from '@/components/onboarding/shared/OptionCard';
import GoalParamFields, {
  intentHasParamFields,
  intentParamSatisfied,
} from '@/components/onboarding/shared/GoalParamFields';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  UserPlus,
  PlayCircle,
  CreditCard,
  Calendar,
  Download,
  Mail,
} from 'lucide-react';

const goalIcons: Record<LandingGoal, React.ReactNode> = {
  waitlist: <ClipboardList className="w-6 h-6" />,
  signup: <UserPlus className="w-6 h-6" />,
  'free-trial': <PlayCircle className="w-6 h-6" />,
  buy: <CreditCard className="w-6 h-6" />,
  demo: <Calendar className="w-6 h-6" />,
  download: <Download className="w-6 h-6" />,
  enquiry: <Mail className="w-6 h-6" />,
};

const goalDescriptions: Record<LandingGoal, string> = {
  waitlist: 'Collect emails for early access',
  signup: 'Create an account to get started',
  'free-trial': 'Try the product for free',
  buy: 'Purchase or subscribe now',
  demo: 'Schedule a product walkthrough',
  download: 'Get the app or resource',
  enquiry: 'Get enquiries / quote requests from buyers',
};

export default function GoalStep() {
  const landingGoal = useProductGenerationStore((s) => s.landingGoal);
  const setLandingGoal = useProductGenerationStore((s) => s.setLandingGoal);
  const goalParam = useProductGenerationStore((s) => s.goalParam);
  const setGoalParam = useProductGenerationStore((s) => s.setGoalParam);
  const nextStep = useProductGenerationStore((s) => s.nextStep);
  const templateId = useProductGenerationStore((s) => s.templateId);

  // `enquiry` is manufacturer-only (onboarding1, D1). SaaS personas keep
  // exactly the original 6 goals ('enquiry' is appended last in landingGoals,
  // so filtering preserves the original order).
  const visibleGoals = isManufacturerFlow(templateId)
    ? landingGoals
    : landingGoals.filter((g) => g !== 'enquiry');

  // Goal-slot param capture (scale-05 phase 1): goals whose intent needs a
  // param pause the auto-advance and show GoalParamFields + Continue/Skip.
  const selectedIntent = landingGoal ? LANDING_GOAL_TO_INTENT[landingGoal] : null;
  const showParamFields = selectedIntent !== null && intentHasParamFields(selectedIntent);
  const canProceed =
    selectedIntent !== null && intentParamSatisfied(selectedIntent, goalParam);

  const handleSelect = (goal: LandingGoal) => {
    setLandingGoal(goal);
    if (goal !== landingGoal) setGoalParam({}); // stale params don't cross goals
    const intent = LANDING_GOAL_TO_INTENT[goal];
    if (!intentHasParamFields(intent)) {
      nextStep(); // Auto-advance (original behavior for param-less goals)
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What should visitors do?
        </h1>
        <p className="mt-2 text-gray-600">
          Choose the primary action for your landing page
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleGoals.map((goal) => (
          <OptionCard
            key={goal}
            icon={goalIcons[goal]}
            label={landingGoalLabels[goal]}
            description={goalDescriptions[goal]}
            selected={landingGoal === goal}
            onClick={() => handleSelect(goal)}
          />
        ))}
      </div>

      {showParamFields && selectedIntent && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <GoalParamFields
            intent={selectedIntent}
            value={goalParam}
            onChange={setGoalParam}
          />
          <div className="flex items-center gap-4">
            <Button
              onClick={nextStep}
              disabled={!canProceed}
              className="bg-brand-accentPrimary hover:bg-orange-500"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={() => {
                setGoalParam({});
                nextStep();
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
