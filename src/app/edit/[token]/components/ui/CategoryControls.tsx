// /app/edit/[token]/components/ui/CategoryControls.tsx
"use client";

import React, { useState } from 'react';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface CategoryControlsProps {
  currentTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  onTokensChange: (tokens: Partial<ColorTokens>) => void;
  disabled?: boolean;
}

type ColorCategory = 'interactive' | 'text' | 'surfaces';

interface CategoryConfig {
  id: ColorCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  tokens: Array<{
    key: keyof ColorTokens;
    label: string;
    description: string;
  }>;
}

export function CategoryControls({
  currentTokens,
  backgroundSystem,
  onTokensChange,
  disabled = false,
}: CategoryControlsProps) {
  const [activeCategory, setActiveCategory] = useState<ColorCategory>('interactive');
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  const categories: CategoryConfig[] = [
    {
      id: 'interactive',
      label: 'Interactive Elements',
      description: 'CTAs, links, buttons, and focus states',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      tokens: [
        { key: 'ctaBg', label: 'Primary CTA', description: 'Main action buttons' },
        { key: 'ctaSecondary', label: 'Secondary CTA', description: 'Secondary action buttons' },
        { key: 'ctaGhost', label: 'Ghost CTA', description: 'Minimal action buttons' },
        { key: 'link', label: 'Links', description: 'Text links and navigation' },
        { key: 'accent', label: 'Accent Color', description: 'Brand accent elements' },
        { key: 'borderFocus', label: 'Focus Border', description: 'Keyboard focus indicators' },
      ],
    },
    {
      id: 'text',
      label: 'Text & Readability',
      description: 'Text hierarchy and content readability',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      tokens: [
        { key: 'textPrimary', label: 'Primary Text', description: 'Headlines and main content' },
        { key: 'textSecondary', label: 'Secondary Text', description: 'Body text and descriptions' },
        { key: 'textMuted', label: 'Muted Text', description: 'Captions and subtle text' },
        { key: 'textOnLight', label: 'Text on Light', description: 'Text over light backgrounds' },
        { key: 'textOnDark', label: 'Text on Dark', description: 'Text over dark backgrounds' },
        { key: 'textOnAccent', label: 'Text on Accent', description: 'Text over accent colors' },
      ],
    },
    {
      id: 'surfaces',
      label: 'Surfaces & Backgrounds',
      description: 'Cards, sections, and background elements',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      tokens: [
        { key: 'surfaceCard', label: 'Card Surface', description: 'Card backgrounds' },
        { key: 'surfaceElevated', label: 'Elevated Surface', description: 'Raised elements' },
        { key: 'surfaceSection', label: 'Section Surface', description: 'Section backgrounds' },
        { key: 'borderDefault', label: 'Default Border', description: 'Standard borders' },
        { key: 'borderSubtle', label: 'Subtle Border', description: 'Light separators' },
      ],
    },
  ];

  const activeConfig = categories.find(c => c.id === activeCategory);

  const handleTokenChange = (tokenKey: keyof ColorTokens, value: string) => {
    onTokensChange({ [tokenKey]: value });
  };

  const getTokenPreview = (tokenKey: keyof ColorTokens, value: string) => {
    if (tokenKey.startsWith('text')) {
      return (
        <div className={`w-full h-8 bg-white border border-gray-200 rounded flex items-center justify-center`}>
          <span className={`text-sm font-medium ${value}`}>Aa</span>
        </div>
      );
    }
    
    if (tokenKey.startsWith('border')) {
      return (
        <div className={`w-full h-8 bg-white rounded border-2 ${value}`} />
      );
    }
    
    return <div className={`w-full h-8 rounded ${value}`} />;
  };

  const getColorIntensityOptions = (baseColor: string): Array<{ value: string; label: string }> => {
    if (!baseColor) return [];
    
    return [
      { value: `bg-${baseColor}-50`, label: '50' },
      { value: `bg-${baseColor}-100`, label: '100' },
      { value: `bg-${baseColor}-200`, label: '200' },
      { value: `bg-${baseColor}-300`, label: '300' },
      { value: `bg-${baseColor}-400`, label: '400' },
      { value: `bg-${baseColor}-500`, label: '500' },
      { value: `bg-${baseColor}-600`, label: '600' },
      { value: `bg-${baseColor}-700`, label: '700' },
      { value: `bg-${baseColor}-800`, label: '800' },
      { value: `bg-${baseColor}-900`, label: '900' },
    ];
  };

  if (!backgroundSystem) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">Background Required</p>
        <p className="text-xs text-gray-600">Select a background system first to access category controls</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Category Controls</h4>
        <p className="text-xs text-gray-600">
          Fine-tune color groups for advanced customization
        </p>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              disabled={disabled}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors
                ${activeCategory === category.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={activeCategory === category.id ? 'text-gray-900' : 'text-gray-400'}>
                {category.icon}
              </span>
              <span>{category.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Category Content */}
      {activeConfig && (
        <div className="space-y-4">
          <div className="text-xs text-gray-600">{activeConfig.description}</div>

          <div className="space-y-3">
            {activeConfig.tokens.map((token) => {
              const currentValue = currentTokens[token.key];
              const isExpanded = expandedToken === token.key;
              
              return (
                <div key={token.key} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedToken(isExpanded ? null : token.key)}
                    disabled={disabled}
                    className={`
                      w-full p-3 text-left transition-colors
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden">
                          {getTokenPreview(token.key, currentValue)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{token.label}</div>
                          <div className="text-xs text-gray-500">{token.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {currentValue}
                        </code>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs text-gray-600 mb-3">
                        Choose intensity for {backgroundSystem.baseColor} color family:
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {getColorIntensityOptions(backgroundSystem.baseColor).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleTokenChange(token.key, option.value)}
                            disabled={disabled}
                            className={`
                              p-2 rounded border transition-all
                              ${currentValue === option.value
                                ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <div className={`w-full h-6 rounded mb-1 ${option.value}`} />
                            <div className="text-xs text-gray-600">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-amber-800">Advanced Controls</div>
            <div className="text-xs text-amber-700 mt-1">
              Category-level changes may override semantic relationships. Test accessibility after changes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}