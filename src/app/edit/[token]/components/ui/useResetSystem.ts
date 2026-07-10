// /app/edit/[token]/components/ui/useResetSystem.ts
"use client";

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore, useEditStoreApi } from '@/hooks/useEditStoreLegacy';
import { useToast } from './useToast';
import type { ResetScope } from '@/types/core';

export function useResetSystem() {
  // Render-time read: narrow selector for the derived availability flag.
  const hasOriginalState = useEditStore((s) => Boolean(s.onboardingData?.confirmedFields));
  // Non-reactive store instance — actions read in the handler only.
  const storeApi = useEditStoreApi();
  const { showToast } = useToast();

  const handleResetConfirm = useCallback(async (scope: ResetScope) => {
    try {
      const { resetToGenerated, triggerAutoSave } = storeApi.getState();
      resetToGenerated();
      await triggerAutoSave();

      // Reset now restores the full generation baseline (copy + design)
      // regardless of the dialog's scope selection — scope stays text-only,
      // and a design-only message would now mislead.
      showToast('Restored original copy + design', 'success');

    } catch (error) {
      // console.error('Reset failed:', error);
      showToast('Reset failed. Please try again.', 'error');
    }
  }, [storeApi, showToast]);

  return {
    handleResetConfirm,
    hasOriginalState,
  };
}