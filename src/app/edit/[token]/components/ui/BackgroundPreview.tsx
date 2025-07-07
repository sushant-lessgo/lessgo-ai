// /app/edit/[token]/components/ui/BackgroundPreview.tsx
"use client";

import React from 'react';

interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

interface BackgroundPreviewProps {
  background: BackgroundSystem;
  title?: string;
  showSectionBreakdown?: boolean;
  compact?: boolean;
  isPreview?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export function BackgroundPreview({
  background,
  title,
  showSectionBreakdown = false,
  compact = false,
  isPreview = false,
  className = '',
  onClick,
  onHover,
  onHoverEnd,
}: BackgroundPreviewProps) {
  const containerClasses = `
    relative rounded-lg overflow-hidden transition-all duration-200
    ${compact ? 'h-16' : 'h-24'}
    ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}
    ${isPreview ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
    ${className}
  `;

  const handleClick = () => {
    onClick?.();
  };

  const handleMouseEnter = () => {
    onHover?.();
  };

  const handleMouseLeave = () => {
    onHoverEnd?.();
  };

  // Helper to clean up Tailwind classes for inline styles
  const getBackgroundStyle = (bgClass: string) => {
    // Handle gradient classes
    if (bgClass.includes('gradient-to-br')) {
      if (bgClass.includes('blue-500') && bgClass.includes('purple-600')) {
        return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
      }
      if (bgClass.includes('orange-400') && bgClass.includes('pink-400')) {
        return { background: 'linear-gradient(to bottom right, #fb923c, #f472b6)' };
      }
      if (bgClass.includes('teal-200') && bgClass.includes('green-100')) {
        return { background: 'linear-gradient(to bottom right, #99f6e4, #dcfce7)' };
      }
    }
    
    // Handle solid colors
    if (bgClass.includes('bg-blue-50')) return { backgroundColor: '#eff6ff' };
    if (bgClass.includes('bg-blue-100')) return { backgroundColor: '#dbeafe' };
    if (bgClass.includes('bg-purple-50')) return { backgroundColor: '#faf5ff' };
    if (bgClass.includes('bg-orange-50')) return { backgroundColor: '#fff7ed' };
    if (bgClass.includes('bg-teal-50')) return { backgroundColor: '#f0fdfa' };
    if (bgClass.includes('bg-white')) return { backgroundColor: '#ffffff' };
    if (bgClass.includes('bg-gray-100')) return { backgroundColor: '#f3f4f6' };
    
    // Fallback
    return { backgroundColor: '#f3f4f6' };
  };

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Preview */}
      <div 
        className="w-full h-full flex items-center justify-center relative"
        style={getBackgroundStyle(background.primary)}
      >
        {/* Content Overlay */}
        <div className="text-white text-xs font-medium text-center px-2">
          {title || 'Background Preview'}
        </div>

        {/* Preview Badge */}
        {isPreview && (
          <div className="absolute top-1 right-1">
            <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded text-center font-medium">
              Preview
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isPreview && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 animate-pulse"></div>
        )}
      </div>

