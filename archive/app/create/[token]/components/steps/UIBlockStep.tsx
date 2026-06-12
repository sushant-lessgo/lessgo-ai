'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { useSimplifiedOnboardingV3 } from '@/hooks/useSimplifiedOnboarding';
import { Button } from '@/components/ui/button';
import LoadingOverlay from '../shared/LoadingOverlay';
import ErrorRetry from '../shared/ErrorRetry';
import { selectUIBlocksV3 } from '@/modules/uiblock/selectUIBlocksV3';
import type { UIBlockQuestion, SectionType, SimplifiedStrategyOutput } from '@/types/generation';
import { cn } from '@/lib/utils';

const uiblockMessages = [
  'Selecting layouts...',
  'Matching design to strategy...',
  'Optimizing visual flow...',
];

/**
 * Question card component for layout selection (V2 only)
 */
function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: UIBlockQuestion;
  value: string | undefined;
  onChange: (answer: string) => void;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <p className="font-medium text-gray-700">{question.question}</p>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              'p-3 rounded-lg border-2 text-sm text-left transition-all',
              value === option
                ? 'border-brand-accentPrimary bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UIBlockStep() {
  console.log('[UIBlockStep] Component rendering');

  const isV3 = useSimplifiedOnboardingV3();
  const strategy = useGenerationStore((s) => s.strategy);
  const productName = useGenerationStore((s) => s.productName);
  const assetAvailability = useGenerationStore((s) => s.assetAvailability);
  const landingGoal = useGenerationStore((s) => s.landingGoal);
  const understanding = useGenerationStore((s) => s.understanding);
  const uiblockQuestions = useGenerationStore((s) => s.uiblockQuestions);
  const uiblockQuestionsAnswered = useGenerationStore((s) => s.uiblockQuestionsAnswered);
  const uiblockLoading = useGenerationStore((s) => s.uiblockLoading);
  const uiblockError = useGenerationStore((s) => s.uiblockError);
  const uiblockSelections = useGenerationStore((s) => s.uiblockSelections);
  const setUIBlockQuestions = useGenerationStore((s) => s.setUIBlockQuestions);
  const setUIBlockSelection = useGenerationStore((s) => s.setUIBlockSelection);
  const answerUIBlockQuestion = useGenerationStore((s) => s.answerUIBlockQuestion);
  const markQuestionsAnswered = useGenerationStore((s) => s.markQuestionsAnswered);
  const setUIBlockLoading = useGenerationStore((s) => s.setUIBlockLoading);
  const setUIBlockError = useGenerationStore((s) => s.setUIBlockError);
  const setGenerationProgress = useGenerationStore((s) => s.setGenerationProgress);
  const nextStep = useGenerationStore((s) => s.nextStep);

  // Local state for question answers before submission (V2 only)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  // Ref guard to prevent double API calls (React Strict Mode)
  const hasCalledApi = useRef(false);

  console.log('[UIBlockStep] State:', {
    isV3,
    hasStrategy: !!strategy,
    hasCalledApi: hasCalledApi.current,
    selectionsCount: Object.keys(uiblockSelections).length,
    questionsCount: uiblockQuestions.length,
    uiblockLoading,
    uiblockError,
  });

  /**
   * V3: Use UIBlocks from backend or fall back to client-side selection
   */
  const selectUIBlocksV3Handler = useCallback(() => {
    console.log('[UIBlockStep] V3: Processing UIBlock selection');

    if (!strategy || !landingGoal || !assetAvailability) {
      console.log('[UIBlockStep] V3: Missing required data');
      return;
    }

    // Cast strategy to SimplifiedStrategyOutput for V3
    // The store uses StrategyOutput union, but V3 flow guarantees SimplifiedStrategyOutput
    const v3Strategy = strategy as unknown as SimplifiedStrategyOutput;

    try {
      let uiblocks: Record<string, string>;

      // Check if backend already provided UIBlocks
      if (v3Strategy.uiblocks && Object.keys(v3Strategy.uiblocks).length > 0) {
        console.log('[UIBlockStep] V3: Using UIBlocks from backend');
        uiblocks = v3Strategy.uiblocks;
      } else {
        // Fallback to client-side selection
        console.log('[UIBlockStep] V3: Falling back to client-side selection');

        if (!v3Strategy.uiblockDecisions) {
          console.error('[UIBlockStep] V3: Strategy missing uiblockDecisions');
          setUIBlockError('Strategy missing UIBlock decisions. Please regenerate.');
          return;
        }

        const hasMultipleAudiences = (understanding?.audiences?.length ?? 0) > 1;

        const result = selectUIBlocksV3({
          sections: v3Strategy.sections,
          strategy: v3Strategy,
          assets: assetAvailability,
          landingGoal,
          hasMultipleAudiences,
        });
        uiblocks = result.uiblocks;
      }

      console.log('[UIBlockStep] V3: Final UIBlocks:', uiblocks);

      // Store all selections
      Object.entries(uiblocks).forEach(([section, layout]) => {
        setUIBlockSelection(section as SectionType, layout);
      });

      // Mark as complete and advance
      markQuestionsAnswered();
      setUIBlockLoading(false);
      nextStep();
      setGenerationProgress(0);
    } catch (error) {
      console.error('[UIBlockStep] V3: Selection error:', error);
      setUIBlockError('Failed to select layouts. Please try again.');
    }
  }, [
    strategy,
    landingGoal,
    assetAvailability,
    understanding,
    setUIBlockSelection,
    markQuestionsAnswered,
    setUIBlockLoading,
    setUIBlockError,
    nextStep,
    setGenerationProgress,
  ]);

  /**
   * V2: API-based UIBlock selection
   */
  const callUIBlockAPI = useCallback(async (answers?: Record<string, string>) => {
    console.log('[UIBlockStep] V2: callUIBlockAPI called');
    if (!strategy) {
      console.log('[UIBlockStep] V2: no strategy, returning early');
      return;
    }

    setUIBlockLoading(true);
    setUIBlockError(null);

    try {
      const response = await fetch('/api/v2/uiblock-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          productName: productName || undefined,
          assets: assetAvailability ?? {
            hasTestimonials: false,
            hasSocialProof: false,
            hasConcreteResults: false,
            hasDemoVideo: false,
            testimonialType: null,
            socialProofTypes: null,
          },
          answers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.uiblocks) {
          Object.entries(result.uiblocks).forEach(([section, layout]) => {
            if (layout) {
              setUIBlockSelection(section as SectionType, layout as string);
            }
          });
        }

        if (result.needsInput && result.questions?.length > 0) {
          setUIBlockQuestions(result.questions);
          setUIBlockLoading(false);
        } else {
          markQuestionsAnswered();
          setUIBlockLoading(false);
          nextStep();
          setGenerationProgress(0);
        }
      } else {
        setUIBlockError(result.message || 'UIBlock selection failed');
      }
    } catch (error) {
      setUIBlockError('Network error. Please try again.');
    }
  }, [
    strategy,
    productName,
    assetAvailability,
    setUIBlockSelection,
    setUIBlockQuestions,
    markQuestionsAnswered,
    setUIBlockLoading,
    setUIBlockError,
    nextStep,
    setGenerationProgress,
  ]);

  // Trigger selection when strategy available
  useEffect(() => {
    console.log('[UIBlockStep] useEffect running, checking guards...');

    if (!strategy) {
      console.log('[UIBlockStep] Guard: no strategy, skipping');
      return;
    }
    if (hasCalledApi.current) {
      console.log('[UIBlockStep] Guard: already processed, skipping');
      return;
    }
    if (Object.keys(uiblockSelections).length > 0) {
      console.log('[UIBlockStep] Guard: selections exist, skipping');
      return;
    }
    if (uiblockQuestions.length > 0) {
      console.log('[UIBlockStep] Guard: questions exist, skipping');
      return;
    }

    console.log('[UIBlockStep] All guards passed, processing...');
    hasCalledApi.current = true;
    setUIBlockLoading(true);

    if (isV3) {
      // V3: Deterministic selection
      selectUIBlocksV3Handler();
    } else {
      // V2: API-based selection
      callUIBlockAPI();
    }
  }, [strategy, uiblockSelections, uiblockQuestions, isV3, selectUIBlocksV3Handler, callUIBlockAPI, setUIBlockLoading]);

  // Handle local answer change (V2 only)
  const handleAnswerChange = (section: string, answer: string) => {
    setLocalAnswers((prev) => ({ ...prev, [section]: answer }));
  };

  // Submit answers (V2 only)
  const handleSubmit = async () => {
    Object.entries(localAnswers).forEach(([section, answer]) => {
      answerUIBlockQuestion(section as SectionType, answer);
    });

    setUIBlockLoading(true);
    await callUIBlockAPI(localAnswers);
  };

  // Check if all questions are answered (V2 only)
  const allAnswered = uiblockQuestions.every((q) => localAnswers[q.section]);

  // Loading state
  if (uiblockLoading) {
    return <LoadingOverlay messages={uiblockMessages} />;
  }

  // Error state
  if (uiblockError) {
    return (
      <ErrorRetry
        title="Layout selection failed"
        message="We couldn't select layouts for your page. Please try again."
        onRetry={() => {
          hasCalledApi.current = false;
          if (isV3) {
            selectUIBlocksV3Handler();
          } else {
            callUIBlockAPI();
          }
        }}
      />
    );
  }

  // Questions UI (V2 only - V3 never shows questions)
  if (uiblockQuestions.length > 0 && !uiblockQuestionsAnswered && !isV3) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">A few quick choices</h1>
          <p className="mt-2 text-gray-600">Help us pick the perfect layouts for your page.</p>
        </div>

        {uiblockQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={localAnswers[question.section]}
            onChange={(answer) => handleAnswerChange(question.section, answer)}
          />
        ))}

        <Button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          Continue
        </Button>
      </div>
    );
  }

  // If all questions answered or no questions, show loading (will auto-advance)
  return <LoadingOverlay messages={['Finalizing layouts...']} />;
}
