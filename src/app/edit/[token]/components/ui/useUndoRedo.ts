// /app/edit/[token]/components/ui/useUndoRedo.ts
"use client";

import { useCallback } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToast } from './useToast';

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo, triggerAutoSave } = useEditStore();
  const { showToast } = useToast();

  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
      triggerAutoSave();
      showToast('Undid last action', 'info');
    }
  }, [undo, canUndo, triggerAutoSave, showToast]);

  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
      triggerAutoSave();
      showToast('Redid action', 'info');
    }
  }, [redo, canRedo, triggerAutoSave, showToast]);

  return {
    handleUndo,
    handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}