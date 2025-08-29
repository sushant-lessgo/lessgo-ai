// hooks/useImageToolbar.ts - Robust image toolbar hook
import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

import { logger } from '@/lib/logger';
/**
 * Hook that provides a robust image toolbar function that works across different store implementations
 * Handles cases where showImageToolbar might not be available in the store
 */
export function useImageToolbar() {
  // Get store instance
  const store = useEditStore();
  
  // Robust image toolbar function
  const handleImageToolbar = React.useCallback((imageId: string, position: { x: number; y: number }) => {
    try {
      // Try multiple approaches to show the image toolbar
      if (store.showImageToolbar && typeof store.showImageToolbar === 'function') {
        store.showImageToolbar(imageId, position);
      } else if (store.showToolbar && typeof store.showToolbar === 'function') {
        store.showToolbar('image', imageId, position);
      } else if (store.showElementToolbar && typeof store.showElementToolbar === 'function') {
        // Fallback to element toolbar as it might handle images too
        store.showElementToolbar(imageId, position);
      } else {
        // Last resort: try to access the raw store state and call any available function
        const storeState = useEditStore.getState();
        if (storeState?.showImageToolbar) {
          storeState.showImageToolbar(imageId, position);
        } else if (storeState?.showToolbar) {
          storeState.showToolbar('image', imageId, position);
        } else {
          logger.warn('No toolbar function available for image:', { imageId, availableFunctions: Object.keys(storeState || {}) });
        }
      }
    } catch (error) {
      logger.error('Error showing image toolbar:', error);
      logger.warn('Falling back to console log for image toolbar request:', { imageId, position });
    }
  }, [store]);

  return handleImageToolbar;
}