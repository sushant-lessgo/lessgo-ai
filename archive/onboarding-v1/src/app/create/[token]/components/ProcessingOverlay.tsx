'use client';

import React, { useEffect, useState } from 'react';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
}

export default function ProcessingOverlay({ 
  isProcessing, 
  message = "Analyzing your business context...", 
  progress = 0,
  children 
}: ProcessingOverlayProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isActivating, setIsActivating] = useState(false);
  const [wasProcessing, setWasProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing && progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, isProcessing, displayProgress]);

  // Handle activation animation when processing completes
  useEffect(() => {
    if (wasProcessing && !isProcessing) {
      setIsActivating(true);
      const timer = setTimeout(() => {
        setIsActivating(false);
      }, 600);
      return () => clearTimeout(timer);
    }
    setWasProcessing(isProcessing);
  }, [isProcessing, wasProcessing]);

  return (
    <div className="relative">
      {/* Original content with activation animation */}
      <div className={`
        transition-all duration-300 
        ${isProcessing ? 'opacity-60 pointer-events-none' : 'opacity-100'}
        ${isActivating ? 'animate-pulse ring-2 ring-brand-accentPrimary ring-opacity-30 rounded-xl' : ''}
      `}>
        {children}
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
          {/* Progress bar */}
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{message}</span>
              <span className="text-sm text-gray-500">{Math.round(displayProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-accentPrimary to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          {/* Animated thinking indicator */}
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-brand-accentPrimary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-brand-accentPrimary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-brand-accentPrimary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm">AI is thinking...</span>
          </div>

          {/* Shimmer effect for tiles underneath */}
          <div className="absolute inset-0 -z-10">
            <div className="animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full transform -skew-x-12"></div>
          </div>
        </div>
      )}
    </div>
  );
}