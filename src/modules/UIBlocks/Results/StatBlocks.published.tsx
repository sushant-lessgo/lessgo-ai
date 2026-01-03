/**
 * StatBlocks - Published Version
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

// Stat item structure
interface Stat {
  value: string;
  label: string;
  description: string;
}

export default function StatBlocksPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Real Results That Speak for Themselves';
  const subheadline = props.subheadline || '';
  const achievement_footer = props.achievement_footer || '';

  // Parse stat data from pipe-separated strings
  const stat_values = props.stat_values || '';
  const stat_labels = props.stat_labels || '';
  const stat_descriptions = props.stat_descriptions || '';

  const valueList = stat_values.split('|').map(v => v.trim()).filter(v => v && v !== '___REMOVED___');
  const labelList = stat_labels.split('|').map(l => l.trim());
  const descList = stat_descriptions ? stat_descriptions.split('|').map(d => d.trim()) : [];

  const stats: Stat[] = valueList.map((value, idx) => ({
    value,
    label: labelList[idx] || 'Metric',
    description: descList[idx] || ''
  }));

  // Get stat icon (emoji-based)
  const getStatIcon = (index: number): string => {
    const iconFields = ['stat_icon_1', 'stat_icon_2', 'stat_icon_3', 'stat_icon_4', 'stat_icon_5', 'stat_icon_6'];
    const iconField = iconFields[index];
    const iconValue = props[iconField];

    // Return icon if available, otherwise use contextual fallback based on label
    if (iconValue) return iconValue;

    // Contextual icon fallback based on stat label
    const label = stats[index]?.label?.toLowerCase() || '';
    if (label.includes('customer') || label.includes('user') || label.includes('client')) return '👥';
    if (label.includes('satisfaction') || label.includes('rating') || label.includes('score') || label.includes('love')) return '❤️';
    if (label.includes('revenue') || label.includes('growth') || label.includes('sales') || label.includes('profit') || label.includes('increase')) return '📈';
    if (label.includes('time') || label.includes('speed') || label.includes('fast') || label.includes('support') || label.includes('24')) return '⏰';
    if (label.includes('efficiency') || label.includes('productivity') || label.includes('performance') || label.includes('boost')) return '⚡';
    if (label.includes('award') || label.includes('achievement') || label.includes('success') || label.includes('winner')) return '🏆';
    if (label.includes('money') || label.includes('cost') || label.includes('save') || label.includes('dollar')) return '💰';
    if (label.includes('goal') || label.includes('target') || label.includes('hit') || label.includes('reach')) return '🎯';

    // Positional fallback
    return ['📊', '✨', '🔥', '💡', '🚀', '🎉'][index] || '📊';
  };

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
                                 (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme colors (hex values for inline styles)
  const getStatCardColors = (theme: UIBlockTheme) => {
    return {
      warm: { border: '#fed7aa', iconBg: '#ffedd5', iconText: '#ea580c' },
      cool: { border: '#bfdbfe', iconBg: '#dbeafe', iconText: '#2563eb' },
      neutral: { border: '#e5e7eb', iconBg: '#f3f4f6', iconText: '#6b7280' }
    }[theme];
  };

  const colors = getStatCardColors(uiTheme);

  // Grid layout logic
  const gridCols = stats.length === 2 ? 'md:grid-cols-2 max-w-3xl' :
                   stats.length === 3 ? 'md:grid-cols-3 max-w-5xl' :
                   stats.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                   'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

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
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-8 ${gridCols} mx-auto`}>
          {stats.map((stat, idx) => (
            <div
              key={`stat-${idx}`}
              className="relative text-center p-8 bg-white rounded-xl border transition-all duration-300"
              style={{ borderColor: colors.border }}
            >
              {/* Icon */}
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    backgroundColor: colors.iconBg,
                    color: colors.iconText
                  }}
                >
                  <IconPublished icon={getStatIcon(idx)} size={32} />
                </div>
              </div>

              {/* Value */}
              <div className="mb-4">
                <div
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    lineHeight: '1'
                  }}
                >
                  {stat.value}
                </div>
              </div>

              {/* Label */}
              <div className="mb-3">
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}
                >
                  {stat.label}
                </div>
              </div>

              {/* Description */}
              {stat.description && (
                <TextPublished
                  value={stat.description}
                  style={{
                    color: '#6b7280',
                    lineHeight: '1.75'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Achievement Footer */}
        {achievement_footer && achievement_footer !== '___REMOVED___' && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 border rounded-full"
              style={{
                backgroundColor: '#f0fdf4',
                borderColor: '#bbf7d0',
                color: '#166534'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontWeight: 500, color: '#166534' }}>
                {achievement_footer}
              </span>
            </div>
          </div>
        )}

      </div>
    </SectionWrapperPublished>
  );
}
