// /app/edit/[token]/components/ui/usePreviewNavigation.ts
"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStore } from '@/hooks/useEditStore';
import { useToast } from './useToast';

export function usePreviewNavigation(tokenId: string) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { triggerAutoSave } = useEditStore();
  const router = useRouter();
  const { showToast } = useToast();

  const handlePreviewClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      await triggerAutoSave();
      router.push(`/preview/${tokenId}?editMode=true`);
    } catch (error) {
      console.error('Preview navigation failed:', error);
      showToast('Failed to save changes. Please try again.', 'error');
      setIsNavigating(false);
    }
  }, [tokenId, triggerAutoSave, router, showToast]);

  return {
    handlePreviewClick,
    isNavigating,
  };
}