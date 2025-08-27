/**
 * useSelectionPreserver Hook
 * 
 * Encapsulates browser selection preservation logic for text toolbar interaction.
 * Prevents selection loss when clicking toolbar buttons or other UI elements.
 * 
 * Based on selection.md approach for reliable selection management.
 */

import { useRef, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { suppressSelectionEvents, useSelectionGuard } from '@/utils/selectionGuard';

import { logger } from '@/lib/logger';
export interface SelectionPreserver {
  saveSelection: () => void;
  restoreSelection: () => void;
  hasSelection: () => boolean;
  clearSelection: () => void;
  getCurrentSelection: () => Range | null;
  validateSelection: () => boolean;
  cleanup: () => void;
}

/**
 * Hook for preserving and restoring browser text selections
 * 
 * Usage:
 * ```tsx
 * const { saveSelection, restoreSelection } = useSelectionPreserver();
 * 
 * // Before toolbar opens
 * onMouseDown={() => saveSelection()}
 * 
 * // When applying format
 * onClick={() => {
 *   restoreSelection();
 *   applyFormatting();
 * }}
 * ```
 */
export function useSelectionPreserver(): SelectionPreserver {
  const savedRangeRef = useRef<Range | null>(null);
  const { createGuardedHandler } = useSelectionGuard();
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  /**
   * Validate that a saved range is still valid (Fix #3: Validate Saved Ranges)
   */
  const validateSelection = useCallback(() => {
    if (!savedRangeRef.current) return false;
    
    try {
      const range = savedRangeRef.current;
      
      // Check if container is still connected to DOM
      if (!range.startContainer.isConnected || !range.endContainer.isConnected) {
        logger.warn('🎯 Range container disconnected from DOM');
        savedRangeRef.current = null;
        return false;
      }
      
      // Check if selection is within valid bounds
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      // Ensure containers are within editable elements
      const isInEditable = (node: Node): boolean => {
        let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
        while (current) {
          if (current.hasAttribute && current.hasAttribute('contenteditable')) {
            return current.getAttribute('contenteditable') === 'true';
          }
          if (current.hasAttribute && current.hasAttribute('data-element-key')) {
            return true; // Our text elements
          }
          current = current.parentElement;
        }
        return false;
      };
      
      if (!isInEditable(startContainer) || !isInEditable(endContainer)) {
        logger.warn('🎯 Range not within editable element');
        savedRangeRef.current = null;
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn('🎯 Range validation failed:', error);
      savedRangeRef.current = null;
      return false;
    }
  }, []);

  /**
   * Save current browser selection with debouncing
   */
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        const range = sel.getRangeAt(0).cloneRange();
        savedRangeRef.current = range;
        
        logger.debug('🎯 Selection saved:', {
          text: range.toString().substring(0, 50),
          isValid: validateSelection(),
        });
      } catch (error) {
        logger.warn('🎯 Failed to save selection:', error);
        savedRangeRef.current = null;
      }
    } else {
      savedRangeRef.current = null;
    }
  }, [validateSelection]);

  /**
   * Restore previously saved selection with validation
   */
  const restoreSelection = useCallback(() => {
    if (!validateSelection()) {
      logger.warn('🎯 Cannot restore - invalid selection');
      return;
    }
    
    const sel = window.getSelection();
    const range = savedRangeRef.current;
    
    if (sel && range) {
      try {
        // Temporarily suppress selection events during restore
        suppressSelectionEvents(25);
        
        sel.removeAllRanges();
        sel.addRange(range);
        
        logger.debug('🎯 Selection restored:', {
          text: range.toString().substring(0, 50),
          isValid: true,
        });
      } catch (error) {
        logger.warn('🎯 Failed to restore selection:', error);
        savedRangeRef.current = null;
      }
    }
  }, [validateSelection]);

  /**
   * Check if we have a saved selection
   */
  const hasSelection = useCallback(() => {
    return savedRangeRef.current !== null;
  }, []);

  /**
   * Clear saved selection
   */
  const clearSelection = useCallback(() => {
    savedRangeRef.current = null;
    logger.debug('🎯 Selection cleared');
  }, []);

  /**
   * Get current saved selection range
   */
  const getCurrentSelection = useCallback(() => {
    return savedRangeRef.current;
  }, []);

  /**
   * Hard cleanup function (Fix #4: Hard Cleanup on Mode Switch)
   */
  const cleanup = useCallback(() => {
    // DISABLED to prevent log spam: console.log('🎯 Performing hard cleanup');
    
    // Clear saved range
    savedRangeRef.current = null;
    
    // Cancel any pending debounced operations
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
      debouncedSaveRef.current = null;
    }
    
    // Force restore selection events
    suppressSelectionEvents(0); // Reset immediately
  }, []);

  /**
   * Auto-save selection on selectionchange events with guard
   */
  useEffect(() => {
    const handleSelectionChange = createGuardedHandler(() => {
      // Only auto-save if we don't already have a saved selection
      if (!savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          try {
            const range = sel.getRangeAt(0).cloneRange();
            savedRangeRef.current = range;
            logger.debug('🎯 Auto-saved selection:', {
              text: range.toString().substring(0, 50),
            });
          } catch (error) {
            logger.warn('🎯 Auto-save selection failed:', error);
          }
        }
      }
    });

    // Add guarded selectionchange listener
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [createGuardedHandler]);

  /**
   * Cleanup on unmount (Fix #4: Hard Cleanup)
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    saveSelection,
    restoreSelection,
    hasSelection,
    clearSelection,
    getCurrentSelection,
    validateSelection,
    cleanup,
  };
}

/**
 * Enhanced version with element-scoped selection preservation
 * Useful when multiple text editors are present
 */
export function useScopedSelectionPreserver(elementRef: React.RefObject<HTMLElement>): SelectionPreserver {
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && elementRef.current) {
      const range = sel.getRangeAt(0);
      
      // Only save if selection is within our element
      if (elementRef.current.contains(range.commonAncestorContainer)) {
        try {
          savedRangeRef.current = range.cloneRange();
          logger.debug('🎯 Scoped selection saved for element:', elementRef.current.dataset.elementKey);
        } catch (error) {
          logger.warn('🎯 Failed to save scoped selection:', error);
          savedRangeRef.current = null;
        }
      }
    }
  }, [elementRef]);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current && elementRef.current) {
      try {
        // Ensure the saved range is still valid within our element
        if (elementRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
          logger.debug('🎯 Scoped selection restored for element:', elementRef.current.dataset.elementKey);
        } else {
          logger.warn('🎯 Saved range is no longer valid for element');
          savedRangeRef.current = null;
        }
      } catch (error) {
        logger.warn('🎯 Failed to restore scoped selection:', error);
        savedRangeRef.current = null;
      }
    }
  }, [elementRef]);

  const hasSelection = useCallback(() => {
    return savedRangeRef.current !== null;
  }, []);

  const clearSelection = useCallback(() => {
    savedRangeRef.current = null;
  }, []);

  const getCurrentSelection = useCallback(() => {
    return savedRangeRef.current;
  }, []);

  const validateSelection = useCallback(() => {
    return savedRangeRef.current !== null;
  }, []);

  const cleanup = useCallback(() => {
    savedRangeRef.current = null;
    logger.debug('🎯 Scoped selection preserver cleanup');
  }, []);

  return {
    saveSelection,
    restoreSelection,
    hasSelection,
    clearSelection,
    getCurrentSelection,
    validateSelection,
    cleanup,
  };
}