'use client';

import { useEffect, useCallback, useState } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import LoadingOverlay from '../shared/LoadingOverlay';
import ErrorRetry from '../shared/ErrorRetry';

const strategyMessages = [
  'Building your conversion strategy...',
  'Crafting your unique angle...',
  'Designing the perfect page flow...',
  'Selecting optimal sections...',
];

const MAX_RETRIES = 3;

export default function StrategyStep() {
  const productName = useGenerationStore((s) => s.productName);
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const understanding = useGenerationStore((s) => s.understanding);
  const landingGoal = useGenerationStore((s) => s.landingGoal);
  const offer = useGenerationStore((s) => s.offer);
  const assetAvailability = useGenerationStore((s) => s.assetAvailability);
  const ivoc = useGenerationStore((s) => s.ivoc);
  const strategy = useGenerationStore((s) => s.strategy);
  const strategyLoading = useGenerationStore((s) => s.strategyLoading);
  const strategyError = useGenerationStore((s) => s.strategyError);
  const setStrategy = useGenerationStore((s) => s.setStrategy);
  const setStrategyLoading = useGenerationStore((s) => s.setStrategyLoading);
  const setStrategyError = useGenerationStore((s) => s.setStrategyError);
  const nextStep = useGenerationStore((s) => s.nextStep);

  const [retryCount, setRetryCount] = useState(0);

  // API call
  const callStrategyAPI = useCallback(async () => {
    if (!understanding || !landingGoal || !assetAvailability || !ivoc) return;

    setStrategyLoading(true);
    setStrategyError(null);

    try {
      const response = await fetch('/api/v2/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName || 'Your Product',
          oneLiner,
          features: understanding.features,  // string[] - API extracts benefits
          landingGoal,
          offer,
          hasTestimonials: assetAvailability.hasTestimonials,
          hasSocialProof: assetAvailability.hasSocialProof,
          hasConcreteResults: assetAvailability.hasConcreteResults,
          ivoc,
          primaryAudience: understanding.audiences[0],
          otherAudiences: understanding.audiences.slice(1),
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('[StrategyStep] Strategy success, setting strategy');
        setStrategy(result.data);
        setStrategyLoading(false);
        // Don't call nextStep() here - let the auto-advance effect handle it
        // This gives React time to propagate strategy to UIBlockStep
      } else {
        setStrategyError(result.message || 'Strategy generation failed');
      }
    } catch (error) {
      setStrategyError('Network error. Please try again.');
    }
  }, [
    productName, oneLiner, understanding, landingGoal, offer,
    assetAvailability, ivoc, setStrategy, setStrategyLoading,
    setStrategyError
  ]);

  // Trigger API call on mount when loading flag is set
  useEffect(() => {
    if (strategyLoading && !strategy && !strategyError) {
      callStrategyAPI();
    }
  }, []); // Only on mount

  // Auto-advance when strategy is set (separate from setting to let React propagate)
  useEffect(() => {
    if (strategy && !strategyLoading && !strategyError) {
      console.log('[StrategyStep] Strategy ready, advancing to next step');
      nextStep();
    }
  }, [strategy, strategyLoading, strategyError, nextStep]);

  // Handle retry with count tracking
  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      // Already at max retries - show persistent error
      return;
    }
    setRetryCount((c) => c + 1);
    callStrategyAPI();
  };

  // Loading state
  if (strategyLoading && !strategy) {
    return <LoadingOverlay messages={strategyMessages} />;
  }

  // Error state
  if (strategyError && !strategy) {
    const canRetry = retryCount < MAX_RETRIES;
    return (
      <ErrorRetry
        title="Strategy generation failed"
        message={
          canRetry
            ? `We couldn't generate your landing page strategy. Please try again. (${retryCount}/${MAX_RETRIES} retries)`
            : 'Maximum retries reached. Please go back and try again later.'
        }
        onRetry={handleRetry}
        retryLabel={canRetry ? 'Try again' : 'Max retries reached'}
      />
    );
  }

  // If we have strategy, this step should auto-advance
  return <LoadingOverlay messages={['Continuing...']} />;
}
