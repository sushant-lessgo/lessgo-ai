// src/hooks/useSelectionPriority.ts - Enhanced with Global Anchor Management (Step 3)
// Implements Steps 1, 2 & 3 from selection.md with React integration

import { useMemo, useEffect, useRef } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTransitionLock, useTransitionAwareVisibility } from '@/hooks/useTransitionLock';
import { useGlobalAnchor } from '@/hooks/useGlobalAnchor';
import { 
  getActiveToolbar, 
  shouldShowToolbar, 
  getToolbarTarget,
  createEditorSelection,
  debugSelection,
  type EditorSelection,
  type ToolbarType 
} from '@/utils/selectionPriority';

/**
 * Hook to get the current editor selection state with priority resolution, transition locks, and global anchors
 */
export function useSelectionPriority() {
  const {
    mode,
    isTextEditing,
    textEditingElement,
    selectedElement,
    selectedSection,
    toolbar,
  } = useEditStore();
  
  // STEP 2: Initialize transition lock system
  const transitionLock = useTransitionLock({
    lockDuration: 350,    // Slightly longer for better UX
    debounceTime: 150,    // Prevent rapid changes
    debug: process.env.NODE_ENV === 'development',
  });
  
  // STEP 3: Initialize global anchor management
  const globalAnchor = useGlobalAnchor({
    updateInterval: 100,  // Fast updates for smooth positioning
    staleTimeout: 3000,   // Clean up after 3 seconds
    toolbarSpacing: 8,    // 8px spacing from elements
    debug: process.env.NODE_ENV === 'development',
  });
  
  // Track previous state for transition detection
  const previousStateRef = useRef<{
    isTextEditing: boolean;
    selectedElement?: any;
    selectedSection?: string;
  }>({
    isTextEditing: false,
  });
  
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
  
  // Get active toolbar type (before lock consideration)
  const naturalActiveToolbar = useMemo(() => {
    return getActiveToolbar(editorSelection);
  }, [editorSelection]);
  
  // Get toolbar target info
  const toolbarTarget = useMemo(() => {
    return getToolbarTarget(editorSelection);
  }, [editorSelection]);
  
  // STEP 2: Detect transitions and apply locks
  useEffect(() => {
    const previous = previousStateRef.current;
    const current = { isTextEditing, selectedElement, selectedSection };
    
    // Detect text editing transitions
    if (current.isTextEditing !== previous.isTextEditing) {
      transitionLock.lockForTextEditing(current.isTextEditing, textEditingElement);
    }
    
    // Detect element selection changes
    else if (current.selectedElement?.elementKey !== previous.selectedElement?.elementKey) {
      if (current.selectedElement && !current.isTextEditing) {
        // Determine the correct toolbar type based on explicit toolbar setting
        const correctToolbarType = editorSelection.toolbarType || 'element';
        // console.log('🔒 Locking transition for element change:', {
        //   elementKey: current.selectedElement.elementKey,
        //   toolbarType: correctToolbarType,
        //   explicitType: editorSelection.toolbarType
        // });
        
        transitionLock.lockForElementChange({
          sectionId: current.selectedElement.sectionId,
          elementKey: current.selectedElement.elementKey,
        }, correctToolbarType);
      }
    }
    
    // Detect section selection changes
    else if (current.selectedSection !== previous.selectedSection) {
      if (current.selectedSection && !current.selectedElement && !current.isTextEditing) {
        transitionLock.lockForSectionChange(current.selectedSection);
      }
    }
    
    // Update previous state
    previousStateRef.current = current;
    
  }, [isTextEditing, selectedElement, selectedSection, textEditingElement, transitionLock]);
  
  // STEP 2: Apply transition locks to toolbar visibility
  const activeToolbar = transitionLock.isLocked ? transitionLock.lockedToolbar : naturalActiveToolbar;
  
  // Enhanced shouldShowToolbar with transition lock support
  const shouldShowToolbarWithLock = (toolbarType: ToolbarType): boolean => {
    const naturalVisibility = shouldShowToolbar(toolbarType, editorSelection);
    const { shouldRender } = useTransitionAwareVisibility(toolbarType, naturalVisibility, transitionLock);
    return shouldRender;
  };
  
  // Debug logging with transition info - DISABLED to prevent infinite loops
  // The timeRemaining property changes every millisecond, causing render loops
  // if (process.env.NODE_ENV === 'development') {
  //   const selectionKey = `${mode}-${isTextEditing}-${selectedElement?.elementKey}-${selectedSection}-${transitionLock.isLocked}`;
  //   if (useSelectionPriority.lastSelectionKey !== selectionKey) {
  //     useSelectionPriority.lastSelectionKey = selectionKey;
  //     debugSelection(editorSelection, 'useSelectionPriority');
  //     
  //     if (transitionLock.isLocked) {
  //       console.log('🔒 Transition lock active:', {
  //         lockedToolbar: transitionLock.lockedToolbar,
  //         reason: transitionLock.lockReason,
  //         timeRemaining: transitionLock.timeRemaining,
  //       });
  //     }
  //   }
  // }
  
  // Memoize the return value to prevent object identity churn
  return useMemo(() => ({
    // Raw selection state
    editorSelection,
    
    // Computed values with lock consideration
    activeToolbar,
    naturalActiveToolbar,  // The toolbar that would be active without locks
    toolbarTarget,
    
    // STEP 2: Transition lock state
    transitionLock,
    isTransitionLocked: transitionLock.isLocked,
    lockReason: transitionLock.lockReason,
    
    // STEP 3: Global anchor management
    globalAnchor,
    anchorCount: globalAnchor.anchorCount,
    
    // Enhanced helpers with lock support
    shouldShowToolbar: shouldShowToolbarWithLock,
    
    // Convenience flags
    isTextToolbarActive: activeToolbar === 'text',
    isElementToolbarActive: activeToolbar === 'element',
    isSectionToolbarActive: activeToolbar === 'section',
    hasActiveToolbar: activeToolbar !== null,
    
    // State checks (unchanged)
    canShowTextToolbar: isTextEditing && !!textEditingElement,
    canShowElementToolbar: !!selectedElement && !isTextEditing,
    canShowSectionToolbar: !!selectedSection && !selectedElement && !isTextEditing,
  }), [
    editorSelection,
    activeToolbar,
    naturalActiveToolbar,
    toolbarTarget,
    transitionLock,
    globalAnchor,
    shouldShowToolbarWithLock,
    isTextEditing,
    textEditingElement,
    selectedElement,
    selectedSection
  ]);
}

