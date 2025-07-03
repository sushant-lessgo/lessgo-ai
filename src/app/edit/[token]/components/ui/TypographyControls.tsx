

// /app/edit/[token]/components/ui/TypographyControls.tsx
"use client";

import React, { useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';

export function TypographyControls() {
  const { theme, setTheme } = useEditStore();
  const [showTypographyPanel, setShowTypographyPanel] = useState(false);

  const fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif', category: 'Sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'Sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif', category: 'Sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'Sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'Serif' },
    { name: 'Merriweather', value: 'Merriweather, serif', category: 'Serif' },
    { name: 'Source Code Pro', value: 'Source Code Pro, monospace', category: 'Monospace' },
  ];

  const scaleOptions = [
    { name: 'Compact', value: 'compact' },
    { name: 'Comfortable', value: 'comfortable' },
    { name: 'Spacious', value: 'spacious' },
  ];

  const handleFontChange = (type: 'heading' | 'body', fontFamily: string) => {
    setTheme({
      ...theme,
      typography: {
        ...theme.typography,
        [type === 'heading' ? 'headingFont' : 'bodyFont']: fontFamily,
      },
    });
  };

  const handleScaleChange = (scale: string) => {
    setTheme({
      ...theme,
      typography: {
        ...theme.typography,
        scale: scale as any,
      },
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowTypographyPanel(!showTypographyPanel)}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        aria-expanded={showTypographyPanel}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="hidden sm:inline">Typography</span>
      </button>

      {showTypographyPanel && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            {/* Heading Font */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heading Font
              </label>
              <select
                value={theme.typography.headingFont}
                onChange={(e) => handleFontChange('heading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.name} ({font.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Body Font */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Font
              </label>
              <select
                value={theme.typography.bodyFont}
                onChange={(e) => handleFontChange('body', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.name} ({font.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Typography Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {scaleOptions.map((scale) => (
                  <button
                    key={scale.value}
                    onClick={() => handleScaleChange(scale.value)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${theme.typography.scale === scale.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    {scale.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Preview */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="space-y-2">
                <div 
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: theme.typography.headingFont }}
                >
                  This is a heading
                </div>
                <div 
                  className="text-sm text-gray-600"
                  style={{ fontFamily: theme.typography.bodyFont }}
                >
                  This is body text that will appear in paragraphs and content sections.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showTypographyPanel && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowTypographyPanel(false)}
        />
      )}
    </div>
  );
}