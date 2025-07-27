// components/ui/SectionBackgroundModal.tsx - Enhanced section background customization modal
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { SolidColorPicker } from './ColorPicker/SolidColorPicker';
import { GradientPicker } from './ColorPicker/GradientPicker';
import { validateBackgroundAccessibility } from '@/utils/contrastValidator';
import { getSectionBackgroundType } from '@/modules/Design/background/backgroundIntegration';
import { 
  BackgroundType, 
  SectionBackground, 
  CustomBackground,
  BackgroundPickerMode,
  BackgroundPickerState,
  BackgroundValidation,
  ThemeColorType
} from '@/types/core';

interface SectionBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
}

export function SectionBackgroundModal({ isOpen, onClose, sectionId }: SectionBackgroundModalProps) {
  console.log('🎯 SectionBackgroundModal render:', { isOpen, sectionId });
  
  const { content, setBackgroundType, setSectionBackground, theme, sections, onboardingData } = useEditStore();
  
  // Get current section data
  const section = content[sectionId];
  
  // Calculate what the background SHOULD be based on current rules
  const calculatedBackgroundType = getSectionBackgroundType(sectionId, sections, undefined, onboardingData);
  
  // Get current stored background type (might be manually changed by user)
  const storedBackgroundType = section?.backgroundType;
  
  // Use stored type if available (user may have customized), otherwise use calculated
  const currentThemeColor = (storedBackgroundType as ThemeColorType) || calculatedBackgroundType;
  
  console.log('🎯 Background comparison:', {
    sectionId,
    calculatedBackgroundType,
    storedBackgroundType,
    currentThemeColor,
    hasOnboardingData: !!onboardingData,
    sectionsCount: sections?.length
  });
  
  // Create background object for modal state
  const currentBackground: SectionBackground = { 
    type: 'theme' as BackgroundType, 
    themeColor: currentThemeColor
  };
  
  // Local state for background editing
  const [pickerMode, setPickerMode] = useState<BackgroundPickerMode>('solid');
  const [localBackground, setLocalBackground] = useState<SectionBackground>(currentBackground);
  
  console.log('🎯 Modal initialized with:', { 
    sectionId,
    finalThemeColor: currentThemeColor,
    localBackground,
    themeColors: theme?.colors?.sectionBackgrounds
  });
  const [validation, setValidation] = useState<BackgroundValidation | null>(null);
  
  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen && section) {
      // Use the current background based on backgroundType
      const initBackground: SectionBackground = {
        type: 'theme',
        themeColor: (section.backgroundType as ThemeColorType) || 'neutral'
      };
      setLocalBackground(initBackground);
      
      if (section.sectionBackground?.type === 'custom' && section.sectionBackground.custom?.gradient) {
        setPickerMode('gradient');
      } else {
        setPickerMode('solid');
      }
    }
  }, [isOpen, section]);
  
  // Validate background contrast
  useEffect(() => {
    if (localBackground.type === 'custom' && localBackground.custom && theme?.colors?.text) {
      const validationResult = validateBackgroundAccessibility(
        localBackground.custom,
        theme.colors.text.primary || '#000000',
        theme.colors.text.secondary || '#666666'
      );
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  }, [localBackground, theme]);
  
  // Handle background type change
  const handleBackgroundTypeChange = useCallback((type: BackgroundType) => {
    if (type === 'theme') {
      setLocalBackground({ 
        type: 'theme',
        themeColor: 'primary' // Default to primary theme color
      });
    } else if (type === 'custom') {
      // Initialize with a default custom background
      setLocalBackground({
        type: 'custom',
        custom: pickerMode === 'gradient' 
          ? {
              gradient: {
                type: 'linear',
                angle: 90,
                stops: [
                  { color: '#ffffff', position: 0 },
                  { color: '#f0f0f0', position: 100 }
                ]
              }
            }
          : {
              solid: '#ffffff'
            }
      });
    }
  }, [pickerMode]);

  // Handle theme color selection
  const handleThemeColorChange = useCallback((themeColor: ThemeColorType) => {
    console.log('🎨 Theme color changed to:', themeColor);
    setLocalBackground(prev => ({
      ...prev,
      themeColor
    }));
  }, []);
  
  // Handle color/gradient changes
  const handleBackgroundChange = useCallback((custom: CustomBackground) => {
    setLocalBackground({
      type: 'custom',
      custom
    });
  }, []);
  
  // Apply changes
  const handleApply = useCallback(() => {
    console.log('🔥 Apply clicked!', { 
      sectionId, 
      localBackground,
      newBackgroundType: localBackground.themeColor,
      setBackgroundType: !!setBackgroundType,
      setSectionBackground: !!setSectionBackground 
    });
    
    if (localBackground.type === 'theme' && localBackground.themeColor) {
      // For theme backgrounds, update the backgroundType field (this is what controls visual rendering)
      if (setBackgroundType) {
        setBackgroundType(sectionId, localBackground.themeColor as any);
        console.log('✅ setBackgroundType called with:', localBackground.themeColor);
      } else {
        console.error('❌ setBackgroundType function not available');
      }
    }
    
    // Also save to the new sectionBackground format for future compatibility
    if (setSectionBackground) {
      setSectionBackground(sectionId, localBackground);
      console.log('✅ setSectionBackground called for future compatibility');
    }
    
    onClose();
  }, [sectionId, localBackground, setBackgroundType, setSectionBackground, onClose]);
  
  // Reset to theme
  const handleResetToTheme = useCallback(() => {
    setLocalBackground({ type: 'theme', themeColor: 'primary' });
  }, []);
  
  
  if (!isOpen) {
    console.log('🎯 Modal not open, returning null');
    return null;
  }
  
  console.log('🎯 Modal is open, rendering content');
  
  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Section Background Settings
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Customize the background for the {sectionId} section
            </p>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Background Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Type
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleBackgroundTypeChange('theme')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    localBackground.type === 'theme'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Use Theme
                </button>
                <button
                  onClick={() => handleBackgroundTypeChange('custom')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    localBackground.type === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
            
            {/* Theme Color Palette */}
            {localBackground.type === 'theme' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Theme Color
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { 
                      key: 'primary', 
                      label: 'Primary', 
                      cssClass: theme?.colors?.sectionBackgrounds?.primary || 'bg-gradient-to-br from-blue-500 to-blue-600',
                      fallbackColor: '#3b82f6'
                    },
                    { 
                      key: 'secondary', 
                      label: 'Secondary', 
                      cssClass: theme?.colors?.sectionBackgrounds?.secondary || 'bg-blue-50',
                      fallbackColor: '#eff6ff'
                    },
                    { 
                      key: 'neutral', 
                      label: 'Neutral', 
                      cssClass: theme?.colors?.sectionBackgrounds?.neutral || 'bg-white',
                      fallbackColor: '#ffffff'
                    },
                    { 
                      key: 'divider', 
                      label: 'Divider', 
                      cssClass: theme?.colors?.sectionBackgrounds?.divider || 'bg-gray-100/50',
                      fallbackColor: '#f3f4f6'
                    }
                  ].map((themeOption) => {
                    const isSelected = localBackground.themeColor === themeOption.key;
                    console.log('🎨 Theme option:', themeOption.key, 'isSelected:', isSelected, 'localBackground.themeColor:', localBackground.themeColor);
                    return (
                    <button
                      key={themeOption.key}
                      onClick={() => handleThemeColorChange(themeOption.key as ThemeColorType)}
                      className={`flex items-center p-3 rounded-md border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div 
                        className={`w-8 h-8 rounded-md border border-gray-300 mr-3 flex-shrink-0 ${themeOption.cssClass}`}
                      />
                      <div className="text-left">
                        <div className="font-medium text-sm text-gray-900">
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {themeOption.cssClass}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Custom Background Options */}
            {localBackground.type === 'custom' && (
              <>
                {/* Picker Mode Tabs */}
                <div className="mb-4">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setPickerMode('solid')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          pickerMode === 'solid'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Solid Color
                      </button>
                      <button
                        onClick={() => setPickerMode('gradient')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          pickerMode === 'gradient'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Gradient
                      </button>
                    </nav>
                  </div>
                </div>
                
                {/* Color Pickers */}
                <div className="mb-6">
                  {pickerMode === 'solid' ? (
                    <SolidColorPicker
                      color={localBackground.custom?.solid || '#ffffff'}
                      onChange={(color) => handleBackgroundChange({ solid: color })}
                    />
                  ) : (
                    <GradientPicker
                      gradient={localBackground.custom?.gradient || {
                        type: 'linear',
                        angle: 90,
                        stops: [
                          { color: '#ffffff', position: 0 },
                          { color: '#f0f0f0', position: 100 }
                        ]
                      }}
                      onChange={(gradient) => handleBackgroundChange({ gradient })}
                    />
                  )}
                </div>
                
                {/* Accessibility Validation */}
                {validation && (
                  <div className={`p-4 rounded-md mb-4 ${
                    validation.wcagAA ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <h4 className="text-sm font-medium mb-2 text-gray-900">
                      Accessibility Check
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li className={validation.wcagAA ? 'text-green-700' : 'text-yellow-700'}>
                        WCAG AA: {validation.wcagAA ? '✓ Pass' : '⚠ Needs improvement'}
                      </li>
                      <li className="text-gray-600">
                        Primary text contrast: {validation.primaryTextContrast.toFixed(2)}:1
                      </li>
                      <li className="text-gray-600">
                        Secondary text contrast: {validation.secondaryTextContrast.toFixed(2)}:1
                      </li>
                    </ul>
                    {validation.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {validation.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div 
                className={`h-32 rounded-md border border-gray-300 ${
                  localBackground.type === 'theme' 
                    ? (() => {
                        const themeColor = localBackground.themeColor || 'primary';
                        return theme?.colors?.sectionBackgrounds?.[themeColor] || 'bg-white';
                      })()
                    : 'bg-white'
                }`}
                style={{
                  background: localBackground.type === 'custom'
                    ? localBackground.custom?.solid 
                      ? localBackground.custom.solid
                      : localBackground.custom?.gradient
                      ? `linear-gradient(${localBackground.custom.gradient.angle}deg, ${
                          localBackground.custom.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')
                        })`
                      : undefined
                    : undefined
                }}
              >
                <div className="p-4">
                  <p className="text-sm" style={{ color: theme?.colors?.text?.primary || '#000000' }}>
                    Primary text example
                  </p>
                  <p className="text-xs mt-2" style={{ color: theme?.colors?.text?.secondary || '#666666' }}>
                    Secondary text example
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
            <button
              onClick={handleResetToTheme}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={localBackground.type === 'theme'}
            >
              Reset to Theme
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Use portal to render modal at document root
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}