// /app/edit/[token]/components/ui/IntensitySlider.tsx
"use client";

import React from 'react';
import type { ColorIntensityLevel } from '@/types/core';

interface IntensitySliderProps {
  value: ColorIntensityLevel;
  onChange: (level: ColorIntensityLevel) => void;
  disabled?: boolean;
}

export function IntensitySlider({
  value,
  onChange,
  disabled = false,
}: IntensitySliderProps) {
  
  const levels: Array<{
    level: ColorIntensityLevel;
    label: string;
    description: string;
    impact: string;
    intensityValue: number;
  }> = [
    {
      level: 'soft',
      label: 'Soft',
      description: 'Gentle, minimal visual impact',
      impact: 'Elegant and understated',
      intensityValue: 400
    },
    {
      level: 'medium',
      label: 'Medium',
      description: 'Balanced vibrancy and professionalism',
      impact: 'Standard recommendation',
      intensityValue: 600
    },
    {
      level: 'bold',
      label: 'Bold',
      description: 'High impact, vibrant colors',
      impact: 'Strong brand presence',
      intensityValue: 700
    },
  ];

  const getIntensityBars = (level: ColorIntensityLevel) => {
    const levelData = levels.find(l => l.level === level);
    const baseIntensity = levelData?.intensityValue || 600;
    
    return [
      { active: true, intensity: Math.max(200, baseIntensity - 200) },
      { active: level !== 'soft', intensity: baseIntensity },
      { active: level === 'bold', intensity: Math.min(800, baseIntensity + 100) },
    ];
  };

  const getSliderPosition = (level: ColorIntensityLevel): number => {
    switch (level) {
      case 'soft': return 16.67; // ~1/6
      case 'medium': return 50;   // 1/2
      case 'bold': return 83.33;  // ~5/6
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Color Intensity</h4>
        <p className="text-xs text-gray-600">
          Scale all colors proportionally while maintaining their relationships
        </p>
      </div>

      {/* Visual Slider */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full relative overflow-hidden">
          {/* Gradient track */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-blue-600 to-blue-800 rounded-full" />
          
          {/* Slider thumb */}
          <div 
            className="absolute top-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full shadow-sm transform -translate-y-1/2 transition-all duration-200"
            style={{ left: `calc(${getSliderPosition(value)}% - 8px)` }}
          />
          
          {/* Level markers */}
          {levels.map((level, index) => (
            <div
              key={level.level}
              className="absolute top-1/2 w-2 h-2 bg-white border border-gray-300 rounded-full transform -translate-y-1/2"
              style={{ left: `calc(${getSliderPosition(level.level)}% - 4px)` }}
            />
          ))}
        </div>

        {/* Level labels */}
        <div className="flex justify-between mt-2">
          {levels.map((level) => (
            <button
              key={level.level}
              onClick={() => onChange(level.level)}
              disabled={disabled}
              className={`
                text-xs font-medium transition-colors
                ${value === level.level ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level Cards */}
      <div className="grid grid-cols-3 gap-3">
        {levels.map((levelOption) => {
          const isSelected = value === levelOption.level;
          const bars = getIntensityBars(levelOption.level);
          
          return (
            <button
              key={levelOption.level}
              onClick={() => onChange(levelOption.level)}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Intensity visualization */}
              <div className="flex space-x-1 mb-3">
                {bars.map((bar, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-6 rounded transition-all duration-200 ${
                      bar.active 
                        ? `bg-blue-${bar.intensity === 200 ? '300' : bar.intensity === 600 ? '600' : bar.intensity === 700 ? '700' : '800'}` 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">{levelOption.label}</div>
                <div className="text-xs text-gray-600">{levelOption.description}</div>
                <div className="text-xs text-gray-500">{levelOption.impact}</div>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Selection Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-blue-800">
              Current: {levels.find(l => l.level === value)?.label} Intensity
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {levels.find(l => l.level === value)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Intensity Effects Info */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">What This Affects</div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• All interactive colors (CTAs, links, focus states)</li>
          <li>• Background and surface color intensities</li>
          <li>• Border and accent color vibrancy</li>
          <li>• Maintains color relationships and accessibility</li>
        </ul>
      </div>
    </div>
  );
}