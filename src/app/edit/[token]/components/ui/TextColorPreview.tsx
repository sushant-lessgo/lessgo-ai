// TextColorPreview.tsx - Live preview of text color changes
"use client";

import React from 'react';
import { getSmartTextColor, validateWCAGContrast } from '@/utils/improvedTextColors';

interface TextColorPreviewProps {
  mode: 'auto' | 'manual';
  overrides: {
    heading?: string;
    body?: string;
    muted?: string;
  };
  contrastLevel: number;
  backgrounds: { name: string; value: string }[];
}

function adjustColorContrast(color: string, level: number): string {
  // Simple contrast adjustment - in practice, this would need more sophisticated logic
  // For now, just return the original color
  return color;
}

export function TextColorPreview({ mode, overrides, contrastLevel, backgrounds }: TextColorPreviewProps) {
  
  const getTextColor = (type: 'heading' | 'body' | 'muted', background: string) => {
    if (mode === 'manual' && overrides[type]) {
      return overrides[type];
    }
    
    // Auto mode - get smart color and adjust for contrast
    try {
      const smartColor = getSmartTextColor(background, type);
      return adjustColorContrast(smartColor, contrastLevel);
    } catch (error) {
      // Fallback colors
      const fallbacks = {
        heading: '#111827', // gray-900
        body: '#374151',    // gray-700
        muted: '#6b7280'    // gray-500
      };
      return fallbacks[type];
    }
  };

  const getValidationStatus = (textColor: string, backgroundColor: string) => {
    try {
      const { ratio, meetsAA, meetsAAA } = validateWCAGContrast(textColor, backgroundColor);
      return {
        ratio,
        level: meetsAAA ? 'AAA' : meetsAA ? 'AA' : 'Fail',
        meetsAA,
        meetsAAA
      };
    } catch (error) {
      return { ratio: 0, level: 'Fail', meetsAA: false, meetsAAA: false };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
            mode === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {mode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
          </span>
          <span>Contrast: {contrastLevel}%</span>
        </div>
      </div>

      {/* Preview on different backgrounds */}
      <div className="space-y-4">
        {backgrounds.length > 0 ? (
          backgrounds.map((bg, index) => {
            const headingColor = getTextColor('heading', bg.value);
            const bodyColor = getTextColor('body', bg.value);
            const mutedColor = getTextColor('muted', bg.value);
            
            // Get validation for each text type
            const headingValidation = getValidationStatus(headingColor, bg.value);
            const bodyValidation = getValidationStatus(bodyColor, bg.value);
            const mutedValidation = getValidationStatus(mutedColor, bg.value);

            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">{bg.name} Background</h4>
                    <div className="text-xs text-gray-500">{bg.value}</div>
                  </div>
                </div>
                
                <div 
                  className={`p-6 ${bg.value}`}
                  style={{ 
                    backgroundColor: bg.value.includes('#') ? bg.value : undefined 
                  }}
                >
                  <div className="space-y-4">
                    {/* Heading Sample */}
                    <div className="space-y-1">
                      <h2 
                        className="text-2xl font-bold"
                        style={{ color: headingColor }}
                      >
                        Sample Heading Text
                      </h2>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          headingValidation.level === 'AAA' ? 'bg-green-100 text-green-700' :
                          headingValidation.level === 'AA' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {headingValidation.level}
                        </span>
                        <span className="text-gray-500">
                          {headingValidation.ratio ? headingValidation.ratio.toFixed(1) : '0.0'}:1 contrast
                        </span>
                      </div>
                    </div>

                    {/* Body Sample */}
                    <div className="space-y-1">
                      <p 
                        className="text-base"
                        style={{ color: bodyColor }}
                      >
                        This is sample body text that shows how regular content will appear with the selected text colors. It should be easily readable while maintaining good visual hierarchy.
                      </p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          bodyValidation.level === 'AAA' ? 'bg-green-100 text-green-700' :
                          bodyValidation.level === 'AA' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {bodyValidation.level}
                        </span>
                        <span className="text-gray-500">
                          {bodyValidation.ratio ? bodyValidation.ratio.toFixed(1) : '0.0'}:1 contrast
                        </span>
                      </div>
                    </div>

                    {/* Muted Sample */}
                    <div className="space-y-1">
                      <p 
                        className="text-sm"
                        style={{ color: mutedColor }}
                      >
                        This is muted text used for secondary information, timestamps, and less important content.
                      </p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          mutedValidation.level === 'AAA' ? 'bg-green-100 text-green-700' :
                          mutedValidation.level === 'AA' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {mutedValidation.level}
                        </span>
                        <span className="text-gray-500">
                          {mutedValidation.ratio ? mutedValidation.ratio.toFixed(1) : '0.0'}:1 contrast
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No backgrounds available for preview.</p>
            <p className="text-xs mt-1">Set up backgrounds in the Background System first.</p>
          </div>
        )}
      </div>

      {/* Overall Status */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Accessibility Summary</h4>
        <div className="text-xs text-gray-600">
          <p className="mb-1">
            <strong>WCAG AA:</strong> Requires 4.5:1 contrast ratio for normal text
          </p>
          <p>
            <strong>WCAG AAA:</strong> Requires 7:1 contrast ratio for enhanced accessibility
          </p>
        </div>
      </div>
    </div>
  );
}