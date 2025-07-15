// /app/edit/[token]/components/ui/ThemeSelector.tsx
"use client";

import React, { useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';

export function ThemeSelector() {
  const { theme, /* setTheme, */ getColorTokens } = useEditStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const colorTokens = getColorTokens();

  const colorPresets = [
    { name: 'Blue', baseColor: 'blue', accentColor: 'blue' },
    { name: 'Purple', baseColor: 'gray', accentColor: 'purple' },
    { name: 'Green', baseColor: 'gray', accentColor: 'green' },
    { name: 'Red', baseColor: 'gray', accentColor: 'red' },
    { name: 'Orange', baseColor: 'gray', accentColor: 'orange' },
    { name: 'Pink', baseColor: 'gray', accentColor: 'pink' },
  ];

  const handleColorChange = (baseColor: string, accentColor: string) => {
    // setTheme({
    //   ...theme,
    //   colors: {
    //     ...theme.colors,
    //     baseColor,
    //     accentColor,
    //   },
    // });
    console.log('Theme would change to:', baseColor, accentColor);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        aria-expanded={showColorPicker}
      >
        <div className="flex space-x-1">
          <div className={`w-3 h-3 rounded-full ${colorTokens.accent}`} />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
        <span className="hidden sm:inline">Colors</span>
      </button>

      {showColorPicker && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="mb-3">
            <h3 className="font-medium text-gray-900 mb-2">Color Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleColorChange(preset.baseColor, preset.accentColor)}
                  className={`
                    p-2 rounded-lg border transition-colors
                    ${theme.colors.accentColor === preset.accentColor
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-1">
                    <div className={`w-4 h-4 rounded-full bg-${preset.accentColor}-500`} />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Background Style</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 border border-gray-200 rounded text-xs hover:bg-gray-50">
                Light
              </button>
              <button className="p-2 border border-gray-200 rounded text-xs hover:bg-gray-50">
                Dark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}