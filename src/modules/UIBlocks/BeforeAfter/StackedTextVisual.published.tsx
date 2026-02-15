/**
 * StackedTextVisual - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Before/After comparison with stacked layout
 * - Transition connector between states
 * - Optional summary box
 * - Theme-based visual styling (warm/cool/neutral)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function StackedTextVisualPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Experience';
  const subheadline = props.subheadline || '';
  const before_text = props.before_text || 'Struggling with manual processes, disconnected tools, and delayed insights that slow down your progress.';
  const after_text = props.after_text || 'Enjoy automated workflows, unified data, and instant insights that accelerate your success.';
  const before_label = props.before_label || 'Before';
  const after_label = props.after_label || 'After';
  const transition_text = props.transition_text || '';
  const summary_text = props.summary_text || '';

  // Extract icons (optional)
  const before_icon = props.before_icon || 'Plus';
  const after_icon = props.after_icon || 'Zap';
  const transition_icon = props.transition_icon || 'ArrowDown';

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get adaptive card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get accent color for After block
  const accentColor = theme?.colors?.accentColor || '#3b82f6';

  // Theme-based color system - After block uses accent color
  const getStackedColors = (themeType: UIBlockTheme) => ({
    warm: {
      before: {
        bg: '#fff7ed',           // orange-50
        border: '#fb923c',       // orange-400
        iconBg: '#fed7aa',       // orange-200
        iconText: '#ea580c'      // orange-600
      },
      transition: {
        bg: '#ffedd5',           // orange-100
        text: '#ea580c'          // orange-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        bg: 'linear-gradient(to right, #fff7ed, #fffbeb, #fefce8)',
        border: '#fed7aa'
      }
    },
    cool: {
      before: {
        bg: '#eff6ff',           // blue-50
        border: '#60a5fa',       // blue-400
        iconBg: '#bfdbfe',       // blue-200
        iconText: '#2563eb'      // blue-600
      },
      transition: {
        bg: '#dbeafe',           // blue-100
        text: '#2563eb'          // blue-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        bg: 'linear-gradient(to right, #eff6ff, #e0e7ff, #faf5ff)',
        border: '#bfdbfe'
      }
    },
    neutral: {
      before: {
        bg: '#f9fafb',           // gray-50
        border: '#9ca3af',       // gray-400
        iconBg: '#e5e7eb',       // gray-200
        iconText: '#6b7280'      // gray-600
      },
      transition: {
        bg: '#f3f4f6',           // gray-100
        text: '#4b5563'          // gray-600
      },
      after: {
        bg: `${accentColor}15`,      // light accent
        border: accentColor,          // accent
        iconBg: `${accentColor}30`,   // medium accent
        iconText: accentColor         // accent
      },
      summary: {
        bg: 'linear-gradient(to right, #f9fafb, #f8fafc, #fafafa)',
        border: '#e5e7eb'
      }
    }
  }[themeType]);

  const themeColors = getStackedColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const summaryTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Main Headline */}
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              element="p"
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '32rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Stacked Before/After Blocks */}
        <div className="space-y-8">
          {/* Before Block */}
          <div className="relative">
            <div
              className="border-l-4 rounded-lg p-8 shadow-sm"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                borderLeftColor: themeColors.before.border
              }}
            >
              <div className="flex items-start space-x-4">
                {/* Before Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.before.iconBg }}
                >
                  <IconPublished
                    icon={before_icon}
                    size={32} color={themeColors.before.iconText}
                  />
                </div>

                <div className="flex-1">
                  <TextPublished
                    value={before_label}
                    element="div"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: cardStyles.textHeading,
                      marginBottom: '0.75rem'
                    }}
                  />

                  <TextPublished
                    value={before_text}
                    element="p"
                    style={{
                      color: cardStyles.textBody,
                      fontSize: '0.8rem',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transition Connector */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
              {/* Arrow */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColors.transition.bg }}
              >
                <IconPublished
                  icon={transition_icon}
                  size={24} color={themeColors.transition.text}
                />
              </div>

              {/* Optional Transition Text - V2: no more ___REMOVED___ check */}
              {transition_text && (
                <div
                  className="text-sm font-medium text-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: themeColors.transition.bg }}
                >
                  <TextPublished
                    value={transition_text}
                    element="span"
                    style={{
                      color: themeColors.transition.text
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* After Block */}
          <div className="relative">
            <div
              className="border-l-4 rounded-lg p-8 shadow-sm"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                borderLeftColor: themeColors.after.border
              }}
            >
              <div className="flex items-start space-x-4">
                {/* After Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.after.iconBg }}
                >
                  <IconPublished
                    icon={after_icon}
                    size={32} color={themeColors.after.iconText}
                  />
                </div>

                <div className="flex-1">
                  <TextPublished
                    value={after_label}
                    element="div"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: cardStyles.textHeading,
                      marginBottom: '0.75rem'
                    }}
                  />

                  <TextPublished
                    value={after_text}
                    element="p"
                    style={{
                      color: cardStyles.textBody,
                      fontSize: '0.8rem',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Summary Text */}
        {summary_text && (
          <div className="mt-10 text-center">
            <TextPublished
              value={summary_text}
              element="p"
              style={{
                color: textColors.body,
                ...summaryTypography,
                fontStyle: 'italic',
                maxWidth: '32rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