      {/* Section Breakdown */}
      {showSectionBreakdown && !compact && (
        <div className="mt-2 grid grid-cols-3 gap-1 h-6">
          {/* Secondary Background */}
          <div 
            className="rounded-sm flex items-center justify-center"
            style={getBackgroundStyle(background.secondary)}
            title="Secondary sections (Features, etc.)"
          >
            <span className="text-xs text-gray-600">Sec</span>
          </div>

          {/* Neutral Background */}
          <div 
            className="rounded-sm flex items-center justify-center border border-gray-200"
            style={getBackgroundStyle(background.neutral)}
            title="Neutral sections (Testimonials, etc.)"
          >
            <span className="text-xs text-gray-600">Neu</span>
          </div>

          {/* Accent/CTA */}
          <div 
            className="rounded-sm flex items-center justify-center"
            style={getBackgroundStyle(background.accentCSS)}
            title="Accent color (Buttons, CTAs)"
          >
            <span className="text-xs text-white font-medium">CTA</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified preview for grid/list views
 */
interface CompactBackgroundPreviewProps {
  background: BackgroundSystem;
  label?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export function CompactBackgroundPreview({
  background,
  label,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
}: CompactBackgroundPreviewProps) {
  return (
    <div className="group">
      <BackgroundPreview
        background={background}
        title=""
        compact={true}
        className={`
          border-2 transition-all
          ${isSelected 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-gray-200 group-hover:border-gray-300'
          }
        `}
        onClick={onClick}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
      
      {label && (
        <div className="mt-1 text-center">
          <div className="text-xs text-gray-600 truncate">{label}</div>
        </div>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="mt-1 flex justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Live page preview with real section layout
 */
interface LivePagePreviewProps {
  background: BackgroundSystem;
  sections?: string[];
  showMobile?: boolean;
}

export function LivePagePreview({ 
  background, 
  sections = ['hero', 'features', 'testimonials', 'cta'],
  showMobile = false 
}: LivePagePreviewProps) {
  const getSectionBackground = (sectionType: string) => {
    switch (sectionType) {
      case 'hero':
      case 'cta':
        return background.primary;
      case 'features':
      case 'pricing':
        return background.secondary;
      case 'testimonials':
      case 'faq':
        return background.neutral;
      case 'divider':
        return background.divider;
      default:
        return background.neutral;
    }
  };

  const getSectionLabel = (sectionType: string) => {
    switch (sectionType) {
      case 'hero': return 'Hero';
      case 'features': return 'Features';
      case 'testimonials': return 'Testimonials';
      case 'cta': return 'CTA';
      case 'pricing': return 'Pricing';
      case 'faq': return 'FAQ';
      default: return sectionType;
    }
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 overflow-hidden
      ${showMobile ? 'w-48' : 'w-full'}
    `}>
      {/* Mock Browser Header */}
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="ml-2 flex-1 bg-white rounded px-2 py-0.5">
            <div className="text-xs text-gray-500">yoursite.com</div>
          </div>
        </div>
      </div>

      {/* Page Sections */}
      <div className="space-y-0">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`
              px-4 py-3 flex items-center justify-between
              ${showMobile ? 'text-xs' : 'text-sm'}
            `}
            style={{
              ...getBackgroundStyle(getSectionBackground(section)),
              minHeight: showMobile ? '24px' : '32px'
            }}
          >
            <span className={`
              font-medium
              ${getSectionBackground(section).includes('white') || getSectionBackground(section).includes('50') 
                ? 'text-gray-700' 
                : 'text-white'
              }
            `}>
              {getSectionLabel(section)}
            </span>
            
            {/* Mock content blocks */}
            <div className="flex space-x-1">
              <div className={`
                w-2 h-2 rounded
                ${getSectionBackground(section).includes('white') || getSectionBackground(section).includes('50')
                  ? 'bg-gray-300'
                  : 'bg-white bg-opacity-30'
                }
              `}></div>
              <div className={`
                w-2 h-2 rounded
                ${getSectionBackground(section).includes('white') || getSectionBackground(section).includes('50')
                  ? 'bg-gray-300'
                  : 'bg-white bg-opacity-30'
                }
              `}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function (same as in BackgroundPreview component)
function getBackgroundStyle(bgClass: string) {
  // Handle gradient classes
  if (bgClass.includes('gradient-to-br')) {
    if (bgClass.includes('blue-500') && bgClass.includes('purple-600')) {
      return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
    }
    if (bgClass.includes('orange-400') && bgClass.includes('pink-400')) {
      return { background: 'linear-gradient(to bottom right, #fb923c, #f472b6)' };
    }
    if (bgClass.includes('teal-200') && bgClass.includes('green-100')) {
      return { background: 'linear-gradient(to bottom right, #99f6e4, #dcfce7)' };
    }
  }
  
  // Handle solid colors
  if (bgClass.includes('bg-blue-50')) return { backgroundColor: '#eff6ff' };
  if (bgClass.includes('bg-blue-100')) return { backgroundColor: '#dbeafe' };
  if (bgClass.includes('bg-blue-600')) return { backgroundColor: '#2563eb' };
  if (bgClass.includes('bg-purple-50')) return { backgroundColor: '#faf5ff' };
  if (bgClass.includes('bg-purple-600')) return { backgroundColor: '#9333ea' };
  if (bgClass.includes('bg-orange-50')) return { backgroundColor: '#fff7ed' };
  if (bgClass.includes('bg-teal-50')) return { backgroundColor: '#f0fdfa' };
  if (bgClass.includes('bg-white')) return { backgroundColor: '#ffffff' };
  if (bgClass.includes('bg-gray-100')) return { backgroundColor: '#f3f4f6' };
  
  // Fallback
  return { backgroundColor: '#f3f4f6' };
}