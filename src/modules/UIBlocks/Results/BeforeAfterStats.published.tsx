/**
 * BeforeAfterStats - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function BeforeAfterStatsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'See the Transformation Our Customers Experience';
  const subheadline = props.subheadline || '';
  const stat_metrics = props.stat_metrics || '';
  const stat_before = props.stat_before || '';
  const stat_after = props.stat_after || '';
  const stat_improvements = props.stat_improvements || '';
  const time_period = props.time_period || '';
  const footer_text = props.footer_text || '';
  const before_icon = props.before_icon || '❌';
  const after_icon = props.after_icon || '✅';
  const improvement_icon = props.improvement_icon || '📈';

  // Parse pipe-separated data
  const metricList = stat_metrics.split('|').map(m => m.trim()).filter(m => m && m !== '___REMOVED___');
  const beforeList = stat_before.split('|').map(b => b.trim());
  const afterList = stat_after.split('|').map(a => a.trim());
  const improvementList = stat_improvements.split('|').map(i => i.trim());

  const statComparisons = metricList.map((metric, index) => ({
    metric,
    before: beforeList[index] || '0',
    after: afterList[index] || '0',
    improvement: improvementList[index] || '+0%'
  }));

  // Don't render if no stats
  if (statComparisons.length === 0) return null;

  // Theme detection
  const uiTheme: UIBlockTheme =
    props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Theme colors (inline styles for SSR)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',
        cardBorderHover: '#fdba74',
        arrowGradient: 'linear-gradient(to bottom right, #f97316, #dc2626)',
        improvementGradient: 'linear-gradient(to right, #f97316, #dc2626)',
        timePeriodBg: '#ffedd5',
        timePeriodBorder: '#fed7aa',
        timePeriodText: '#9a3412',
        timePeriodIcon: '#ea580c'
      },
      cool: {
        cardBorder: '#bfdbfe',
        cardBorderHover: '#93c5fd',
        arrowGradient: 'linear-gradient(to bottom right, #3b82f6, #6366f1)',
        improvementGradient: 'linear-gradient(to right, #3b82f6, #6366f1)',
        timePeriodBg: '#dbeafe',
        timePeriodBorder: '#bfdbfe',
        timePeriodText: '#1e3a8a',
        timePeriodIcon: '#2563eb'
      },
      neutral: {
        cardBorder: '#e5e7eb',
        cardBorderHover: '#d1d5db',
        arrowGradient: 'linear-gradient(to bottom right, #6b7280, #64748b)',
        improvementGradient: 'linear-gradient(to right, #4b5563, #475569)',
        timePeriodBg: '#f9fafb',
        timePeriodBorder: '#e5e7eb',
        timePeriodText: '#1f2937',
        timePeriodIcon: '#6b7280'
      }
    }[theme];
  };

  const colors = getThemeColors(uiTheme);

  // Grid column logic
  const gridCols = statComparisons.length === 2 ? 'md:grid-cols-2 max-w-4xl' :
                   statComparisons.length === 3 ? 'md:grid-cols-3 max-w-6xl' :
                   statComparisons.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                   'md:grid-cols-2 lg:grid-cols-3';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            className="mb-4"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              className="mb-6 max-w-3xl mx-auto"
              style={{
                color: textColors.body,
                ...bodyTypography
              }}
            />
          )}
          {time_period && (
            <div
              className="inline-flex items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: colors.timePeriodBg,
                border: `1px solid ${colors.timePeriodBorder}`,
                color: colors.timePeriodText
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: colors.timePeriodIcon }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{time_period}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-8 ${gridCols} mx-auto`}>
          {statComparisons.map((stat, idx) => (
            <div
              key={idx}
              className="p-8 bg-white rounded-2xl"
              style={{
                border: `1px solid ${colors.cardBorder}`
              }}
            >
              {/* Metric */}
              <h3 className="mb-6 text-center font-semibold text-gray-900">
                {stat.metric}
              </h3>

              {/* Before/After Comparison */}
              <div className="space-y-6">
                {/* Before */}
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <IconPublished icon={before_icon} size={18} color="#dc2626" />
                    </div>
                    <span className="text-sm font-medium text-red-800">Before</span>
                  </div>
                  <span className="font-bold text-red-900 text-xl">{stat.before}</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ background: colors.arrowGradient }}
                  >
                    ⬇️
                  </div>
                </div>

                {/* After */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <IconPublished icon={after_icon} size={18} color="#16a34a" />
                    </div>
                    <span className="text-sm font-medium text-green-800">After</span>
                  </div>
                  <span className="font-bold text-green-900 text-xl">{stat.after}</span>
                </div>
              </div>

              {/* Improvement Badge */}
              <div className="mt-6 text-center">
                <div
                  className="inline-flex items-center px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ background: colors.improvementGradient }}
                >
                  <IconPublished icon={improvement_icon} size={16} color="#ffffff" className="mr-2" />
                  <span>{stat.improvement}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer_text && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-800">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{footer_text}</span>
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
