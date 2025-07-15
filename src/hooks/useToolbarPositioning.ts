// hooks/useToolbarPositioning.ts - Simplified positioning (kept for compatibility)
import { useCallback } from 'react';
import { useEditStore } from './useEditStore';

export interface PositioningOptions {
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}

export function useToolbarPositioning() {
  const { showToolbar, hideToolbar } = useEditStore();

  // Simple position calculation
  const calculatePosition = useCallback((
    targetElement: HTMLElement,
    options: PositioningOptions = {}
  ): { x: number; y: number } => {
    const rect = targetElement.getBoundingClientRect();
    const { offset = { x: 0, y: 0 } } = options;
    
    // Simple centering above target
    return {
      x: rect.left + rect.width / 2 + offset.x,
      y: rect.top - 60 + offset.y
    };
  }, []);

  // Legacy compatibility functions
  const showSmartToolbar = useCallback((
    type: any,
    targetId: string,
    options: any = {}
  ) => {
    // Find target element for position calculation
    let selector = '';
    if (type === 'section') {
      selector = `[data-section-id="${targetId}"]`;
    } else if (type === 'element') {
      const parts = targetId.split('.');
      selector = `[data-section-id="${parts[0]}"] [data-element-key="${parts[1]}"]`;
    }
    
    const targetElement = document.querySelector(selector) as HTMLElement;
    const position = targetElement 
      ? calculatePosition(targetElement, options)
      : { x: 0, y: 0 };
    
    showToolbar(type, targetId, position);
  }, [showToolbar, calculatePosition]);

  const hideSmartToolbar = useCallback(() => {
    hideToolbar();
  }, [hideToolbar]);

  // No-op functions for removed complex positioning
  const updateAllPositions = useCallback(() => {
    // No longer needed - positions calculated once when shown
  }, []);

  return {
    // Core positioning
    calculatePosition,
    showSmartToolbar,
    hideSmartToolbar,
    updateAllPositions,
    
    // Legacy compatibility
    showToolbar,
    hideToolbar,
  };
}