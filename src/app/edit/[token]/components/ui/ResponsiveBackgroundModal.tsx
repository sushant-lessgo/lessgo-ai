// /app/edit/[token]/components/ui/ResponsiveBackgroundModal.tsx - Mobile-Optimized Version
"use client";

import React, { useState, useEffect } from 'react';
import { useBackgroundSelector } from './useBackgroundSelector';
import { validateBackgroundSystem } from './backgroundValidation';
import { ModalActions } from './ModalActions';
import { ValidationWarnings } from './ValidationWarnings';
import type { BackgroundValidationResult } from '@/types/core';

interface ResponsiveBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
}

export function ResponsiveBackgroundModal({ isOpen, onClose, tokenId }: ResponsiveBackgroundModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'options' | 'validation'>('options');
  const [validationResult, setValidationResult] = useState<BackgroundValidationResult | null>(null);

  const {
    mode,
    brandColors,
    selectedBackground,
    previewBackground,
    compatibleOptions,
    isLoading,
    canApply,
    setMode,
    setBrandColors,
    setSelectedBackground,
    setPreviewBackground,
    handleApplyBackground,
    handleResetToGenerated,
    currentBackgroundSystem,
  } = useBackgroundSelector(tokenId);

  // Validate selection
  useEffect(() => {
    const backgroundToValidate = previewBackground || selectedBackground;
    if (!backgroundToValidate) {
      setValidationResult(null);
      return;
    }

    const result = validateBackgroundSystem(backgroundToValidate, brandColors, { mode });
    setValidationResult(result);
  }, [previewBackground, selectedBackground, brandColors, mode]);

  const handleCancel = () => {
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationResult(null);
    onClose();
  };

  const handleApply = async () => {
    const success = await handleApplyBackground();
    if (success) onClose();
  };

  const handleOptionSelect = (variation: any) => {
    const backgroundSystem = {
      primary: variation.tailwindClass,
      secondary: `bg-${variation.baseColor}-50`,
      neutral: 'bg-white',
      divider: `bg-${variation.baseColor}-100/50`,
      baseColor: variation.baseColor,
      accentColor: variation.baseColor,
      accentCSS: `bg-${variation.baseColor}-600`,
    };

    setPreviewBackground(backgroundSystem);
    setSelectedBackground(backgroundSystem);
  };

  if (!isOpen) return null;

  const hasErrors = validationResult?.errors && validationResult.errors.length > 0;
  const hasWarnings = validationResult?.warnings && validationResult.warnings.length > 0;

  return (
    <>
      {/* Desktop Version (hidden on mobile) */}
      <div className="hidden lg:block fixed inset-0 bg-black bg-opacity-50 z-50">
        {/* Use the full desktop modal here */}
      </div>

      {/* Mobile Version (visible on mobile) */}
      <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Background System</h2>
          <button 
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle - Mobile */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1">
            {(['generated', 'brand', 'custom'] as const).map((modeOption) => (
              <button
                key={modeOption}
                onClick={() => setMode(modeOption)}
                disabled={isLoading}
                className={`
                  flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${mode === modeOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation - Mobile */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('options')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'options'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Options
            {compatibleOptions.length > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {compatibleOptions.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('preview')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'preview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Preview
          </button>
          
          <button
            onClick={() => setActiveTab('validation')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative
              ${activeTab === 'validation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Quality
            {(hasErrors || hasWarnings) && (
              <div className={`
                absolute -top-1 -right-1 w-2 h-2 rounded-full
                ${hasErrors ? 'bg-red-500' : 'bg-yellow-500'}
              `}></div>
            )}
          </button>
        </div>

        {/* Content Area - Mobile */}
        <div className="flex-1 overflow-y-auto">
          {/* Options Tab */}
          {activeTab === 'options' && (
            <div className="p-4 space-y-4">
              {/* Brand Color Picker for Brand Mode */}
              {mode === 'brand' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Brand Color *
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandColors?.primary || '#3b82f6'}
                        onChange={(e) => setBrandColors({ 
                          ...brandColors, 
                          primary: e.target.value 
                        })}
                        className="w-12 h-10 rounded border border-gray-300"
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        value={brandColors?.primary || '#3b82f6'}
                        onChange={(e) => setBrandColors({ 
                          ...brandColors, 
                          primary: e.target.value 
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="#3b82f6"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Background Options Grid - Mobile Optimized */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  {mode === 'generated' && 'Generated Variations'}
                  {mode === 'brand' && `Compatible Backgrounds (${compatibleOptions.length})`}
                  {mode === 'custom' && 'All Background Styles'}
                </div>
                
                {compatibleOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {compatibleOptions.slice(0, 12).map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        className={`
                          p-3 border rounded-lg transition-all duration-200
                          ${previewBackground?.primary === option.tailwindClass
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        disabled={isLoading}
                      >
                        <div className={`w-full h-16 ${option.tailwindClass} rounded mb-2`}></div>
                        <div className="text-xs text-gray-600 truncate font-medium">
                          {option.variationLabel}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {option.baseColor}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">No compatible backgrounds found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Current Background</div>
                <div className={`h-24 rounded-lg ${currentBackgroundSystem.primary} flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">Current</span>
                </div>
              </div>

              {previewBackground && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
                  <div className={`h-24 rounded-lg ${previewBackground.primary} flex items-center justify-center`}>
                    <span className="text-white text-sm font-medium">Preview</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Section Impact</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Hero Section</span>
                    <div className={`w-6 h-6 rounded ${previewBackground?.primary || currentBackgroundSystem.primary}`}></div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Features</span>
                    <div className={`w-6 h-6 rounded ${previewBackground?.secondary || currentBackgroundSystem.secondary}`}></div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">CTA Section</span>
                    <div className={`w-6 h-6 rounded ${previewBackground?.primary || currentBackgroundSystem.primary}`}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="p-4">
              {validationResult ? (
                <ValidationWarnings validationResult={validationResult} />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Select a background to see quality analysis</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!canApply || isLoading}
              className={`
                flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${canApply && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? 'Applying...' : 'Apply Background'}
            </button>
          </div>
          
          {validationResult && (
            <div className="mt-2 text-xs text-center text-gray-600">
              Quality Score: {validationResult.score}% • 
              WCAG {validationResult.accessibility.wcagLevel}
            </div>
          )}
        </div>
      </div>
    </>
  );
}