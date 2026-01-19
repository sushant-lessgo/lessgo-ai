'use client';

import { useGenerationStore } from '@/hooks/useGenerationStore';
import { landingGoals, landingGoalLabels, type LandingGoal } from '@/types/generation';
import OptionCard from '../shared/OptionCard';
import {
  ClipboardList,
  UserPlus,
  PlayCircle,
  CreditCard,
  Calendar,
  Download,
} from 'lucide-react';

const goalIcons: Record<LandingGoal, React.ReactNode> = {
  waitlist: <ClipboardList className="w-6 h-6" />,
  signup: <UserPlus className="w-6 h-6" />,
  'free-trial': <PlayCircle className="w-6 h-6" />,
  buy: <CreditCard className="w-6 h-6" />,
  demo: <Calendar className="w-6 h-6" />,
  download: <Download className="w-6 h-6" />,
};

const goalDescriptions: Record<LandingGoal, string> = {
  waitlist: 'Collect emails for early access',
  signup: 'Create an account to get started',
  'free-trial': 'Try the product for free',
  buy: 'Purchase or subscribe now',
  demo: 'Schedule a product walkthrough',
  download: 'Get the app or resource',
};

export default function LandingGoalStep() {
  const landingGoal = useGenerationStore((s) => s.landingGoal);
  const setLandingGoal = useGenerationStore((s) => s.setLandingGoal);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const handleSelect = (goal: LandingGoal) => {
    setLandingGoal(goal);
    nextStep(); // Auto-advance
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
        {landingGoals.map((goal) => (
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
    </div>
  );
}
