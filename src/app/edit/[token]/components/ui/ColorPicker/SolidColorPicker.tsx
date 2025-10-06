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
      {/* Main Heading */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Choose a Color</h3>
      </div>

      {/* Primary: Color Picker Input */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Color Picker</label>
        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-900">{selectedColor}</div>
            <div className="text-sm text-gray-500">Selected color</div>
          </div>
        </div>
      </div>

      {/* Secondary: Quick Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Colors</h4>
        <div className="grid grid-cols-8 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-10 h-10 rounded-md border-2 transition-all ${
                selectedColor === color
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Tertiary: Custom Hex Input (Collapsible) */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span>Or enter custom hex code</span>
          <svg
            className={`w-4 h-4 transition-transform ${showCustomInput ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCustomInput && (
          <div className="flex items-center space-x-2 mt-3">
            <div className="flex-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#FF5733"
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
      </div>
    </div>
  );
}