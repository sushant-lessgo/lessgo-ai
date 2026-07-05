'use client';

// Product-route (Meridian) onboarding wizard — store-based step dispatcher.
// Mirrors /onboarding/service/[token]/page.tsx. In-memory store; reload
// restarts at oneLiner (acceptable for pilot, matches service/product flows).

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { isResumableGeneration } from '@/modules/generation/multiPageAssembly';
import StepContainer from './components/StepContainer';
import OneLinerStep from './components/steps/OneLinerStep';
import UnderstandingStep from './components/steps/UnderstandingStep';
import GoalStep from './components/steps/GoalStep';
import OfferStep from './components/steps/OfferStep';
import SitemapReviewStep from './components/steps/SitemapReviewStep';

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
  sitemap: SitemapReviewStep,
  generating: GeneratingStep,
};

// Whitelisted ?template= values (all open to every user).
const TEMPLATE_PARAM_WHITELIST = ['meridian', 'vestria'] as const;

export default function ProductOnboardingPage() {
  const currentStep = useProductGenerationStore((s) => s.currentStep);
  const setTemplateId = useProductGenerationStore((s) => s.setTemplateId);
  const goToStep = useProductGenerationStore((s) => s.goToStep);
  const searchParams = useSearchParams();
  const params = useParams();
  const tokenId = params?.token as string | undefined;
  const templateParam = searchParams?.get('template');
  const checkedResume = useRef(false);

  // Template selection once on mount. Explicit ?template= wins; otherwise the
  // `manufacturer` persona defaults to Vestria (mirrors the param → same store
  // field, so the rest of the flow — sitemap gate, fan-out — is unchanged).
  useEffect(() => {
    if (templateParam && (TEMPLATE_PARAM_WHITELIST as readonly string[]).includes(templateParam)) {
      setTemplateId(templateParam as (typeof TEMPLATE_PARAM_WHITELIST)[number]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/persona');
        if (!res.ok) return;
        const { persona } = await res.json();
        if (!cancelled && persona === 'manufacturer') setTemplateId('vestria');
      } catch {
        /* best-effort — falls back to Meridian */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateParam, setTemplateId]);

  // Resume an in-progress multi-page generation after a reload/tab close: the
  // in-memory store restarts at oneLiner, but the DB draft carries the agreed
  // sitemap + completed pages — jump straight to generating (which resumes
  // from the first missing page; completed pages are never re-paid).
  useEffect(() => {
    if (checkedResume.current || !tokenId) return;
    checkedResume.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) return;
        const json = await res.json();
        const fc = json?.finalContent || json?.content?.finalContent || json?.content;
        if (isResumableGeneration(fc)) {
          if (fc.onboardingData?.strategy) setTemplateId('vestria');
          goToStep('generating');
        }
      } catch {
        /* best-effort */
      }
    })();
  }, [tokenId, goToStep, setTemplateId]);

  const StepComponent = stepComponents[currentStep] ?? OneLinerStep;

  return (
    <StepContainer>
      <StepComponent />
    </StepContainer>
  );
}
