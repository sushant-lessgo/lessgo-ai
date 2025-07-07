// /app/edit/[token]/components/ui/ModalActions.tsx
"use client";

import React from 'react';
import type { BackgroundValidationResult } from '@/types/core';

interface ModalActionsProps {
  onCancel: () => void;
  onApply: () => Promise<void>;
  onReset?: () => Promise<void>;
  canApply: boolean;
  isLoading: boolean;
  validationResult?: BackgroundValidationResult;
  hasSelection: boolean;
}

export function ModalActions({
  onCancel,
  onApply,
  onReset,
  canApply,
  isLoading,
  validationResult,
  hasSelection,
}: ModalActionsProps) {
  const handleApply = async () => {
    if (!canApply || isLoading) return;
    await onApply();
  };

  const handleReset = async () => {
    if (!onReset || isLoading) return;
    await onReset();
  };

  const showValidationScore = validationResult && hasSelection;
  const isHighQuality = validationResult && validationResult.score >= 80;
  const hasErrors = validationResult && validationResult.errors.length > 0;
  const hasWarnings = validationResult && validationResult.warnings.length > 0;

  return (
    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
      {/* Left Section - Reset and Validation */}
      <div className="flex items-center space-x-4">
        {/* Reset Button */}
        {onReset && (
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset to original LessGo-generated background"
          >
            Reset to Generated
          </button>
        )}

        {/* Validation Score Badge */}
        {showValidationScore && (
          <div className="flex items-center space-x-2">
            <div className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${isHighQuality
                ? 'bg-green-100 text-green-800 border border-green-200'
                : validationResult.score >= 60
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }
            `}>
              Quality: {validationResult.score}%
            </div>

            {/* Accessibility Badge */}
            {validationResult.accessibility.wcagLevel !== 'fail' && (
              <div className={`
                px-2 py-1 text-xs font-medium rounded-full border
                ${validationResult.accessibility.wcagLevel === 'AAA'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
                }
              `}>
                WCAG {validationResult.accessibility.wcagLevel}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Validation Summary */}
        {hasSelection && (hasErrors || hasWarnings) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {hasErrors && (
              <div className="flex items-center space-x-1 text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{validationResult?.errors.length} error{validationResult?.errors.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {hasWarnings && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{validationResult?.warnings.length} warning{validationResult?.warnings.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!canApply || isLoading}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px]
            ${canApply && !isLoading
              ? hasErrors
                ? 'bg-yellow-600 text-white hover:bg-yellow-700 border border-yellow-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
            }
          `}
          title={
            !hasSelection
              ? 'Select a background to apply'
              : hasErrors
                ? 'Apply with validation issues'
                : isHighQuality
                  ? 'High quality background - ready to apply'
                  : 'Apply background'
          }
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Applying...</span>
            </div>
          ) : hasErrors ? (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Apply Anyway</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Apply Background</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}