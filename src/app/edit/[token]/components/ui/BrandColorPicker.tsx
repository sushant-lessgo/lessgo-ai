// /app/edit/[token]/components/ui/BrandColorPicker.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { validateBrandColor } from './backgroundCompatibility';

interface BrandColors {
  primary: string;
  secondary?: string;
}

interface BrandColorPickerProps {
  brandColors: BrandColors | null;
  onColorsChange: (colors: BrandColors) => void;
  onAnalysisComplete?: (analysis: ColorAnalysisResult) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
}

interface ColorAnalysisResult {
  isValid: boolean;
  baseColorFamily: string;
  harmonicColors: string[];
  warnings: string[];
  suggestions: string[];
  compatibilityScore: number;
}

interface ColorSuggestion {
  hex: string;
  name: string;
  category: 'popular' | 'harmony' | 'brand';
}

export function BrandColorPicker({
  brandColors,
  onColorsChange,
  onAnalysisComplete,
  disabled = false,
  showAdvanced = false,
}: BrandColorPickerProps) {
  const [localColors, setLocalColors] = useState<BrandColors>(
    brandColors || { primary: '#3B82F6', secondary: '#6B7280' }
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);

  // Color analysis when colors change
  const colorAnalysis = useMemo((): ColorAnalysisResult => {
    if (!localColors.primary) {
      return {
        isValid: false,
        baseColorFamily: 'unknown',
        harmonicColors: [],
        warnings: ['Primary color is required'],
        suggestions: [],
        compatibilityScore: 0,
      };
    }

    try {
      const primaryValidation = validateBrandColor(localColors.primary);
      const secondaryValidation = localColors.secondary 
        ? validateBrandColor(localColors.secondary)
        : { isValid: true };

      const baseColorFamily = extractColorFamily(localColors.primary);
      const harmonicColors = getHarmonicColors(baseColorFamily);
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Validation warnings
      if (!primaryValidation.isValid) {
        warnings.push(primaryValidation.error || 'Invalid primary color');
      }
      if (localColors.secondary && !secondaryValidation.isValid) {
        warnings.push(secondaryValidation.error || 'Invalid secondary color');
      }

      // Color harmony suggestions
      if (localColors.secondary) {
        const secondaryFamily = extractColorFamily(localColors.secondary);
        const isHarmonious = harmonicColors.includes(secondaryFamily) || 
                           Math.abs(getColorDistance(localColors.primary, localColors.secondary)) > 0.3;
        
        if (!isHarmonious) {
          warnings.push('Primary and secondary colors may not work well together');
          suggestions.push(`Consider using ${harmonicColors[0]} tones for secondary color`);
        }
      }

      // Accessibility suggestions
      const lightness = getColorLightness(localColors.primary);
      if (lightness > 0.8) {
        warnings.push('Primary color is very light - may have contrast issues');
        suggestions.push('Consider using a darker shade for better text contrast');
      } else if (lightness < 0.2) {
        warnings.push('Primary color is very dark - may limit background options');
        suggestions.push('Consider using a lighter shade for more background compatibility');
      }

      // Calculate compatibility score
      let compatibilityScore = 100;
      compatibilityScore -= warnings.length * 15;
      compatibilityScore -= Math.abs(lightness - 0.5) * 40; // Prefer mid-range lightness
      
      if (localColors.secondary) {
        const secondaryFamily = extractColorFamily(localColors.secondary);
        if (harmonicColors.includes(secondaryFamily)) {
          compatibilityScore += 10; // Bonus for harmonic colors
        }
      }

      compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

      return {
        isValid: primaryValidation.isValid && secondaryValidation.isValid,
        baseColorFamily,
        harmonicColors,
        warnings,
        suggestions,
        compatibilityScore,
      };

    } catch (error) {
      return {
        isValid: false,
        baseColorFamily: 'unknown',
        harmonicColors: [],
        warnings: ['Error analyzing colors'],
        suggestions: [],
        compatibilityScore: 0,
      };
    }
  }, [localColors]);

  // Update parent when analysis completes
  useEffect(() => {
    onAnalysisComplete?.(colorAnalysis);
  }, [colorAnalysis, onAnalysisComplete]);

  // Debounced color change
  useEffect(() => {
    const timer = setTimeout(() => {
      onColorsChange(localColors);
    }, 300);

    return () => clearTimeout(timer);
  }, [localColors, onColorsChange]);

  // Color input handlers
  const handlePrimaryChange = (color: string) => {
    setLocalColors(prev => ({ ...prev, primary: color }));
    
    // Clear validation errors when user types
    if (validationErrors.primary) {
      setValidationErrors(prev => ({ ...prev, primary: '' }));
    }
  };

  const handleSecondaryChange = (color: string) => {
    setLocalColors(prev => ({ ...prev, secondary: color }));
    
    if (validationErrors.secondary) {
      setValidationErrors(prev => ({ ...prev, secondary: '' }));
    }
  };

  // Apply color suggestion
  const applySuggestion = (suggestion: ColorSuggestion, target: 'primary' | 'secondary') => {
    if (target === 'primary') {
      handlePrimaryChange(suggestion.hex);
    } else {
      handleSecondaryChange(suggestion.hex);
    }
    setShowColorSuggestions(false);
  };

  // Generate color suggestions
  const colorSuggestions: ColorSuggestion[] = useMemo(() => {
    const suggestions: ColorSuggestion[] = [];

    // Popular brand colors
    const popularColors = [
      { hex: '#1DA1F2', name: 'Twitter Blue', category: 'popular' as const },
      { hex: '#4267B2', name: 'Facebook Blue', category: 'popular' as const },
      { hex: '#FF0000', name: 'YouTube Red', category: 'popular' as const },
      { hex: '#0077B5', name: 'LinkedIn Blue', category: 'popular' as const },
      { hex: '#25D366', name: 'WhatsApp Green', category: 'popular' as const },
      { hex: '#FF5722', name: 'Product Hunt Orange', category: 'popular' as const },
    ];

    // Harmonic colors based on current primary
    if (localColors.primary && colorAnalysis.isValid) {
      colorAnalysis.harmonicColors.forEach(colorFamily => {
        const harmonicHex = getColorHexForFamily(colorFamily);
        if (harmonicHex) {
          suggestions.push({
            hex: harmonicHex,
            name: `${colorFamily.charAt(0).toUpperCase() + colorFamily.slice(1)}`,
            category: 'harmony'
          });
        }
      });
    }

    return [...suggestions, ...popularColors].slice(0, 12);
  }, [localColors.primary, colorAnalysis]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Brand Colors</h4>
        {colorAnalysis.isValid && (
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              colorAnalysis.compatibilityScore >= 80 ? 'bg-green-500' :
              colorAnalysis.compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-500">
              {colorAnalysis.compatibilityScore}% compatible
            </span>
          </div>
        )}
      </div>

      {/* Primary Brand Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Primary Brand Color *
        </label>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="color"
              value={localColors.primary}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
            />
            {/* Color preview overlay */}
            <div 
              className="absolute inset-1 rounded-md pointer-events-none"
              style={{ backgroundColor: localColors.primary }}
            />
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={localColors.primary}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="#3B82F6"
            />
            {validationErrors.primary && (
              <div className="mt-1 text-xs text-red-600">{validationErrors.primary}</div>
            )}
          </div>

          <button
            onClick={() => setShowColorSuggestions(!showColorSuggestions)}
            disabled={disabled}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Color suggestions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Secondary Brand Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Secondary Brand Color (Optional)
        </label>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="color"
              value={localColors.secondary || '#6B7280'}
              onChange={(e) => handleSecondaryChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
            />
            <div 
              className="absolute inset-1 rounded-md pointer-events-none"
              style={{ backgroundColor: localColors.secondary || '#6B7280' }}
            />
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={localColors.secondary || ''}
              onChange={(e) => handleSecondaryChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="#6B7280 (optional)"
            />
            {validationErrors.secondary && (
              <div className="mt-1 text-xs text-red-600">{validationErrors.secondary}</div>
            )}
          </div>

          <button
            onClick={() => handleSecondaryChange('')}
            disabled={disabled || !localColors.secondary}
            className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Clear secondary color"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color Suggestions */}
      {showColorSuggestions && (
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Color Suggestions</div>
          <div className="grid grid-cols-6 gap-2">
            {colorSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion, 'primary')}
                className="group relative"
                title={suggestion.name}
              >
                <div 
                  className="w-8 h-8 rounded-md border border-gray-200 hover:ring-2 hover:ring-gray-300 transition-all"
                  style={{ backgroundColor: suggestion.hex }}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {suggestion.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Analysis Results */}
      {colorAnalysis.isValid && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-700">Analysis</div>
            <div className="text-xs text-gray-500">
              Base: {colorAnalysis.baseColorFamily}
            </div>
          </div>
          
          {/* Compatibility Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Compatibility Score</span>
              <span className={`font-medium ${
                colorAnalysis.compatibilityScore >= 80 ? 'text-green-700' :
                colorAnalysis.compatibilityScore >= 60 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {colorAnalysis.compatibilityScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  colorAnalysis.compatibilityScore >= 80 ? 'bg-green-500' :
                  colorAnalysis.compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${colorAnalysis.compatibilityScore}%` }}
              />
            </div>
          </div>

          {/* Harmonic Colors */}
          {colorAnalysis.harmonicColors.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">Works well with:</div>
              <div className="flex flex-wrap gap-1">
                {colorAnalysis.harmonicColors.slice(0, 4).map((color, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {colorAnalysis.warnings.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-amber-700 font-medium mb-1">⚠️ Considerations:</div>
              <ul className="text-xs text-amber-700 space-y-0.5">
                {colorAnalysis.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {colorAnalysis.suggestions.length > 0 && (
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">💡 Suggestions:</div>
              <ul className="text-xs text-blue-700 space-y-0.5">
                {colorAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Analyzing color compatibility...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function extractColorFamily(hex: string): string {
  try {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    
    const [h, s, l] = rgbToHsl(r, g, b);
    
    if (s < 0.1) return 'gray';
    if (l > 0.9 || l < 0.1) return 'neutral';
    
    if (h >= 345 || h < 15) return 'red';
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 75) return 'yellow';
    if (h >= 75 && h < 105) return 'green';
    if (h >= 105 && h < 165) return 'teal';
    if (h >= 165 && h < 195) return 'cyan';
    if (h >= 195 && h < 225) return 'sky';
    if (h >= 225 && h < 255) return 'blue';
    if (h >= 255 && h < 285) return 'indigo';
    if (h >= 285 && h < 315) return 'purple';
    if (h >= 315 && h < 345) return 'pink';
    
    return 'blue';
  } catch {
    return 'unknown';
  }
}

function getHarmonicColors(baseColor: string): string[] {
  const harmonies: Record<string, string[]> = {
    red: ['orange', 'pink', 'purple'],
    orange: ['red', 'yellow', 'amber'],
    yellow: ['orange', 'green', 'amber'],
    green: ['yellow', 'teal', 'emerald'],
    teal: ['green', 'cyan', 'blue'],
    cyan: ['teal', 'blue', 'sky'],
    sky: ['cyan', 'blue', 'indigo'],
    blue: ['sky', 'indigo', 'purple'],
    indigo: ['blue', 'purple', 'violet'],
    purple: ['indigo', 'pink', 'red'],
    pink: ['purple', 'red', 'rose'],
  };
  
  return harmonies[baseColor] || [];
}

function getColorLightness(hex: string): number {
  try {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    
    const [, , l] = rgbToHsl(r, g, b);
    return l;
  } catch {
    return 0.5;
  }
}

function getColorDistance(hex1: string, hex2: string): number {
  try {
    const r1 = parseInt(hex1.substr(1, 2), 16);
    const g1 = parseInt(hex1.substr(3, 2), 16);
    const b1 = parseInt(hex1.substr(5, 2), 16);
    
    const r2 = parseInt(hex2.substr(1, 2), 16);
    const g2 = parseInt(hex2.substr(3, 2), 16);
    const b2 = parseInt(hex2.substr(5, 2), 16);
    
    return Math.sqrt(
      Math.pow(r2 - r1, 2) + 
      Math.pow(g2 - g1, 2) + 
      Math.pow(b2 - b1, 2)
    ) / 441.6729559300637; // Normalize to 0-1
  } catch {
    return 0;
  }
}

function getColorHexForFamily(family: string): string | null {
  const familyColors: Record<string, string> = {
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#EAB308',
    green: '#22C55E',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    blue: '#3B82F6',
    indigo: '#6366F1',
    purple: '#A855F7',
    pink: '#EC4899',
  };
  
  return familyColors[family] || null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }

    h /= 6;
  }

  return [h * 360, s, l];
}