// Add static property for debug tracking
useSelectionPriority.lastSelectionKey = '';

/**
 * Hook specifically for toolbar components to determine visibility with transition lock and anchor support
 */
export function useToolbarVisibility(
  toolbarType: ToolbarType,
  toolbarSize: { width: number; height: number } = { width: 300, height: 48 }
) {
  const { 
    shouldShowToolbar: shouldShow, 
    editorSelection, 
    activeToolbar, 
    naturalActiveToolbar,
    isTransitionLocked,
    lockReason,
    transitionLock,
    globalAnchor,
    toolbarTarget
  } = useSelectionPriority();
  
  const isVisible = shouldShow(toolbarType);
  
  // STEP 3: Get anchor and positioning info
  const anchor = toolbarTarget.sectionId ? 
    globalAnchor.getAnchorBySelection(
      toolbarType, 
      toolbarTarget.sectionId, 
      toolbarTarget.elementKey || undefined
    ) : null;
    
  const toolbarPosition = anchor ? 
    globalAnchor.calculateToolbarPosition(
      `${toolbarType}:${toolbarTarget.sectionId}${toolbarTarget.elementKey ? `.${toolbarTarget.elementKey}` : ''}`,
      toolbarSize
    ) : null;
  
  // Enhanced reason with lock and anchor information
  let reason: string;
  if (isTransitionLocked) {
    if (isVisible) {
      reason = `${toolbarType} toolbar locked visible (${lockReason})`;
    } else {
      reason = `${toolbarType} toolbar locked hidden (${transitionLock.lockedToolbar} is locked)`;
    }
  } else {
    reason = isVisible ? 
      `${toolbarType} toolbar naturally active` : 
      `${naturalActiveToolbar || 'no'} toolbar has natural priority`;
  }
  
  // Add anchor status to reason
  if (isVisible) {
    if (anchor && toolbarPosition) {
      reason += ` with anchor positioning`;
    } else if (!anchor) {
      reason += ` (no anchor registered)`;
    } else if (!toolbarPosition) {
      reason += ` (position calculation failed)`;
    }
  }
  
  return {
    isVisible,
    activeToolbar,
    naturalActiveToolbar,
    editorSelection,
    
    // STEP 2: Transition lock info
    isTransitionLocked,
    lockReason,
    transitionLock,
    
    // STEP 3: Anchor and positioning info
    anchor,
    position: toolbarPosition,
    hasValidPosition: toolbarPosition !== null,
    globalAnchor,
    
    // Enhanced debug info
    reason,
  };
}

/**
 * Hook for components that need to know when text editing starts/stops
 */
export function useTextEditingState() {
  const { 
    isTextToolbarActive, 
    canShowTextToolbar, 
    editorSelection 
  } = useSelectionPriority();
  
  return {
    isTextEditing: editorSelection.isTextEditing,
    textEditingElement: editorSelection.textEditingElement,
    isTextToolbarVisible: isTextToolbarActive,
    canStartTextEditing: canShowTextToolbar,
    
    // Helper for components to check if they're the active text element
    isActiveTextElement: (sectionId: string, elementKey: string) => {
      return editorSelection.textEditingElement?.sectionId === sectionId &&
             editorSelection.textEditingElement?.elementKey === elementKey;
    }
  };
}