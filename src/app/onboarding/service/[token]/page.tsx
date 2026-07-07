'use client';

// Service-route onboarding wizard — store-based step dispatcher.
// Mirrors /create/[token]/page.tsx pattern. The store is in-memory only;
// reload restarts at oneLiner (acceptable for pilot, matches product flow).

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { briefToServicePrefill } from '@/modules/brief/bridge';
import { templateIds, type TemplateId } from '@/types/service';
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
  const params = useParams();
  const tokenId = params?.token as string | undefined;
  const checkedBrief = useRef(false);

  // scale-02 phase 6 (D5): bridge hydrate — mount-level only, steps/store
  // untouched. No-ops when the project has no Brief / no facts.entry (legacy
  // flows byte-identical) or the store is already dirty.
  // goToStep('understanding') skips OneLinerStep so the entry's 1-credit
  // classify isn't re-charged (mirrors the import-hydrate pattern).
  useEffect(() => {
    if (checkedBrief.current || !tokenId) return;
    checkedBrief.current = true;
    (async () => {
      try {
        const pre = useServiceGenerationStore.getState();
        if (pre.currentStep !== 'oneLiner' || pre.oneLiner) return;
        const res = await fetch(`/api/brief?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) return;
        const { brief, templateId } = await res.json();
        const prefill = briefToServicePrefill(brief);
        if (!prefill) return; // no brief / no facts.entry ⇒ no-op
        const s = useServiceGenerationStore.getState();
        if (s.currentStep !== 'oneLiner' || s.oneLiner) return; // dirty since fetch
        if (templateId && (templateIds as readonly string[]).includes(templateId)) {
          s.setTemplateId(templateId as TemplateId);
        }
        s.setOneLiner(prefill.oneLiner);
        s.setBusinessName(prefill.businessName);
        s.setUnderstanding(prefill.understanding);
        if (prefill.goal) s.setGoal(prefill.goal);
        if (prefill.offer) s.setOffer(prefill.offer);
        if (prefill.importedTestimonials?.length) {
          // ServicePrefill carries plain quote strings; the store expects
          // ScrapedTestimonial objects — map here so the pure bridge keeps
          // its clean shape (plan phase-6 step 5 note).
          s.setImportedTestimonials(
            prefill.importedTestimonials.map((quote) => ({
              quote,
              author_name: '',
              author_role: '',
            }))
          );
        }
        s.goToStep('understanding');
      } catch {
        /* best-effort — wizard starts empty, exactly as today */
      }
    })();
  }, [tokenId]);

  const StepComponent = stepComponents[currentStep] ?? OneLinerStep;

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
