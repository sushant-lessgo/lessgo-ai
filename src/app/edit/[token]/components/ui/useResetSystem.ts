// /app/edit/[token]/components/ui/useResetSystem.ts
"use client";

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToast } from './useToast';
import type { ResetScope } from '@/types/core';

export function useResetSystem() {
  const { resetToGenerated, triggerAutoSave, onboardingData } = useEditStore();
  const { showToast } = useToast();

  const hasOriginalState = Boolean(onboardingData?.confirmedFields);

  const handleResetConfirm = useCallback(async (scope: ResetScope) => {
    try {
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
  }, [resetToGenerated, triggerAutoSave, showToast]);

  return {
    handleResetConfirm,
    hasOriginalState,
  };
}