/**
 * IconGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of pipe-separated strings
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Feature structure - clean array item
interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function IconGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Powerful Features Built for You';
  const subheadline = props.subheadline || '';
  const badge_text = props.badge_text || '';
  const supporting_text = props.supporting_text || '';

  // V2: Direct array access - no pipe parsing needed
  const features: Feature[] = props.features || [];

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
          {/* Badge Text */}
          {badge_text && (
            <div style={{ marginBottom: '1rem' }}>
              <span
                style={{
                  color: themeColors.iconColor,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.8
                }}
              >
                {badge_text}
              </span>
            </div>
          )}

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
          {features.map((feature: Feature) => {
            // V2: Get icon - use stored value or derive from title/description
            const displayIcon = feature.icon || inferIconFromText(feature.title, feature.description);

            return (
              <div
                key={feature.id}
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
                      icon={displayIcon}
                      size={24}
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
            );
          })}
        </div>

        {/* Supporting Text */}
        {supporting_text && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <TextPublished
              value={supporting_text}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '42rem',
                margin: '0 auto',
                opacity: 0.9
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
