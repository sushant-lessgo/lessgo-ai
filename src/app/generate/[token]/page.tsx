"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditProvider, useEditStoreContext } from '@/components/EditProvider';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { StoreDebugPanel } from '@/app/create/[token]/components/StoreDebugPanel';
import { OnboardingDebugPanel } from '@/app/create/[token]/components/OnboardingDebugPanel';
import EditTransitionModal from './components/EditTransitionModal';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;
  
  if (!tokenId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600 mb-6">No token provided in URL</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditProvider 
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        preload: true,
      }}
    >
      <GeneratePageContent tokenId={tokenId} />
    </EditProvider>
  );
}

// Separate component for the actual page logic
function GeneratePageContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();
  const { store, sections, content, isInitialized, isHydrating } = useEditStoreContext();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(1);
  const [transitionProgress, setTransitionProgress] = useState(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize preview mode and validate data
  useEffect(() => {
    if (!store || !isInitialized || isHydrating) return;
    
    // Wait a bit for hydration to complete
    const checkData = async () => {
      // Small delay to ensure hydration is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentState = store.getState();
      console.log('🔍 Generate page checking store state:', {
        sections: currentState.sections.length,
        content: Object.keys(currentState.content).length,
        hasElements: Object.values(currentState.content).some((s: any) => s.elements && Object.keys(s.elements).length > 0)
      });
      
      // Set preview mode
      if (currentState.mode !== 'preview') {
        currentState.setMode('preview');
      }

      // Check if store has data
      if (currentState.sections.length === 0) {
        // Try to load from API as fallback
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load page data');
          }

          const data = await response.json();
          
          // Use the loadFromDraft method from EditStore
          await currentState.loadFromDraft(data, tokenId);
          setDataLoaded(true);
          
        } catch (err) {
          console.error('Failed to load page data:', err);
          
          if (err instanceof Error && err.message.includes('regeneration required')) {
            setError('Page needs to be regenerated. Redirecting to setup...');
            setTimeout(() => {
              router.push(`/create/${tokenId}`);
            }, 2000);
          } else {
            setError('Failed to load page data. Please return to setup and try again.');
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setDataLoaded(true);
        setIsLoading(false);
      }
    };
    
    checkData();
  }, [tokenId, store, isInitialized, isHydrating, router]);

  // Handle edit navigation - ensure data is saved before transitioning
  const handleEdit = async () => {
    if (!store) return;
    
    try {
      // Show transition modal immediately
      setIsTransitioning(true);
      setTransitionStep(1);
      setTransitionProgress(0);
      
      // Log current state for debugging
      const currentState = store.getState();
      console.log('📊 [GENERATE-DEBUG] Pre-navigation store state:', {
        sections: currentState.sections.length,
        content: Object.keys(currentState.content).length,
        sectionsArray: currentState.sections,
        hasContent: Object.keys(currentState.content).length > 0,
        theme: {
          colors: currentState.theme?.colors,
          typography: {
            headingFont: currentState.theme?.typography?.headingFont,
            bodyFont: currentState.theme?.typography?.bodyFont
          },
          backgroundsBeforeEdit: {
            primary: currentState.theme?.colors?.sectionBackgrounds?.primary,
            secondary: currentState.theme?.colors?.sectionBackgrounds?.secondary,
            neutral: currentState.theme?.colors?.sectionBackgrounds?.neutral,
            divider: currentState.theme?.colors?.sectionBackgrounds?.divider
          }
        }
      });
      
      // Ensure we have data to save
      if (currentState.sections.length === 0) {
        setIsTransitioning(false);
        setError('No sections to edit. Please generate content first.');
        return;
      }
      
      // Check if we have content for the sections
      const hasContent = Object.keys(currentState.content).length > 0 && 
                        Object.values(currentState.content).some((section: any) => 
                          section.elements && Object.keys(section.elements).length > 0
                        );
      
      if (!hasContent) {
        console.warn('⚠️ Sections exist but no content found. This might be a data loading issue.');
        // Don't block navigation, but log the issue
      }
      
      // Step 1: Saving changes
      setTransitionProgress(25);
      console.log('💾 [GENERATE-DEBUG] Saving data before navigation...');
      await currentState.save();
      
      // Log theme after save
      const stateAfterSave = store.getState();
      console.log('🎨 [GENERATE-DEBUG] Theme after save:', {
        colors: stateAfterSave.theme?.colors,
        backgroundsAfterSave: {
          primary: stateAfterSave.theme?.colors?.sectionBackgrounds?.primary,
          secondary: stateAfterSave.theme?.colors?.sectionBackgrounds?.secondary,
          neutral: stateAfterSave.theme?.colors?.sectionBackgrounds?.neutral,
          divider: stateAfterSave.theme?.colors?.sectionBackgrounds?.divider
        }
      });
      
      setTransitionProgress(60);
      
      // Also ensure the persist middleware has saved to localStorage
      if (store.persist && typeof store.persist.rehydrate === 'function') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Step 2: Preparing editor
      setTransitionStep(2);
      setTransitionProgress(75);
      
      // Set edit mode in the store
      currentState.setMode('edit');
      
      // Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 3: Loading components
      setTransitionStep(3);
      setTransitionProgress(90);
      
      console.log('✅ [GENERATE-DEBUG] Data saved, navigating to edit page...');
      
      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setTransitionProgress(100);
      
      // Navigate to edit page
      router.push(`/edit/${tokenId}`);
    } catch (error) {
      console.error('❌ Failed to prepare for edit mode:', error);
      setIsTransitioning(false);
      setError('Failed to save changes. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accentPrimary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your generated page...</p>
        </div>
      </div>
    );
  }


  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Page</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/create/${tokenId}`)}
              className="w-full bg-brand-accentPrimary hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Return to Setup
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Rendered Landing Page */}
      <div id="landing-preview">
        <LandingPageRenderer />
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          {/* Context Info */}
          <div className="text-sm text-gray-500">
            Generated page ready for editing
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              disabled={isTransitioning}
              className={`
                px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 text-white
                ${isTransitioning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg transform hover:scale-105'
                }
              `}
            >
              {isTransitioning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Opening Editor...</span>
                </div>
              ) : (
                'Edit Page'
              )}
            </button>

            {/* Info Text */}
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

      {/* Development Debug Panels */}
      {process.env.NODE_ENV === 'development' && <StoreDebugPanel />}
      {process.env.NODE_ENV === 'development' && <OnboardingDebugPanel />}

      {/* Bottom padding to prevent content from being hidden behind fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}