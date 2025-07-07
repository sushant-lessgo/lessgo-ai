// /app/edit/[token]/components/ui/InteractiveColorPicker.tsx
"use client";

import React, { useMemo } from 'react';
import type { BackgroundSystem } from '@/types/core';

interface ColorOption {
  color: string;
  label: string;
  preview: string;
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic';
  description: string;
}

interface InteractiveColorPickerProps {
  selectedColor: string;
  backgroundSystem: BackgroundSystem | null;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export function InteractiveColorPicker({
  selectedColor,
  backgroundSystem,
  onColorChange,
  disabled = false,
}: InteractiveColorPickerProps) {
  
  const colorOptions = useMemo((): ColorOption[] => {
    if (!backgroundSystem) return [];
    
    const baseColor = backgroundSystem.baseColor;
    
    const allOptions: ColorOption[] = [
      { 
        color: baseColor, 
        label: `Match ${baseColor}`, 
        preview: `bg-${baseColor}-600`,
        harmony: 'monochromatic',
        description: 'Same color family as background'
      },
      { 
        color: 'purple', 
        label: 'Purple', 
        preview: 'bg-purple-600',
        harmony: 'analogous',
        description: 'Elegant and modern'
      },
      { 
        color: 'blue', 
        label: 'Blue', 
        preview: 'bg-blue-600',
        harmony: 'analogous',
        description: 'Trust and reliability'
      },
      { 
        color: 'green', 
        label: 'Green', 
        preview: 'bg-green-600',
        harmony: 'complementary',
        description: 'Growth and action'
      },
      { 
        color: 'orange', 
        label: 'Orange', 
        preview: 'bg-orange-600',
        harmony: 'complementary',
        description: 'Energy and enthusiasm'
      },
      { 
        color: 'red', 
        label: 'Red', 
        preview: 'bg-red-600',
        harmony: 'triadic',
        description: 'Urgency and attention'
      },
      { 
        color: 'teal', 
        label: 'Teal', 
        preview: 'bg-teal-600',
        harmony: 'analogous',
        description: 'Fresh and balanced'
      },
      { 
        color: 'indigo', 
        label: 'Indigo', 
        preview: 'bg-indigo-600',
        harmony: 'analogous',
        description: 'Professional and deep'
      },
      { 
        color: 'pink', 
        label: 'Pink', 
        preview: 'bg-pink-600',
        harmony: 'triadic',
        description: 'Creative and approachable'
      },
    ];
    
    return allOptions.filter((option, index) => 
      index === 0 || option.color !== baseColor
    ).slice(0, 9);
  }, [backgroundSystem]);

  const getHarmonyColor = (harmony: ColorOption['harmony']): string => {
    switch (harmony) {
      case 'monochromatic': return 'text-blue-600';
      case 'analogous': return 'text-green-600';
      case 'complementary': return 'text-orange-600';
      case 'triadic': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getHarmonyIcon = (harmony: ColorOption['harmony']): string => {
    switch (harmony) {
      case 'monochromatic': return '●';
      case 'analogous': return '◗';
      case 'complementary': return '◐';
      case 'triadic': return '▲';
      default: return '○';
    }
  };

  if (!backgroundSystem) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Background Required</p>
        <p className="text-xs text-gray-600">Select a background system first to see compatible interactive colors</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Interactive Color Selection</h4>
        <p className="text-xs text-gray-600">
          Choose the accent color for CTAs, links, and interactive elements
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {colorOptions.map((option) => (
          <button
            key={option.color}
            onClick={() => onColorChange(option.color)}
            disabled={disabled}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200 text-left
              ${selectedColor === option.color
                ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`w-full h-10 rounded-md ${option.preview} mb-2 shadow-sm`} />
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-700">{option.label}</div>
                <div className={`text-xs ${getHarmonyColor(option.harmony)}`}>
                  {getHarmonyIcon(option.harmony)}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 leading-tight">
                {option.description}
              </div>
              
              <div className="text-xs text-gray-400 capitalize">
                {option.harmony}
              </div>
            </div>
            
            {selectedColor === option.color && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="text-xs font-medium text-blue-800 mb-1">Color Harmony Guide</div>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">●</span>
            <span>Monochromatic - Same color family</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">◗</span>
            <span>Analogous - Adjacent colors</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-orange-600">◐</span>
            <span>Complementary - Opposite colors</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-600">▲</span>
            <span>Triadic - Three-point harmony</span>
          </div>
        </div>
      </div>
    </div>
  );
}