// src/hooks/useSelectionPriority.ts - Schema-driven selection resolver
//
// Phase-3 rebuild: the transition-lock + global-anchor machinery was removed.
// This hook is now a thin reactive wrapper over the pure resolver in
// `@/utils/selectionPriority`: it reads the UI-selection store fields via a
// narrow `useShallow` selector and returns the resolved toolbar output. The
// SINGLE instance lives in `ToolbarShell`; positioning/dismissal are owned by
// the shell (floating-ui), not here.

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  getActiveToolbar,
  shouldShowToolbar,
  getToolbarTarget,
  createEditorSelection,
  type EditorSelection,
  type ToolbarType,
} from '@/utils/selectionPriority';

/**
 * Hook to get the current editor selection state with priority resolution.
 */
export function useSelectionPriority() {
  // Render-time reads of the UI-selection fields only — narrow selector so this
  // hook no longer re-renders its host on content-slice mutations.
  const {
    mode,
    isTextEditing,
    textEditingElement,
    selectedElement,
    selectedSection,
    toolbar,
  } = useEditStore(
    useShallow((s) => ({
      mode: s.mode,
      isTextEditing: s.isTextEditing,
      textEditingElement: s.textEditingElement,
      selectedElement: s.selectedElement,
      selectedSection: s.selectedSection,
      toolbar: s.toolbar,
    }))
  );

  // Create standardized selection object
  const editorSelection = useMemo((): EditorSelection => {
    return createEditorSelection({
      mode,
      isTextEditing,
      textEditingElement,
      selectedElement,
      selectedSection,
      toolbar,
    });
  }, [mode, isTextEditing, textEditingElement, selectedElement, selectedSection, toolbar]);

  // Get active toolbar type
  const activeToolbar = useMemo(() => {
    return getActiveToolbar(editorSelection);
  }, [editorSelection]);

  // Get toolbar target info (section/element ids for anchor resolution)
  const toolbarTarget = useMemo(() => {
    return getToolbarTarget(editorSelection);
  }, [editorSelection]);

  // Memoize the return value to prevent object identity churn
  return useMemo(() => ({
    // Raw selection state
    editorSelection,

    // Computed values
    activeToolbar,
    toolbarTarget,

    // Pure helper bound to the current selection
    shouldShowToolbar: (toolbarType: ToolbarType) =>
      shouldShowToolbar(toolbarType, editorSelection),

    // Convenience flags
    isTextToolbarActive: activeToolbar === 'text',
    isElementToolbarActive: activeToolbar === 'element',
    isSectionToolbarActive: activeToolbar === 'section',
    hasActiveToolbar: activeToolbar !== null,

    // State checks
    canShowTextToolbar: isTextEditing && !!textEditingElement,
    canShowElementToolbar: !!selectedElement && !isTextEditing,
    canShowSectionToolbar: !!selectedSection && !selectedElement && !isTextEditing,
  }), [
    editorSelection,
    activeToolbar,
    toolbarTarget,
    isTextEditing,
    textEditingElement,
    selectedElement,
    selectedSection,
  ]);
}

// Add static property for debug tracking
useSelectionPriority.lastSelectionKey = '';
