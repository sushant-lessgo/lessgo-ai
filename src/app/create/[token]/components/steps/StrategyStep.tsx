'use client';

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import LoadingOverlay from '../shared/LoadingOverlay';
import ErrorRetry from '../shared/ErrorRetry';

const MAX_RETRIES = 3;

export default function StrategyStep() {
  const isV3 = useGenerationStore((s) => s.isSimplifiedV3);
  const productName = useGenerationStore((s) => s.productName);
  const oneLiner = useGenerationStore((s) => s.oneLiner);
  const understanding = useGenerationStore((s) => s.understanding);

  const audience = understanding?.audiences?.[0] || '';
  const name = productName || 'your product';

  const strategyMessages = useMemo(() => [
    audience ? `Analyzing the ${audience} market...` : 'Analyzing your market position...',
    `Figuring out what converts for ${name}...`,
    audience ? `Designing the perfect page for ${audience}...` : 'Designing the perfect page flow...',
    `Selecting high-converting sections for ${name}...`,
    'Almost there...',
  ], [audience, name]);
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

  // Ref guard to prevent double API calls (React Strict Mode)
  const hasCalledApi = useRef(false);

  // API call
  const callStrategyAPI = useCallback(async () => {
    // V3: No IVOC required
    // V2: Requires IVOC
    if (!understanding || !landingGoal || !assetAvailability) return;
    if (!isV3 && !ivoc) return;

    setStrategyLoading(true);
    setStrategyError(null);

    try {
      // Choose endpoint based on V3 mode
      const endpoint = isV3 ? '/api/v3/strategy' : '/api/v2/strategy';

      // Build request body based on version
      const requestBody = isV3
        ? {
            // V3 request body (no IVOC, includes UIBlock decision data)
            productName: productName || 'Your Product',
            oneLiner,
            features: understanding.features,
            landingGoal,
            offer,
            hasTestimonials: assetAvailability.hasTestimonials,
            hasSocialProof: assetAvailability.hasSocialProof,
            hasConcreteResults: assetAvailability.hasConcreteResults,
            hasDemoVideo: assetAvailability.hasDemoVideo,
            testimonialType: assetAvailability.testimonialType,
            socialProofTypes: assetAvailability.socialProofTypes,
            primaryAudience: understanding.audiences[0],
            otherAudiences: understanding.audiences.slice(1),
            categories: understanding.categories,
            hasMultipleAudiences: understanding.audiences.length > 1,
          }
        : {
            // V2 request body (with IVOC)
            productName: productName || 'Your Product',
            oneLiner,
            features: understanding.features,
            landingGoal,
            offer,
            hasTestimonials: assetAvailability.hasTestimonials,
            hasSocialProof: assetAvailability.hasSocialProof,
            hasConcreteResults: assetAvailability.hasConcreteResults,
            ivoc,
            primaryAudience: understanding.audiences[0],
            otherAudiences: understanding.audiences.slice(1),
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[StrategyStep] Strategy ${isV3 ? 'V3' : 'V2'} success, setting strategy`);
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
    isV3, productName, oneLiner, understanding, landingGoal, offer,
    assetAvailability, ivoc, setStrategy, setStrategyLoading,
    setStrategyError
  ]);

  // Trigger API call on mount when loading flag is set
  useEffect(() => {
    if (strategyLoading && !strategy && !strategyError && !hasCalledApi.current) {
      hasCalledApi.current = true;
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
    return <LoadingOverlay messages={strategyMessages} messageInterval={3000} />;
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
  return <LoadingOverlay messages={strategyMessages} messageInterval={3000} skeletonCount={0} />;
}
