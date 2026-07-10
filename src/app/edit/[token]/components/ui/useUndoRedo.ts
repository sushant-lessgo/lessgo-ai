// /app/edit/[token]/components/ui/useUndoRedo.ts
"use client";

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore, useEditStoreApi } from '@/hooks/useEditStoreLegacy';
import { useToast } from './useToast';

export function useUndoRedo() {
  // Render-time reads: narrow reactive selectors for the derived enabled flags
  // (only re-render when the boolean flips, not on every store mutation).
  const canUndoBool = useEditStore((s) => (typeof s.canUndo === 'function' ? s.canUndo() : false));
  const canRedoBool = useEditStore((s) => (typeof s.canRedo === 'function' ? s.canRedo() : false));
  // Non-reactive store instance — actions read in handlers only.
  const storeApi = useEditStoreApi();
  const { showToast } = useToast();

  const handleUndo = useCallback(() => {
    const { canUndo, undo, triggerAutoSave } = storeApi.getState();
    if (typeof canUndo === 'function' && canUndo()) {
      undo();
      triggerAutoSave();
      showToast('Undid last action', 'info');
    }
  }, [storeApi, showToast]);

  const handleRedo = useCallback(() => {
    const { canRedo, redo, triggerAutoSave } = storeApi.getState();
    if (typeof canRedo === 'function' && canRedo()) {
      redo();
      triggerAutoSave();
      showToast('Redid action', 'info');
    }
  }, [storeApi, showToast]);

  return {
    handleUndo,
    handleRedo,
    canUndo: canUndoBool,
    canRedo: canRedoBool,
  };
}