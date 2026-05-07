'use client';

// Service-route onboarding wizard — store-based step dispatcher.
// Mirrors /create/[token]/page.tsx pattern. The store is in-memory only;
// reload restarts at oneLiner (acceptable for pilot, matches product flow).

import dynamic from 'next/dynamic';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import StepContainer from './components/StepContainer';
import OneLinerStep from './components/steps/OneLinerStep';
import UnderstandingStep from './components/steps/UnderstandingStep';
import GoalStep from './components/steps/GoalStep';
import OfferStep from './components/steps/OfferStep';
import AssetsStep from './components/steps/AssetsStep';
import StyleStep from './components/steps/StyleStep';

// GeneratingStep uses crypto.randomUUID + router; keep it dynamic to mirror
// the product flow's CompleteStep handling and avoid SSR hydration concerns
// with the saveDraft fetch path.
const GeneratingStep = dynamic(
  () => import('./components/steps/GeneratingStep'),
  { ssr: false }
);

const stepComponents: Record<string, React.ComponentType> = {
  oneLiner: OneLinerStep,
  understanding: UnderstandingStep,
  goal: GoalStep,
  offer: OfferStep,
  assets: AssetsStep,
  style: StyleStep,
  generating: GeneratingStep,
  // 'complete' is unused in pilot — GeneratingStep redirects directly to
  // /edit/[token] without a CompleteStep handoff. Kept in the store enum
  // for shape consistency with future expansion.
};

export default function ServiceOnboardingPage() {
  const currentStep = useServiceGenerationStore((s) => s.currentStep);
  const StepComponent = stepComponents[currentStep] ?? OneLinerStep;

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
