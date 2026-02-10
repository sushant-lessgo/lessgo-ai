/**
 * StackedPainBullets - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Uses array-based pain_items instead of pipe-separated strings
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// Pain item structure (V2)
interface PainItem {
  id: string;
  point: string;
  description?: string;
  icon?: string;
}


export default function StackedPainBulletsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Are You Struggling With These Daily Frustrations?';
  const subheadline = props.subheadline || '';
  const conclusion_text = props.conclusion_text || 'Sound familiar? You\'re not alone.';

  // Get pain items (V2 array format)
  const painItems: PainItem[] = Array.isArray(props.pain_items)
    ? props.pain_items
    : [
        { id: 'p1', point: 'Spending hours on manual data entry', description: '' },
        { id: 'p2', point: 'Juggling multiple disconnected tools', description: '' },
        { id: 'p3', point: 'Missing important deadlines', description: '' },
      ];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles based on luminance and theme
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme-specific colors for conclusion badge and dot (not part of card styling)
  const getThemeAccentColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        conclusionBg: '#fff7ed',
        conclusionBorder: '#fed7aa',
        conclusionText: '#9a3412',
        conclusionIconText: '#ea580c',
        dotColor: '#fb923c'
      },
      cool: {
        conclusionBg: '#eff6ff',
        conclusionBorder: '#bfdbfe',
        conclusionText: '#1e40af',
        conclusionIconText: '#2563eb',
        dotColor: '#60a5fa'
      },
      neutral: {
        conclusionBg: '#fffbeb',
        conclusionBorder: '#fde68a',
        conclusionText: '#92400e',
        conclusionIconText: '#d97706',
        dotColor: '#fbbf24'
      }
    };
    return colorMap[theme];
  };

  const themeAccentColors = getThemeAccentColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Render icon component
  const renderIcon = (item: PainItem) => {
    const iconName = item.icon || inferIconFromText(item.point, item.description);
    const IconComponent = (LucideIcons as any)[iconName] ?? LucideIcons.AlertCircle;
    return <IconComponent size={24} strokeWidth={2} />;
  };

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
          {painItems.map((painItem: PainItem) => (
            <div
              key={painItem.id}
              className="group flex items-start space-x-4 p-6 rounded-lg transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                WebkitBackdropFilter: cardStyles.backdropFilter,
                borderColor: cardStyles.borderColor,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                boxShadow: cardStyles.boxShadow
              }}
            >
              {/* Pain Icon */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: cardStyles.iconBg,
                  color: cardStyles.iconColor
                }}
              >
                {renderIcon(painItem)}
              </div>

              {/* Pain Content */}
              <div className="flex-1">
                {/* Pain Point */}
                <div className="mb-2">
                  <TextPublished
                    value={painItem.point}
                    style={{
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      color: cardStyles.textHeading,
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>

                {/* Optional Description */}
                {painItem.description && (
                  <TextPublished
                    value={painItem.description}
                    style={{
                      color: cardStyles.textBody,
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
                  backgroundColor: themeAccentColors.dotColor
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
              backgroundColor: themeAccentColors.conclusionBg,
              borderColor: themeAccentColors.conclusionBorder,
              color: themeAccentColors.conclusionText
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              style={{ color: themeAccentColors.conclusionIconText }}
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
