// /app/edit/[token]/components/ui/usePreviewNavigation.ts
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStoreApi } from '@/hooks/useEditStore';
import { useToast } from './useToast';
import { getTabManager, cleanupTabManager } from '@/utils/tabManager';

export function usePreviewNavigation(tokenId: string) {
  const [isNavigating, setIsNavigating] = useState(false);
  const storeApi = useEditStoreApi();
  const router = useRouter();
  const { showToast } = useToast();
  const [tabManager, setTabManager] = useState<ReturnType<typeof getTabManager> | null>(null);

  // Initialize tab manager
  useEffect(() => {
    const manager = getTabManager('edit', tokenId);
    setTabManager(manager);

    return () => {
      cleanupTabManager('edit', tokenId);
    };
  }, [tokenId]);

  const handlePreviewClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      
      await storeApi.getState().triggerAutoSave();

      const previewUrl = `/preview/${tokenId}`;
      
      // Store the source tab ID in sessionStorage for the preview page to reference
      const currentTabId = sessionStorage.getItem('tabId');
      if (currentTabId) {
        sessionStorage.setItem(`preview-source-${tokenId}`, currentTabId);
      }
      
      const newWindow = window.open(previewUrl, '_blank');

      setIsNavigating(false);
    } catch (error) {
      // console.error('❌ Preview navigation failed:', error);
      showToast('Failed to save changes. Please try again.', 'error');
      setIsNavigating(false);
    }
  }, [tokenId, storeApi, router, showToast]);

  return {
    handlePreviewClick,
    isNavigating,
  };
}