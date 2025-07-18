// /app/edit/[token]/components/ui/BackgroundSystemModal.tsx - Complete Integration
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useBackgroundSelector } from './useBackgroundSelector';
import { validateBackgroundSystem } from './backgroundValidation';
import { ModeToggle } from './ModeToggle';
import { PreviewSection } from './PreviewSection';
import { BrandColorPicker } from './BrandColorPicker';
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

  const {
    mode,
    brandColors,
    selectedBackground,
    previewBackground,
    compatibleOptions,
    isLoading,
    validationErrors,
    currentBackgroundSystem,
    canApply,
    setMode,
    setBrandColors,
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
          brandColors,
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
  }, [previewBackground, selectedBackground, brandColors, mode]);

  // Handle modal close with cleanup
  const handleCancel = () => {
    console.log('BackgroundSystemModal: handleCancel called');
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationResult(null);
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
      className="!max-w-5xl !h-[700px]"
      showCloseButton={false}
    >
      <div className="flex flex-col h-full -m-6">
        {/* Custom Header with Mode Toggle */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Preview */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <PreviewSection
              currentBackground={currentBackgroundSystem}
              previewBackground={previewBackground}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="w-1/2 flex flex-col min-h-0">
            {/* Controls Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {mode === 'generated' && 'Generated Options'}
                {mode === 'brand' && 'Brand Color Matching'}
                {mode === 'custom' && 'Custom Background Selection'}
              </h3>
              
              <p className="text-sm text-gray-600">
                {mode === 'generated' && 
                  'LessGo\'s AI has selected the perfect background. Explore different intensity levels while maintaining design coherence.'
                }
                {mode === 'brand' && 
                  'Enter your brand colors and we\'ll find compatible background options that maintain your brand identity.'
                }
                {mode === 'custom' && 
                  'Choose from all available background archetypes. Advanced users can select any background style.'
                }
              </p>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Brand Color Picker for Brand Mode */}
              {mode === 'brand' && (
                <BrandColorPicker
                  brandColors={brandColors}
                  onColorsChange={setBrandColors}
                  disabled={isLoading}
                />
              )}

              {/* Custom Mode Warning */}
              {mode === 'custom' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-amber-800">Override Design System</div>
                      <div className="text-xs text-amber-700 mt-1">
                        This will override LessGo's intelligent background selection and may impact design coherence.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Style Grid - TODO: Fix props */}
              <div className="text-center text-gray-500 py-8">
                Style Grid component needs to be fixed
              </div>

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

              {/* No Results Message */}
              {!isLoading && mode === 'brand' && brandColors?.primary && compatibleOptions.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Limited Compatible Options</p>
                  <p className="text-xs text-gray-600">
                    Your brand color may have limited background options. Consider custom mode for more choices.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
    </BaseModal>
  );
}