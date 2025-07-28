// Custom Color Picker Component for Background System
"use client";

import React, { useState, useEffect } from 'react';
import { 
  generateCustomColorScheme, 
  updateColorScheme, 
  getPopularBrandColors,
  validateColorContrast,
  type CustomColors 
} from './colorCalculations';

interface CustomColorPickerProps {
  colors: CustomColors | null;
  onColorsChange: (colors: CustomColors) => void;
  disabled?: boolean;
}

export function CustomColorPicker({ colors, onColorsChange, disabled = false }: CustomColorPickerProps) {
  const [localColors, setLocalColors] = useState<CustomColors>(
    colors || generateCustomColorScheme('#3B82F6')
  );
  const [showPresets, setShowPresets] = useState(false);

  // Update parent when colors change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      onColorsChange(localColors);
    }, 300);

    return () => clearTimeout(timer);
  }, [localColors, onColorsChange]);

  // Handle primary color change
  const handlePrimaryChange = (color: string) => {
    const updatedScheme = updateColorScheme(localColors, 'primary', color, true);
    setLocalColors(updatedScheme);
  };

  // Handle individual color overrides
  const handleColorOverride = (
    colorType: 'secondary' | 'neutral' | 'divider',
    color: string
  ) => {
    const updatedScheme = updateColorScheme(localColors, colorType, color, true);
    setLocalColors(updatedScheme);
  };

  // Reset color to auto-calculated
  const resetToAuto = (colorType: 'secondary' | 'neutral' | 'divider') => {
    let autoColor: string;
    
    if (colorType === 'secondary') {
      const { secondary } = generateCustomColorScheme(localColors.primary);
      autoColor = secondary;
    } else if (colorType === 'neutral') {
      const { neutral } = generateCustomColorScheme(localColors.primary);
      autoColor = neutral;
    } else {
      const { divider } = generateCustomColorScheme(localColors.primary);
      autoColor = divider;
    }

    const updatedScheme = updateColorScheme(localColors, colorType, autoColor, false);
    setLocalColors(updatedScheme);
  };

  // Apply preset color
  const applyPreset = (presetColor: string) => {
    const newScheme = generateCustomColorScheme(presetColor);
    setLocalColors(newScheme);
    setShowPresets(false);
  };

  const popularColors = getPopularBrandColors();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Custom Color Scheme</h4>
        <div className="text-xs text-green-600 font-medium">✨ Smart Defaults</div>
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Primary Color
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              placeholder="#3B82F6"
            />
          </div>

          <button
            onClick={() => setShowPresets(!showPresets)}
            disabled={disabled}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Color presets"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color Presets */}
      {showPresets && (
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Popular Brand Colors</div>
          <div className="grid grid-cols-4 gap-2">
            {popularColors.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset.color)}
                className="group relative p-2 rounded-md hover:bg-gray-50 transition-colors"
                title={`${preset.name} (${preset.category})`}
              >
                <div 
                  className="w-8 h-8 rounded-md border border-gray-200 mx-auto"
                  style={{ backgroundColor: preset.color }}
                />
                <div className="text-xs text-gray-600 mt-1 truncate">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Calculated Colors */}
      <div className="space-y-3">
        {/* Secondary Color */}
        <ColorRow
          label="Secondary Color"
          color={localColors.secondary}
          isAuto={localColors.isSecondaryAuto}
          onColorChange={(color) => handleColorOverride('secondary', color)}
          onResetToAuto={() => resetToAuto('secondary')}
          disabled={disabled}
        />

        {/* Neutral Color */}
        <ColorRow
          label="Neutral Color"
          color={localColors.neutral}
          isAuto={localColors.isNeutralAuto}
          onColorChange={(color) => handleColorOverride('neutral', color)}
          onResetToAuto={() => resetToAuto('neutral')}
          disabled={disabled}
        />

        {/* Divider Color */}
        <ColorRow
          label="Divider Color"
          color={localColors.divider}
          isAuto={localColors.isDividerAuto}
          onColorChange={(color) => handleColorOverride('divider', color)}
          onResetToAuto={() => resetToAuto('divider')}
          disabled={disabled}
        />
      </div>

      {/* Color Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Preview</div>
        <div className="flex space-x-2">
          <div 
            className="flex-1 h-8 rounded border border-gray-200 flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: localColors.primary }}
          >
            Primary
          </div>
          <div 
            className="flex-1 h-8 rounded border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700"
            style={{ backgroundColor: localColors.secondary }}
          >
            Secondary
          </div>
          <div 
            className="flex-1 h-8 rounded border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700"
            style={{ backgroundColor: localColors.neutral }}
          >
            Neutral
          </div>
          <div 
            className="w-12 h-8 rounded border border-gray-200"
            style={{ backgroundColor: localColors.divider }}
            title="Divider"
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for auto-calculated color rows
interface ColorRowProps {
  label: string;
  color: string;
  isAuto: boolean;
  onColorChange: (color: string) => void;
  onResetToAuto: () => void;
  disabled?: boolean;
}

function ColorRow({ label, color, isAuto, onColorChange, onResetToAuto, disabled }: ColorRowProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        {label}
        {isAuto && <span className="ml-2 text-xs text-green-600 font-normal">✨ Auto</span>}
      </label>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={disabled}
            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
          />
          <div 
            className="absolute inset-1 rounded-md pointer-events-none"
            style={{ backgroundColor: color }}
          />
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          />
        </div>

        <button
          onClick={onResetToAuto}
          disabled={disabled || isAuto}
          className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset to auto-calculated"
        >
          {isAuto ? (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}