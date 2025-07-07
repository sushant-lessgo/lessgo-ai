// /app/edit/[token]/components/ui/TextContrastSlider.tsx
"use client";

import React from 'react';
import type { TextContrastLevel, BackgroundSystem } from '@/types/core';

interface TextContrastSliderProps {
  value: TextContrastLevel;
  backgroundSystem: BackgroundSystem | null;
  onChange: (level: TextContrastLevel) => void;
  disabled?: boolean;
}

export function TextContrastSlider({
  value,
  backgroundSystem,
  onChange,
  disabled = false,
}: TextContrastSliderProps) {
  
  const levels: Array<{
    level: TextContrastLevel;
    label: string;
    description: string;
    accessibilityNote: string;
  }> = [
    {
      level: 'subtle',
      label: 'Subtle',
      description: 'Softer contrast for elegant aesthetics',
      accessibilityNote: 'May not meet WCAG AA for small text'
    },
    {
      level: 'balanced',
      label: 'Balanced',
      description: 'Standard readability with visual appeal',
      accessibilityNote: 'Meets WCAG AA standards'
    },
    {
      level: 'high',
      label: 'High',
      description: 'Maximum contrast for accessibility',
      accessibilityNote: 'Exceeds WCAG AAA standards'
    },
  ];

  const getPreviewColors = (level: TextContrastLevel) => {
    if (!backgroundSystem) {
      return {
        primary: 'text-gray-800',
        secondary: 'text-gray-600',
        muted: 'text-gray-400'
      };
    }

    const baseColor = backgroundSystem.baseColor;
    
    switch (level) {
      case 'subtle':
        return {
          primary: `text-${baseColor}-700`,
          secondary: `text-${baseColor}-500`,
          muted: `text-${baseColor}-400`
        };
      case 'balanced':
        return {
          primary: `text-${baseColor}-800`,
          secondary: `text-${baseColor}-600`,
          muted: `text-${baseColor}-400`
        };
      case 'high':
        return {
          primary: `text-${baseColor}-900`,
          secondary: `text-${baseColor}-700`,
          muted: `text-${baseColor}-500`
        };
    }
  };

  const getAccessibilityIcon = (level: TextContrastLevel) => {
    switch (level) {
      case 'subtle':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'balanced':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Text Contrast Level</h4>
        <p className="text-xs text-gray-600">
          Adjust the contrast of text hierarchy while maintaining accessibility
        </p>
      </div>

      <div className="space-y-3">
        {levels.map((levelOption) => {
          const previewColors = getPreviewColors(levelOption.level);
          const isSelected = value === levelOption.level;
          
          return (
            <button
              key={levelOption.level}
              onClick={() => onChange(levelOption.level)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-700">{levelOption.label}</div>
                  {getAccessibilityIcon(levelOption.level)}
                </div>
                
                {isSelected && (
                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-3">{levelOption.description}</div>

              <div className="space-y-2 mb-3">
                <div className={`text-sm font-semibold ${previewColors.primary}`}>
                  Primary headline text
                </div>
                <div className={`text-sm ${previewColors.secondary}`}>
                  Secondary body text content
                </div>
                <div className={`text-sm ${previewColors.muted}`}>
                  Muted text and captions
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">Accessibility:</div>
                <div className="text-xs text-gray-600">{levelOption.accessibilityNote}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-green-800">Accessibility Tips</div>
            <ul className="text-xs text-green-700 mt-1 space-y-1">
              <li>• Text hierarchy is preserved across all contrast levels</li>
              <li>• Background-aware colors ensure readability on all sections</li>
              <li>• Changes apply to all text elements maintaining relationships</li>
            </ul>
          </div>
        </div>
      </div>

      {!backgroundSystem && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-amber-800">Background Required</div>
              <div className="text-xs text-amber-700 mt-1">
                Select a background system first for accurate text color previews
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}