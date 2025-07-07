// /app/edit/[token]/components/ui/SemanticControls.tsx
"use client";

import React from 'react';
import type { 
  ColorIntensityLevel, 
  TextContrastLevel,
  BackgroundSystem 
} from '@/types/core';

interface SemanticControlsProps {
  selectedAccent: string;
  textContrast: TextContrastLevel;
  overallIntensity: ColorIntensityLevel;
  backgroundSystem: BackgroundSystem | null;
  onAccentChange: (accent: string) => void;
  onTextContrastChange: (level: TextContrastLevel) => void;
  onIntensityChange: (level: ColorIntensityLevel) => void;
  disabled?: boolean;
}

export function SemanticControls({
  selectedAccent,
  textContrast,
  overallIntensity,
  backgroundSystem,
  onAccentChange,
  onTextContrastChange,
  onIntensityChange,
  disabled = false,
}: SemanticControlsProps) {
  
  // Available accent colors compatible with base color
  const getCompatibleAccents = (): Array<{ color: string; label: string; preview: string }> => {
    if (!backgroundSystem) return [];
    
    const baseColor = backgroundSystem.baseColor;
    
    // Generate compatible accent options
    const accentOptions = [
      { color: baseColor, label: 'Match Background', preview: `bg-${baseColor}-600` },
      { color: 'purple', label: 'Purple', preview: 'bg-purple-600' },
      { color: 'blue', label: 'Blue', preview: 'bg-blue-600' },
      { color: 'green', label: 'Green', preview: 'bg-green-600' },
      { color: 'orange', label: 'Orange', preview: 'bg-orange-600' },
      { color: 'red', label: 'Red', preview: 'bg-red-600' },
      { color: 'teal', label: 'Teal', preview: 'bg-teal-600' },
      { color: 'indigo', label: 'Indigo', preview: 'bg-indigo-600' },
    ];
    
    // Filter out the base color from other options to avoid duplication
    return accentOptions.filter((option, index) => 
      index === 0 || option.color !== baseColor
    ).slice(0, 6); // Limit to 6 options for clean UI
  };

  const compatibleAccents = getCompatibleAccents();

  return (
    <div className="space-y-6">
      {/* Interactive Color Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Interactive Color
        </label>
        <p className="text-xs text-gray-600 mb-4">
          Choose the accent color for CTAs, links, and focus states
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          {compatibleAccents.map((accent) => (
            <button
              key={accent.color}
              onClick={() => onAccentChange(accent.color)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${selectedAccent === accent.color
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`w-full h-8 rounded-md ${accent.preview} mb-2`} />
              <div className="text-xs font-medium text-gray-700">{accent.label}</div>
              
              {selectedAccent === accent.color && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {!backgroundSystem && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            Select a background system first to see compatible accent colors
          </div>
        )}
      </div>

      {/* Text Contrast Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Text Contrast
        </label>
        <p className="text-xs text-gray-600 mb-4">
          Adjust the contrast level of text hierarchy (headlines, body, muted)
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          {(['subtle', 'balanced', 'high'] as TextContrastLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onTextContrastChange(level)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${textContrast === level
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="space-y-1 mb-2">
                <div className={`h-2 rounded ${
                  level === 'subtle' ? 'bg-gray-600' : 
                  level === 'balanced' ? 'bg-gray-800' : 'bg-gray-900'
                }`} />
                <div className={`h-1 rounded ${
                  level === 'subtle' ? 'bg-gray-400' : 
                  level === 'balanced' ? 'bg-gray-600' : 'bg-gray-700'
                }`} />
                <div className={`h-1 rounded w-3/4 ${
                  level === 'subtle' ? 'bg-gray-300' : 
                  level === 'balanced' ? 'bg-gray-400' : 'bg-gray-500'
                }`} />
              </div>
              
              <div className="text-xs font-medium text-gray-700 capitalize">{level}</div>
              <div className="text-xs text-gray-500">
                {level === 'subtle' && 'Softer, elegant'}
                {level === 'balanced' && 'Standard readability'}
                {level === 'high' && 'Maximum contrast'}
              </div>
              
              {textContrast === level && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Intensity Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Overall Intensity
        </label>
        <p className="text-xs text-gray-600 mb-4">
          Scale all colors proportionally while maintaining relationships
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          {(['soft', 'medium', 'bold'] as ColorIntensityLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onIntensityChange(level)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${overallIntensity === level
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex space-x-1 mb-2">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className={`flex-1 h-6 rounded ${
                      level === 'soft' 
                        ? bar === 1 ? 'bg-blue-300' : 'bg-gray-200'
                        : level === 'medium'
                          ? bar <= 2 ? 'bg-blue-500' : 'bg-gray-200'
                          : 'bg-blue-700'
                    }`}
                  />
                ))}
              </div>
              
              <div className="text-xs font-medium text-gray-700 capitalize">{level}</div>
              <div className="text-xs text-gray-500">
                {level === 'soft' && 'Gentle, minimal'}
                {level === 'medium' && 'Balanced vibrancy'}
                {level === 'bold' && 'High impact'}
              </div>
              
              {overallIntensity === level && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-blue-800">Quick Tips</div>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Interactive Color affects all CTAs, links, and focus states</li>
              <li>• Text Contrast maintains accessibility while adjusting visual hierarchy</li>
              <li>• Overall Intensity preserves color relationships during scaling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}