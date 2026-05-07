'use client';

import {
  useServiceGenerationStore,
  SERVICE_GENERATION_STEPS,
} from '@/hooks/useServiceGenerationStore';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';

interface StepContainerProps {
  children: React.ReactNode;
}

const BACK_ALLOWED_STEPS = ['understanding', 'goal', 'offer', 'assets', 'style'];

// Generating + complete use the wider layout for status indicators.
const WIDE_STEPS = new Set(['generating', 'complete']);

export default function StepContainer({ children }: StepContainerProps) {
  const currentStep = useServiceGenerationStore((s) => s.currentStep);
  const stepIndex = useServiceGenerationStore((s) => s.stepIndex);
  const prevStep = useServiceGenerationStore((s) => s.prevStep);

  const totalUserSteps = SERVICE_GENERATION_STEPS.length - 1; // exclude 'complete'
  const progress = (stepIndex / (totalUserSteps - 1)) * 100;
  const showBack = BACK_ALLOWED_STEPS.includes(currentStep);
  const isWide = WIDE_STEPS.has(currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-24" />
          <Logo size={80} />
          <span className="w-24 text-right text-sm text-gray-500">
            Step {Math.min(stepIndex + 1, totalUserSteps)} of {totalUserSteps}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-brand-accentPrimary transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="pt-24 pb-16 px-4">
        <div className={`${isWide ? 'max-w-3xl' : 'max-w-xl'} mx-auto`}>
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isWide ? 'p-4 md:p-6' : 'p-6 md:p-8'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
