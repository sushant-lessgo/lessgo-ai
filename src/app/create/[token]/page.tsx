'use client';

import dynamic from 'next/dynamic';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import StepContainer from './components/StepContainer';
import OneLinerStep from './components/steps/OneLinerStep';
import UnderstandingStep from './components/steps/UnderstandingStep';
import LandingGoalStep from './components/steps/LandingGoalStep';
import OfferStep from './components/steps/OfferStep';
import AssetAvailabilityStep from './components/steps/AssetAvailabilityStep';
import ResearchStep from './components/steps/ResearchStep';
import StrategyStep from './components/steps/StrategyStep';
import UIBlockStep from './components/steps/UIBlockStep';
import GeneratingStep from './components/steps/GeneratingStep';

// Dynamic import to avoid SSR - CompleteStep uses EditProvider which accesses window
const CompleteStep = dynamic(
  () => import('./components/steps/CompleteStep'),
  { ssr: false }
);

const stepComponents: Record<string, React.ComponentType> = {
  oneLiner: OneLinerStep,
  understanding: UnderstandingStep,
  landingGoal: LandingGoalStep,
  offer: OfferStep,
  assetAvailability: AssetAvailabilityStep,
  research: ResearchStep,
  strategy: StrategyStep,
  uiblockSelection: UIBlockStep,
  generating: GeneratingStep,
  complete: CompleteStep,
};

export default function CreatePage() {
  const currentStep = useGenerationStore((s) => s.currentStep);
  const StepComponent = stepComponents[currentStep];

  console.log('[CreatePage] Rendering step:', currentStep);

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
