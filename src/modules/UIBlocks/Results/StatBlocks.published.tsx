/**
 * StatBlocks - Published Version (V2)
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

// Stat item structure (V2 array format)
interface StatItem {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

// Get contextual icon based on stat label
const getContextualIcon = (label: string, index: number): string => {
  const lower = label.toLowerCase();

  if (lower.includes('customer') || lower.includes('user') || lower.includes('client')) return '👥';
  if (lower.includes('satisfaction') || lower.includes('rating') || lower.includes('score') || lower.includes('love')) return '❤️';
  if (lower.includes('revenue') || lower.includes('growth') || lower.includes('sales') || lower.includes('profit') || lower.includes('increase')) return '📈';
  if (lower.includes('time') || lower.includes('speed') || lower.includes('fast') || lower.includes('support') || lower.includes('24')) return '⏰';
  if (lower.includes('efficiency') || lower.includes('productivity') || lower.includes('performance') || lower.includes('boost')) return '⚡';
  if (lower.includes('award') || lower.includes('achievement') || lower.includes('success') || lower.includes('winner')) return '🏆';
  if (lower.includes('money') || lower.includes('cost') || lower.includes('save') || lower.includes('dollar')) return '💰';
  if (lower.includes('goal') || lower.includes('target') || lower.includes('hit') || lower.includes('reach')) return '🎯';

  // Positional fallback
  return ['📊', '✨', '🔥', '💡', '🚀', '🎉'][index] || '📊';
};

export default function StatBlocksPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Real Results That Speak for Themselves';
  const subheadline = props.subheadline || '';
  const achievement_footer = props.achievement_footer || '';

  // Get stats array directly (V2 format)
  const stats: StatItem[] = props.stats || [
    { id: 's1', value: '10,000+', label: 'Happy Customers', description: 'And growing daily' },
    { id: 's2', value: '98%', label: 'Customer Satisfaction', description: 'Based on NPS surveys' },
    { id: 's3', value: '2.5x', label: 'Revenue Growth', description: 'Average increase' },
    { id: 's4', value: '24/7', label: 'Support Available', description: 'Always here to help' }
  ];

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

  // Theme colors for achievement footer (hex values for inline styles)
  const getFooterColors = (theme: UIBlockTheme) => {
    return {
      warm: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', icon: '#f97316' },
      cool: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: '#3b82f6' },
      neutral: { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', icon: '#6b7280' }
    }[theme];
  };

  const footerColors = getFooterColors(uiTheme);

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
          {stats.map((stat: StatItem, idx: number) => {
            // Get icon: user-set → derived from label
            const displayIcon = stat.icon || getContextualIcon(stat.label, idx);

            return (
              <div
                key={stat.id}
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
                    <IconPublished icon={displayIcon} size={32} />
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
            );
          })}
        </div>

        {/* Achievement Footer */}
        {achievement_footer && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 border rounded-full"
              style={{
                backgroundColor: footerColors.bg,
                borderColor: footerColors.border,
                color: footerColors.text
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: footerColors.icon }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontWeight: 500, color: footerColors.text }}>
                {achievement_footer}
              </span>
            </div>
          </div>
        )}

      </div>
    </SectionWrapperPublished>
  );
}
