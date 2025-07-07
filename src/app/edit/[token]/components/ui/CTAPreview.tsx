// /app/edit/[token]/components/ui/CTAPreview.tsx
"use client";

import React, { useState } from 'react';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface CTAPreviewProps {
  colorTokens: ColorTokens;
  backgroundSystem: BackgroundSystem | null;
  size?: 'minimal' | 'compact' | 'full';
  showHoverStates?: boolean;
  className?: string;
}

export function CTAPreview({
  colorTokens,
  backgroundSystem,
  size = 'compact',
  showHoverStates = true,
  className = '',
}: CTAPreviewProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Size configurations
  const sizeConfigs = {
    minimal: {
      buttonClass: 'px-2 py-1 text-xs',
      spacing: 'space-y-1',
      showSecondary: false,
      showGhost: false,
    },
    compact: {
      buttonClass: 'px-3 py-1.5 text-sm',
      spacing: 'space-y-2',
      showSecondary: true,
      showGhost: false,
    },
    full: {
      buttonClass: 'px-4 py-2 text-sm',
      spacing: 'space-y-3',
      showSecondary: true,
      showGhost: true,
    },
  };

  const config = sizeConfigs[size];

  // Button hover handlers
  const handleMouseEnter = (buttonType: string) => {
    if (showHoverStates) {
      setHoveredButton(buttonType);
    }
  };

  const handleMouseLeave = () => {
    setHoveredButton(null);
  };

  // Get appropriate button colors based on hover state
  const getButtonColors = (
    buttonType: 'primary' | 'secondary' | 'ghost',
    isHovered: boolean
  ) => {
    switch (buttonType) {
      case 'primary':
        return {
          bg: isHovered ? colorTokens.ctaHover : colorTokens.ctaBg,
          text: colorTokens.ctaText,
          border: '',
        };
      case 'secondary':
        return {
          bg: isHovered ? colorTokens.ctaSecondaryHover : colorTokens.ctaSecondary,
          text: colorTokens.ctaSecondaryText,
          border: `border ${colorTokens.borderDefault}`,
        };
      case 'ghost':
        return {
          bg: isHovered ? colorTokens.ctaGhostHover : 'bg-transparent',
          text: colorTokens.ctaGhost,
          border: '',
        };
      default:
        return { bg: '', text: '', border: '' };
    }
  };

  return (
    <div className={`${config.spacing} ${className}`}>
      {size === 'full' && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-600">CTA Buttons</span>
        </div>
      )}

      {/* Primary CTA */}
      <div className="space-y-1">
        <button
          className={`
            ${getButtonColors('primary', hoveredButton === 'primary').bg}
            ${getButtonColors('primary', hoveredButton === 'primary').text}
            ${config.buttonClass} font-medium rounded-lg
            transition-all duration-200 w-full
            ${showHoverStates ? 'hover:shadow-sm' : ''}
          `}
          onMouseEnter={() => handleMouseEnter('primary')}
          onMouseLeave={handleMouseLeave}
        >
          {size === 'minimal' ? 'CTA' : 'Get Started'}
        </button>
        
        {size === 'full' && (
          <div className="text-xs text-gray-500 pl-1">
            Primary CTA • {hoveredButton === 'primary' ? 'Hover' : 'Default'}
          </div>
        )}
      </div>

      {/* Secondary CTA */}
      {config.showSecondary && (
        <div className="space-y-1">
          <button
            className={`
              ${getButtonColors('secondary', hoveredButton === 'secondary').bg}
              ${getButtonColors('secondary', hoveredButton === 'secondary').text}
              ${getButtonColors('secondary', hoveredButton === 'secondary').border}
              ${config.buttonClass} font-medium rounded-lg
              transition-all duration-200 w-full
            `}
            onMouseEnter={() => handleMouseEnter('secondary')}
            onMouseLeave={handleMouseLeave}
          >
            Learn More
          </button>
          
          {size === 'full' && (
            <div className="text-xs text-gray-500 pl-1">
              Secondary CTA • {hoveredButton === 'secondary' ? 'Hover' : 'Default'}
            </div>
          )}
        </div>
      )}

      {/* Ghost CTA */}
      {config.showGhost && (
        <div className="space-y-1">
          <button
            className={`
              ${getButtonColors('ghost', hoveredButton === 'ghost').bg}
              ${getButtonColors('ghost', hoveredButton === 'ghost').text}
              ${config.buttonClass} font-medium rounded-lg
              transition-all duration-200 w-full
            `}
            onMouseEnter={() => handleMouseEnter('ghost')}
            onMouseLeave={handleMouseLeave}
          >
            Skip for now
          </button>
          
          {size === 'full' && (
            <div className="text-xs text-gray-500 pl-1">
              Ghost CTA • {hoveredButton === 'ghost' ? 'Hover' : 'Default'}
            </div>
          )}
        </div>
      )}

      {/* Interactive Elements Demo (full size only) */}
      {size === 'full' && (
        <div className="pt-2 mt-3 border-t border-gray-200 space-y-2">
          <span className="text-xs font-medium text-gray-600">Interactive Elements</span>
          
          {/* Focus State Demo */}
          <div className="relative">
            <input
              type="text"
              placeholder="Email address"
              className={`
                w-full px-3 py-2 text-sm border rounded-lg
                ${colorTokens.borderDefault}
                focus:${colorTokens.borderFocus} focus:ring-2 focus:ring-blue-500/20
                transition-colors
              `}
            />
            <div className="text-xs text-gray-500 mt-1 pl-1">
              Focus border uses accent color
            </div>
          </div>

          {/* Link Demo */}
          <div>
            <a
              href="#"
              className={`
                ${colorTokens.link} hover:${colorTokens.linkHover}
                text-sm underline hover:no-underline transition-colors
              `}
              onClick={(e) => e.preventDefault()}
            >
              Example link with hover
            </a>
            <div className="text-xs text-gray-500 mt-1">
              Links match accent color for consistency
            </div>
          </div>
        </div>
      )}

      {/* Color Info (compact and full only) */}
      {(size === 'compact' || size === 'full') && showHoverStates && (
        <div className="pt-2 text-xs text-gray-500">
          {hoveredButton ? (
            <span>Hover states use darker shades for depth</span>
          ) : (
            <span>Hover over buttons to see interaction states</span>
          )}
        </div>
      )}
    </div>
  );
}