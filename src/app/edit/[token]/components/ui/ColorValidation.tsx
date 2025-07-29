// ColorValidation.tsx - User-friendly CTA visibility display
"use client";

import React from 'react';
import type { ValidationStatus } from './ColorSystemModalMVP';

interface ColorValidationProps {
  status: ValidationStatus;
  isValidating: boolean;
}

export function ColorValidation({ status, isValidating }: ColorValidationProps) {
  if (isValidating) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Checking how well your CTAs stand out...</span>
        </div>
      </div>
    );
  }

  // Get color based on score
  const getScoreColor = () => {
    if (status.score >= 90) return 'bg-green-500';
    if (status.score >= 70) return 'bg-emerald-500';
    if (status.score >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getScoreBarColor = () => {
    if (status.score >= 90) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (status.score >= 70) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (status.score >= 50) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-orange-400 to-orange-600';
  };

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-2">
          <span className="text-2xl font-bold text-gray-900">{status.score}%</span>
        </div>
        <p className="text-lg font-medium text-gray-900">{status.message}</p>
      </div>

      {/* Visual Score Bar */}
      <div className="relative">
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getScoreBarColor()}`}
            style={{ width: `${status.score}%` }}
          />
        </div>
        
        {/* Score indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <span className="text-xs font-medium text-gray-600">Blends in</span>
          <span className="text-xs font-medium text-gray-600">Stands out</span>
        </div>
      </div>

      {/* Simple explanation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          {status.score >= 70 
            ? "Your buttons and calls-to-action will grab attention on your main background."
            : "Your buttons might not stand out enough. Try a color with more contrast."
          }
        </p>
      </div>

      {/* Visual comparison (optional) */}
      {status.level === 'poor' && (
        <div className="text-xs text-gray-500 text-center">
          💡 Tip: Colors that contrast well with your background make CTAs impossible to miss!
        </div>
      )}
    </div>
  );
}