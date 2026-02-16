/**
 * StatBlocks - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';

// Stat item structure (V2 array format)
interface StatItem {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
}


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
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme colors for achievement footer (hex values for inline styles)
  const getFooterColors = (theme: UIBlockTheme) => {
    return {
      warm: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', icon: '#f97316' },
      cool: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: '#3b82f6' },
      neutral: { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', icon: '#6b7280' }
    }[theme];
  };

  const footerColors = getFooterColors(uiTheme);

  // Dynamic card layout
  const layout = getDynamicCardLayout(stats.length);

  // Helper to render stat card
  const renderStatCard = (stat: StatItem, cardClass: string) => {
    const displayIcon = stat.icon || inferIconFromText(stat.label, stat.description);
    return (
      <div
        key={stat.id}
        className={`relative text-center rounded-xl transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
        style={{
          backgroundColor: cardStyles.bg,
          backdropFilter: cardStyles.backdropFilter,
          WebkitBackdropFilter: cardStyles.backdropFilter,
          borderColor: cardStyles.borderColor,
          borderWidth: cardStyles.borderWidth,
          borderStyle: cardStyles.borderStyle,
          boxShadow: cardStyles.boxShadow
        }}
      >
        {/* Icon */}
        <div className="mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{
              backgroundColor: cardStyles.iconBg,
              color: cardStyles.iconColor
            }}
          >
            <IconPublished icon={displayIcon} size={32} color={cardStyles.iconColor} />
          </div>
        </div>

        {/* Value */}
        <div className="mb-4">
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: cardStyles.textHeading,
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
              color: cardStyles.textHeading
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
              color: cardStyles.textBody,
              lineHeight: '1.75'
            }}
          />
        )}
      </div>
    );
  };

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
        {isSplitLayout(stats.length) && layout.splitLayout ? (
          <div className={layout.containerClass}>
            <div className={layout.splitLayout.firstRowGrid}>
              {stats.slice(0, layout.splitLayout.firstRowCount).map((stat: StatItem) =>
                renderStatCard(stat, layout.splitLayout!.firstRowCard)
              )}
            </div>
            <div className={layout.splitLayout.secondRowGrid}>
              {stats.slice(layout.splitLayout.firstRowCount).map((stat: StatItem) =>
                renderStatCard(stat, layout.splitLayout!.secondRowCard)
              )}
            </div>
          </div>
        ) : (
          <div className={layout.containerClass}>
            <div className={layout.gridClass}>
              {stats.map((stat: StatItem) =>
                renderStatCard(stat, layout.cardClass)
              )}
            </div>
          </div>
        )}

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
