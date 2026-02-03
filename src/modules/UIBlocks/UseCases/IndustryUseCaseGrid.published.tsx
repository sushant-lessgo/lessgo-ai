/**
 * IndustryUseCaseGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of numbered fields
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

// V2: Industry structure - clean array item
interface Industry {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function IndustryUseCaseGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Trusted Across Industries';
  const subheadline = props.subheadline || '';

  // V2: Direct array access - no numbered fields or pipe parsing needed
  const industries: Industry[] = props.industries || [];

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme color mapping (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',                                    // orange-200
        cardHoverShadow: '0 10px 15px -3px rgba(251, 146, 60, 0.1), 0 4px 6px -2px rgba(251, 146, 60, 0.05)',
        iconBg: '#fff7ed',                                        // orange-50
        iconText: '#ea580c'                                       // orange-600
      },
      cool: {
        cardBorder: '#bfdbfe',                                    // blue-200
        cardHoverShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
        iconBg: '#eff6ff',                                        // blue-50
        iconText: '#2563eb'                                       // blue-600
      },
      neutral: {
        cardBorder: '#e5e7eb',                                    // gray-200
        cardHoverShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        iconBg: '#f9fafb',                                        // gray-50
        iconText: '#4b5563'                                       // gray-600
      }
    }[theme];
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
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* Headline */}
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              textAlign: 'center',
              marginBottom: subheadline ? '1rem' : '0'
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
                textAlign: 'center',
                opacity: 0.8
              }}
            />
          )}
        </div>

        {/* Industry Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry: Industry) => {
            // V2: Get icon - use stored value or derive from name/description
            const displayIcon = industry.icon || inferIconFromText(industry.name, industry.description);

            return (
              <div
                key={industry.id}
                className="bg-white p-8 rounded-xl transition-all duration-300"
                style={{
                  border: `1px solid ${themeColors.cardBorder}`,
                  boxShadow: themeColors.cardHoverShadow
                }}
              >
                {/* Icon Container - Circular with theme background */}
                <div
                  className="w-32 h-32 mx-auto flex items-center justify-center mb-6 rounded-full"
                  style={{
                    backgroundColor: themeColors.iconBg
                  }}
                >
                  <IconPublished
                    icon={displayIcon}
                    color={themeColors.iconText}
                    size={60}
                  />
                </div>

                {/* Industry Name */}
                <div className="mb-4 text-center">
                  <h3
                    style={{
                      ...h3Typography,
                      fontWeight: 700,
                      color: textColors.heading,
                      textAlign: 'center'
                    }}
                  >
                    {industry.name}
                  </h3>
                </div>

                {/* Use Case Description */}
                <div className="text-center">
                  <TextPublished
                    value={industry.description}
                    style={{
                      color: textColors.muted,
                      ...bodyTypography,
                      textAlign: 'center',
                      opacity: 0.8
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
