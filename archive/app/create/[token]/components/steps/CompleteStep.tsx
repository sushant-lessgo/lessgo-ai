'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditProvider, useEditStoreContext } from '@/components/EditProvider';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import PageRevealAnimation from '@/app/generate/[token]/components/PageRevealAnimation';
import EditTransitionModal from '@/app/generate/[token]/components/EditTransitionModal';
import { logger } from '@/lib/logger';

/**
 * Complete step - shows the generated page with "Edit Page" button
 * Reuses pattern from /generate/[token]/page.tsx
 */
export default function CompleteStep() {
  const params = useParams();
  const tokenId = params?.token as string;

  return (
    <EditProvider
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        preload: true,
      }}
    >
      <CompleteStepContent tokenId={tokenId} />
    </EditProvider>
  );
}

function CompleteStepContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();
  const { store, sections, isInitialized, isHydrating } = useEditStoreContext();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(1);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Initialize and load data
  useEffect(() => {
    if (!store || !isInitialized || isHydrating) return;

    const initializeStore = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const currentState = store.getState();
      logger.debug('Complete step checking store state:', {
        sections: currentState.sections.length,
        content: Object.keys(currentState.content).length,
      });

      // Set preview mode
      if (currentState.mode !== 'preview') {
        currentState.setMode('preview');
      }

      // Check if we have data
      if (currentState.sections.length === 0) {
        try {
          const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
          if (!response.ok) {
            throw new Error('Failed to load page data');
          }
          const data = await response.json();
          await currentState.loadFromDraft(data, tokenId);
        } catch (err) {
          logger.error('Failed to load page data:', err);
          setError('Failed to load your generated page.');
        }
      }

      setIsLoading(false);
    };

    initializeStore();
  }, [tokenId, store, isInitialized, isHydrating]);

  // Handle edit navigation
  const handleEdit = async () => {
    if (!store) return;

    try {
      setIsTransitioning(true);
      setTransitionStep(1);
      setTransitionProgress(0);

      const currentState = store.getState();

      if (currentState.sections.length === 0) {
        setIsTransitioning(false);
        setError('No sections to edit. Please regenerate content.');
        return;
      }

      // Step 1: Save
      setTransitionProgress(25);
      await currentState.save();
      setTransitionProgress(60);

      // Step 2: Prepare
      setTransitionStep(2);
      setTransitionProgress(75);
      currentState.setMode('edit');

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: Load
      setTransitionStep(3);
      setTransitionProgress(90);

      await new Promise((resolve) => setTimeout(resolve, 200));
      setTransitionProgress(100);

      // Navigate
      router.push(`/edit/${tokenId}`);
    } catch (error) {
      logger.error('Failed to prepare for edit mode:', error);
      setIsTransitioning(false);
      setError('Failed to save changes. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accentPrimary mx-auto mb-4" />
          <p className="text-gray-600">Loading your page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Page</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mx-6 -mt-6">
      {/* Rendered Landing Page with Reveal Animation */}
      <PageRevealAnimation sectionsCount={sections.length}>
        <div id="landing-preview">
          <LandingPageRenderer />
        </div>
      </PageRevealAnimation>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-500">Generated page ready for editing</div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleEdit}
              disabled={isTransitioning}
              className={`
                px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 text-white
                ${
                  isTransitioning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg transform hover:scale-105'
                }
              `}
            >
              {isTransitioning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Opening Editor...</span>
                </div>
              ) : (
                'Edit Page'
              )}
            </button>

            <div className="text-xs text-gray-400 max-w-xs">
              Click "Edit Page" to customize your landing page with our visual editor
            </div>
          </div>
        </div>
      </div>

      {/* Transition Modal */}
      <EditTransitionModal
        isOpen={isTransitioning}
        currentStep={transitionStep}
        progress={transitionProgress}
      />

      {/* Bottom padding */}
      <div className="h-20" />
    </div>
  );
}
