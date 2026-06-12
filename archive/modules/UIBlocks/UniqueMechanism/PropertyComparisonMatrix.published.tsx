/**
 * PropertyComparisonMatrix - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

interface ComparisonRow {
  id: string;
  property: string;
  us_value: string;
  competitor_value: string;
}

const DEFAULT_ROWS: ComparisonRow[] = [
  { id: 'r1', property: 'Speed', us_value: 'Ultra-Fast', competitor_value: 'Slow' },
  { id: 'r2', property: 'Accuracy', us_value: '99.9%', competitor_value: '95%' },
  { id: 'r3', property: 'Security', us_value: 'Enterprise', competitor_value: 'Basic' },
  { id: 'r4', property: 'Scalability', us_value: 'Unlimited', competitor_value: 'Limited' },
  { id: 'r5', property: 'Support', us_value: '24/7', competitor_value: 'Business Hours' },
];

export default function PropertyComparisonMatrixPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'How We Compare';
  const subheadline = props.subheadline || '';
  const feature_header = props.feature_header || 'Feature';
  const us_header = props.us_header || 'Us';
  const competitors_header = props.competitors_header || 'Competitors';
  const footer_text = props.footer_text || '';
  const comparison_rows: ComparisonRow[] = props.comparison_rows || DEFAULT_ROWS;

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Theme color mapping (HEX values for inline styles) - with "Us" column highlight
  const getThemeColors = (themeVal: UIBlockTheme) => {
    return {
      warm: {
        headerBg: '#fff7ed',        // orange-50
        headerBorder: '#fdba74',    // orange-300 (stronger)
        cardBorder: '#fed7aa',      // orange-200
        cardShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.1), 0 2px 4px -1px rgba(251, 146, 60, 0.06)',
        usColumnBg: 'rgba(255, 247, 237, 0.7)',  // orange-50/70
        usColumnText: '#ea580c',    // orange-600
        usHeaderText: '#ea580c',    // orange-600
        rowBorder: '#ffedd5',       // orange-100
      },
      cool: {
        headerBg: '#eff6ff',        // blue-50
        headerBorder: '#93c5fd',    // blue-300 (stronger)
        cardBorder: '#bfdbfe',      // blue-200
        cardShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
        usColumnBg: 'rgba(239, 246, 255, 0.7)',  // blue-50/70
        usColumnText: '#2563eb',    // blue-600
        usHeaderText: '#2563eb',    // blue-600
        rowBorder: '#dbeafe',       // blue-100
      },
      neutral: {
        headerBg: '#f3f4f6',        // gray-100 (stronger)
        headerBorder: '#d1d5db',    // gray-300 (stronger)
        cardBorder: '#e5e7eb',      // gray-200
        cardShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        usColumnBg: '#f9fafb',      // gray-50
        usColumnText: '#374151',    // gray-700
        usHeaderText: '#374151',    // gray-700
        rowBorder: '#e5e7eb',       // gray-200
      }
    }[themeVal];
  };

  const themeColors = getThemeColors(uiTheme);

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

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
      <div className="max-w-5xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: subheadline ? '1rem' : '3rem'
          }}
        />

        {/* Optional Subheadline */}
        {subheadline && (
          <div
            style={{
              color: textColors.body,
              ...bodyTypography,
              textAlign: 'center',
              marginBottom: '3rem',
              maxWidth: '42rem',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <TextPublished value={subheadline} />
          </div>
        )}

        {/* Comparison Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: cardStyles.bg,
            backdropFilter: cardStyles.backdropFilter,
            border: `${cardStyles.borderWidth} ${cardStyles.borderStyle} ${cardStyles.borderColor}`,
            boxShadow: cardStyles.boxShadow
          }}
        >
          {/* Header Row - stronger border */}
          <div
            className="grid grid-cols-3"
            style={{
              backgroundColor: themeColors.headerBg,
              borderBottom: `2px solid ${themeColors.headerBorder}`
            }}
          >
            {/* Feature Header */}
            <div
              style={{
                padding: '1.25rem',
                fontWeight: 700,
                color: cardStyles.textHeading,
                ...bodyTypography
              }}
            >
              <TextPublished value={feature_header} />
            </div>

            {/* Us Header - with background highlight */}
            <div
              className="text-center"
              style={{
                padding: '1.25rem',
                fontWeight: 700,
                color: themeColors.usHeaderText,
                backgroundColor: themeColors.usColumnBg,
                ...bodyTypography
              }}
            >
              <TextPublished value={us_header} />
            </div>

            {/* Competitors Header */}
            <div
              className="text-center"
              style={{
                padding: '1.25rem',
                fontWeight: 700,
                color: cardStyles.textMuted,
                ...bodyTypography
              }}
            >
              <TextPublished value={competitors_header} />
            </div>
          </div>

          {/* Comparison Rows - with "Us" column highlight */}
          {comparison_rows.map((row: ComparisonRow, index: number) => (
            <div
              key={row.id}
              className="grid grid-cols-3"
              style={{
                borderBottom: index < comparison_rows.length - 1 ? `1px solid ${themeColors.rowBorder}` : 'none'
              }}
            >
              {/* Property Name */}
              <div
                style={{
                  padding: '1.25rem',
                  fontWeight: 500,
                  color: cardStyles.textHeading,
                  ...bodyTypography
                }}
              >
                <TextPublished value={row.property} />
              </div>

              {/* Us Value - with background highlight */}
              <div
                className="text-center"
                style={{
                  padding: '1.25rem',
                  fontWeight: 600,
                  color: themeColors.usColumnText,
                  backgroundColor: themeColors.usColumnBg,
                  ...bodyTypography
                }}
              >
                <TextPublished value={row.us_value} />
              </div>

              {/* Competitor Value */}
              <div
                className="text-center"
                style={{
                  padding: '1.25rem',
                  color: cardStyles.textMuted,
                  ...bodyTypography
                }}
              >
                <TextPublished value={row.competitor_value} />
              </div>
            </div>
          ))}
        </div>

        {/* Optional Footer Text */}
        {footer_text && (
          <div
            style={{
              color: textColors.body,
              ...bodyTypography,
              textAlign: 'center',
              marginTop: '2rem',
            }}
          >
            <TextPublished value={footer_text} />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
