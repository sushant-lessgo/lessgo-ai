// /app/edit/[token]/components/ui/useUndoRedo.ts
"use client";

// i18n-phase-1 (3a) NOTE: undo/redo is locale-AWARE. Each 'content' history entry
// carries `entry.locale` (stamped in historyHelpers.pushContentHistoryEntry); the
// restore in uiActions.undo/redo routes to base `state.content` for default-locale
// entries and to `state.localeContent[locale]` for non-default ones. History is
// therefore PRESERVED across a locale switch — a mixed EN/NL undo stack replays
// each entry against its own locale's target.

import { useCallback } from 'react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
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