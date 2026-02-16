/**
 * SideBySideBlock - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Features:
 * - Visual contrast: Before=muted/dashed, After=accent/solid
 * - Transformation arrow between cards (always horizontal)
 * - Support for before_points/after_points lists
 * - Theme-based accent colors
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

export default function SideBySideBlockPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Your Transformation Story';
  const subheadline = props.subheadline || '';
  const before_label = props.before_label || 'Before';
  const after_label = props.after_label || 'After';
  const before_description = props.before_description || '';
  const after_description = props.after_description || '';
  const summary_text = (props as any).summary_text || '';

  // Extract icons with defaults
  const before_icon = props.before_icon || 'XCircle';
  const after_icon = props.after_icon || 'CheckCircle';

  // Parse before_points from V2 clean arrays
  const beforePoints = ((props as any).before_points || []).map((item: any) =>
    typeof item === 'string' ? item : item.text
  ).filter((text: string) => text && text.trim() !== '');

  // Parse after_points from V2 clean arrays
  const afterPoints = ((props as any).after_points || []).map((item: any) =>
    typeof item === 'string' ? item : item.text
  ).filter((text: string) => text && text.trim() !== '');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get accent color from theme
  const accentColor = theme?.colors?.accentColor || '#3b82f6';
  const accentColorLight = `${accentColor}15`; // 15% opacity for bg
  const accentColorMedium = `${accentColor}40`; // 40% opacity for border

  // Theme colors - Before=muted, After=light accent
  const getCardColors = (themeType: UIBlockTheme) => ({
    warm: {
      before: {
        bg: '#fef2f2',
        border: '#fecaca',
        labelColor: '#dc2626',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: '#f97316'
    },
    cool: {
      before: {
        bg: '#fef2f2',
        border: '#fecaca',
        labelColor: '#dc2626',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: accentColor
    },
    neutral: {
      before: {
        bg: '#f9fafb',
        border: '#d1d5db',
        labelColor: '#6b7280',
        pointIcon: 'XCircle'
      },
      after: {
        bg: accentColorLight,
        border: accentColorMedium,
        labelColor: accentColor,
        pointIcon: 'CheckCircle'
      },
      arrow: accentColor
    }
  }[themeType]);

  const themeColors = getCardColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              element="p"
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Side by Side Cards - Always horizontal (3 columns: Before | Arrow | After) */}
        <div
          className="grid gap-2 sm:gap-4 md:gap-6 items-stretch"
          style={{ gridTemplateColumns: '1fr auto 1fr' }}
        >
          {/* Before Card - Muted/Problem styling with dashed border */}
          <div className="min-w-0">
            <div
              className="rounded-xl p-4 sm:p-6 md:p-8 h-full transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                border: `2px dashed ${themeColors.before.border}`
              }}
            >
              {/* Label + Icon */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <IconPublished
                  icon={before_icon}
                  size={20}
                  className="sm:text-2xl"
                />
                <TextPublished
                  value={before_label}
                  element="span"
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: themeColors.before.labelColor
                  }}
                  className="text-base sm:text-lg"
                />
              </div>

              {/* Description */}
              {before_description && (
                <TextPublished
                  value={before_description}
                  element="p"
                  style={{
                    color: textColors.body,
                    lineHeight: '1.75rem',
                    marginBottom: beforePoints.length > 0 ? '1rem' : '0'
                  }}
                  className="text-sm sm:text-base"
                />
              )}

              {/* Pain Points List */}
              {beforePoints.length > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  {beforePoints.map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm sm:text-base">
                      <span style={{ color: themeColors.before.labelColor }} className="flex-shrink-0 mt-0.5">
                        {themeColors.before.pointIcon}
                      </span>
                      <span style={{ color: cardStyles.textBody }}>{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transformation Arrow - Always visible */}
          <div className="flex items-center justify-center px-2 sm:px-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              style={{ color: themeColors.arrow }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
            </svg>
          </div>

          {/* After Card - Accent/Success styling with solid border */}
          <div className="min-w-0">
            <div
              className="rounded-xl p-4 sm:p-6 md:p-8 h-full transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                border: `2px solid ${themeColors.after.border}`
              }}
            >
              {/* Label + Icon */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <IconPublished
                  icon={after_icon}
                  size={20}
                  className="sm:text-2xl"
                />
                <TextPublished
                  value={after_label}
                  element="span"
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: themeColors.after.labelColor
                  }}
                  className="text-base sm:text-lg"
                />
              </div>

              {/* Description */}
              {after_description && (
                <TextPublished
                  value={after_description}
                  element="p"
                  style={{
                    color: textColors.body,
                    lineHeight: '1.75rem',
                    marginBottom: afterPoints.length > 0 ? '1rem' : '0'
                  }}
                  className="text-sm sm:text-base"
                />
              )}

              {/* Benefits List */}
              {afterPoints.length > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  {afterPoints.map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm sm:text-base">
                      <span style={{ color: themeColors.after.labelColor }} className="flex-shrink-0 mt-0.5">
                        {themeColors.after.pointIcon}
                      </span>
                      <span style={{ color: cardStyles.textBody }}>{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Text - Optional transition copy below cards */}
        {summary_text && (
          <div className="text-center mt-8 sm:mt-12">
            <TextPublished
              value={summary_text}
              element="p"
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
