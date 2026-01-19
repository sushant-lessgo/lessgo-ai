'use client';

import { useEffect, useCallback, useState } from 'react';
import { useGenerationStore } from '@/hooks/useGenerationStore';
import { Button } from '@/components/ui/button';
import LoadingOverlay from '../shared/LoadingOverlay';
import ErrorRetry from '../shared/ErrorRetry';
import type { UIBlockQuestion, SectionType } from '@/types/generation';
import { cn } from '@/lib/utils';

const uiblockMessages = [
  'Selecting layouts...',
  'Matching design to strategy...',
  'Optimizing visual flow...',
];

/**
 * Question card component for layout selection
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

  const strategy = useGenerationStore((s) => s.strategy);
  const productName = useGenerationStore((s) => s.productName);
  const assetAvailability = useGenerationStore((s) => s.assetAvailability);
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

  // Local state for question answers before submission
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  // Track if initial fetch done to prevent double-fetch
  const [hasFetched, setHasFetched] = useState(false);

  console.log('[UIBlockStep] State:', {
    hasStrategy: !!strategy,
    hasFetched,
    selectionsCount: Object.keys(uiblockSelections).length,
    questionsCount: uiblockQuestions.length,
    uiblockLoading,
    uiblockError,
  });

  // API call
  const callUIBlockAPI = useCallback(async (answers?: Record<string, string>) => {
    console.log('[UIBlockStep] callUIBlockAPI called, strategy:', !!strategy);
    if (!strategy) {
      console.log('[UIBlockStep] callUIBlockAPI: no strategy, returning early');
      return;
    }

    console.log('[UIBlockStep] callUIBlockAPI: calling /api/v2/uiblock-select');
    setUIBlockLoading(true);
    setUIBlockError(null);

    try {
      const response = await fetch('/api/v2/uiblock-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          productName: productName || undefined,  // Pass undefined if not set
          assets: assetAvailability ?? {
            hasTestimonials: false,
            hasSocialProof: false,
            hasConcreteResults: false,
          },
          answers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store selections
        if (result.uiblocks) {
          Object.entries(result.uiblocks).forEach(([section, layout]) => {
            if (layout) {
              setUIBlockSelection(section as SectionType, layout as string);
            }
          });
        }

        // Check if we need user input
        if (result.needsInput && result.questions?.length > 0) {
          setUIBlockQuestions(result.questions);
          setUIBlockLoading(false);
        } else {
          // All resolved - proceed to generation
          markQuestionsAnswered();
          setUIBlockLoading(false);
          nextStep();
          setGenerationProgress(0); // Initialize generation progress
        }
      } else {
        setUIBlockError(result.message || 'UIBlock selection failed');
      }
    } catch (error) {
      setUIBlockError('Network error. Please try again.');
    }
  }, [
    strategy, productName, assetAvailability, setUIBlockSelection, setUIBlockQuestions,
    markQuestionsAnswered, setUIBlockLoading, setUIBlockError, nextStep, setGenerationProgress
  ]);

  // Trigger API call when strategy available and not yet fetched
  useEffect(() => {
    console.log('[UIBlockStep] useEffect running, checking guards...');

    // Guard: need strategy, haven't fetched yet, no selections/questions yet
    if (!strategy) {
      console.log('[UIBlockStep] Guard: no strategy, skipping');
      return;
    }
    if (hasFetched) {
      console.log('[UIBlockStep] Guard: already fetched, skipping');
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

    console.log('[UIBlockStep] All guards passed, calling API...');
    setHasFetched(true);
    callUIBlockAPI();
  }, [strategy, hasFetched, uiblockSelections, uiblockQuestions, callUIBlockAPI]);

  // Handle local answer change
  const handleAnswerChange = (section: string, answer: string) => {
    setLocalAnswers((prev) => ({ ...prev, [section]: answer }));
  };

  // Submit answers
  const handleSubmit = async () => {
    // Store answers in global state
    Object.entries(localAnswers).forEach(([section, answer]) => {
      answerUIBlockQuestion(section as SectionType, answer);
    });

    // Re-call API with answers
    setUIBlockLoading(true);
    await callUIBlockAPI(localAnswers);
  };

  // Check if all questions are answered
  const allAnswered = uiblockQuestions.every(
    (q) => localAnswers[q.section]
  );

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
        onRetry={() => callUIBlockAPI()}
      />
    );
  }

  // Questions UI
  if (uiblockQuestions.length > 0 && !uiblockQuestionsAnswered) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            A few quick choices
          </h1>
          <p className="mt-2 text-gray-600">
            Help us pick the perfect layouts for your page.
          </p>
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
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                     transform hover:scale-105 transition-all duration-200"
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
