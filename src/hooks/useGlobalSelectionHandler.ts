// Global selection and focus event handler with AbortController
// Handles selection changes and focus events in capture phase

import { useEffect, useRef } from 'react';
import { 
  shouldIgnoreSelectionChange, 
  shouldIgnoreFocusChange, 
  logInteractionTimeline,
  isInEditorContext 
} from '@/utils/interactionTracking';
import { logger } from '@/lib/logger';

interface GlobalSelectionHandlerOptions {
  editorId: string;
  onSelectionChange?: () => void;
  onFocusOut?: (e: FocusEvent) => void;
  enabled?: boolean;
}

export function useGlobalSelectionHandler({
  editorId,
  onSelectionChange,
  onFocusOut,
  enabled = true
}: GlobalSelectionHandlerOptions) {
  const controllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Create new AbortController for this instance
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    
    // Selection change handler (capture phase)
    const handleSelectionChange = () => {
      logInteractionTimeline('selectionchange:global');
      
      // Check if we should ignore this selection change
      if (shouldIgnoreSelectionChange()) {
        return;
      }
      
      // Call the provided handler
      onSelectionChange?.();
    };
    
    // Focus out handler (capture phase)
    const handleFocusOut = (e: FocusEvent) => {
      logInteractionTimeline('focusout:global', {
        target: (e.target as Element)?.nodeName,
        relatedTarget: (e.relatedTarget as Element)?.nodeName
      });
      
      // Check if we should ignore this focus change
      if (shouldIgnoreFocusChange()) {
        return;
      }
      
      // Check if focus is moving within editor context
      if (e.relatedTarget && isInEditorContext(e.relatedTarget, editorId)) {
        logger.dev('🔍 Focus staying within editor context');
        return;
      }
      
      // Call the provided handler
      onFocusOut?.(e);
    };
    
    // Add event listeners in capture phase with AbortController
    document.addEventListener('selectionchange', handleSelectionChange, { 
      capture: true, 
      signal 
    });
    
    document.addEventListener('focusout', handleFocusOut, { 
      capture: true, 
      signal 
    });
    
    // console.log('🎯 Global selection handler attached', { editorId });
    
    // Cleanup function - AbortController automatically removes all listeners
    return () => {
      controller.abort();
      controllerRef.current = null;
      // console.log('🧹 Global selection handler cleaned up', { editorId });
    };
  }, [editorId, onSelectionChange, onFocusOut, enabled]);
  
  // Manual abort function if needed
  const abort = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  };
  
  return { abort };
}