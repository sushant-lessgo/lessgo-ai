"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditStore } from "@/hooks/useEditStore";
import { EditLayout } from "./components/layout/EditLayout";
import { EditLayoutErrorBoundary } from "@/app/edit/[token]/components/layout/EditLayoutErrorBoundary";

console.log("Edit page module loaded");

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;
  
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    loadFromDraft,
    reset,
    initializeAutoSave,
    triggerAutoSave,
  } = useEditStore();
  
  console.log("EditPage mounted");
  console.log("params:", params);
  console.log("tokenId:", tokenId);

  useEffect(() => {
    if (!tokenId) {
      console.error("❌ No token provided in URL");
      setLoadingState('error');
      setErrorMessage('Invalid URL - missing token');
      return;
    }

    const loadDraft = async () => {
      try {
        setLoadingState('loading');
        console.log("🔄 Loading draft for edit mode, token:", tokenId);
        
        const response = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log("📝 No existing draft found, initializing empty edit state");
            // Initialize with empty state for new edit session
            reset();
            setLoadingState('success');
            return;
          }
          
          throw new Error(`Failed to load draft: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("📊 Loaded draft data for edit:", {
          hasInputText: !!data.inputText,
          hasValidatedFields: !!(data.validatedFields && Object.keys(data.validatedFields).length > 0),
          hasFinalContent: !!data.finalContent,
          hasThemeValues: !!data.themeValues,
          stepIndex: data.stepIndex,
          lastUpdated: data.lastUpdated,
        });

        // Load the draft data into edit store
        await loadFromDraft(data);
        
        // Initialize auto-save for this token
        initializeAutoSave(tokenId);
        
        console.log("✅ Edit store populated from draft:", {
          tokenId,
          sectionsCount: useEditStore.getState().sections.length,
          hasContent: Object.keys(useEditStore.getState().content).length > 0,
          hasTheme: !!useEditStore.getState().theme,
        });

        setLoadingState('success');

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error("❌ Draft load failed for edit:", {
          error: errorMsg,
          tokenId,
        });
        
        setErrorMessage(errorMsg);
        setLoadingState('error');
      }
    };

    loadDraft();
    
    // Cleanup function
    return () => {
      console.log("🧹 EditPage cleanup");
      // Trigger final save on unmount
      if (loadingState === 'success') {
        triggerAutoSave();
      }
    };
  }, [tokenId, loadFromDraft, reset, initializeAutoSave, triggerAutoSave, loadingState]);

  // Handle loading state
  if (loadingState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Editor</h2>
          <p className="text-gray-600">Preparing your landing page for editing...</p>
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