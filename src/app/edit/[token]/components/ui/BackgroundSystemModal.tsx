// /app/edit/[token]/components/ui/BackgroundSystemModal.tsx - Complete Integration
"use client";

/*
Tailwind Safelist: These classes are used dynamically in bgVariations and need to be preserved:
bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-200 to-transparent blur-[160px]
bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-blue-200 to-transparent  
bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#b4d8ff] via-[#dceeff] to-white
bg-gradient-to-br from-blue-300 via-blue-100 to-white
bg-gradient-to-tr from-blue-500 via-blue-400 to-sky-300  
bg-gradient-to-tl from-sky-400 via-blue-500 to-indigo-400
bg-white bg-opacity-60 backdrop-blur-sm blur-[100px]
*/

import React, { useState, useEffect, useMemo } from 'react';
import { useBackgroundSelector } from './useBackgroundSelector';
import { validateBackgroundSystem } from './backgroundValidation';
import { ModeToggle } from './ModeToggle';
import { PreviewSection } from './PreviewSection';
import { CustomBackgroundPicker } from './CustomBackgroundPicker';
import { StyleGrid } from './StyleGrid';
import { ModalActions } from './ModalActions';
import { ValidationWarnings } from './ValidationWarnings';
import { BaseModal } from '../modals/BaseModal';
import type { BackgroundValidationResult } from '@/types/core';

interface BackgroundSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
}

export function BackgroundSystemModal({ isOpen, onClose, tokenId }: BackgroundSystemModalProps) {
  const [validationResult, setValidationResult] = useState<BackgroundValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  const {
    mode,
    selectedBackground,
    previewBackground,
    compatibleOptions,
    isLoading,
    validationErrors,
    currentBackgroundSystem,
    canApply,
    setMode,
    setCustomColors,
    setSelectedBackground,
    setPreviewBackground,
    handleApplyBackground,
    handleResetToGenerated,
  } = useBackgroundSelector(tokenId);

  // Validate background when selection changes
  useEffect(() => {
    const backgroundToValidate = previewBackground || selectedBackground;
    if (!backgroundToValidate) {
      setValidationResult(null);
      return;
    }

    const validateAsync = async () => {
      setIsValidating(true);
      try {
        const result = validateBackgroundSystem(
          backgroundToValidate,
          null, // No brand colors needed anymore
          {
            mode,
            performanceRequirements: 'medium',
          }
        );
        setValidationResult(result);
      } catch (error) {
        console.error('Validation failed:', error);
        setValidationResult(null);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateAsync, 300);
    return () => clearTimeout(timeoutId);
  }, [previewBackground, selectedBackground, mode]);

  // Handle modal close with cleanup
  const handleCancel = () => {
    console.log('BackgroundSystemModal: handleCancel called');
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationResult(null);
    setSelectedVariation(null);
    onClose();
  };

  // Enhanced apply handler with validation check
  const handleApply = async () => {
    if (validationResult?.errors && validationResult.errors.length > 0) {
      const confirmApply = window.confirm(
        `This background has ${validationResult.errors.length} validation issue(s). Apply anyway?\n\n` +
        validationResult.errors.map(e => `• ${e.message}`).join('\n')
      );
      
      if (!confirmApply) return;
    }

    const success = await handleApplyBackground();
    if (success) {
      onClose();
    }
  };

  // Enhanced reset handler
  const handleReset = async () => {
    await handleResetToGenerated();
    setValidationResult(null);
  };

  // Handle background option selection
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

    setSelectedVariation(variation);
    setPreviewBackground(backgroundSystem);
    setSelectedBackground(backgroundSystem);
  };

  // Handle background option hover for preview
  const handleOptionHover = (variation: any | null) => {
    if (variation) {
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
    } else {
      setPreviewBackground(selectedBackground);
    }
  };

  // Memoized validation state
  const validationState = useMemo(() => {
    if (!validationResult) return { hasSelection: false, hasErrors: false, hasWarnings: false };
    
    return {
      hasSelection: !!(selectedBackground || previewBackground),
      hasErrors: validationResult.errors.length > 0,
      hasWarnings: validationResult.warnings.length > 0,
      score: validationResult.score,
    };
  }, [validationResult, selectedBackground, previewBackground]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title=""
      size="full"
      className="!max-w-5xl"
      showCloseButton={false}
    >
      <div className="flex flex-col min-h-[80vh] max-h-[90vh] -m-6">
        {/* Custom Header with Mode Toggle */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Background System</h2>
            <ModeToggle 
              mode={mode} 
              onModeChange={setMode}
              disabled={isLoading}
            />
            
            {/* Quality Indicator */}
            {validationState.hasSelection && validationResult && (
              <div className="flex items-center space-x-2">
                <div className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${validationResult.score >= 80
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : validationResult.score >= 60
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }
                `}>
                  Quality: {validationResult.score}%
                </div>
                
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
          
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel - Preview */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <PreviewSection
              currentBackground={currentBackgroundSystem}
              previewBackground={previewBackground}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="w-1/2 flex flex-col min-h-0 overflow-hidden">
            {/* Controls Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {mode === 'recommended' && 'Recommended Backgrounds'}
                {mode === 'custom' && 'Custom Color Scheme'}
              </h3>
              
              <p className="text-sm text-gray-600">
                {mode === 'recommended' && 
                  'Smart backgrounds chosen for your content. Explore different styles while maintaining design coherence.'
                }
                {mode === 'custom' && 
                  'Pick your primary color and we\'ll calculate complementary colors. Override any color as needed.'
                }
              </p>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Custom Background Picker for Custom Mode */}
              {mode === 'custom' && (
                <CustomBackgroundPicker
                  colors={null} // TODO: Connect to actual custom colors state
                  onColorsChange={setCustomColors}
                  onBackgroundChange={(bg) => {
                    // Handle background system change
                    setPreviewBackground(bg);
                    setSelectedBackground(bg);
                  }}
                  disabled={isLoading}
                />
              )}


              {/* Style Grid - Only show for recommended mode */}
              {mode === 'recommended' && (
                <StyleGrid
                  variations={compatibleOptions}
                  selectedVariation={selectedVariation}
                  onVariationSelect={handleOptionSelect}
                  onVariationHover={handleOptionHover}
                  isLoading={isLoading}
                  mode={mode}
                />
              )}

              {/* Validation Warnings */}
              <ValidationWarnings 
                validationResult={validationResult}
                className="mt-4"
              />

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm">Finding compatible backgrounds...</span>
                  </div>
                </div>
              )}

              {/* No Results Message (for any mode) */}
              {!isLoading && compatibleOptions.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.7-2.7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">No Background Options</p>
                  <p className="text-xs text-gray-600">
                    Unable to load background options. Please try refreshing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <ModalActions
            onCancel={handleCancel}
            onApply={handleApply}
            onReset={handleReset}
            canApply={!!canApply}
            isLoading={isLoading}
            validationResult={validationResult || undefined}
            hasSelection={validationState.hasSelection}
          />
        </div>
      </div>
    </BaseModal>
  );
}