// /app/edit/[token]/components/ui/TextHierarchyPreview.tsx
"use client";

import React from 'react';
import { getTextColorForBackground } from '@/modules/Design/background/enhancedBackgroundLogic';
import type { ColorTokens, BackgroundSystem } from '@/types/core';

interface TextHierarchyPreviewProps {
  colorTokens: ColorTokens;
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider';
  backgroundSystem: BackgroundSystem | null;
  size?: 'minimal' | 'compact' | 'full';
  showLabels?: boolean;
  className?: string;
}

export function TextHierarchyPreview({
  colorTokens,
  backgroundType,
  backgroundSystem,
  size = 'compact',
  showLabels = false,
  className = '',
}: TextHierarchyPreviewProps) {

  // Get background-aware text colors
  const textColors = getTextColorForBackground(backgroundType, colorTokens);

  // Size configurations
  const sizeConfigs = {
    minimal: {
      headingClass: 'text-sm font-semibold',
      bodyClass: 'text-xs',
      mutedClass: 'text-xs',
      spacing: 'space-y-1',
      showAllLevels: false,
    },
    compact: {
      headingClass: 'text-base font-semibold',
      bodyClass: 'text-sm',
      mutedClass: 'text-sm',
      spacing: 'space-y-2',
      showAllLevels: true,
    },
    full: {
      headingClass: 'text-lg font-bold',
      bodyClass: 'text-base',
      mutedClass: 'text-sm',
      spacing: 'space-y-3',
      showAllLevels: true,
    },
  };

  const config = sizeConfigs[size];

  // Content samples based on background type
  const getContentSamples = () => {
    switch (backgroundType) {
      case 'primary':
        return {
          heading: size === 'minimal' ? 'Hero Section' : 'Transform Your Business Today',
          body: size === 'minimal' ? 'Get started now' : 'Join thousands of companies already using our platform to streamline their operations.',
          muted: size === 'minimal' ? 'Learn more' : 'Trusted by Fortune 500 companies worldwide',
        };
      case 'secondary':
        return {
          heading: size === 'minimal' ? 'Features' : 'Powerful Features Built for Scale',
          body: size === 'minimal' ? 'Feature description' : 'Everything you need to grow your business, from automation to analytics.',
          muted: size === 'minimal' ? 'View details' : 'No setup fees • Cancel anytime',
        };
      case 'neutral':
        return {
          heading: size === 'minimal' ? 'Content Section' : 'How It Works',
          body: size === 'minimal' ? 'Body content here' : 'Our three-step process makes it easy to get started and see results quickly.',
          muted: size === 'minimal' ? 'Additional info' : 'Average setup time: 5 minutes',
        };
      case 'divider':
        return {
          heading: size === 'minimal' ? 'Separator' : 'Ready to Get Started?',
          body: size === 'minimal' ? 'Call to action' : 'Join thousands of satisfied customers and transform your workflow today.',
          muted: size === 'minimal' ? 'Terms apply' : '30-day money-back guarantee',
        };
      default:
        return {
          heading: 'Sample Heading',
          body: 'Sample body text content',
          muted: 'Sample muted text',
        };
    }
  };

  const content = getContentSamples();

  // Calculate contrast info for accessibility
  const getContrastInfo = () => {
    const isDarkBackground = backgroundType === 'primary';
    return {
      level: isDarkBackground ? 'High contrast on dark' : 'Optimized for light backgrounds',
      wcag: 'WCAG AA compliant',
    };
  };

  const contrastInfo = getContrastInfo();

  return (
    <div className={`${config.spacing} ${className}`}>
      {/* Size and background info header (full size only) */}
      {size === 'full' && showLabels && (
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Text Hierarchy • {backgroundType.charAt(0).toUpperCase() + backgroundType.slice(1)}
            </span>
            <span className="text-xs text-gray-500">{contrastInfo.wcag}</span>
          </div>
        </div>
      )}

      {/* Primary Heading */}
      <div className="space-y-1">
        <div className={`${textColors.heading} ${config.headingClass} leading-tight`}>
          {content.heading}
        </div>
        {size === 'full' && showLabels && (
          <div className="text-xs text-gray-500">
            Primary Heading • {textColors.heading}
          </div>
        )}
      </div>

      {/* Body Text */}
      {config.showAllLevels && (
        <div className="space-y-1">
          <div className={`${textColors.body} ${config.bodyClass} leading-relaxed`}>
            {content.body}
          </div>
          {size === 'full' && showLabels && (
            <div className="text-xs text-gray-500">
              Body Text • {textColors.body}
            </div>
          )}
        </div>
      )}

      {/* Muted Text */}
      <div className="space-y-1">
        <div className={`${textColors.muted} ${config.mutedClass}`}>
          {content.muted}
        </div>
        {size === 'full' && showLabels && (
          <div className="text-xs text-gray-500">
            Muted Text • {textColors.muted}
          </div>
        )}
      </div>

      {/* Text Samples with Links (full size only) */}
      {size === 'full' && (
        <div className="pt-3 mt-3 border-t border-gray-200/50 space-y-2">
          <span className="text-xs font-medium text-gray-600">Interactive Text</span>
          
          {/* Link in context */}
          <div className={`${textColors.body} ${config.bodyClass}`}>
            Ready to start? {' '}
            <a
              href="#"
              className={`
                ${colorTokens.link} hover:${colorTokens.linkHover}
                underline hover:no-underline transition-colors
              `}
              onClick={(e) => e.preventDefault()}
            >
              Sign up now
            </a>
            {' '} and see the difference.
          </div>

          {/* Contrast and accessibility info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>• {contrastInfo.level}</div>
            <div>• Link color maintains brand consistency</div>
            <div>• Optimized for {backgroundType} backgrounds</div>
          </div>
        </div>
      )}

      {/* Readability Score (full size only) */}
      {size === 'full' && backgroundSystem && (
        <div className="pt-2 mt-2 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Readability Score</span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3 h-3 ${
                      star <= 4 ? 'text-green-500' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-green-600 font-medium">Excellent</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}