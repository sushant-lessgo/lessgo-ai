/**
 * EditProvider - Context provider for token-scoped EditStore management
 * Handles loading states, error boundaries, and store lifecycle
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import type { EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';
import { EditErrorBoundary } from './EditErrorBoundary';

import { logger } from '@/lib/logger';
// Context interfaces
interface EditStoreContext {
  store: EditStoreInstance | null;
  tokenId: string;
  isInitialized: boolean;
  isHydrating: boolean;
  error: string | null;
  isReady: boolean;
  retryInitialization: () => void;
  
  // Convenience accessors
  sections: string[];
  content: Record<string, any>;
  theme: any;
}

interface EditProviderProps {
  children: React.ReactNode;
  tokenId: string;
  
  // Configuration options
  options?: {
    suspense?: boolean;
    preload?: boolean;
    resetOnTokenChange?: boolean;
    showLoadingState?: boolean;
    showErrorBoundary?: boolean;
    fallbackComponent?: React.ComponentType<{ error: string; retry: () => void }>;
    loadingComponent?: React.ComponentType<{ tokenId: string }>;
  };
}

// Create context with default values
const EditStoreContext = createContext<EditStoreContext | null>(null);

/**
 * Default loading component
 */
const DefaultLoadingComponent: React.FC<{ tokenId: string }> = ({ tokenId }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-gray-600">Loading project...</p>
      <p className="text-xs text-gray-400">Token: {tokenId.slice(0, 8)}...</p>
    </div>
  </div>
);

/**
 * Default error fallback component
 */
