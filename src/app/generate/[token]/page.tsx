"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditProvider, useEditStoreContext } from '@/components/EditProvider';
import LandingPageRenderer from '@/modules/generatedLanding/LandingPageRenderer';
import { StoreDebugPanel } from '@/app/create/[token]/components/StoreDebugPanel';
import { OnboardingDebugPanel } from '@/app/create/[token]/components/OnboardingDebugPanel';

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
  const { store, sections, content, isInitialized } = useEditStoreContext();
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize preview mode and validate data
  useEffect(() => {
    if (!store || !isInitialized) return;
    
    // Set preview mode
    const currentState = store.getState();
    if (currentState.mode !== 'preview') {
      store.getState().setMode('preview');
    }

    // Check if store has data
    if (sections.length === 0) {
      // Try to load from API as fallback
      const loadData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load page data');
          }

          const data = await response.json();
          
          // Use the loadFromDraft method from EditStore
          await store.getState().loadFromDraft(data, tokenId);
          
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
      };

      loadData();
    } else {
      setIsLoading(false);
    }
  }, [sections.length, tokenId, store, isInitialized, router]);

  // Handle edit navigation (no migration needed anymore)
  const handleEdit = async () => {
    if (!store) return;
    
    // Set edit mode in the store
    store.getState().setMode('edit');
    
    // Ensure persistence by triggering auto-save
    const currentState = store.getState();
    console.log('📊 Pre-navigation store state:', {
      sections: currentState.sections.length,
      content: Object.keys(currentState.content).length,
      sectionsArray: currentState.sections
    });
    
    // Small delay to ensure state changes are applied
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Navigate to edit page with flag to indicate data is already in store
    router.push(`/edit/${tokenId}?migrated=true`);
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
              className="px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 bg-brand-accentPrimary hover:bg-orange-500 text-white hover:shadow-lg transform hover:scale-105"
            >
              Edit Page
            </button>

            {/* Info Text */}
            <div className="text-xs text-gray-400 max-w-xs">
              Click "Edit Page" to customize your landing page with our visual editor
            </div>
          </div>
        </div>
      </div>

      {/* Development Debug Panels */}
      {process.env.NODE_ENV === 'development' && <StoreDebugPanel />}
      {process.env.NODE_ENV === 'development' && <OnboardingDebugPanel />}

      {/* Bottom padding to prevent content from being hidden behind fixed bar */}
      <div className="h-20"></div>
    </div>
  );
}