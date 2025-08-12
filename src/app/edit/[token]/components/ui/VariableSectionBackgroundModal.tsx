// Variable Section Background Modal - Enhanced section background modal with CSS variable support
// Supports legacy, hybrid, and variable modes with real-time preview

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useVariableTheme } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { VariableBackgroundRenderer } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer';
import { VariableColorControls } from '@/modules/Design/ColorSystem/VariableColorControls';
import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter';
import { BaseModal } from '../modals/BaseModal';
import { SolidColorPicker } from './ColorPicker/SolidColorPicker';
import { GradientPicker } from './ColorPicker/GradientPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Palette, 
  Code2, 
  Eye, 
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Wand2,
  Settings
} from 'lucide-react';
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

interface VariableSectionBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  tokenId: string;
}

interface VariableBackgroundConfig {
  mode: 'theme' | 'custom' | 'variable';
  themeColor?: ThemeColorType;
  customBackground?: CustomBackground;
  variableConfig?: {
    structuralClass: string;
    cssVariables: Record<string, string>;
    fallbackClass: string;
  };
}

export function VariableSectionBackgroundModal({ 
  isOpen, 
  onClose, 
  sectionId, 
  tokenId 
}: VariableSectionBackgroundModalProps) {
  const { content, setBackgroundType, setSectionBackground, theme, sections, onboardingData } = useEditStore();
  const { phase, flags, isVariableMode, isHybridMode } = useVariableTheme(tokenId);
  
  // Section data
  const section = content[sectionId];
  const calculatedBackgroundType = getSectionBackgroundType(sectionId, sections, undefined, onboardingData as any);
  const storedBackgroundType = section?.backgroundType;
  const currentThemeColor = (storedBackgroundType as ThemeColorType) || calculatedBackgroundType;

  // State management
  const [activeMode, setActiveMode] = useState<'theme' | 'custom' | 'variable'>('theme');
  const [pickerMode, setPickerMode] = useState<BackgroundPickerMode>('solid');
  const [localBackground, setLocalBackground] = useState<SectionBackground>({
    type: 'theme' as BackgroundType, 
    themeColor: currentThemeColor
  });
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [variableConfig, setVariableConfig] = useState<VariableBackgroundConfig['variableConfig']>();
  const [validation, setValidation] = useState<BackgroundValidation | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    canMigrate: boolean;
    complexity: 'low' | 'medium' | 'high';
    warnings: string[];
  } | null>(null);

  // Initialize background configuration
  useEffect(() => {
    if (!isOpen || !section) return;

    // Determine initial mode based on current configuration
    let initMode: 'theme' | 'custom' | 'variable' = 'theme';
    let initBackground: SectionBackground = {
      type: 'theme',
      themeColor: currentThemeColor
    };

    if (section.backgroundType === 'custom' && section.sectionBackground?.type === 'custom') {
      initMode = 'custom';
      initBackground = section.sectionBackground;
    } else if (isVariableMode && section.backgroundClass) {
      // Check if current background can be converted to variables
      try {
        const converted = migrationAdapter.convertToVariableBackground(section.backgroundClass, 'section');
        if (Object.keys(converted.cssVariables).length > 0) {
          initMode = 'variable';
          setVariableConfig(converted);
        }
      } catch (error) {
        console.warn('Failed to convert existing background to variable mode:', error);
      }
    }

    setActiveMode(initMode);
    setLocalBackground(initBackground);
    
    // Reset custom colors
    setCustomColors({});
    
    console.log('🎨 Variable Section Background Modal initialized:', {
      sectionId,
      initMode,
      phase,
      currentThemeColor,
      hasVariableConfig: !!variableConfig
    });
  }, [isOpen, section, currentThemeColor, isVariableMode]);

  // Check migration status
  useEffect(() => {
    if (!isOpen || activeMode !== 'variable') {
      setMigrationStatus(null);
      return;
    }

    const currentBgClass = section?.backgroundClass || theme?.colors?.sectionBackgrounds?.[currentThemeColor] || 'bg-white';
    
    try {
      const validation = migrationAdapter.convertLegacyVariation({
        variationId: `section-${sectionId}`,
        variationLabel: 'Section Background',
        archetypeId: 'section',
        themeId: 'current',
        tailwindClass: currentBgClass,
        baseColor: currentThemeColor,
      } as any);

      setMigrationStatus({
        canMigrate: !validation.legacyOnly,
        complexity: validation.complexity,
        warnings: validation.migrationWarnings || [],
      });
    } catch (error) {
      setMigrationStatus({
        canMigrate: false,
        complexity: 'high',
        warnings: ['Failed to analyze background for migration'],
      });
    }
  }, [isOpen, activeMode, section, currentThemeColor, theme, sectionId]);

  // Available modes based on feature flags
  const availableModes = useMemo(() => {
    const modes = [
      { value: 'theme' as const, label: 'Theme', icon: <Layers className="w-4 h-4" /> },
      { value: 'custom' as const, label: 'Custom', icon: <Palette className="w-4 h-4" /> },
    ];

    if ((isVariableMode || isHybridMode) && flags.enableVariableBackgrounds) {
      modes.push({
        value: 'variable' as const,
        label: 'Variable',
        icon: <Code2 className="w-4 h-4" />
      });
    }

    return modes;
  }, [isVariableMode, isHybridMode, flags]);

  // Get current background for preview
  const currentBackgroundForPreview = useMemo(() => {
    switch (activeMode) {
      case 'theme':
        return theme?.colors?.sectionBackgrounds?.[localBackground.themeColor!] || 'bg-white';
      case 'custom':
        if (localBackground.custom?.solid) {
          return `bg-[${localBackground.custom.solid}]`;
        }
        if (localBackground.custom?.gradient) {
          const { type, from, via, to } = localBackground.custom.gradient;
          let gradientClass = `bg-gradient-${type}`;
          if (from) gradientClass += ` from-[${from}]`;
          if (via) gradientClass += ` via-[${via}]`;
          if (to) gradientClass += ` to-[${to}]`;
          return gradientClass;
        }
        return 'bg-white';
      case 'variable':
        return variableConfig?.structuralClass || 'bg-pattern-primary';
      default:
        return 'bg-white';
    }
  }, [activeMode, localBackground, theme, variableConfig]);

  // Handle mode change
  const handleModeChange = useCallback((mode: 'theme' | 'custom' | 'variable') => {
    setActiveMode(mode);
    
    // Reset configuration for new mode
    if (mode === 'theme') {
      setLocalBackground({
        type: 'theme',
        themeColor: currentThemeColor
      });
    } else if (mode === 'custom') {
      setLocalBackground({
        type: 'custom',
        custom: {
          solid: '#ffffff'
        }
      });
    } else if (mode === 'variable') {
      // Try to convert current background to variable mode
      const currentBgClass = theme?.colors?.sectionBackgrounds?.[currentThemeColor] || 'bg-white';
      try {
        const converted = migrationAdapter.convertToVariableBackground(currentBgClass, 'section');
        setVariableConfig(converted);
      } catch (error) {
        console.warn('Failed to convert to variable mode:', error);
        setVariableConfig({
          structuralClass: 'bg-pattern-primary',
          cssVariables: {
            '--gradient-from': '#3b82f6',
            '--gradient-to': '#8b5cf6'
          },
          fallbackClass: currentBgClass
        });
      }
    }
  }, [currentThemeColor, theme]);

  // Apply changes
  const handleApply = useCallback(() => {
    try {
      switch (activeMode) {
        case 'theme':
          setBackgroundType(sectionId, localBackground.themeColor!);
          setSectionBackground(sectionId, null);
          break;
          
        case 'custom':
          setBackgroundType(sectionId, 'custom');
          setSectionBackground(sectionId, localBackground as any);
          break;
          
        case 'variable':
          if (variableConfig) {
            // For variable mode, we need to set both the background type and store variable config
            setBackgroundType(sectionId, 'custom');
            setSectionBackground(sectionId, {
              type: 'variable',
              variableConfig,
              customColors
            } as any);
          }
          break;
      }
      
      onClose();
      console.log('🎨 Applied section background:', { sectionId, activeMode, localBackground });
    } catch (error) {
      console.error('Failed to apply section background:', error);
    }
  }, [activeMode, sectionId, localBackground, variableConfig, customColors, setBackgroundType, setSectionBackground, onClose]);

  // Validation check
  useEffect(() => {
    // Validate accessibility when background changes
    // This is a simplified validation - in real app would use proper contrast calculation
    setValidation(null); // Placeholder for validation logic
  }, [currentBackgroundForPreview, localBackground]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Section Background"
      description={`Customize background for section ${sectionId}`}
      size="large"
    >
      <div className="space-y-6">
        {/* Migration Phase Indicator */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Migration Mode: {phase}
            </span>
          </div>
          {isVariableMode && (
            <Badge variant="secondary" className="text-xs">
              CSS Variables Active
            </Badge>
          )}
        </div>

        {/* Mode Selection */}
        <Tabs value={activeMode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableModes.length}, 1fr)` }}>
            {availableModes.map(mode => (
              <TabsTrigger key={mode.value} value={mode.value} className="flex items-center gap-1">
                {mode.icon}
                {mode.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Theme Mode */}
          <TabsContent value="theme" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use predefined theme backgrounds that automatically adapt to your brand colors.
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['primary', 'secondary', 'neutral', 'divider'] as ThemeColorType[]).map(colorType => {
                const bgClass = theme?.colors?.sectionBackgrounds?.[colorType] || 'bg-gray-100';
                const isSelected = localBackground.themeColor === colorType;
                
                return (
                  <button
                    key={colorType}
                    onClick={() => setLocalBackground({ type: 'theme', themeColor: colorType })}
                    className={`
                      relative h-20 rounded-lg border-2 transition-all
                      ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <VariableBackgroundRenderer
                      tokenId={tokenId}
                      background={bgClass}
                      className="h-full w-full rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium capitalize">
                        {colorType}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* Custom Mode */}
          <TabsContent value="custom" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create custom solid colors or gradients for unique section backgrounds.
            </div>
            
            <Tabs value={pickerMode} onValueChange={(mode) => setPickerMode(mode as BackgroundPickerMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="solid">Solid Color</TabsTrigger>
                <TabsTrigger value="gradient">Gradient</TabsTrigger>
              </TabsList>

              <TabsContent value="solid" className="space-y-4">
                <SolidColorPicker
                  color={localBackground.custom?.solid || '#ffffff'}
                  onChange={(color) => setLocalBackground({
                    ...localBackground,
                    type: 'custom',
                    custom: { solid: color }
                  })}
                />
              </TabsContent>

              <TabsContent value="gradient" className="space-y-4">
                <GradientPicker
                  gradient={localBackground.custom?.gradient || {
                    type: 'to-r',
                    from: '#3b82f6',
                    to: '#8b5cf6'
                  }}
                  onChange={(gradient) => setLocalBackground({
                    ...localBackground,
                    type: 'custom',
                    custom: { gradient }
                  })}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Variable Mode */}
          {(isVariableMode || isHybridMode) && (
            <TabsContent value="variable" className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use CSS variables for infinite customization possibilities with real-time updates.
              </div>

              {/* Migration Status */}
              {migrationStatus && (
                <Alert className={migrationStatus.canMigrate ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                  <div className="flex items-center gap-2">
                    {migrationStatus.canMigrate ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">
                          Migration Status: {migrationStatus.canMigrate ? 'Compatible' : 'Limited Support'}
                        </div>
                        <div className="text-xs">
                          Complexity: {migrationStatus.complexity} • 
                          {migrationStatus.warnings.length > 0 ? ` ${migrationStatus.warnings.length} warnings` : ' No issues'}
                        </div>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Variable Controls */}
              <VariableColorControls
                tokenId={tokenId}
                customColors={customColors}
                onColorChange={setCustomColors}
                backgroundSystem={theme?.colors?.sectionBackgrounds}
                compactMode={true}
              />

              {/* Structural Class Info */}
              {variableConfig && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Variable Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium">Structural Class:</span>
                        <code className="ml-2 px-1 bg-gray-100 rounded">{variableConfig.structuralClass}</code>
                      </div>
                      <div>
                        <span className="font-medium">Variables:</span>
                        <span className="ml-2">{Object.keys(variableConfig.cssVariables).length} defined</span>
                      </div>
                      <div>
                        <span className="font-medium">Fallback:</span>
                        <code className="ml-2 px-1 bg-gray-100 rounded text-xs">{variableConfig.fallbackClass}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Live Preview */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b">
            <span className="text-sm font-medium">Live Preview</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activeMode} mode
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <VariableBackgroundRenderer
            tokenId={tokenId}
            background={currentBackgroundForPreview}
            customColors={activeMode === 'variable' ? customColors : undefined}
            className="h-48 flex items-center justify-center"
            debugMode={flags.enableMigrationDebug}
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-white/90 mb-1">
                Section Background Preview
              </div>
              <div className="text-sm text-white/70">
                Mode: {activeMode} • Phase: {phase}
              </div>
            </div>
          </VariableBackgroundRenderer>
        </div>

        {/* Validation Messages */}
        {validation && validation.errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-red-800">Accessibility Issues</div>
                {validation.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700">• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setActiveMode('theme');
              setLocalBackground({ type: 'theme', themeColor: 'neutral' });
              setCustomColors({});
            }}>
              Reset
            </Button>
            <Button onClick={handleApply}>
              Apply Background
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}