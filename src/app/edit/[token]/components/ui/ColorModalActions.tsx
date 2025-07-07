// /app/edit/[token]/components/ui/ColorModalActions.tsx
"use client";

import React, { useState } from 'react';
import { analyzeColorAccessibility, getAccessibilityBadge } from './colorAccessibilityUtils';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface ColorModalActionsProps {
  currentTokens: ColorTokens;
  previewTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  canApply: boolean;
  isLoading: boolean;
  validationErrors: string[];
  onApply: () => Promise<boolean>;
  onCancel: () => void;
  onResetToGenerated: () => Promise<void>;
}

export function ColorModalActions({
  currentTokens,
  previewTokens,
  backgroundSystem,
  canApply,
  isLoading,
  validationErrors,
  onApply,
  onCancel,
  onResetToGenerated,
}: ColorModalActionsProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Analyze accessibility of preview tokens
  const accessibilityAnalysis = backgroundSystem 
    ? analyzeColorAccessibility(previewTokens, backgroundSystem)
    : null;

  const accessibilityBadge = accessibilityAnalysis 
    ? getAccessibilityBadge(accessibilityAnalysis)
    : null;

  // Check if there are significant changes
  const hasChanges = JSON.stringify(currentTokens) !== JSON.stringify(previewTokens);

  // Calculate change summary
  const getChangeSummary = (): string => {
    if (!hasChanges) return 'No changes';
    
    const changedTokens = Object.keys(currentTokens).filter(
      key => currentTokens[key as keyof ColorTokens] !== previewTokens[key as keyof ColorTokens]
    );
    
    if (changedTokens.length === 0) return 'No changes';
    if (changedTokens.length === 1) return '1 color updated';
    return `${changedTokens.length} colors updated`;
  };

  const handleApplyWithLoading = async () => {
    const success = await onApply();
    if (!success) {
      // Error handling is done in the parent component
    }
  };

  const handleResetConfirm = async () => {
    setShowConfirmReset(false);
    await onResetToGenerated();
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        {/* Left Side - Reset and Info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={isLoading}
            className={`
              text-sm transition-colors
              ${isLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Reset to LessGo-Generated
          </button>

          {/* Change Summary */}
          <div className="text-sm text-gray-600">
            {getChangeSummary()}
          </div>

          {/* Accessibility Badge */}
          {accessibilityBadge && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${accessibilityBadge.color}`}>
              {accessibilityBadge.icon} {accessibilityBadge.label}
            </div>
          )}
        </div>

        {/* Right Side - Main Actions */}
        <div className="flex items-center space-x-3">
          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg border transition-colors
              ${isLoading
                ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }
            `}
          >
            Cancel
          </button>

          {/* Apply Button */}
          <button
            onClick={handleApplyWithLoading}
            disabled={!canApply || isLoading}
            className={`
              px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2
              ${canApply && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
            )}
            <span>{isLoading ? 'Applying...' : 'Apply Colors'}</span>
          </button>
        </div>
      </div>

      {/* Validation Details Dropdown */}
      {showValidationDetails && validationErrors.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-red-50">
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-800">Validation Issues:</div>
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Details */}
      {accessibilityAnalysis && !accessibilityAnalysis.overall.passesWCAG && (
        <div className="px-6 py-4 border-t border-gray-200 bg-yellow-50">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-800">Accessibility Concerns</div>
              <div className="text-xs text-yellow-700 mt-1">
                Some color combinations may not meet WCAG standards. Consider reviewing accessibility tab before applying.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Reset Color System</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-3">
                  This will reset all color customizations back to the original AI-generated color system. 
                  Your current changes will be lost.
                </p>
                
                {hasChanges && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm text-amber-800">
                      You have unsaved changes that will be lost: {getChangeSummary()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset Colors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Success Feedback */}
      {!canApply && !isLoading && hasChanges && validationErrors.length === 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-green-50">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">Colors look good! Ready to apply changes.</span>
          </div>
        </div>
      )}

      {/* No Changes State */}
      {!hasChanges && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 text-center">
            Make changes above to preview and apply new colors
          </div>
        </div>
      )}
    </>
  );
}