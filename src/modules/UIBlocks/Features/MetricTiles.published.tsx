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
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface MetricTileData {
  title: string;
  metric: string;
  label: string;
  description: string;
  icon: string;
}

interface ROIMetric {
  metric: string;
  label: string;
}

export default function MetricTilesPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Quantifiable Results That Drive ROI';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // ROI fields
  const roi_summary_title = props.roi_summary_title || '';
  const show_roi_summary = props.show_roi_summary !== false;
  const roi_description = props.roi_description || '';

  // Parse pipe-separated data
  const titles = (props.feature_titles || '').split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const metrics = (props.feature_metrics || '').split('|').map(m => m.trim()).filter(m => m && m !== '___REMOVED___');
  const labels = (props.metric_labels || '').split('|').map(l => l.trim()).filter(l => l && l !== '___REMOVED___');
  const descriptions = (props.feature_descriptions || '').split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');

  // Extract icons (4 slots)
  const icons = [
    props.metric_icon_1 || '⚡',
    props.metric_icon_2 || '💰',
    props.metric_icon_3 || '✅',
    props.metric_icon_4 || '📈'
  ];

  // Build metric tiles array
  const metricTiles: MetricTileData[] = titles.map((title, idx) => ({
    title,
    metric: metrics[idx] || '',
    label: labels[idx] || '',
    description: descriptions[idx] || '',
    icon: icons[idx] || '📊'
  }));

  // ROI metrics
  const roiMetrics: ROIMetric[] = [
    { metric: props.roi_metric_1 || '', label: props.roi_label_1 || '' },
    { metric: props.roi_metric_2 || '', label: props.roi_label_2 || '' },
    { metric: props.roi_metric_3 || '', label: props.roi_label_3 || '' }
  ].filter(item => item.metric && item.metric !== '___REMOVED___' && item.metric.trim() !== '');

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based gradient styles (inline for SSR)
  const getMetricGradientStyle = (index: number) => {
    const gradientSets = {
      warm: [
        'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
        'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
        'linear-gradient(135deg, #ea580c 0%, #b91c1c 100%)',
        'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
      ],
      cool: [
        'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
      ],
      neutral: [
        'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)',
        'linear-gradient(135deg, #64748b 0%, #4b5563 100%)',
        'linear-gradient(135deg, #6b7280 0%, #64748b 100%)',
        'linear-gradient(135deg, #64748b 0%, #52525b 100%)'
      ]
    };
    return gradientSets[uiTheme][index % 4];
  };

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
    return colorSets[uiTheme][index];
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

  // Trust items
  const trustList = trust_items ? trust_items.split('|').map(item => item.trim()).filter(Boolean) : [];

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
        {metricTiles.length > 0 && (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: metricTiles.length === 1 ? '1fr' :
                                   metricTiles.length === 2 ? 'repeat(2, 1fr)' :
                                   metricTiles.length === 3 ? 'repeat(auto-fit, minmax(250px, 1fr))' :
                                   'repeat(auto-fit, minmax(240px, 1fr))'
            }}
          >
            {metricTiles.map((tile, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4"
                    style={{
                      background: getMetricGradientStyle(index)
                    }}
                  >
                    <span className="text-white text-2xl">{tile.icon}</span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      ...h3Typography,
                      fontWeight: 'bold',
                      color: textColors.heading,
                      marginBottom: '0.5rem'
                    }}
                  >
                    {tile.title}
                  </h3>

                  {/* Metric Display */}
                  <div className="text-center bg-gray-50 rounded-lg p-4 mb-4">
                    <div
                      className="text-4xl font-bold bg-clip-text"
                      style={{
                        backgroundImage: getMetricGradientStyle(index),
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
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

                  {/* Indicator Dot */}
                  <div className="mt-4 flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: getMetricGradientStyle(index)
                      }}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      Measured impact
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROI Summary Section */}
        {show_roi_summary && roi_summary_title && roiMetrics.length > 0 && (
          <div
            className="mt-12 rounded-2xl p-8 border"
            style={{
              background: getRoiBgGradient(),
              borderColor: getRoiBorderColor()
            }}
          >
            <div className="text-center">
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

              <div className="grid md:grid-cols-3 gap-8">
                {roiMetrics.map((item, index) => (
                  <div key={index} className="text-center">
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

              {roi_description && roi_description !== '___REMOVED___' && (
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

        {/* CTA Section */}
        {(supporting_text || cta_text || trustList.length > 0) && (
          <div className="text-center space-y-6 mt-16">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  ...bodyLgTypography,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {cta_text && (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
                  textColor="#FFFFFF"
                  className="px-8 py-4 text-lg"
                />
              )}

              {trustList.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span style={{ color: textColors.muted, fontSize: '0.875rem' }}>
                    {trustList.join(' • ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
