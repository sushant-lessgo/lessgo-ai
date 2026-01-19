'use client';

import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Button } from '@/components/ui/button';
import StepContainer from './components/StepContainer';
import OneLinerStep from './components/steps/OneLinerStep';
import UnderstandingStep from './components/steps/UnderstandingStep';
import LandingGoalStep from './components/steps/LandingGoalStep';
import OfferStep from './components/steps/OfferStep';
import AssetAvailabilityStep from './components/steps/AssetAvailabilityStep';

// Placeholder for Phase 4B/4C steps (with temp Skip button for testing)
function PlaceholderStep({ name }: { name: string }) {
  const nextStep = useGenerationStore((s) => s.nextStep);
  return (
    <div className="text-center p-8">
      <p className="text-gray-500 mb-4">Step: {name} (coming in Phase 4B/4C)</p>
      <Button variant="outline" onClick={nextStep}>
        Skip (dev only)
      </Button>
    </div>
  );
}

const stepComponents: Record<string, React.ComponentType> = {
  oneLiner: OneLinerStep,
  understanding: UnderstandingStep,
  landingGoal: LandingGoalStep,
  offer: OfferStep,
  assetAvailability: AssetAvailabilityStep,
  research: () => <PlaceholderStep name="research" />,
  strategy: () => <PlaceholderStep name="strategy" />,
  uiblockSelection: () => <PlaceholderStep name="uiblockSelection" />,
  generating: () => <PlaceholderStep name="generating" />,
  complete: () => <PlaceholderStep name="complete" />,
};

export default function CreatePage() {
  const currentStep = useGenerationStore((s) => s.currentStep);
  const StepComponent = stepComponents[currentStep];

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
