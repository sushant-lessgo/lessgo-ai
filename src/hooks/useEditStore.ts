/**
 * SSR-Safe useEditStore Hook - Token-scoped store access
 * Replaces the global useEditStore with token-aware store management
 */

import { useEffect, useState, useRef } from 'react';
import { storeManager } from '@/stores/storeManager';
import type { EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';
import { isStorageAvailable } from '@/utils/storage';

// Hook state for managing store lifecycle
interface UseEditStoreState {
  store: EditStoreInstance | null;
  isInitialized: boolean;
  isHydrating: boolean;
  error: string | null;
}

/**
 * SSR-safe hook for accessing token-scoped EditStore
 * 
 * @param tokenId - The token ID for the project
 * @param options - Configuration options
 * @returns Store instance and loading states
 */
export function useEditStore(
  tokenId: string,
  options: {
    suspense?: boolean;
    preload?: boolean;
    resetOnTokenChange?: boolean;
  } = {}
) {
  const {
    suspense = false,
    preload = false,
    resetOnTokenChange = true
  } = options;

  // State management
  const [state, setState] = useState<UseEditStoreState>({
    store: null,
    isInitialized: false,
    isHydrating: true,
    error: null,
  });

  // Ref to track current token and prevent unnecessary re-renders
  const currentTokenRef = useRef<string | null>(null);
  const initializationRef = useRef<Promise<EditStoreInstance> | null>(null);

  /**
   * Initialize store for the given token
   */
  const initializeStore = async (newTokenId: string): Promise<EditStoreInstance> => {
    try {
      // console.log(`🎯 useEditStore: Initializing store for token ${newTokenId}`);
      
      // Check if we're switching tokens
      const isTokenSwitch = currentTokenRef.current && currentTokenRef.current !== newTokenId;
      if (isTokenSwitch && resetOnTokenChange) {
        // console.log(`🔄 useEditStore: Token switch detected: ${currentTokenRef.current} → ${newTokenId}`);
      }

      // Get store from manager
      const store = storeManager.getEditStore(newTokenId);
      currentTokenRef.current = newTokenId;

      // Wait for hydration if storage is available
      if (isStorageAvailable()) {
        // Give the persist middleware time to hydrate
        await new Promise(resolve => {
          const unsubscribe = store.persist.onFinishHydration(() => {
            unsubscribe();
            resolve(void 0);
          });
          
          // Fallback timeout in case hydration events don't fire
          setTimeout(() => {
            unsubscribe();
            resolve(void 0);
          }, 1000);
        });
      }

      // Mark store as initialized in manager
      storeManager.markStoreInitialized(newTokenId);

      setState({
        store,
        isInitialized: true,
        isHydrating: false,
        error: null,
      });

      return store;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ useEditStore: Failed to initialize store for token ${newTokenId}:`, error);
      
      setState(prev => ({
        ...prev,
        isHydrating: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  /**
   * Handle token changes and initialization
   */
  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') return;

    // Validate token
    if (!tokenId || typeof tokenId !== 'string') {
      setState(prev => ({
        ...prev,
        isHydrating: false,
        error: 'Invalid token ID provided',
      }));
      return;
    }

    // Skip if already initializing the same token
    if (currentTokenRef.current === tokenId && state.store && !state.error) {
      return;
    }

    // Initialize or switch store
    const initPromise = initializeStore(tokenId);
    initializationRef.current = initPromise;

    // Handle initialization result
    initPromise.catch(error => {
      // Error is already handled in initializeStore
      console.warn('useEditStore initialization failed:', error);
    });

    return () => {
      // Cleanup on unmount or token change
      if (initializationRef.current === initPromise) {
        initializationRef.current = null;
      }
    };
  }, [tokenId, resetOnTokenChange]);

  /**
   * Preload effect for performance optimization
   */
  useEffect(() => {
    if (preload && tokenId && typeof window !== 'undefined') {
      // Preload in the background without affecting state
      storeManager.preloadStore(tokenId).catch(error => {
        console.warn('Store preloading failed:', error);
      });
    }
  }, [tokenId, preload]);

  /**
   * SSR compatibility - return minimal state on server
   */
  if (typeof window === 'undefined') {
    return {
      // Server-side safe values
      store: null,
      isInitialized: false,
      isHydrating: true,
      error: null,
      // Dummy functions for SSR
      sections: [],
      content: {},
      theme: null,
      // State management helpers
      isLoading: true,
      hasError: false,
      retryInitialization: () => {},
    };
  }

  /**
   * Suspense support for React concurrent features
   */
  if (suspense && state.isHydrating && !state.error) {
    if (initializationRef.current) {
      throw initializationRef.current;
    }
  }

  /**
   * Retry initialization function
   */
  const retryInitialization = () => {
    if (tokenId) {
      setState(prev => ({ ...prev, error: null, isHydrating: true }));
      initializeStore(tokenId);
    }
  };

  // Extract commonly used store properties for convenience
  const storeState = state.store?.getState();
  const sections = storeState?.sections || [];
  const content = storeState?.content || {};
  const theme = storeState?.theme || null;

  return {
    // Core store access
    store: state.store,
    isInitialized: state.isInitialized,
    isHydrating: state.isHydrating,
    error: state.error,

    // Convenience properties
    sections,
    content,
    theme,

    // Status helpers
    isLoading: state.isHydrating,
    hasError: !!state.error,
    isReady: state.isInitialized && !state.error && !state.isHydrating,

    // Actions
    retryInitialization,
  };
}

/**
 * Hook for getting the current store instance (for components that already have a store)
 * Useful when you need direct store access without re-initialization
 */
export function useCurrentEditStore(tokenId: string) {
  const [store, setStore] = useState<EditStoreInstance | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && tokenId) {
      // Get existing store from manager (won't create new one)
      try {
        const existingStore = storeManager.getEditStore(tokenId);
        setStore(existingStore);
      } catch (error) {
        console.warn('Failed to get current store:', error);
        setStore(null);
      }
    }
  }, [tokenId]);

  return store;
}

/**
 * Hook for subscribing to specific store state changes
 * Optimized for performance with selective subscriptions
 */
export function useEditStoreSelector<T>(
  tokenId: string,
  selector: (state: EditStore) => T,
  equalityFn?: (a: T, b: T) => boolean
): T | undefined {
  const { store, isInitialized } = useEditStore(tokenId);
  const [selectedState, setSelectedState] = useState<T | undefined>();

  useEffect(() => {
    if (!store || !isInitialized) {
      setSelectedState(undefined);
      return;
    }

    // Initial value
    const initialValue = selector(store.getState());
    setSelectedState(initialValue);

    // Subscribe to changes
    const unsubscribe = store.subscribe((state: any) => {
      const newValue = selector(state);
      setSelectedState(current => {
        // Use custom equality function if provided
        if (equalityFn && current !== undefined) {
          return equalityFn(current, newValue) ? current : newValue;
        }
        // Default equality check
        return current === newValue ? current : newValue;
      });
    });

    return unsubscribe;
  }, [store, isInitialized, selector, equalityFn]);

  return selectedState;
}

/**
 * Development utilities
 */
if (process.env.NODE_ENV === 'development') {
  (window as any).__useEditStoreDebug = {
    storeManager,
    getCurrentStore: (tokenId: string) => storeManager.getEditStore(tokenId),
    getCacheStats: () => storeManager.getCacheStats(),
    isStorageAvailable,
  };
  
  console.log('🔧 useEditStore debug utilities available at window.__useEditStoreDebug');
}

// Export types for consumer components
export type { EditStore, EditStoreInstance };

// Legacy compatibility - export the factory function with warning
export const createEditStore = (tokenId?: string) => {
  console.warn(
    'Direct createEditStore usage is deprecated. Use useEditStore hook instead.',
    'If you need direct store access, use storeManager.getEditStore(tokenId)'
  );
  if (!tokenId) throw new Error('tokenId is required');
  return storeManager.getEditStore(tokenId);
};

// Legacy compatibility - for components that use useEditStore() without tokenId
// This will use the legacy compatibility layer
export { useEditStoreLegacy as useEditStoreCompat } from './useEditStoreLegacy';