// Variable Background Modal - Enhanced background selector with CSS variable support
// Supports legacy, hybrid, and variable modes with smooth transitions

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBackgroundSelector } from './useBackgroundSelector';
import { validateBackgroundSystem } from './backgroundValidation';
import { ModeToggle } from './ModeToggle';
// import { VariablePreview } from './VariablePreviewComponents'; // Temporarily disabled
import { CustomBackgroundPicker } from './CustomBackgroundPicker';
import { StyleGrid } from './StyleGrid';
import { ModalActions } from './ModalActions';
import { ValidationWarnings } from './ValidationWarnings';
import { BaseModal } from '../modals/BaseModal';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
// import { VariableBackgroundRenderer, VariableBackgroundVariation } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer'; // Disabled
// import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter'; // Disabled until CSS variable system is ready
// Using simple buttons instead of tabs for now
import { Badge } from '@/components/ui/badge';
import { Info, Sparkles, Palette, Code } from 'lucide-react';
import type { BackgroundValidationResult, BackgroundSelectorMode } from '@/types/core';
import type { VariableBackgroundVariation as VarBgVariation } from '@/modules/Design/ColorSystem/migrationAdapter';

import { logger } from '@/lib/logger';
interface VariableBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  enableVariableMode?: boolean;
}

interface CustomColorState {
  primaryFrom?: string;
  primaryTo?: string;
  primaryVia?: string;
  accentPrimary?: string;
  textPrimary?: string;
  blurAmount?: string;
}

