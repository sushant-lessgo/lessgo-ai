// /app/edit/[token]/components/ui/usePreviewNavigation.ts
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToast } from './useToast';
import { getTabManager, cleanupTabManager } from '@/utils/tabManager';

export function usePreviewNavigation(tokenId: string) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { triggerAutoSave } = useEditStore();
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
    console.log('🚀 handlePreviewClick called');
    try {
      console.log('🔄 Setting isNavigating to true');
      setIsNavigating(true);
      
      console.log('💾 Triggering auto-save...');
      await triggerAutoSave();
      console.log('✅ Auto-save completed');
      
      const previewUrl = `/preview/${tokenId}`;
      console.log('🔗 Opening preview URL:', previewUrl);
      
      // Store the source tab ID in sessionStorage for the preview page to reference
      const currentTabId = sessionStorage.getItem('tabId');
      if (currentTabId) {
        sessionStorage.setItem(`preview-source-${tokenId}`, currentTabId);
      }
      
      const newWindow = window.open(previewUrl, '_blank');
      console.log('🪟 Window.open result:', newWindow);
      
      console.log('🔄 Setting isNavigating to false');
      setIsNavigating(false);
    } catch (error) {
      console.error('❌ Preview navigation failed:', error);
      showToast('Failed to save changes. Please try again.', 'error');
      setIsNavigating(false);
    }
  }, [tokenId, triggerAutoSave, router, showToast]);

  return {
    handlePreviewClick,
    isNavigating,
  };
}