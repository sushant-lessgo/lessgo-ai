// CSS Variable Error Boundary
// Catches errors in the CSS variable system and provides fallback

'use client';

import React from 'react';
import { logger } from '@/lib/logger';

interface CSSVariableErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMode?: 'legacy' | 'minimal';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface CSSVariableErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  fallbackMode: 'legacy' | 'minimal';
}

/**
 * Error Boundary for CSS Variable System
 * 
 * This component:
 * 1. Catches errors in the CSS variable injection system
 * 2. Provides fallback rendering without CSS variables
 * 3. Logs errors for debugging and monitoring
 * 4. Allows graceful degradation to legacy mode
 */
export class CSSVariableErrorBoundary extends React.Component<
  CSSVariableErrorBoundaryProps,
  CSSVariableErrorBoundaryState
> {
  constructor(props: CSSVariableErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      fallbackMode: props.fallbackMode || 'legacy',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CSSVariableErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    logger.error('CSS Variable System Error:', () => error);
    logger.error('Error Info:', () => errorInfo);

    // Update state with error information
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'css_variable_error', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        timestamp: Date.now(),
      });
    }

    // Performance monitoring
    if (typeof window !== 'undefined') {
      try {
        const performanceEntry = {
          name: 'css-variable-error',
          entryType: 'measure',
          startTime: performance.now(),
          duration: 0,
          detail: {
            error: error.message,
            fallbackMode: this.state.fallbackMode,
          },
        };

        // Log performance entry if Performance Observer is available
        if ('PerformanceObserver' in window) {
          logger.warn('CSS Variable system encountered an error and fell back to legacy mode');
        }
      } catch (perfError) {
        // Ignore performance logging errors
      }
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.fallbackMode === 'minimal') {
        // Minimal fallback - just render children without variable wrapper
        logger.warn('CSS Variable Error Boundary: Using minimal fallback mode');
        return (
          <div data-css-variable-fallback="minimal">
            {this.props.children}
          </div>
        );
      }

      // Legacy fallback - show error message in development
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="css-variable-error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  CSS Variable System Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="mb-2">
                    The CSS variable system encountered an error and has fallen back to legacy mode.
                  </p>
                  
                  {this.state.error && (
                    <details className="mb-2">
                      <summary className="cursor-pointer font-medium">
                        Error Details
                      </summary>
                      <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono">
                        <p><strong>Message:</strong> {this.state.error.message}</p>
                        {this.state.error.stack && (
                          <div className="mt-2">
                            <strong>Stack:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                  
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry CSS Variables
                  </button>
                </div>
              </div>
            </div>

            {/* Render children in legacy mode */}
            <div className="mt-4" data-css-variable-fallback="legacy">
              {this.props.children}
            </div>
          </div>
        );
      } else {
        // Production: silent fallback to legacy mode
        return (
          <div data-css-variable-fallback="legacy">
            {this.props.children}
          </div>
        );
      }
    }

    // No error, render normally
    return this.props.children;
  }
}

/**
 * React Hook version of the error boundary for functional components
 */
export function useCSSVariableErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    logger.error('CSS Variable Hook Error:', () => error);
    setError(error);
  }, []);

  return {
    hasError: error !== null,
    error,
    resetError,
    captureError,
  };
}

/**
 * Higher-order component for wrapping components with CSS variable error boundary
 */
export function withCSSVariableErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackMode: 'legacy' | 'minimal' = 'legacy'
) {
  const WrappedComponent = (props: P) => (
    <CSSVariableErrorBoundary fallbackMode={fallbackMode}>
      <Component {...props} />
    </CSSVariableErrorBoundary>
  );

  WrappedComponent.displayName = `withCSSVariableErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}