"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEditStore } from "@/hooks/useEditStore";
import { EditLayout } from "./components/layout/EditLayout";
import { EditLayoutErrorBoundary } from "@/app/edit/[token]/components/layout/EditLayoutErrorBoundary";


export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenId = params?.token as string;
  
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    loadFromDraft,
    reset,
    sections, // Check if we already have data
    triggerAutoSave,
  } = useEditStore();

  
  // Check if this is a migration from generate page
  const isMigrated = searchParams.get('migrated') === 'true';
  


  // In EditPage, add this at the very top
useEffect(() => {
  
  const interval = setInterval(() => {
    // Store monitoring active
  }, 500);
  
  setTimeout(() => {
    clearInterval(interval);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    if (!tokenId) {
      console.error("❌ No token provided in URL");
      setLoadingState('error');
      setErrorMessage('Invalid URL - missing token');
      return;
    }

    const initializeEditor = async () => {
      try {
        setLoadingState('loading');
        
        // If coming from migration, check if we already have data
        if (isMigrated) {
          
          // Give a small delay for Zustand persistence to rehydrate
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Re-check sections after potential rehydration
          const currentState = useEditStore.getState();
          
          // Check if EditStore already has sections (migration successful)
          if (currentState.sections.length > 0) {
            setLoadingState('success');
            return;
          } else {
            console.warn("⚠️ Migration flag set but no data in EditStore, falling back to API load");
          }
        }
        
        // Load from API (either no migration flag or migration failed)
        
        const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            reset();
            setLoadingState('success');
            return;
          }
          
          throw new Error(`Failed to load draft: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        

        // Load the draft data into edit store
        await loadFromDraft(data);
        

        setLoadingState('success');

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error("❌ Draft load failed for edit:", {
          error: errorMsg,
          tokenId,
          isMigrated,
        });
        
        setErrorMessage(errorMsg);
        setLoadingState('error');
      }
    };

    initializeEditor();
    
    // Cleanup function
    return () => {
      // Trigger final save on unmount
      if (loadingState === 'success') {
        triggerAutoSave();
      }
    };
  }, [tokenId, loadFromDraft, reset, triggerAutoSave, isMigrated, sections.length]);

  // Handle loading state
  if (loadingState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isMigrated ? 'Finalizing Migration' : 'Loading Editor'}
          </h2>
          <p className="text-gray-600">
            {isMigrated 
              ? 'Setting up your page for editing...' 
              : 'Preparing your landing page for editing...'
            }
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (loadingState === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Editor</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push(`/create/${tokenId}`)}
              className="w-full bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Setup
            </button>
            {isMigrated && (
              <button
                onClick={() => router.push(`/generate/${tokenId}`)}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Back to Generated Page
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state - render the edit interface
  return (
    <EditLayoutErrorBoundary tokenId={tokenId}>
      <EditLayout tokenId={tokenId} />
    </EditLayoutErrorBoundary>
  );
}