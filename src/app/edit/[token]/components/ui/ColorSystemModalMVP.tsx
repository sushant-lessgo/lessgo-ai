// ColorSystemModalMVP.tsx - Simplified MVP Color System Interface
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { BaseModal } from '../modals/BaseModal';
import { ColorPresets } from './ColorPresets';
import { ColorValidation } from './ColorValidation';
import { validateWCAGContrast } from '@/utils/improvedTextColors';
import type { ThemeColors } from '@/types/storeTypes';

import { logger } from '@/lib/logger';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface ColorSystemModalMVPProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
}

export interface ColorOption {
  name: string;
  value: string;
  tailwindClass: string;
  hex: string;
}

export interface ValidationStatus {
  score: number; // 0-100
  level: 'perfect' | 'great' | 'good' | 'poor';
  message: string;
  contrastRatio: number;
}

export function ColorSystemModalMVP({ isOpen, onClose, tokenId }: ColorSystemModalMVPProps) {
  const { theme, updateTheme, getColorTokens, meta } = useEditStore();

  // Debug: Verify what updateTheme actually is
  React.useEffect(() => {
    console.log('🔍 ColorSystemModalMVP updateTheme check:', {
      updateThemeType: typeof updateTheme,
      updateThemeDefined: !!updateTheme,
      updateThemeName: updateTheme?.name,
      themeUiBlock: theme?.uiBlockTheme
    });
  }, [updateTheme, theme?.uiBlockTheme]);

  const [activeTab, setActiveTab] = useState<'accent'>('accent');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [previewColor, setPreviewColor] = useState<ColorOption | null>(null);
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(null);
      setPreviewColor(null);
    }
  }, [isOpen]);

  // Get current colors
  const currentColorTokens = useMemo(() => {
    try {
      const tokens = getColorTokens();
      return tokens;
    } catch (error) {
      logger.error('Error getting color tokens:', error);
      return null;
    }
  }, [getColorTokens]);

  const currentAccentColor = theme?.colors?.accentColor || 'purple';
  const currentAccentCSS = theme?.colors?.accentCSS || 'bg-purple-600';

  // Get primary background for validation (only check against main background)
  const primaryBackground = useMemo(() => {
    const primary = theme?.colors?.sectionBackgrounds?.primary || 'bg-white';
    return primary;
  }, [theme?.colors?.sectionBackgrounds?.primary]);

  // Get auto-detected theme from taxonomy data
  const autoDetectedTheme = useMemo(() => {
    const validatedFields = meta?.validatedFields;
    if (!validatedFields) return null;

    return selectUIBlockTheme({
      marketCategory: validatedFields.marketCategory,
      targetAudience: validatedFields.targetAudience,
      landingPageGoals: validatedFields.landingPageGoals,
      startupStage: validatedFields.startupStage,
      toneProfile: validatedFields.toneProfile,
      awarenessLevel: validatedFields.awarenessLevel,
      pricingModel: validatedFields.pricingModel,
    });
  }, [meta?.validatedFields]);

  // Current theme (manual override or auto-detected)
  const currentTheme = theme?.uiBlockTheme || autoDetectedTheme || 'neutral';

  // Fix the hex color extraction from CSS class if needed
  const getHexFromTailwind = (tailwindClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-purple-600': '#9333ea',
      'bg-blue-600': '#2563eb',
      'bg-green-600': '#16a34a',
      'bg-red-600': '#dc2626',
      'bg-orange-600': '#ea580c',
      'bg-pink-600': '#db2777',
      'bg-indigo-600': '#4f46e5',
      'bg-teal-600': '#0d9488',
      'bg-gray-600': '#4b5563',
      'bg-slate-600': '#475569',
      'bg-zinc-600': '#52525b',
      'bg-neutral-600': '#525252',
      'bg-stone-600': '#57534e',
    };
    return colorMap[tailwindClass] || '#8b5cf6';
  };

  // Get the most up-to-date current color (prioritize theme over color tokens for immediate updates)
  const getCurrentColor = useMemo(() => {
    // Always check theme first since it's updated immediately when we apply changes
    if (theme?.colors?.accentCSS && theme?.colors?.accentColor) {
      //   accentColor: theme.colors.accentColor,
      //   accentCSS: theme.colors.accentCSS
      // });
      
      return {
        name: theme.colors.accentColor.charAt(0).toUpperCase() + theme.colors.accentColor.slice(1),
        value: theme.colors.accentColor,
        tailwindClass: theme.colors.accentCSS,
        hex: getHexFromTailwind(theme.colors.accentCSS)
      };
    }
    
    // Fallback to color tokens if theme doesn't have the values
    if (currentColorTokens) {
      const actualAccentCSS = currentColorTokens.ctaBg || currentColorTokens.accent;
      logger.debug('🎨 Fallback to color tokens:', actualAccentCSS);
      
      const colorMatch = actualAccentCSS.match(/bg-(\w+)-\d+/);
      const actualColorName = colorMatch ? colorMatch[1] : 'gray';
      
      return {
        name: actualColorName.charAt(0).toUpperCase() + actualColorName.slice(1),
        value: actualColorName,
        tailwindClass: actualAccentCSS,
        hex: getHexFromTailwind(actualAccentCSS)
      };
    }
    
    return null;
  }, [theme?.colors?.accentCSS, theme?.colors?.accentColor, currentColorTokens]);

  // Color to display (preview or selected or current)
  const displayColor = previewColor || selectedColor || getCurrentColor || {
    name: 'Gray',
    value: 'gray',
    tailwindClass: 'bg-gray-600',
    hex: '#4b5563'
  };

  // Debug logging after all values are defined
  //   accentColor: currentAccentColor,
  //   accentCSS: currentAccentCSS,
  //   themeColors: theme?.colors,
  //   hasThemeAccent: !!theme?.colors?.accentCSS,
  //   getCurrentColorResult: getCurrentColor,
  //   displayColor
  // });

  // Ensure displayColor has correct hex value
  if (displayColor && !displayColor.hex.startsWith('#')) {
    displayColor.hex = getHexFromTailwind(displayColor.tailwindClass);
  }

  // Calculate how well the CTA color stands out
  const calculateStandoutScore = (contrastRatio: number): { score: number; level: 'perfect' | 'great' | 'good' | 'poor'; message: string } => {
    // Higher contrast = better stand out
    // Normalize contrast ratio to 0-100 score
    // Perfect contrast is 21:1, good minimum is ~4.5:1
    
    let score: number;
    let level: 'perfect' | 'great' | 'good' | 'poor';
    let message: string;
    
    if (contrastRatio >= 15) {
      score = 95 + (contrastRatio - 15) * 0.5; // 95-100
      level = 'perfect';
      message = 'Your CTAs will really pop! ✨';
    } else if (contrastRatio >= 7) {
      score = 70 + ((contrastRatio - 7) / 8) * 25; // 70-95
      level = 'great';
      message = 'CTAs will stand out nicely ✅';
    } else if (contrastRatio >= 4.5) {
      score = 50 + ((contrastRatio - 4.5) / 2.5) * 20; // 50-70
      level = 'good';
      message = 'CTAs are noticeable 👍';
    } else {
      score = Math.max(0, (contrastRatio / 4.5) * 50); // 0-50
      level = 'poor';
      message = 'CTAs might blend in ⚠️';
    }
    
    return { score: Math.min(100, Math.round(score)), level, message };
  };

  // Validate color against primary background only
  useEffect(() => {
    if (!displayColor || !primaryBackground) {
      setValidation(null);
      return;
    }

    const validateColor = async () => {
      setIsValidating(true);
      try {
        logger.debug('🔍 Validating CTA stand-out:', {
          ctaColor: displayColor.tailwindClass,
          background: primaryBackground
        });
        
        const { ratio, meetsAA, meetsAAA } = validateWCAGContrast(
          displayColor.tailwindClass,
          primaryBackground,
          'AA'
        );
        
        const { score, level, message } = calculateStandoutScore(ratio);
        
        logger.debug('✅ Stand-out result:', {
          ratio,
          score,
          level,
          message
        });
        
        setValidation({ 
          score, 
          level, 
          message,
          contrastRatio: ratio 
        });
      } catch (error) {
        logger.error('Validation failed:', error);
        setValidation(null);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateColor, 300);
    return () => clearTimeout(timeoutId);
  }, [displayColor, primaryBackground]);

  // Handle apply
  const handleApply = () => {
    if (!selectedColor) return;

    logger.debug('🎨 [EDIT-DEBUG] Color update initiated:', {
      selectedColor: {
        name: selectedColor.name,
        value: selectedColor.value,
        tailwindClass: selectedColor.tailwindClass,
        hex: selectedColor.hex
      },
      currentTheme: {
        baseColor: theme?.colors?.baseColor,
        accentColor: theme?.colors?.accentColor,
        accentCSS: theme?.colors?.accentCSS,
        sectionBackgrounds: theme?.colors?.sectionBackgrounds
      },
      typography: {
        headingFont: theme?.typography?.headingFont,
        bodyFont: theme?.typography?.bodyFont
      }
    });

    // Update the theme colors (updateTheme handles the merge)
    const updatedColors = {
      ...theme?.colors,
      accentColor: selectedColor.value,
      accentCSS: selectedColor.tailwindClass,
    };

    logger.debug('🎨 [EDIT-DEBUG] Applying accent color update:', {
      selectedColor,
      updatedColors: updatedColors,
      beforeUpdate: theme?.colors,
      backgroundsPreserved: {
        primary: updatedColors.sectionBackgrounds?.primary,
        secondary: updatedColors.sectionBackgrounds?.secondary,
        neutral: updatedColors.sectionBackgrounds?.neutral,
        divider: updatedColors.sectionBackgrounds?.divider
      }
    });

    updateTheme({
      colors: updatedColors
    });
    
    // Log color tokens after update
    setTimeout(() => {
      try {
        const colorTokens = getColorTokens();
        logger.debug('🎨 [EDIT-DEBUG] Color tokens after accent update:', colorTokens);
      } catch (error) {
        logger.warn('🎨 [EDIT-DEBUG] Failed to get updated color tokens:', error);
      }
    }, 100);
    
    // Clear selection so the modal shows the updated current color
    setTimeout(() => {
      setSelectedColor(null);
      setPreviewColor(null);
    }, 100);

    // Show success message
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50';
    message.textContent = 'Color system updated successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);

    // Don't close modal automatically - let user see the updated current color
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedColor(null);
    setPreviewColor(null);
    onClose();
  };

  // Handle theme selection
  const handleThemeSelect = (newTheme: 'warm' | 'cool' | 'neutral') => {
    console.log('🔧 handleThemeSelect called:', { newTheme, currentTheme: theme?.uiBlockTheme });

    updateTheme({
      uiBlockTheme: newTheme
    });

    console.log('✅ updateTheme called with:', { uiBlockTheme: newTheme });

    // Show success message
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50';
    message.textContent = `Theme updated to ${newTheme}!`;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  // Handle reset to auto
  const handleResetTheme = () => {
    console.log('🔧 handleResetTheme called, clearing manual override');

    updateTheme({
      uiBlockTheme: undefined
    });

    // Show success message
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-lg z-50';
    message.textContent = `Theme reset to auto (${autoDetectedTheme})`;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Color System"
      size="large"
    >
      <div className="space-y-6">

        {/* Accent Colors */}
        <>
            {/* Current Color Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {selectedColor ? 'Selected' : 'Current'} Accent Color
              </h3>
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-lg ${displayColor.tailwindClass} shadow-sm`} />
                <div>
                  <p className="font-medium text-gray-900">{displayColor.name}</p>
                  <p className="text-sm text-gray-500">{displayColor.tailwindClass}</p>
                  <p className="text-xs text-gray-400">{displayColor.hex}</p>
                </div>
                {selectedColor && (
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

        {/* Color Selection */}
        <div>
          <ColorPresets
            currentColor={getCurrentColor?.value || currentAccentColor}
            backgroundColor={primaryBackground}
            onSelect={setSelectedColor}
            onPreview={setPreviewColor}
            onPreviewEnd={() => setPreviewColor(null)}
          />
        </div>

        {/* Live Preview */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
          <div className="space-y-4">
            {/* Show current vs new if there's a selection */}
            {selectedColor && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Current</div>
                  <button className={`px-4 py-2 ${getCurrentColor?.tailwindClass} text-white font-medium rounded-lg text-sm w-full`}>
                    Get Started
                  </button>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">New</div>
                  <button className={`px-4 py-2 ${selectedColor.tailwindClass} text-white font-medium rounded-lg text-sm w-full`}>
                    Get Started
                  </button>
                </div>
              </div>
            )}
            
            {/* CTA Button Preview */}
            <div className="flex items-center space-x-4">
              <button className={`px-6 py-2.5 ${displayColor.tailwindClass} text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                Get Started
              </button>
              <span className="text-sm text-gray-500">Primary CTA</span>
            </div>
            
            {/* Link Preview */}
            <div className="flex items-center space-x-4">
              <a href="#" className={`${displayColor.tailwindClass.replace('bg-', 'text-').replace('-600', '-600')} hover:underline font-medium`}>
                Learn more about our features
              </a>
              <span className="text-sm text-gray-500">Link Text</span>
            </div>
            
            {/* Badge Preview */}
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${displayColor.tailwindClass.replace('-600', '-100')} ${displayColor.tailwindClass.replace('bg-', 'text-').replace('-600', '-800')}`}>
                New Feature
              </span>
              <span className="text-sm text-gray-500">Accent Badge</span>
            </div>
          </div>
        </div>

            {/* Validation Status */}
            {validation && (
              <ColorValidation
                status={validation}
                isValidating={isValidating}
              />
            )}
          </>

        {/* UIBlock Theme Selector */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700">UIBlock Theme</h3>
              <p className="text-xs text-gray-500 mt-1">Visual polish for icons, shadows, and hover effects</p>
            </div>
            {theme?.uiBlockTheme && (
              <button
                onClick={handleResetTheme}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset to Auto
              </button>
            )}
          </div>

          {/* Theme Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Warm Theme */}
            <button
              onClick={() => handleThemeSelect('warm')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                currentTheme === 'warm'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-sm font-medium text-gray-900">Warm</div>
              <div className="text-xs text-gray-500 mt-1">Energetic, inviting</div>
              {currentTheme === 'warm' && !theme?.uiBlockTheme && autoDetectedTheme === 'warm' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Auto
                </div>
              )}
            </button>

            {/* Cool Theme */}
            <button
              onClick={() => handleThemeSelect('cool')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                currentTheme === 'cool'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">❄️</div>
              <div className="text-sm font-medium text-gray-900">Cool</div>
              <div className="text-xs text-gray-500 mt-1">Professional, calm</div>
              {currentTheme === 'cool' && !theme?.uiBlockTheme && autoDetectedTheme === 'cool' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Auto
                </div>
              )}
            </button>

            {/* Neutral Theme */}
            <button
              onClick={() => handleThemeSelect('neutral')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                currentTheme === 'neutral'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">⚖️</div>
              <div className="text-sm font-medium text-gray-900">Neutral</div>
              <div className="text-xs text-gray-500 mt-1">Balanced, subtle</div>
              {currentTheme === 'neutral' && !theme?.uiBlockTheme && autoDetectedTheme === 'neutral' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Auto
                </div>
              )}
            </button>
          </div>

          {/* Show what's auto-detected */}
          {autoDetectedTheme && !theme?.uiBlockTheme && (
            <div className="mt-3 text-xs text-gray-500">
              Auto-detected: <span className="font-medium">{autoDetectedTheme}</span> based on your market category
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedColor}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              !selectedColor
                ? 'bg-gray-400 cursor-not-allowed'
                : validation?.score && validation.score < 50
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {selectedColor ? (
              validation?.score && validation.score < 50 
                ? 'Apply Anyway (Low Visibility)' 
                : 'Apply Selected Color'
            ) : 'Apply Color System'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}