'use client';

// Product-route (Meridian) onboarding wizard — store-based step dispatcher.
// Mirrors /onboarding/service/[token]/page.tsx. In-memory store; reload
// restarts at oneLiner (acceptable for pilot, matches service/product flows).

import dynamic from 'next/dynamic';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import StepContainer from './components/StepContainer';
import OneLinerStep from './components/steps/OneLinerStep';
import UnderstandingStep from './components/steps/UnderstandingStep';
import GoalStep from './components/steps/GoalStep';
import OfferStep from './components/steps/OfferStep';

// GeneratingStep uses crypto.randomUUID + router + saveDraft fetch; keep it
// dynamic (ssr:false) to mirror the service flow and avoid hydration concerns.
const GeneratingStep = dynamic(
  () => import('./components/steps/GeneratingStep'),
  { ssr: false }
);

const stepComponents: Record<string, React.ComponentType> = {
  oneLiner: OneLinerStep,
  understanding: UnderstandingStep,
  goal: GoalStep,
  offer: OfferStep,
  generating: GeneratingStep,
};

export default function ProductOnboardingPage() {
  const currentStep = useProductGenerationStore((s) => s.currentStep);
  const StepComponent = stepComponents[currentStep] ?? OneLinerStep;

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
