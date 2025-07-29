// TextColorControls.tsx - Manual text color override controls
"use client";

import React from 'react';
import { getSmartTextColor } from '@/utils/improvedTextColors';

interface TextColorControlsProps {
  currentTextColors: {
    heading: string;
    body: string;
    muted: string;
  };
  mode: 'auto' | 'manual';
  contrastLevel: number;
  overrides: {
    heading?: string;
    body?: string;
    muted?: string;
  };
  backgrounds: { name: string; value: string }[];
  onModeChange: (mode: 'auto' | 'manual') => void;
  onColorChange: (type: 'heading' | 'body' | 'muted', value: string) => void;
  onContrastChange: (level: number) => void;
}

const TEXT_PRESETS = {
  light: {
    heading: '#f9fafb', // gray-50
    body: '#e5e7eb',    // gray-200
    muted: '#9ca3af'    // gray-400
  },
  dark: {
    heading: '#111827', // gray-900
    body: '#374151',    // gray-700
    muted: '#6b7280'    // gray-500
  }
};

export function TextColorControls({
  currentTextColors,
  mode,
  contrastLevel,
  overrides,
  backgrounds,
  onModeChange,
  onColorChange,
  onContrastChange
}: TextColorControlsProps) {
  
  const handlePresetChange = (type: 'heading' | 'body' | 'muted', preset: 'light' | 'dark') => {
    onColorChange(type, TEXT_PRESETS[preset][type]);
  };

  const getActivePreset = (type: 'heading' | 'body' | 'muted'): 'light' | 'dark' | 'custom' => {
    const value = overrides[type] || currentTextColors[type];
    if (value === TEXT_PRESETS.light[type]) return 'light';
    if (value === TEXT_PRESETS.dark[type]) return 'dark';
    return 'custom';
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Text Color Mode</h3>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onModeChange('auto')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'auto'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Auto (AI Optimized)
            </span>
          </button>
          <button
            onClick={() => onModeChange('manual')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Manual Override
            </span>
          </button>
        </div>
        
        {mode === 'auto' && (
          <p className="mt-2 text-xs text-gray-500">
            Text colors are automatically calculated based on your backgrounds for optimal readability and WCAG compliance.
          </p>
        )}
      </div>

      {/* Manual Color Selection */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Override Text Colors</h3>
          
          {/* Heading Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Heading Text</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePresetChange('heading', 'light')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('heading') === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handlePresetChange('heading', 'dark')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('heading') === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Dark
              </button>
              <button
                disabled
                className="px-3 py-2 text-sm font-medium rounded-md border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                Custom
              </button>
            </div>
          </div>

          {/* Body Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Body Text</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePresetChange('body', 'light')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('body') === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handlePresetChange('body', 'dark')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('body') === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Dark
              </button>
              <button
                disabled
                className="px-3 py-2 text-sm font-medium rounded-md border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                Custom
              </button>
            </div>
          </div>

          {/* Muted Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Muted Text</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePresetChange('muted', 'light')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('muted') === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handlePresetChange('muted', 'dark')}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-all ${
                  getActivePreset('muted') === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Dark
              </button>
              <button
                disabled
                className="px-3 py-2 text-sm font-medium rounded-md border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                Custom
              </button>
            </div>
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Warning:</strong> Manual overrides bypass accessibility checks. 
              Ensure sufficient contrast for readability.
            </p>
          </div>
        </div>
      )}

      {/* Contrast Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Contrast Level</label>
          <span className="text-sm text-gray-500">{contrastLevel}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={contrastLevel}
            onChange={(e) => onContrastChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${contrastLevel}%, #f3f4f6 ${contrastLevel}%, #f3f4f6 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {mode === 'auto' 
            ? 'Adjusts the contrast of automatically calculated text colors.'
            : 'Adjusts the contrast of your manual color selections.'
          }
        </p>
      </div>
    </div>
  );
}