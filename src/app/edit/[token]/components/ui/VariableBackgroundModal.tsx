// Variable Background Modal - Enhanced background selector with CSS variable support
// Supports legacy, hybrid, and variable modes with smooth transitions

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBackgroundSelector } from './useBackgroundSelector';
import { validateBackgroundSystem } from './backgroundValidation';
import { ModeToggle } from './ModeToggle';
import { PreviewSection } from './PreviewSection';
import { CustomBackgroundPicker } from './CustomBackgroundPicker';
import { StyleGrid } from './StyleGrid';
import { ModalActions } from './ModalActions';
import { ValidationWarnings } from './ValidationWarnings';
import { BaseModal } from '../modals/BaseModal';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { VariableBackgroundRenderer, VariableBackgroundVariation } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer';
import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Info, Sparkles, Palette, Code, Eye } from 'lucide-react';
import type { BackgroundValidationResult, BackgroundSelectorMode } from '@/types/core';
import type { VariableBackgroundVariation as VarBgVariation } from '@/modules/Design/ColorSystem/migrationAdapter';

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
    
    if (isVariableMode || isHybridMode) {
      modes.push({
        value: 'variable',
        label: 'Variable Mode',
        description: 'Infinite customization with CSS variables',
        icon: <Code className="w-4 h-4" />
      });
    }
    
    if (flags.enableCustomColorPicker) {
      modes.push({
        value: 'custom',
        label: 'Custom Colors',
        description: 'Create your own color palette',
        icon: <Palette className="w-4 h-4" />
      });
    }
    
    return modes;
  }, [phase, isVariableMode, isHybridMode, flags]);

  // Convert compatible options to variable format if in variable mode
  const processedOptions = useMemo(() => {
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
  }, [compatibleOptions, isVariableMode, isHybridMode]);

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
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationResult(null);
    setSelectedVariation(null);
    setCustomColorsState({});
    setShowVariableCode(false);
    onClose();
  };

  // Enhanced apply handler
  const handleApply = async () => {
    if (validationResult?.errors && validationResult.errors.length > 0) {
      const confirmApply = window.confirm(
        'There are validation warnings. Do you want to apply anyway?'
      );
      if (!confirmApply) return;
    }

    const success = await handleApplyBackground();
    if (success) {
      handleCancel();
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

        {/* Mode Selection Tabs */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as BackgroundSelectorMode)}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableModes.length}, 1fr)` }}>
            {availableModes.map(({ value, label, icon }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1">
                {icon}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Recommended/AI Generated Mode */}
          <TabsContent value="recommended" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              AI-generated backgrounds optimized for your {currentBackgroundSystem?.baseColor || 'brand'}
            </div>
            
            <StyleGrid
              options={processedOptions}
              selectedVariation={selectedVariation}
              onSelect={(variation) => {
                setSelectedVariation(variation);
                if ('structuralClass' in variation) {
                  // Variable variation
                  const varVariation = variation as VarBgVariation;
                  setPreviewBackground({
                    ...currentBackgroundSystem,
                    primary: varVariation.structuralClass,
                  });
                } else {
                  // Legacy variation
                  setPreviewBackground({
                    ...currentBackgroundSystem,
                    primary: variation.tailwindClass,
                  });
                }
              }}
              isLoading={isLoading}
              useVariableRenderer={isVariableMode || isHybridMode}
              tokenId={tokenId}
              customColors={customColors as Record<string, string>}
            />
          </TabsContent>

          {/* Variable Mode */}
          {(isVariableMode || isHybridMode) && (
            <TabsContent value="variable" className="space-y-4">
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
                options={processedOptions.filter(opt => 'structuralClass' in opt)}
                selectedVariation={selectedVariation}
                onSelect={(variation) => {
                  setSelectedVariation(variation);
                  const varVariation = variation as VarBgVariation;
                  setPreviewBackground({
                    ...currentBackgroundSystem,
                    primary: varVariation.structuralClass,
                  });
                }}
                isLoading={isLoading}
                useVariableRenderer={true}
                tokenId={tokenId}
                customColors={customColors as Record<string, string>}
              />
            </TabsContent>
          )}

          {/* Custom Mode */}
          {flags.enableCustomColorPicker && (
            <TabsContent value="custom" className="space-y-4">
              <CustomBackgroundPicker
                onSelect={(customBg) => {
                  setPreviewBackground({
                    ...currentBackgroundSystem,
                    primary: customBg.css,
                  });
                }}
                currentBackground={currentBackgroundSystem}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Live Preview with Variable Renderer */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b">
            <span className="text-sm font-medium">Live Preview</span>
            <Eye className="w-4 h-4 text-gray-500" />
          </div>
          <VariableBackgroundRenderer
            tokenId={tokenId}
            background={previewBackground || selectedBackground || currentBackgroundSystem}
            customColors={customColors as Record<string, string>}
            className="h-48"
            debugMode={flags.enableMigrationDebug}
          >
            <PreviewSection
              background={previewBackground || selectedBackground || currentBackgroundSystem}
              showMobilePreview={false}
            />
          </VariableBackgroundRenderer>
        </div>

        {/* Validation Warnings */}
        {validationResult && (
          <ValidationWarnings
            validationResult={validationResult}
            isValidating={isValidating}
          />
        )}

        {/* Actions */}
        <ModalActions
          onCancel={handleCancel}
          onApply={handleApply}
          onReset={handleResetToGenerated}
          canApply={canApply}
          isLoading={isLoading}
          mode={mode}
        />
      </div>
    </BaseModal>
  );
}