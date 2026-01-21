'use client';

import { useEffect, useCallback } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import LoadingOverlay from '../shared/LoadingOverlay';
import ErrorRetry from '../shared/ErrorRetry';
import type { IVOC } from '@/types/generation';

const researchMessages = [
  'Researching your market...',
  'Finding customer insights...',
  'Analyzing competitor messaging...',
  'Gathering voice of customer data...',
];

// Fallback IVOC when research fails and user chooses to skip
const fallbackIVOC: IVOC = {
  pains: [],
  desires: [],
  objections: [],
  firmBeliefs: [],
  shakableBeliefs: [],
  commonPhrases: [],
};

export default function ResearchStep() {
  const understanding = useGenerationStore((s) => s.understanding);
  const ivoc = useGenerationStore((s) => s.ivoc);
  const ivocLoading = useGenerationStore((s) => s.ivocLoading);
  const ivocError = useGenerationStore((s) => s.ivocError);
  const setIVOC = useGenerationStore((s) => s.setIVOC);
  const setIVOCLoading = useGenerationStore((s) => s.setIVOCLoading);
  const setIVOCError = useGenerationStore((s) => s.setIVOCError);
  const setStrategyLoading = useGenerationStore((s) => s.setStrategyLoading);
  const nextStep = useGenerationStore((s) => s.nextStep);

  // API call
  const callResearchAPI = useCallback(async () => {
    if (!understanding) return;

    setIVOCLoading(true);
    setIVOCError(null);

    try {
      const response = await fetch('/api/v2/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: understanding.categories.join(', '),
          audience: understanding.audiences.join(', '),
          productDescription: understanding.whatItDoes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIVOC(result.data);
        setStrategyLoading(true); // Prime next step BEFORE advancing
        nextStep();
      } else {
        setIVOCError(result.message || 'Research failed');
      }
    } catch (error) {
      setIVOCError('Network error. Please try again.');
    }
  }, [understanding, setIVOC, setIVOCLoading, setIVOCError, nextStep, setStrategyLoading]);

  // Trigger API call on mount when loading flag is set
  useEffect(() => {
    if (ivocLoading && !ivoc && !ivocError) {
      callResearchAPI();
    }
  }, []); // Only on mount

  // Handle skip with fallback IVOC
  const handleSkip = () => {
    setIVOC(fallbackIVOC);
    setStrategyLoading(true); // Prime next step BEFORE advancing
    nextStep();
  };

  // Loading state
  if (ivocLoading && !ivoc) {
    return <LoadingOverlay messages={researchMessages} />;
  }

  // Error state
  if (ivocError && !ivoc) {
    return (
      <ErrorRetry
        title="Research unavailable"
        message="We couldn't gather market research data. You can skip this step and continue with generic insights."
        onRetry={callResearchAPI}
        retryLabel="Try again"
        onSecondary={handleSkip}
        secondaryLabel="Skip research"
      />
    );
  }

  // If we have IVOC, this step should auto-advance
  // This shouldn't render, but just in case
  return <LoadingOverlay messages={['Continuing...']} />;
}
