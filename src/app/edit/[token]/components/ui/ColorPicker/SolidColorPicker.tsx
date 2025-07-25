// components/ui/ColorPicker/SolidColorPicker.tsx - Solid color picker component
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { SolidBackground, BrandColorSuggestion } from '@/types/core';

interface SolidColorPickerProps {
  value: SolidBackground | null;
  onChange: (background: SolidBackground) => void;
}

export function SolidColorPicker({ value, onChange }: SolidColorPickerProps) {
  const { theme } = useEditStore();
  const [selectedColor, setSelectedColor] = useState(value?.color || '#3B82F6');
  const [customColor, setCustomColor] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Update selected color when value changes
  useEffect(() => {
    if (value?.color && value.color !== selectedColor) {
      setSelectedColor(value.color);
    }
  }, [value?.color]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    onChange({ color });
  }, [onChange]);

  // Get brand colors from theme
  const brandColors: BrandColorSuggestion[] = React.useMemo(() => {
    const colors = [];
    
    // Primary brand colors
    if (theme.colors.baseColor) {
      colors.push({
        color: `rgb(var(--color-${theme.colors.baseColor}-600))`,
        name: 'Primary',
        category: 'primary' as const,
        recommended: true,
      });
      colors.push({
        color: `rgb(var(--color-${theme.colors.baseColor}-500))`,
        name: 'Primary Light',
        category: 'primary' as const,
        recommended: true,
      });
      colors.push({
        color: `rgb(var(--color-${theme.colors.baseColor}-700))`,
        name: 'Primary Dark',
        category: 'primary' as const,
        recommended: false,
      });
    }

    // Accent colors
    if (theme.colors.accentColor && theme.colors.accentColor !== theme.colors.baseColor) {
      colors.push({
        color: `rgb(var(--color-${theme.colors.accentColor}-600))`,
        name: 'Accent',
        category: 'accent' as const,
        recommended: true,
      });
    }

    return colors;
  }, [theme.colors]);

  // Predefined color palette
  const presetColors = [
    // Blues
    '#3B82F6', '#1D4ED8', '#1E40AF', '#60A5FA',
    // Grays
    '#6B7280', '#374151', '#111827', '#F3F4F6',
    // Greens
    '#10B981', '#047857', '#065F46', '#6EE7B7',
    // Purples
    '#8B5CF6', '#7C3AED', '#6D28D9', '#A78BFA',
    // Reds
    '#EF4444', '#DC2626', '#B91C1C', '#F87171',
    // Yellows
    '#F59E0B', '#D97706', '#B45309', '#FCD34D',
  ];

  // Handle custom color input
  const handleCustomColorSubmit = () => {
    if (customColor) {
      handleColorChange(customColor);
      setCustomColor('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Colors Section */}
      {brandColors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Brand Colors</h4>
          <div className="grid grid-cols-4 gap-2">
            {brandColors.map((brandColor) => (
              <button
                key={brandColor.name}
                onClick={() => handleColorChange(brandColor.color)}
                className={`group relative w-12 h-12 rounded-lg border-2 transition-all ${
                  selectedColor === brandColor.color
                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: brandColor.color }}
                title={brandColor.name}
              >
                {brandColor.recommended && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white">
                    <div className="sr-only">Recommended</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Color Palette */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Color Palette</h4>
        <div className="grid grid-cols-8 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-8 h-8 rounded-md border-2 transition-all ${
                selectedColor === color
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Custom Color</h4>
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showCustomInput ? 'Hide' : 'Enter hex code'}
          </button>
        </div>

        {showCustomInput && (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#FF5733 or rgb(255, 87, 51)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCustomColorSubmit}
              disabled={!customColor}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* HTML5 Color Input */}
        <div className="mt-3">
          <label className="block text-sm text-gray-600 mb-2">Or use color picker:</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded-md border border-gray-300 cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{selectedColor}</div>
              <div className="text-xs text-gray-500">Selected color</div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Preview */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
        <div
          className="w-full h-16 rounded-lg border border-gray-200"
          style={{ backgroundColor: selectedColor }}
        >
          <div className="w-full h-full rounded-lg flex items-center justify-center">
            <div className="bg-white/90 px-3 py-1 rounded text-sm font-medium text-gray-800">
              Sample Text
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}