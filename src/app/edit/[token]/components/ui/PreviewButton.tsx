// /app/edit/[token]/components/ui/PreviewButton.tsx
"use client";

import React, { useRef, useEffect } from 'react';
import { usePreviewNavigation } from './usePreviewNavigation';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface PreviewButtonProps {
  tokenId: string;
}

export function PreviewButton({ tokenId }: PreviewButtonProps) {
  const { handlePreviewClick, isNavigating } = usePreviewNavigation(tokenId);
  const { getColorTokens } = useEditStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const colorTokens = getColorTokens();
  
  // Add native event listener as a test
  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      const nativeClickHandler = (e: MouseEvent) => {
      };
      
      const mouseDownHandler = (e: MouseEvent) => {
      };
      
      const mouseUpHandler = (e: MouseEvent) => {
      };
      
      button.addEventListener('click', nativeClickHandler);
      button.addEventListener('mousedown', mouseDownHandler);
      button.addEventListener('mouseup', mouseUpHandler);
      
      return () => {
        button.removeEventListener('click', nativeClickHandler);
        button.removeEventListener('mousedown', mouseDownHandler);
        button.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, []);
  
  const handleClick = (e: React.MouseEvent) => {
    try {
      handlePreviewClick();
    } catch (error) {
      console.error('❌ Preview click error:', error);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isNavigating}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        bg-blue-600 text-white hover:opacity-90 
        shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isNavigating ? 'cursor-wait' : ''}
      `}
      style={{ pointerEvents: 'auto' }}
      title="Preview your landing page"
    >
      <div className="flex items-center space-x-2">
        {isNavigating ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        <span>{isNavigating ? 'Saving...' : 'Preview'}</span>
      </div>
    </button>
  );
}