'use client';

// Product-route (Meridian) onboarding wizard — store-based step dispatcher.
// Mirrors /onboarding/service/[token]/page.tsx. In-memory store; reload
// restarts at oneLiner (acceptable for pilot, matches service/product flows).

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
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

// Whitelisted ?template= values (vestria is additionally admin-gated server-side).
const TEMPLATE_PARAM_WHITELIST = ['meridian', 'vestria'] as const;

export default function ProductOnboardingPage() {
  const currentStep = useProductGenerationStore((s) => s.currentStep);
  const setTemplateId = useProductGenerationStore((s) => s.setTemplateId);
  const searchParams = useSearchParams();
  const templateParam = searchParams?.get('template');

  // Read ?template=vestria once on mount (pilot selection; a future product
  // picker sets the same store field).
  useEffect(() => {
    if (templateParam && (TEMPLATE_PARAM_WHITELIST as readonly string[]).includes(templateParam)) {
      setTemplateId(templateParam as (typeof TEMPLATE_PARAM_WHITELIST)[number]);
    }
  }, [templateParam, setTemplateId]);

  const StepComponent = stepComponents[currentStep] ?? OneLinerStep;

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
