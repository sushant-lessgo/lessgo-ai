/**
 * EditErrorBoundary - Error boundary for EditProvider and store-related errors
 * Provides fallback UI and error recovery for token-scoped stores
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { storeManager } from '@/stores/storeManager';
import { storageManager } from '@/utils/storageManager';

interface EditErrorBoundaryProps {
  children: ReactNode;
  tokenId?: string;
  fallback?: React.ComponentType<EditErrorBoundaryState>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface EditErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  tokenId?: string;
  retryCount: number;
  errorType: 'store' | 'storage' | 'render' | 'unknown';
  isRecovering: boolean;
}

class EditErrorBoundary extends Component<EditErrorBoundaryProps, EditErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: EditErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      tokenId: props.tokenId,
      retryCount: 0,
      errorType: 'unknown',
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EditErrorBoundaryState> {
    // Analyze error type
    let errorType: EditErrorBoundaryState['errorType'] = 'unknown';
    
    if (error.message.includes('store') || error.message.includes('EditStore')) {
      errorType = 'store';
    } else if (error.message.includes('storage') || error.message.includes('localStorage')) {
      errorType = 'storage';
    } else if (error.name === 'ChunkLoadError' || error.message.includes('Loading CSS chunk')) {
      errorType = 'render';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 EditErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      tokenId: this.props.tokenId,
      errorType: this.state.errorType,
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Try automatic recovery for certain error types
    this.attemptAutomaticRecovery();
  }

  /**
   * Attempt automatic recovery based on error type
   */
  private attemptAutomaticRecovery = async () => {
    const { errorType, retryCount, tokenId } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.log('🛑 Max retry attempts reached, giving up automatic recovery');
      return;
    }

    this.setState({ isRecovering: true });

    try {
      switch (errorType) {
        case 'store':
          await this.recoverFromStoreError();
          break;
        case 'storage':
          await this.recoverFromStorageError();
          break;
        case 'render':
          await this.recoverFromRenderError();
          break;
        default:
          console.warn('⚠️ Unknown error type, attempting generic recovery');
          await this.genericRecovery();
      }

      // If recovery successful, retry after a delay
      this.retryTimeout = setTimeout(() => {
        this.retry();
      }, 1000 * (retryCount + 1)); // Exponential backoff

    } catch (recoveryError) {
      console.error('❌ Recovery attempt failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  /**
   * Recover from store-related errors
   */
  private recoverFromStoreError = async () => {
    console.log('🔧 Attempting store error recovery');
    
    const tokenId = this.props.tokenId;
    if (!tokenId) {
      throw new Error('Cannot recover store without tokenId');
    }

    try {
      // Remove corrupted store from memory
      storeManager.removeFromCache(tokenId);
      
      // Clear any corrupted localStorage for this token
      const storageKey = `edit-store-${tokenId}`;
      if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        console.log('🗑️ Clearing potentially corrupted localStorage');
        localStorage.removeItem(storageKey);
      }

      // Trigger storage cleanup
      await storageManager.performMaintenanceCleanup(true);
      
      console.log('✅ Store error recovery completed');
    } catch (error) {
      console.error('❌ Store recovery failed:', error);
      throw error;
    }
  };

  /**
   * Recover from storage-related errors
   */
  private recoverFromStorageError = async () => {
    console.log('🔧 Attempting storage error recovery');

    try {
      // Force storage cleanup
      await storageManager.forceCleanup();
      
      // Check storage availability
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('__test__', 'test');
          localStorage.removeItem('__test__');
        } catch (error) {
          throw new Error('localStorage not available');
        }
      }

      console.log('✅ Storage error recovery completed');
    } catch (error) {
      console.error('❌ Storage recovery failed:', error);
      throw error;
    }
  };

  /**
   * Recover from render-related errors
   */
  private recoverFromRenderError = async () => {
    console.log('🔧 Attempting render error recovery');

    try {
      // For chunk loading errors, we might need to refresh
      if (this.state.error?.name === 'ChunkLoadError') {
        console.log('🔄 Chunk load error detected, will suggest page refresh');
      }

      // Clear any cached data that might be causing render issues
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      console.log('✅ Render error recovery completed');
    } catch (error) {
      console.error('❌ Render recovery failed:', error);
      throw error;
    }
  };

  /**
   * Generic recovery attempt
   */
  private genericRecovery = async () => {
    console.log('🔧 Attempting generic error recovery');

    try {
      // Basic cleanup
      await storageManager.performMaintenanceCleanup(true);
      
      // Clear any memory caches
      if (typeof window !== 'undefined') {
        // Clear any debugging data
        delete (window as any).__editStoreDebug;
        delete (window as any).__storeManagerDebug;
      }

      console.log('✅ Generic error recovery completed');
    } catch (error) {
      console.error('❌ Generic recovery failed:', error);
      throw error;
    }
  };

  /**
   * Manual retry function
   */
  private retry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));
  };

  /**
   * Reset error boundary completely
   */
  private reset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorType: 'unknown',
      isRecovering: false,
    });
  };

  /**
   * Hard reset - clears everything and refreshes page
   */
  private hardReset = () => {
    try {
      // Clear all localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('❌ Hard reset failed:', error);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }

      // Default error UI
      return <DefaultErrorFallback {...this.state} onRetry={this.retry} onReset={this.reset} onHardReset={this.hardReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
interface DefaultErrorFallbackProps extends EditErrorBoundaryState {
  onRetry: () => void;
  onReset: () => void;
  onHardReset: () => void;
}

function DefaultErrorFallback({
  error,
  errorType,
  retryCount,
  isRecovering,
  tokenId,
  onRetry,
  onReset,
  onHardReset,
}: DefaultErrorFallbackProps) {
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  const errorTypeMessages = {
    store: 'Store initialization failed',
    storage: 'Storage access failed',
    render: 'Component rendering failed',
    unknown: 'An unexpected error occurred',
  };

  const errorTypeIcons = {
    store: '🏪',
    storage: '💾',
    render: '🎨',
    unknown: '❓',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8">
          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{errorTypeIcons[errorType]}</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600">
              {errorTypeMessages[errorType]}
            </p>
          </div>

          {/* Error details */}
          <div className="mb-6">
            <details className="bg-gray-50 rounded p-3">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details
              </summary>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Type:</strong> {errorType}</div>
                <div><strong>Message:</strong> {error?.message}</div>
                {tokenId && <div><strong>Token:</strong> {tokenId.slice(0, 8)}...</div>}
                <div><strong>Attempts:</strong> {retryCount}/{maxRetries}</div>
              </div>
            </details>
          </div>

          {/* Recovery status */}
          {isRecovering && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Attempting automatic recovery...</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {canRetry && !isRecovering && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </button>
            )}
            
            <button
              onClick={onReset}
              disabled={isRecovering}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Reset
            </button>

            {retryCount >= maxRetries && (
              <button
                onClick={onHardReset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Clear All Data & Refresh
              </button>
            )}

            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            If this error persists, try refreshing the page or clearing your browser's storage.
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditErrorBoundary;
export { EditErrorBoundary, type EditErrorBoundaryProps, type EditErrorBoundaryState };