/**
 * StackedPainBullets - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pain point structure
interface PainPoint {
  point: string;
  description?: string;
  icon: string;
}

export default function StackedPainBulletsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Are You Struggling With These Daily Frustrations?';
  const subheadline = props.subheadline || '';
  const conclusion_text = props.conclusion_text || 'Sound familiar? You\'re not alone.';
  const pain_points = props.pain_points || '';
  const pain_descriptions = props.pain_descriptions || '';

  // Extract icons
  const pain_icon_1 = props.pain_icon_1 || '⏰';
  const pain_icon_2 = props.pain_icon_2 || '🔗';
  const pain_icon_3 = props.pain_icon_3 || '⚠️';
  const pain_icon_4 = props.pain_icon_4 || '😰';
  const pain_icon_5 = props.pain_icon_5 || '📉';
  const pain_icon_6 = props.pain_icon_6 || '🌪️';

  const icons = [pain_icon_1, pain_icon_2, pain_icon_3, pain_icon_4, pain_icon_5, pain_icon_6];

  // Parse pain points
  const pointList = pain_points.split('|').map((p: string) => p.trim()).filter((p: string) => p && p !== '___REMOVED___');
  const descriptionList = pain_descriptions ? pain_descriptions.split('|').map((d: string) => d.trim()) : [];

  const painPoints: PainPoint[] = pointList.map((point: string, index: number) => ({
    point,
    description: descriptionList[index] || '',
    icon: icons[index] || '⚠️'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        border: '#fed7aa',
        borderHover: '#fdba74',
        iconBg: '#ffedd5',
        iconBgHover: '#fed7aa',
        iconText: '#ea580c',
        conclusionBg: '#fff7ed',
        conclusionBorder: '#fed7aa',
        conclusionText: '#9a3412',
        dotColor: '#fb923c'
      },
      cool: {
        border: '#bfdbfe',
        borderHover: '#93c5fd',
        iconBg: '#dbeafe',
        iconBgHover: '#bfdbfe',
        iconText: '#2563eb',
        conclusionBg: '#eff6ff',
        conclusionBorder: '#bfdbfe',
        conclusionText: '#1e40af',
        dotColor: '#60a5fa'
      },
      neutral: {
        border: '#fde68a',
        borderHover: '#fcd34d',
        iconBg: '#fef3c7',
        iconBgHover: '#fde68a',
        iconText: '#d97706',
        conclusionBg: '#fffbeb',
        conclusionBorder: '#fde68a',
        conclusionText: '#92400e',
        dotColor: '#fbbf24'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Pain Points List */}
        <div className="space-y-6">
          {painPoints.map((painPoint: PainPoint, index: number) => (
            <div
              key={`pain-${index}`}
              className="group flex items-start space-x-4 p-6 bg-white rounded-lg border hover:shadow-md transition-all duration-300"
              style={{
                borderColor: themeColors.border
              }}
            >
              {/* Pain Icon */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: themeColors.iconBg,
                  color: themeColors.iconText
                }}
              >
                <IconPublished
                  icon={painPoint.icon}
                  size={32}
                  className="text-2xl"
                />
              </div>

              {/* Pain Content */}
              <div className="flex-1">
                {/* Pain Point */}
                <div className="mb-2">
                  <TextPublished
                    value={painPoint.point}
                    style={{
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      color: '#111827',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>

                {/* Optional Description */}
                {painPoint.description && (
                  <TextPublished
                    value={painPoint.description}
                    style={{
                      color: '#4b5563',
                      fontSize: '1rem',
                      lineHeight: '1.75rem'
                    }}
                  />
                )}
              </div>

              {/* Emphasis Indicator */}
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: themeColors.dotColor
                }}
              />
            </div>
          ))}
        </div>

        {/* Emotional Conclusion */}
        <div className="mt-16 text-center mb-8">
          <div
            className="inline-flex items-center px-6 py-3 rounded-full border"
            style={{
              backgroundColor: themeColors.conclusionBg,
              borderColor: themeColors.conclusionBorder,
              color: themeColors.conclusionText
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              style={{ color: themeColors.iconText }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <TextPublished
              value={conclusion_text}
              style={{
                fontWeight: 600
              }}
            />
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
