// /app/edit/[token]/components/layout/EditLayoutErrorBoundary.tsx
"use client";

import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  tokenId: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class EditLayoutErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 EditLayout Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      tokenId: this.props.tokenId,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service
      // reportError(error, { 
      //   context: 'EditLayout', 
      //   tokenId: this.props.tokenId,
      //   errorInfo 
      // });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          tokenId={this.props.tokenId}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined, errorInfo: undefined });
          }}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  tokenId: string;
  onRetry: () => void;
}

function ErrorFallback({ error, errorInfo, tokenId, onRetry }: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push(`/preview/${tokenId}`);
  };

  const handleRetry = () => {
    onRetry();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoToCreate = () => {
    router.push(`/create/${tokenId}`);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-6">
        <div className="mb-6">
          <div className="rounded-full bg-red-100 p-4 mx-auto w-20 h-20 flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Editor Encountered an Error
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Something went wrong while loading the editor. This is usually temporary and can be 
          resolved by refreshing the page or trying again.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Development Error Details:</h3>
            <p className="text-sm text-red-700 mb-2 font-mono">{error.message}</p>
            {error.stack && (
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer font-medium mb-1">Stack Trace</summary>
                <pre className="whitespace-pre-wrap overflow-x-auto bg-red-100 p-2 rounded">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <button
            onClick={handleReload}
            className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Reload Page
          </button>
          
          <button
            onClick={handleGoBack}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View Preview
          </button>
          
          <button
            onClick={handleGoToCreate}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Edit Inputs
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            If this problem persists, you can:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Try using a different browser</li>
            <li>• Contact support if the issue continues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with hooks support
export function EditLayoutErrorBoundary({ children, tokenId }: Props) {
  return (
    <EditLayoutErrorBoundaryClass tokenId={tokenId}>
      {children}
    </EditLayoutErrorBoundaryClass>
  );
}