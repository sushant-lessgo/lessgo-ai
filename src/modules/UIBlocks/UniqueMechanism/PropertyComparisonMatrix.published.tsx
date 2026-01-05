/**
 * PropertyComparisonMatrix - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function PropertyComparisonMatrixPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'How We Compare';
  const properties = props.properties || 'Speed|Accuracy|Security|Scalability|Cost|Support';
  const us_values = props.us_values || 'Ultra-Fast|99.9%|Enterprise|Unlimited|Competitive|24/7';
  const competitors_values = props.competitors_values || 'Slow|95%|Basic|Limited|Expensive|Business Hours';
  const feature_header = props.feature_header || 'Feature';
  const us_header = props.us_header || 'Us';
  const competitors_header = props.competitors_header || 'Competitors';

  // Parse pipe-delimited data
  const propertyList = properties.split('|').map((p: string) => p.trim()).filter((p: string) => p && p !== '___REMOVED___');
  const usValuesList = us_values.split('|').map((v: string) => v.trim());
  const competitorValuesList = competitors_values.split('|').map((v: string) => v.trim());

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme color mapping (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        headerBg: '#fff7ed',        // orange-50
        headerBorder: '#fed7aa',    // orange-200
        cardBorder: '#fed7aa',      // orange-200
        cardShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.1), 0 2px 4px -1px rgba(251, 146, 60, 0.06)'
      },
      cool: {
        headerBg: '#eff6ff',        // blue-50
        headerBorder: '#bfdbfe',    // blue-200
        cardBorder: '#bfdbfe',      // blue-200
        cardShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)'
      },
      neutral: {
        headerBg: '#f9fafb',        // gray-50
        headerBorder: '#e5e7eb',    // gray-200
        cardBorder: '#e5e7eb',      // gray-200
        cardShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
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

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: '3rem'
          }}
        />

        {/* Comparison Table */}
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${themeColors.cardBorder}`,
            boxShadow: themeColors.cardShadow
          }}
        >
          {/* Header Row */}
          <div
            className="grid grid-cols-3"
            style={{
              backgroundColor: themeColors.headerBg,
              borderBottom: `1px solid ${themeColors.headerBorder}`
            }}
          >
            {/* Feature Header */}
            <div
              className="p-4"
              style={{
                fontWeight: 700,
                color: '#111827',
                ...bodyTypography
              }}
            >
              <TextPublished value={feature_header} />
            </div>

            {/* Us Header */}
            <div
              className="p-4 text-center"
              style={{
                fontWeight: 700,
                color: '#10b981',
                ...bodyTypography
              }}
            >
              <TextPublished value={us_header} />
            </div>

            {/* Competitors Header */}
            <div
              className="p-4 text-center"
              style={{
                fontWeight: 700,
                color: '#6b7280',
                ...bodyTypography
              }}
            >
              <TextPublished value={competitors_header} />
            </div>
          </div>

          {/* Property Rows */}
          {propertyList.map((property: string, index: number) => (
            <div
              key={index}
              className="grid grid-cols-3"
              style={{
                borderBottom: index < propertyList.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}
            >
              {/* Property Name */}
              <div
                className="p-4"
                style={{
                  fontWeight: 500,
                  color: '#111827',
                  ...bodyTypography
                }}
              >
                <TextPublished value={property} />
              </div>

              {/* Us Value */}
              <div
                className="p-4 text-center"
                style={{
                  fontWeight: 600,
                  color: '#10b981',
                  ...bodyTypography
                }}
              >
                <TextPublished value={usValuesList[index] || ''} />
              </div>

              {/* Competitor Value */}
              <div
                className="p-4 text-center"
                style={{
                  color: '#6b7280',
                  ...bodyTypography
                }}
              >
                <TextPublished value={competitorValuesList[index] || ''} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
