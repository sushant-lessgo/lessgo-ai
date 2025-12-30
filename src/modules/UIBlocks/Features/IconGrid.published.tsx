/**
 * IconGrid - Published Version
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

// Feature structure
interface Feature {
  title: string;
  description: string;
  icon: string;
}

export default function IconGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Powerful Features Built for You';
  const subheadline = props.subheadline || '';
  const feature_titles = props.feature_titles || '';
  const feature_descriptions = props.feature_descriptions || '';

  // Extract icons
  const icon_1 = props.icon_1 || '🤝';
  const icon_2 = props.icon_2 || '📊';
  const icon_3 = props.icon_3 || '⚡';
  const icon_4 = props.icon_4 || '🔒';
  const icon_5 = props.icon_5 || '🔗';
  const icon_6 = props.icon_6 || '💬';
  const icon_7 = props.icon_7 || '🎯';
  const icon_8 = props.icon_8 || '✨';
  const icon_9 = props.icon_9 || '🚀';

  const icons = [icon_1, icon_2, icon_3, icon_4, icon_5, icon_6, icon_7, icon_8, icon_9];

  // Parse features
  const titleList = feature_titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const descriptionList = feature_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');

  const features: Feature[] = titleList.map((title, index) => ({
    title,
    description: descriptionList[index] || 'Feature description not provided.',
    icon: icons[index] || '⭐'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        iconBg: 'rgba(249, 115, 22, 0.1)',
        iconBgHover: 'rgba(249, 115, 22, 0.2)',
        iconColor: '#f97316'
      },
      cool: {
        iconBg: 'rgba(59, 130, 246, 0.1)',
        iconBgHover: 'rgba(59, 130, 246, 0.2)',
        iconColor: '#3b82f6'
      },
      neutral: {
        iconBg: 'rgba(100, 116, 139, 0.1)',
        iconBgHover: 'rgba(100, 116, 139, 0.2)',
        iconColor: '#64748b'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Card styling based on backgroundType
  const isPrimaryBg = backgroundType === 'primary';
  const cardBg = isPrimaryBg ? 'rgba(255, 255, 255, 0.1)' : '#ffffff';
  const cardBorder = isPrimaryBg ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb';

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="group p-6 rounded-xl border hover:shadow-lg transition-all duration-300"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
                backdropFilter: isPrimaryBg ? 'blur(12px)' : undefined
              }}
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg group-hover:scale-110 transition-all duration-300"
                  style={{
                    backgroundColor: themeColors.iconBg
                  }}
                >
                  <IconPublished
                    value={feature.icon}
                    size="md"
                    className="text-2xl"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="mb-3">
                <h3
                  style={{
                    ...h3Typography,
                    fontWeight: 600,
                    color: textColors.heading
                  }}
                >
                  {feature.title}
                </h3>
              </div>

              {/* Description */}
              <div>
                <p
                  style={{
                    color: textColors.muted,
                    lineHeight: '1.75rem',
                    opacity: 0.9
                  }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
