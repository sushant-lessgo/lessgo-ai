// /app/edit/[token]/components/ui/StyleOption.tsx
"use client";

import React, { useState } from 'react';
import { getBackgroundPreview } from './backgroundCompatibility';
import { validateBackgroundVariation } from './backgroundValidation';
import type { BackgroundVariation, BrandColors } from '@/types/core';

interface StyleOptionProps {
  variation: BackgroundVariation;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
  brandColors?: BrandColors | null;
  showValidation?: boolean;
  disabled?: boolean;
}

export function StyleOption({
  variation,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
  showDetails = true,
  size = 'medium',
  layout = 'vertical',
  brandColors = null,
  showValidation = false,
  disabled = false,
}: StyleOptionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Get background preview data
  const previewData = getBackgroundPreview(variation);
  
  // Validate background if requested
  React.useEffect(() => {
    if (showValidation) {
      const result = validateBackgroundVariation(variation, brandColors);
      setValidationResult(result);
    }
  }, [variation, brandColors, showValidation]);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'h-16',
      preview: 'h-12',
      text: 'text-xs',
      padding: 'p-2',
    },
    medium: {
      container: 'h-24',
      preview: 'h-16',
      text: 'text-sm',
      padding: 'p-3',
    },
    large: {
      container: 'h-32',
      preview: 'h-20',
      text: 'text-base',
      padding: 'p-4',
    },
  };

  const config = sizeConfig[size];

  // Helper to convert Tailwind classes to inline styles
  const getBackgroundStyle = (bgClass: string) => {
    // Handle gradients
    if (bgClass.includes('gradient-to-br') && bgClass.includes('from-blue-300') && bgClass.includes('to-white')) {
      return { background: 'linear-gradient(to bottom right, #93c5fd, #ffffff)' };
    }
    if (bgClass.includes('gradient-to-br')) {
      if (bgClass.includes('blue-500') && bgClass.includes('purple-600')) {
        return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
      }
      if (bgClass.includes('orange-400') && bgClass.includes('pink-400')) {
        return { background: 'linear-gradient(to bottom right, #fb923c, #f472b6)' };
      }
      if (bgClass.includes('green-500') && bgClass.includes('teal-400')) {
        return { background: 'linear-gradient(to bottom right, #22c55e, #2dd4bf)' };
      }
    }
    
    if (bgClass.includes('gradient-to-tr')) {
      if (bgClass.includes('blue-500') && bgClass.includes('sky-300')) {
        return { background: 'linear-gradient(to top right, #3b82f6, #7dd3fc)' };
      }
      if (bgClass.includes('from-blue-500') && bgClass.includes('to-sky-300')) {
        return { background: 'linear-gradient(to top right, #3b82f6, #7dd3fc)' };
      }
    }
    
    if (bgClass.includes('gradient-to-tl')) {
      if (bgClass.includes('sky-400') && bgClass.includes('indigo-400')) {
        return { background: 'linear-gradient(to top left, #38bdf8, #818cf8)' };
      }
      if (bgClass.includes('from-sky-400') && bgClass.includes('to-indigo-400')) {
        return { background: 'linear-gradient(to top left, #38bdf8, #818cf8)' };
      }
    }

    if (bgClass.includes('radial-gradient')) {
      if (bgClass.includes('from-blue-400')) {
        return { background: 'radial-gradient(ellipse at center, #60a5fa, transparent)' };
      }
      if (bgClass.includes('from-sky-300')) {
        return { background: 'radial-gradient(ellipse at top, #7dd3fc, transparent)' };
      }
      return { background: 'radial-gradient(ellipse at center, #3b82f6, #1e40af)' };
    }

    // Handle white with opacity and backdrop blur
    if (bgClass.includes('bg-white') && bgClass.includes('bg-opacity-60')) {
      return { background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)' };
    }
    
    // Handle solid colors
    const colorMap: Record<string, string> = {
      'bg-blue-50': '#eff6ff',
      'bg-blue-100': '#dbeafe',
      'bg-blue-500': '#3b82f6',
      'bg-blue-600': '#2563eb',
      'bg-purple-50': '#faf5ff',
      'bg-purple-500': '#a855f7',
      'bg-purple-600': '#9333ea',
      'bg-green-50': '#f0fdf4',
      'bg-green-500': '#22c55e',
      'bg-orange-50': '#fff7ed',
      'bg-orange-500': '#f97316',
      'bg-teal-50': '#f0fdfa',
      'bg-teal-500': '#14b8a6',
      'bg-amber-50': '#fffbeb',
      'bg-amber-500': '#f59e0b',
      'bg-white': '#ffffff',
      'bg-gray-50': '#f9fafb',
      'bg-gray-100': '#f3f4f6',
      'bg-gray-500': '#6b7280',
    };
    
    for (const [className, color] of Object.entries(colorMap)) {
      if (bgClass.includes(className)) {
        return { backgroundColor: color };
      }
    }
    
    // Fallback
    return { backgroundColor: '#f3f4f6' };
  };

  // Format archetype name for display
  const formatArchetypeName = (archetypeId: string) => {
    return archetypeId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Container classes
  const containerClasses = `
    group relative cursor-pointer transition-all duration-200 rounded-lg border-2 overflow-hidden
    ${isSelected 
      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
      : 'border-gray-200 hover:border-gray-300'
    }
    ${isHovered ? 'shadow-lg transform scale-105' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${layout === 'horizontal' ? 'flex items-center' : ''}
  `;

  if (layout === 'horizontal') {
    return (
      <div
        className={containerClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Preview Section */}
        <div className="w-24 h-16 flex-shrink-0">
          <div
            className="w-full h-full"
            style={getBackgroundStyle(variation.tailwindClass)}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate text-sm">
                {variation.variationLabel}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {formatArchetypeName(variation.archetypeId)}
              </p>
              
              {showDetails && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {variation.baseColor}
                  </span>
                  {variation.tailwindClass.includes('gradient') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-600">
                      Gradient
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Validation indicator */}
            {showValidation && validationResult && (
              <div className="flex-shrink-0 ml-2">
                <div className={`w-2 h-2 rounded-full ${
                  validationResult.score >= 80 ? 'bg-green-500' :
                  validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Validation score: ${validationResult.score}%`} />
              </div>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Preview */}
      <div className={`relative ${config.preview} w-full`}>
        <div
          className="w-full h-full"
          style={getBackgroundStyle(variation.tailwindClass)}
        />
        
        {/* Hover overlay */}
        {isHovered && !disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
            <div className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
              Preview
            </div>
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Validation indicator */}
        {showValidation && validationResult && (
          <div className="absolute top-2 left-2">
            <div className={`w-3 h-3 rounded-full ${
              validationResult.score >= 80 ? 'bg-green-500' :
              validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} title={`Validation score: ${validationResult.score}%`} />
          </div>
        )}
      </div>

      {/* Content */}
      {showDetails && (
        <div className={config.padding}>
          <h3 className={`font-medium text-gray-900 truncate ${config.text}`}>
            {variation.variationLabel}
          </h3>
          
          {size !== 'small' && (
            <>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {formatArchetypeName(variation.archetypeId)}
              </p>
              
              <div className="flex items-center space-x-1 mt-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {variation.baseColor}
                </span>
                {variation.tailwindClass.includes('gradient') && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-600">
                    Gradient
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimal label for small size */}
      {!showDetails && size === 'small' && (
        <div className="px-2 py-1 text-center">
          <div className="text-xs font-medium text-gray-700 truncate">
            {variation.variationLabel.split(' ')[0]}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Style option with expanded details
 */
interface DetailedStyleOptionProps extends StyleOptionProps {
  showCompatibility?: boolean;
  showPreview?: boolean;
}

export function DetailedStyleOption({
  variation,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
  brandColors = null,
  showCompatibility = false,
  showPreview = false,
  disabled = false,
}: DetailedStyleOptionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const validationResult = showCompatibility 
    ? validateBackgroundVariation(variation, brandColors)
    : null;

  return (
    <div className="space-y-2">
      <StyleOption
        variation={variation}
        isSelected={isSelected}
        onClick={onClick}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        showDetails={true}
        size="large"
        brandColors={brandColors}
        showValidation={showCompatibility}
        disabled={disabled}
      />
      
      {/* Toggle details */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? 'Less details' : 'More details'}
        </button>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          {/* Technical details */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Technical Details</h4>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>Archetype: {formatArchetypeName(variation.archetypeId)}</div>
              <div>Theme: {variation.themeId}</div>
              <div>Base Color: {variation.baseColor}</div>
              <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                {variation.tailwindClass}
              </div>
            </div>
          </div>

          {/* Compatibility info */}
          {showCompatibility && validationResult && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Compatibility</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Overall Score</span>
                  <span className={`font-medium ${
                    validationResult.score >= 80 ? 'text-green-600' :
                    validationResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {validationResult.score}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Accessibility</span>
                  <span className="text-gray-800">{validationResult.accessibility.wcagLevel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Performance</span>
                  <span className="text-gray-800">{validationResult.performance.complexity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview sections */}
          {showPreview && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Section Preview</h4>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-center">
                  <div className="h-6 rounded mb-1" style={getBackgroundStyle(variation.tailwindClass)} />
                  <div className="text-xs text-gray-500">Hero</div>
                </div>
                <div className="text-center">
                  <div className="h-6 rounded mb-1" style={getBackgroundStyle(`bg-${variation.baseColor}-50`)} />
                  <div className="text-xs text-gray-500">Features</div>
                </div>
                <div className="text-center">
                  <div className="h-6 rounded mb-1 border border-gray-200" style={{ backgroundColor: '#ffffff' }} />
                  <div className="text-xs text-gray-500">Content</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatArchetypeName(archetypeId: string): string {
  return archetypeId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getBackgroundStyle(bgClass: string) {
  // Same helper function as used in the main component
  if (bgClass.includes('gradient-to-br')) {
    if (bgClass.includes('blue-500') && bgClass.includes('purple-600')) {
      return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
    }
  }
  
  const colorMap: Record<string, string> = {
    'bg-blue-50': '#eff6ff',
    'bg-purple-50': '#faf5ff',
    'bg-green-50': '#f0fdf4',
    'bg-orange-50': '#fff7ed',
    'bg-teal-50': '#f0fdfa',
    'bg-amber-50': '#fffbeb',
    'bg-white': '#ffffff',
  };
  
  for (const [className, color] of Object.entries(colorMap)) {
    if (bgClass.includes(className)) {
      return { backgroundColor: color };
    }
  }
  
  return { backgroundColor: '#f3f4f6' };
}