const DefaultErrorComponent: React.FC<{ error: string; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4 p-8 max-w-md">
      <div className="text-red-500 text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900">Store Loading Failed</h2>
      <p className="text-gray-600">{error}</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

/**
 * EditProvider component that manages store lifecycle and provides context
 */
export function EditProvider({ children, tokenId, options = {} }: EditProviderProps) {
  const {
    suspense = false,
    preload = false,
    resetOnTokenChange = true,
    showLoadingState = true,
    showErrorBoundary = true,
    fallbackComponent: FallbackComponent = DefaultErrorComponent,
    loadingComponent: LoadingComponent = DefaultLoadingComponent,
  } = options;

  // Hook into the store management
  const {
    store,
    isInitialized,
    isHydrating,
    error,
    isReady,
    sections,
    content,
    theme,
    retryInitialization,
  } = useEditStore(tokenId, {
    suspense,
    preload,
    resetOnTokenChange,
  });

  // Track token changes for debugging
  const previousTokenRef = useRef<string>();
  const hasLoadedDataRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (previousTokenRef.current && previousTokenRef.current !== tokenId) {
      logger.debug(`🔄 EditProvider: Token changed from ${previousTokenRef.current} to ${tokenId}`);
    }
    previousTokenRef.current = tokenId;
  }, [tokenId]);

  // Auto-load project data after store initialization
  useEffect(() => {
    if (store && isInitialized && !isHydrating && !hasLoadedDataRef.current.has(tokenId)) {
      // console.log(`📥 [EDIT-DEBUG] EditProvider: Loading project data for token ${tokenId}`);
      hasLoadedDataRef.current.add(tokenId);
      
      // Log current theme state before loading
      const currentState = store.getState();
      // console.log(`🎨 [EDIT-DEBUG] Theme before API load:`, {
      //   colors: currentState.theme?.colors,
      //   typography: {
      //     headingFont: currentState.theme?.typography?.headingFont,
      //     bodyFont: currentState.theme?.typography?.bodyFont
      //   },
      //   sections: currentState.sections?.length || 0,
      //   content: Object.keys(currentState.content || {}).length
      // });
      
      // Load project data from API
      fetch(`/api/loadDraft?tokenId=${tokenId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load draft: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // console.log(`✅ [EDIT-DEBUG] EditProvider: Loaded project data for token ${tokenId}`, {
          //   hasFinalContent: !!data.finalContent,
          //   sectionsCount: data.finalContent?.sections?.length || 0,
          //   hasThemeInResponse: !!data.finalContent?.theme,
          //   themeColors: data.finalContent?.theme?.colors,
          //   themeTypography: data.finalContent?.theme?.typography
          // });
          
          // Load data into store using existing loadFromDraft action
          const storeState = store.getState();
          if (typeof storeState.loadFromDraft === 'function') {
            storeState.loadFromDraft(data, tokenId);
            
            // Log theme after loading
            const updatedState = store.getState();
            // console.log(`🎨 [EDIT-DEBUG] Theme after loadFromDraft:`, {
            //   colors: updatedState.theme?.colors,
            //   typography: {
            //     headingFont: updatedState.theme?.typography?.headingFont,
            //     bodyFont: updatedState.theme?.typography?.bodyFont
            //   },
            //   sections: updatedState.sections?.length || 0,
            //   content: Object.keys(updatedState.content || {}).length
            // });
            
            // Log color tokens if available
            try {
              const colorTokens = updatedState.getColorTokens?.();
              // console.log(`🎨 [EDIT-DEBUG] Color tokens after load:`, colorTokens);
            } catch (error) {
              logger.warn(`🎨 [EDIT-DEBUG] Failed to get color tokens:`, error);
            }
          } else {
            logger.warn('loadFromDraft action not found in store');
          }
        })
        .catch(error => {
          logger.error(`❌ EditProvider: Failed to load project data for token ${tokenId}:`, error);
          // Don't show error for missing projects - they might be new projects
          if (!error.message.includes('404')) {
            // Only log non-404 errors
            logger.error('Project load error:', error);
          }
        });
    }
  }, [store, isInitialized, isHydrating, tokenId]);

  // Create context value - get fresh data from store if available
  const storeState = store?.getState();
  const contextValue: EditStoreContext = {
    store,
    tokenId,
    isInitialized,
    isHydrating,
    error,
    isReady: isReady || false,
    retryInitialization,
    sections: storeState?.sections || sections || [],
    content: storeState?.content || content || {},
    theme: storeState?.theme || theme || {},
  };

  // Show error state
  if (error && showErrorBoundary) {
    return <FallbackComponent error={error} retry={retryInitialization} />;
  }

  // Show loading state
  if (isHydrating && showLoadingState) {
    return <LoadingComponent tokenId={tokenId} />;
  }

  // Provide context to children with error boundary
  return (
    <EditErrorBoundary 
      tokenId={tokenId}
      onError={(error, errorInfo) => {
        logger.error('🚨 EditProvider error boundary caught:', {
          error: error.message,
          tokenId,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <EditStoreContext.Provider value={contextValue}>
        {children}
      </EditStoreContext.Provider>
    </EditErrorBoundary>
  );
}

/**
 * Hook to consume EditStore context
 */
function useEditStoreContext(): EditStoreContext {
  const context = useContext(EditStoreContext);
  
  if (!context) {
    throw new Error('useEditStoreContext must be used within an EditProvider');
  }
  
  return context;
}

/**
 * Hook to get store instance from context (with validation)
 */
function useStore(): EditStoreInstance {
  const context = useEditStoreContext();
  
  if (!context.store) {
    throw new Error('Store is not available. Check if EditProvider is properly configured.');
  }
  
  return context.store;
}

/**
 * Hook to get store state with automatic re-renders
 */
function useStoreState<T>(
  selector: (state: EditStore) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  const store = useStore();
  const [state, setState] = useState(() => selector(store.getState()));
  
  useEffect(() => {
    // Get initial state (in case data was loaded after initial render)
    const currentState = selector(store.getState());
    setState(prev => {
      if (equalityFn && equalityFn(prev, currentState)) {
        return prev;
      }
      return currentState;
    });
    
    // Subscribe to future changes
    const unsubscribe = store.subscribe((newState: any) => {
      const selectedState = selector(newState);
      setState(current => {
        if (equalityFn && equalityFn(current, selectedState)) {
          return current;
        }
        return selectedState;
      });
    });
    
    return unsubscribe;
  }, [store, selector, equalityFn]);
  
  return state;
}

/**
 * Hook to get store actions (methods)
 */
function useStoreActions() {
  const store = useStore();
  
  // Return a stable reference to actions
  return React.useMemo(() => {
    const state = store.getState();
    
    // Extract all action methods (functions) from store
    const actions: Record<string, Function> = {};
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === 'function') {
        actions[key] = value;
      }
    }
    
    return actions;
  }, [store]);
}

/**
 * HOC for wrapping components with EditProvider
 */
function withEditProvider<P extends object>(
  Component: React.ComponentType<P>,
  providerOptions?: Omit<EditProviderProps, 'children' | 'tokenId'>
) {
  const WrappedComponent: React.FC<P & { tokenId: string }> = (props) => {
    const { tokenId, ...componentProps } = props;
    
    return (
      <EditProvider tokenId={tokenId} {...providerOptions}>
        <Component {...(componentProps as P)} />
      </EditProvider>
    );
  };
  
  WrappedComponent.displayName = `withEditProvider(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Utility component for conditional rendering based on store state
 */
const EditStoreGate: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  when?: 'ready' | 'initialized' | 'loading' | 'error';
}> = ({ children, fallback = null, when = 'ready' }) => {
  const context = useEditStoreContext();
  
  let shouldRender = false;
  
  switch (when) {
    case 'ready':
      shouldRender = context.isReady;
      break;
    case 'initialized':
      shouldRender = context.isInitialized;
      break;
    case 'loading':
      shouldRender = context.isHydrating;
      break;
    case 'error':
      shouldRender = !!context.error;
      break;
  }
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

/**
 * Development utilities
 */
if (process.env.NODE_ENV === 'development') {
  (window as any).__editProviderDebug = {
    // Debug utilities for development
    getContext: () => {
      try {
        // This won't work outside of React context, but useful for debugging
        logger.warn('Use React DevTools to inspect EditProvider context');
        return null;
      } catch {
        return null;
      }
    },
    DefaultLoadingComponent,
    DefaultErrorComponent,
  };
  
  logger.debug('🔧 EditProvider debug utilities available at window.__editProviderDebug');
}

// Export types for external use
export type { 
  EditStoreContext, 
  EditProviderProps 
};

// Export all hooks and components
export {
  useEditStoreContext,
  useStore,
  useStoreState,
  useStoreActions,
  withEditProvider,
  EditStoreGate,
};

export default EditProvider;