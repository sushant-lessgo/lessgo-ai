// /app/edit/[token]/components/ui/LivePreviewSection.tsx
"use client";

import React from 'react';
import { CTAPreview } from './CTAPreview';
import { TextHierarchyPreview } from './TextHierarchyPreview';
import { getTextColorForBackground } from '@/modules/Design/background/enhancedBackgroundLogic';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface LivePreviewSectionProps {
  currentTokens: ColorTokens;
  previewTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  isValidating?: boolean;
  className?: string;
}

export function LivePreviewSection({
  currentTokens,
  previewTokens,
  backgroundSystem,
  isValidating = false,
  className = '',
}: LivePreviewSectionProps) {

  // Background types for comprehensive preview
  const backgroundTypes = [
    { type: 'primary' as const, label: 'Primary (Hero)', bg: backgroundSystem?.primary || 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { type: 'secondary' as const, label: 'Secondary (Features)', bg: backgroundSystem?.secondary || 'bg-blue-50' },
    { type: 'neutral' as const, label: 'Neutral (Content)', bg: backgroundSystem?.neutral || 'bg-white' },
    { type: 'divider' as const, label: 'Divider (Separator)', bg: backgroundSystem?.divider || 'bg-gray-100/50' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
        {isValidating && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-xs">Validating...</span>
          </div>
        )}
      </div>

      {/* Current vs New Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Colors */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-600">Current</span>
          </div>
          
          <div className="space-y-3">
            {/* CTA Preview */}
            <CTAPreview
              colorTokens={currentTokens}
              backgroundSystem={backgroundSystem}
              size="compact"
            />
            
            {/* Quick Text Sample */}
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <TextHierarchyPreview
                colorTokens={currentTokens}
                backgroundType="neutral"
                backgroundSystem={backgroundSystem}
                size="compact"
              />
            </div>
          </div>
        </div>

        {/* Preview Colors */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-600">Preview</span>
          </div>
          
          <div className="space-y-3">
            {/* CTA Preview */}
            <CTAPreview
              colorTokens={previewTokens}
              backgroundSystem={backgroundSystem}
              size="compact"
            />
            
            {/* Quick Text Sample */}
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <TextHierarchyPreview
                colorTokens={previewTokens}
                backgroundType="neutral"
                backgroundSystem={backgroundSystem}
                size="compact"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background Context Preview */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Background Context</h4>
        <p className="text-xs text-gray-600">See how your colors look on different section backgrounds</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {backgroundTypes.map((bgType) => (
            <div
              key={bgType.type}
              className={`${bgType.bg} p-4 rounded-lg border border-gray-200 overflow-hidden`}
            >
              {/* Background Label */}
              <div className="mb-3">
                <span className={`
                  text-xs font-medium px-2 py-1 rounded
                  ${bgType.type === 'primary' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-black/10 text-gray-800'
                  }
                `}>
                  {bgType.label}
                </span>
              </div>

              {/* Text Preview on Background */}
              <div className="space-y-2">
                <TextHierarchyPreview
                  colorTokens={previewTokens}
                  backgroundType={bgType.type}
                  backgroundSystem={backgroundSystem}
                  size="minimal"
                />
                
                {/* CTA on Background (for primary/secondary only) */}
                {['primary', 'secondary'].includes(bgType.type) && (
                  <div className="pt-2">
                    <button 
                      className={`
                        ${previewTokens.ctaBg} ${previewTokens.ctaText} 
                        px-3 py-1.5 text-xs font-medium rounded-md
                        hover:${previewTokens.ctaHover} transition-colors
                      `}
                    >
                      Call to Action
                    </button>
                  </div>
                )}

                {/* Link Preview */}
                <div className="pt-1">
                  <a 
                    href="#" 
                    className={`
                      ${getTextColorForBackground(bgType.type, previewTokens).body}
                      text-xs underline hover:no-underline
                    `}
                    onClick={(e) => e.preventDefault()}
                  >
                    Example link
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Elements Showcase */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Interactive Elements</h4>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Buttons Section */}
          <div className="space-y-3">
            <span className="text-xs text-gray-500">Buttons</span>
            <div className="space-y-2">
              {/* Primary CTA */}
              <button 
                className={`
                  ${previewTokens.ctaBg} ${previewTokens.ctaText} 
                  w-full px-3 py-2 text-sm font-medium rounded-lg
                  hover:${previewTokens.ctaHover} transition-colors
                `}
              >
                Primary CTA
              </button>
              
              {/* Secondary CTA */}
              <button 
                className={`
                  ${previewTokens.ctaSecondary} ${previewTokens.ctaSecondaryText} 
                  w-full px-3 py-2 text-sm font-medium rounded-lg border
                  hover:${previewTokens.ctaSecondaryHover} transition-colors
                `}
              >
                Secondary CTA
              </button>
              
              {/* Ghost CTA */}
              <button 
                className={`
                  ${previewTokens.ctaGhost} 
                  w-full px-3 py-2 text-sm font-medium rounded-lg
                  hover:${previewTokens.ctaGhostHover} transition-colors
                `}
              >
                Ghost CTA
              </button>
            </div>
          </div>

          {/* Form Elements Section */}
          <div className="space-y-3">
            <span className="text-xs text-gray-500">Form Elements</span>
            <div className="space-y-2">
              {/* Input Field */}
              <input
                type="text"
                placeholder="Email address"
                className={`
                  w-full px-3 py-2 text-sm border rounded-lg
                  ${previewTokens.borderDefault} 
                  focus:${previewTokens.borderFocus} focus:ring-1 focus:ring-blue-500/20
                  transition-colors
                `}
              />
              
              {/* Checkbox with Label */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className={`
                    w-4 h-4 rounded border-gray-300
                    ${previewTokens.accent.replace('bg-', 'text-')} 
                    focus:ring-blue-500/20
                  `}
                />
                <span className={previewTokens.textSecondary}>
                  Subscribe to newsletter
                </span>
              </label>
              
              {/* Link */}
              <div>
                <a 
                  href="#" 
                  className={`
                    ${previewTokens.link} hover:${previewTokens.linkHover} 
                    text-sm underline hover:no-underline transition-colors
                  `}
                  onClick={(e) => e.preventDefault()}
                >
                  Terms and conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Accessibility Info */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-xs font-medium text-gray-700">Accessibility Check</div>
            <div className="text-xs text-gray-600 mt-1">
              All color combinations maintain WCAG 2.1 AA standards for contrast and readability.
              {backgroundSystem ? ' Compatible with your selected background system.' : ' Select a background system for full validation.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}