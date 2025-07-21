// /app/edit/[token]/components/ui/useUndoRedo.ts
"use client";

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToast } from './useToast';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo, triggerAutoSave } = useEditStore();
  const { showToast } = useToast();

  // Safety checks
  const isUndoAvailable = typeof canUndo === 'function';
  const isRedoAvailable = typeof canRedo === 'function';

  const handleUndo = useCallback(() => {
    if (isUndoAvailable && canUndo()) {
      undo();
      triggerAutoSave();
      showToast('Undid last action', 'info');
    }
  }, [undo, canUndo, triggerAutoSave, showToast, isUndoAvailable]);

  const handleRedo = useCallback(() => {
    if (isRedoAvailable && canRedo()) {
      redo();
      triggerAutoSave();
      showToast('Redid action', 'info');
    }
  }, [redo, canRedo, triggerAutoSave, showToast, isRedoAvailable]);

  return {
    handleUndo,
    handleRedo,
    canUndo: isUndoAvailable ? canUndo() : false,
    canRedo: isRedoAvailable ? canRedo() : false,
  };
}