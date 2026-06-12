'use client';

import { useGenerationStore, GENERATION_STEPS } from '@/hooks/useGenerationStore';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';

interface StepContainerProps {
  children: React.ReactNode;
}

const BACK_ALLOWED_STEPS = ['understanding', 'landingGoal', 'offer', 'assetAvailability'];

export default function StepContainer({ children }: StepContainerProps) {
  const currentStep = useGenerationStore((s) => s.currentStep);
  const stepIndex = useGenerationStore((s) => s.stepIndex);
  const isWideStep = currentStep === 'generating';
  const prevStep = useGenerationStore((s) => s.prevStep);
  const resetFrom = useGenerationStore((s) => s.resetFrom);

  const progress = (stepIndex / (GENERATION_STEPS.length - 1)) * 100;
  const showBack = BACK_ALLOWED_STEPS.includes(currentStep);

  const handleBack = () => {
    resetFrom(currentStep);
    prevStep();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed header with logo + progress */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-24" />
          <Logo size={80} />
          <span className="w-24 text-right text-sm text-gray-500">
            Step {stepIndex + 1} of {GENERATION_STEPS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-brand-accentPrimary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content with card wrapper */}
      <div className="pt-24 pb-16 px-4">
        <div className={`${isWideStep ? 'max-w-5xl' : 'max-w-xl'} mx-auto`}>
          {/* Back button */}
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          {/* Card wrapper */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isWideStep ? 'p-4 md:p-5' : 'p-6 md:p-8'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
