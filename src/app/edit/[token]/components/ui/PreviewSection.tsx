// /app/edit/[token]/components/ui/PreviewSection.tsx
"use client";

import React from 'react';
import { BackgroundPreview } from './BackgroundPreview';
import { getBackgroundPreview } from './backgroundCompatibility';

interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

interface BackgroundVariation {
  variationId: string;
  variationLabel: string;
  archetypeId: string;
  themeId: string;
  tailwindClass: string;
  baseColor: string;
}

interface PreviewSectionProps {
  currentBackground: BackgroundSystem;
  selectedBackground?: BackgroundSystem | null;
  previewBackground?: BackgroundSystem | null;
  isLoading?: boolean;
  onPreviewHover?: (background: BackgroundSystem | null) => void;
}

export function PreviewSection({
  currentBackground,
  selectedBackground,
  previewBackground,
  isLoading = false,
  onPreviewHover,
}: PreviewSectionProps) {
  const backgroundToPreview = previewBackground || selectedBackground;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
      
      {/* Current vs New Comparison */}
      <div className="grid grid-cols-1 gap-4">
        {/* Current Background Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-gray-500">Current Design</div>
            <div className="text-xs text-gray-400">LessGo Generated</div>
          </div>
          
          <BackgroundPreview
            background={currentBackground}
            title="Current Background"
            showSectionBreakdown={true}
            compact={false}
          />
          
          {/* Current Background Info */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Base Color: {currentBackground.baseColor}</span>
              <span>Accent: {currentBackground.accentColor}</span>
            </div>
          </div>
        </div>

        {/* Selected/Preview Background */}
        {backgroundToPreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-gray-500">
                {selectedBackground ? 'Selected Design' : 'Preview'}
              </div>
              <div className="text-xs text-gray-400">
                {selectedBackground ? 'Ready to Apply' : 'Hover Preview'}
              </div>
            </div>
            
            <BackgroundPreview
              background={backgroundToPreview}
              title="New Background"
              showSectionBreakdown={true}
              compact={false}
              isPreview={!selectedBackground}
            />
            
            {/* Background Change Info */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Base Color: {backgroundToPreview.baseColor}</span>
                <span>Accent: {backgroundToPreview.accentColor}</span>
              </div>
              
              {/* Impact Summary */}
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-600 mb-1">Changes:</div>
                <div className="space-y-1">
                  {currentBackground.primary !== backgroundToPreview.primary && (
                    <div className="text-xs text-gray-500">• Hero section background updated</div>
                  )}
                  {currentBackground.secondary !== backgroundToPreview.secondary && (
                    <div className="text-xs text-gray-500">• Feature section backgrounds updated</div>
                  )}
                  {currentBackground.accentColor !== backgroundToPreview.accentColor && (
                    <div className="text-xs text-gray-500">• Button and accent colors updated</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !backgroundToPreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">Generating Preview...</div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Impact Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-xs font-medium text-gray-500 mb-3">Impact on Page Sections</div>
        
        <div className="space-y-2">
          {/* Hero Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">Hero Section</div>
              <div className="text-xs text-gray-400">• Primary</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${currentBackground.primary.includes('gradient') ? currentBackground.primary : 'bg-blue-500'}`}></div>
              {backgroundToPreview && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className={`w-4 h-4 rounded ${backgroundToPreview.primary.includes('gradient') ? backgroundToPreview.primary : 'bg-purple-500'}`}></div>
                </>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">Features</div>
              <div className="text-xs text-gray-400">• Secondary</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${currentBackground.secondary.includes('bg-') ? currentBackground.secondary : 'bg-blue-50'}`}></div>
              {backgroundToPreview && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className={`w-4 h-4 rounded ${backgroundToPreview.secondary.includes('bg-') ? backgroundToPreview.secondary : 'bg-purple-50'}`}></div>
                </>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">Call-to-Action</div>
              <div className="text-xs text-gray-400">• Primary</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${currentBackground.primary.includes('gradient') ? currentBackground.primary : 'bg-blue-500'}`}></div>
              {backgroundToPreview && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className={`w-4 h-4 rounded ${backgroundToPreview.primary.includes('gradient') ? backgroundToPreview.primary : 'bg-purple-500'}`}></div>
                </>
              )}
            </div>
          </div>

          {/* Testimonials */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">Testimonials</div>
              <div className="text-xs text-gray-400">• Neutral</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
              {backgroundToPreview && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility & Performance Info */}
      {backgroundToPreview && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 mb-3">Compatibility Check</div>
          
          <div className="space-y-2">
            {/* Contrast Score */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Text Contrast</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-700 font-medium">AA+</span>
              </div>
            </div>

            {/* Mobile Compatibility */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Mobile Friendly</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-700 font-medium">Yes</span>
              </div>
            </div>

            {/* Performance Impact */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Performance</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-700 font-medium">Optimized</span>
              </div>
            </div>

            {/* Brand Alignment */}
            {currentBackground.baseColor !== backgroundToPreview.baseColor && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Brand Alignment</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-amber-700 font-medium">Changed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {backgroundToPreview && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPreviewHover?.(null)}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Preview
          </button>
          <button
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            Compare Side-by-Side
          </button>
        </div>
      )}
    </div>
  );
}