export function VariableBackgroundModal({ 
  isOpen, 
  onClose, 
  tokenId,
  enableVariableMode = true 
}: VariableBackgroundModalProps) {
  const [validationResult, setValidationResult] = useState<BackgroundValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [customColors, setCustomColorsState] = useState<CustomColorState>({});
  const [showVariableCode, setShowVariableCode] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Get variable theme context
  const { phase, isVariableMode, isHybridMode, flags } = useVariableTheme(tokenId);
  
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

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      // Find the currently applied background variation from compatibleOptions
      const currentVariation = compatibleOptions.find(option => {
        if ('tailwindClass' in option) {
          return option.tailwindClass === currentBackgroundSystem?.primary;
        }
        return false;
      });
      
      if (currentVariation) {
        setSelectedVariation(currentVariation);
        setSelectedBackground(currentBackgroundSystem);
      }
      
      setHasInitialized(true);
    }
    
    // Reset initialization flag when modal closes
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, compatibleOptions, currentBackgroundSystem, setSelectedBackground]);

  // Enhanced mode options based on migration phase
  const availableModes = useMemo(() => {
    const modes: Array<{ value: BackgroundSelectorMode; label: string; description: string; icon: React.ReactNode }> = [
      {
        value: 'recommended',
        label: 'AI Generated',
        description: 'Smart backgrounds based on your business',
        icon: <Sparkles className="w-4 h-4" />
      }
    ];
    
    //   phase,
    //   isVariableMode,
    //   isHybridMode,
    //   enableCustomColorPicker: flags.enableCustomColorPicker,
    //   allFlags: flags
    // });
    
    // Note: Variable mode will be handled as part of recommended mode for now
    // since BackgroundSelectorMode type doesn't include 'variable'
    
    if (flags.enableCustomColorPicker) {
      modes.push({
        value: 'custom',
        label: 'Custom Colors',
        description: 'Create your own color palette',
        icon: <Palette className="w-4 h-4" />
      });
    } else {
    }
    
    return modes;
  }, [phase, isVariableMode, isHybridMode, flags]);

  // Convert compatible options to variable format if in variable mode
  const processedOptions = useMemo(() => {
    // For now, disable variable conversion until CSS variable system is fully implemented
    // Always return the original compatible options without conversion
    return compatibleOptions;
    
    // TODO: Re-enable this when CSS variable system is ready
    /*
    if (!isVariableMode && !isHybridMode) {
      return compatibleOptions;
    }
    
    // Convert legacy variations to variable format
    return compatibleOptions.map(option => {
      try {
        const converted = migrationAdapter.convertLegacyVariation(option as any);
        return converted;
      } catch {
        return option;
      }
    });
    */
  }, [compatibleOptions]);

  // Handle custom color changes
  const handleCustomColorChange = useCallback((colors: CustomColorState) => {
    setCustomColorsState(colors);
    
    // Convert to CSS variables format
    const cssVariables: Record<string, string> = {};
    
    if (colors.primaryFrom) cssVariables['--gradient-from'] = colors.primaryFrom;
    if (colors.primaryTo) cssVariables['--gradient-to'] = colors.primaryTo;
    if (colors.primaryVia) cssVariables['--gradient-via'] = colors.primaryVia;
    if (colors.accentPrimary) cssVariables['--accent-primary'] = colors.accentPrimary;
    if (colors.textPrimary) cssVariables['--text-primary'] = colors.textPrimary;
    if (colors.blurAmount) cssVariables['--blur-custom'] = colors.blurAmount;
    
    setCustomColors(cssVariables);
  }, [setCustomColors]);

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
          null,
          {
            mode,
            performanceRequirements: 'medium',
          }
        );
        setValidationResult(result);
      } catch (error) {
        logger.error('Validation failed:', error);
        setValidationResult(null);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateAsync, 300);
    return () => clearTimeout(timeoutId);
  }, [previewBackground, selectedBackground, mode]);

  // Handle modal close without full state reset
  const handleCancel = () => {
    // Don't reset selectedBackground to preserve state
    setPreviewBackground(null);
    setValidationResult(null);
    // Keep selectedVariation to show current selection when reopening
    setCustomColorsState({});
    setShowVariableCode(false);
    setHasInitialized(false);
    onClose();
  };

  // Enhanced apply handler
  const handleApply = async () => {
    logger.debug('🚀 [DEBUG] handleApply called:', {
      selectedBackground,
      previewBackground,
      selectedVariation,
      canApply,
      validationErrors,
      timestamp: new Date().toISOString()
    });
    
    if (validationResult?.errors && validationResult.errors.length > 0) {
      const confirmApply = window.confirm(
        'There are validation warnings. Do you want to apply anyway?'
      );
      if (!confirmApply) return;
    }

    const success = await handleApplyBackground();
    if (success) {
      logger.debug('✅ [DEBUG] Background applied successfully, closing modal');
      // Reset state after successful apply
      setSelectedBackground(null);
      setPreviewBackground(null);
      setValidationResult(null);
      setSelectedVariation(null);
      setCustomColorsState({});
      setShowVariableCode(false);
      setHasInitialized(false);
      onClose();
    } else {
      logger.error('❌ [DEBUG] Background apply failed');
    }
  };

  // Get CSS variable code for display
  const getVariableCode = useCallback(() => {
    if (!selectedVariation || !('cssVariables' in selectedVariation)) {
      return '';
    }
    
    const variation = selectedVariation as VarBgVariation;
    const allVariables = { ...variation.cssVariables, ...customColors };
    
    return Object.entries(allVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
  }, [selectedVariation, customColors]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Background System"
      description="Customize your landing page background"
      size="large"
    >
      <div className="space-y-6">
        {/* Migration Phase Indicator */}
        {enableVariableMode && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Migration Mode: {phase}
              </span>
            </div>
            {isVariableMode && (
              <Badge variant="secondary" className="text-xs">
                CSS Variables Enabled
              </Badge>
            )}
          </div>
        )}

        {/* Mode Selection Buttons */}
        <div className="grid w-full border rounded-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${availableModes.length}, 1fr)` }}>
          {availableModes.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setMode(value as BackgroundSelectorMode)}
              className={`flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                mode === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200 last:border-r-0'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Recommended/AI Generated Mode */}
        {mode === 'recommended' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              AI-generated backgrounds optimized for your {currentBackgroundSystem?.baseColor || 'brand'}
            </div>
            
            <StyleGrid
              variations={(() => {
                if (processedOptions?.[0]) {
                }
                return processedOptions as any;
              })()}
              selectedVariation={selectedVariation}
              onVariationSelect={(variation) => {
                logger.debug('🎯 [DEBUG] Variation selected:', {
                  variationId: variation.variationId,
                  tailwindClass: variation.tailwindClass,
                  baseColor: variation.baseColor,
                  timestamp: new Date().toISOString()
                });
                
                setSelectedVariation(variation);
                
                // Since we're not converting variations anymore,
                // we can directly use the tailwindClass
                const newBackground = {
                  ...currentBackgroundSystem,
                  primary: variation.tailwindClass,
                  // Use the variation's base color or keep current
                  baseColor: variation.baseColor || currentBackgroundSystem.baseColor,
                };
                
                logger.debug('🎯 [DEBUG] Setting background:', {
                  newBackground,
                  primary: newBackground.primary,
                  baseColor: newBackground.baseColor
                });
                
                // Only set selectedBackground, not previewBackground
                // This avoids confusion in the apply handler
                setSelectedBackground(newBackground);
                setPreviewBackground(null);
              }}
              isLoading={isLoading}
              mode={mode}
            />
          </div>
        )}

        {/* Variable Mode - disabled to avoid key conflicts */}
        {false && (
          <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Customize colors with CSS variables for infinite possibilities
              </div>
              
              {/* Custom Color Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gradient Start</label>
                  <input
                    type="color"
                    value={customColors.primaryFrom || '#3b82f6'}
                    onChange={(e) => handleCustomColorChange({ ...customColors, primaryFrom: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gradient End</label>
                  <input
                    type="color"
                    value={customColors.primaryTo || '#8b5cf6'}
                    onChange={(e) => handleCustomColorChange({ ...customColors, primaryTo: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <input
                    type="color"
                    value={customColors.accentPrimary || '#f59e0b'}
                    onChange={(e) => handleCustomColorChange({ ...customColors, accentPrimary: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Text Color</label>
                  <input
                    type="color"
                    value={customColors.textPrimary || '#1f2937'}
                    onChange={(e) => handleCustomColorChange({ ...customColors, textPrimary: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Variable Code Display */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CSS Variables</span>
                  <button
                    onClick={() => setShowVariableCode(!showVariableCode)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {showVariableCode ? 'Hide' : 'Show'} Code
                  </button>
                </div>
                {showVariableCode && (
                  <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                    {getVariableCode() || 'No variables defined'}
                  </pre>
                )}
              </div>
              
              {/* Variable Background Grid */}
              <StyleGrid
                variations={processedOptions.filter(opt => 'structuralClass' in opt) as any}
                selectedVariation={selectedVariation}
                onVariationSelect={(variation) => {
                  setSelectedVariation(variation);
                  const varVariation = variation as unknown as VarBgVariation;
                  setPreviewBackground({
                    ...currentBackgroundSystem,
                    primary: varVariation.structuralClass,
                  });
                }}
                isLoading={isLoading}
                mode={mode}
              />
          </div>
        )}

        {/* Custom Mode */}
        {flags.enableCustomColorPicker && mode === 'custom' && (
          <div className="space-y-4">
              <CustomBackgroundPicker
                colors={null}
                onColorsChange={(colors) => {
                  logger.debug('🎨 [DEBUG] Custom colors changed:', colors);
                  // Store custom colors for later use if needed
                  setCustomColorsState(colors as any);
                }}
                onBackgroundChange={(background) => {
                  logger.debug('🎨 [CRITICAL DEBUG] Custom background changed:', {
                    background,
                    primary: background.primary,
                    secondary: background.secondary,
                    neutral: background.neutral,
                    divider: background.divider,
                    baseColor: background.baseColor,
                    accentColor: background.accentColor,
                    accentCSS: background.accentCSS,
                    timestamp: new Date().toISOString()
                  });
                  // Set selectedBackground directly for custom mode
                  setSelectedBackground(background);
                  // Clear preview to avoid confusion
                  setPreviewBackground(null);
                  
                  logger.debug('🎨 [CRITICAL DEBUG] setSelectedBackground called with:', {
                    selectedBackgroundSet: true,
                    previewBackgroundCleared: true
                  });
                }}
              />
          </div>
        )}


        {/* Validation Warnings */}
        {validationResult && (
          <ValidationWarnings
            validationResult={validationResult}
          />
        )}

        {/* Actions */}
        <ModalActions
          onCancel={handleCancel}
          onApply={handleApply}
          onReset={handleResetToGenerated}
          canApply={!!canApply}
          isLoading={isLoading}
          hasSelection={!!selectedBackground}
        />
      </div>
    </BaseModal>
  );
}