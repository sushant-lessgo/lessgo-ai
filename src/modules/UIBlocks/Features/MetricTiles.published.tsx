/**
 * MetricTiles - Published Version
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

// V2 Types (no icon - metrics draw attention on their own)
interface MetricItem {
  id: string;
  title: string;
  metric: string;
  label: string;
  description: string;
}

interface RoiMetricItem {
  id: string;
  metric: string;
  label: string;
}

// Theme-based card styling (inline for SSR)
const getCardStyles = (theme: UIBlockTheme) => ({
  warm: {
    border: '#fed7aa', // orange-200
    shadow: '0 4px 20px rgba(249,115,22,0.15)',
    shadowHover: '0 8px 30px rgba(249,115,22,0.25)',
  },
  cool: {
    border: '#bfdbfe', // blue-200
    shadow: '0 4px 20px rgba(37,99,235,0.15)',
    shadowHover: '0 8px 30px rgba(37,99,235,0.25)',
  },
  neutral: {
    border: '#e5e7eb', // gray-200
    shadow: '0 4px 20px rgba(100,116,139,0.15)',
    shadowHover: '0 8px 30px rgba(100,116,139,0.25)',
  }
})[theme];

// Theme-based metric text color (solid, not gradient - bg-clip-text unreliable)
const getMetricTextColor = (theme: UIBlockTheme) => ({
  warm: '#ea580c',   // orange-600
  cool: '#2563eb',   // blue-600
  neutral: '#374151' // gray-700
})[theme];

export default function MetricTilesPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Quantifiable Results That Drive ROI';
  const subheadline = props.subheadline || '';

  // ROI fields
  const roi_summary_title = props.roi_summary_title || '';
  const show_roi_summary = props.show_roi_summary !== false;
  const roi_description = props.roi_description || '';

  // V2 Arrays
  const metrics: MetricItem[] = props.metrics || [];
  const roiMetrics: RoiMetricItem[] = props.roi_metrics || [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');
  const cardStyles = getCardStyles(uiTheme);

  // ROI section background gradient
  const getRoiBgGradient = () => {
    const bgGradients = {
      warm: 'linear-gradient(90deg, #fff7ed 0%, #fee2e2 50%, #fff7ed 100%)',
      cool: 'linear-gradient(90deg, #eff6ff 0%, #eef2ff 50%, #eff6ff 100%)',
      neutral: 'linear-gradient(90deg, #f9fafb 0%, #f1f5f9 50%, #f9fafb 100%)'
    };
    return bgGradients[uiTheme];
  };

  // ROI metric text colors
  const getRoiMetricColor = (index: number) => {
    const colorSets = {
      warm: ['#ea580c', '#dc2626', '#b91c1c'],
      cool: ['#2563eb', '#6366f1', '#1d4ed8'],
      neutral: ['#4b5563', '#64748b', '#52525b']
    };
    return colorSets[uiTheme][index % 3];
  };

  // ROI border color
  const getRoiBorderColor = () => {
    const borders = {
      warm: '#fed7aa',
      cool: '#bfdbfe',
      neutral: '#e5e7eb'
    };
    return borders[uiTheme];
  };

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Grid columns based on count
  const getGridStyle = (count: number) => {
    if (count === 1) return '1fr';
    if (count === 2) return 'repeat(2, 1fr)';
    if (count === 3) return 'repeat(auto-fit, minmax(280px, 1fr))';
    if (count === 4) return 'repeat(auto-fit, minmax(260px, 1fr))';
    if (count <= 6) return 'repeat(auto-fit, minmax(280px, 1fr))';
    return 'repeat(auto-fit, minmax(240px, 1fr))';
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Metric Tiles Grid */}
        {metrics.length > 0 && (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: getGridStyle(metrics.length)
            }}
          >
            {metrics.map((tile) => (
              <div
                key={tile.id}
                className="bg-white rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{
                  boxShadow: cardStyles.shadow,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: cardStyles.border
                }}
              >
                {/* Title */}
                <h3
                  style={{
                    ...h3Typography,
                    fontWeight: 'bold',
                    color: textColors.heading,
                    marginBottom: '1rem'
                  }}
                >
                  {tile.title}
                </h3>

                {/* Metric Display */}
                <div className="text-center bg-gray-50 rounded-lg p-4 mb-4">
                  <div
                    className="text-4xl font-bold"
                    style={{
                      color: getMetricTextColor(uiTheme)
                    }}
                  >
                    {tile.metric}
                  </div>
                  <div
                    className="text-sm font-medium uppercase tracking-wide"
                    style={{ color: textColors.muted }}
                  >
                    {tile.label}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-auto">
                  <TextPublished
                    value={tile.description}
                    style={{
                      color: textColors.muted,
                      fontSize: '0.875rem',
                      lineHeight: '1.75'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROI Summary Section */}
        {show_roi_summary && (roi_summary_title || roiMetrics.length > 0) && (
          <div
            className="mt-12 rounded-2xl p-8 border"
            style={{
              background: getRoiBgGradient(),
              borderColor: getRoiBorderColor()
            }}
          >
            <div className="text-center">
              {roi_summary_title && (
                <h3
                  style={{
                    ...h3Typography,
                    fontWeight: 700,
                    color: textColors.heading,
                    marginBottom: '1rem'
                  }}
                >
                  {roi_summary_title}
                </h3>
              )}

              {roiMetrics.length > 0 && (
                <div className="grid md:grid-cols-3 gap-8">
                  {roiMetrics.map((item, index) => (
                    <div key={item.id} className="text-center">
                      <div
                        className="text-4xl font-bold mb-2"
                        style={{ color: getRoiMetricColor(index) }}
                      >
                        {item.metric}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: textColors.muted }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {roi_description && (
                <div className="mt-6">
                  <TextPublished
                    value={roi_description}
                    style={{
                      color: textColors.muted,
                      maxWidth: '32rem',
                      margin: '0 auto'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
