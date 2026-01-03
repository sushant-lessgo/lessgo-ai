/**
 * TimelineToToday - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

// Theme-based color function (server-safe with CSS gradients)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      timelineLine: 'linear-gradient(to bottom, #fed7aa, #fecaca)',
      badgeQuarter: 'linear-gradient(to bottom right, #f97316, #dc2626)',
      badgeMonth: 'linear-gradient(to bottom right, #fb923c, #f59e0b)',
      badgePhase: 'linear-gradient(to bottom right, #ef4444, #ec4899)',
      badgeDefault: 'linear-gradient(to bottom right, #f97316, #dc2626)',
      yearText: '#ea580c',
      currentStateBg: 'linear-gradient(to bottom right, #fff7ed, #fee2e2)',
      currentStateIcon: 'linear-gradient(to bottom right, #f97316, #dc2626)',
      trustNumberColor: '#ea580c',
      borderColor: '#fed7aa',
      founderAvatar: 'linear-gradient(to bottom right, #fb923c, #dc2626)'
    },
    cool: {
      timelineLine: 'linear-gradient(to bottom, #bfdbfe, #ddd6fe)',
      badgeQuarter: 'linear-gradient(to bottom right, #10b981, #059669)',
      badgeMonth: 'linear-gradient(to bottom right, #a855f7, #7c3aed)',
      badgePhase: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
      badgeDefault: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
      yearText: '#2563eb',
      currentStateBg: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
      currentStateIcon: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
      trustNumberColor: '#2563eb',
      borderColor: '#bfdbfe',
      founderAvatar: 'linear-gradient(to bottom right, #60a5fa, #4f46e5)'
    },
    neutral: {
      timelineLine: 'linear-gradient(to bottom, #e5e7eb, #e2e8f0)',
      badgeQuarter: 'linear-gradient(to bottom right, #6b7280, #64748b)',
      badgeMonth: 'linear-gradient(to bottom right, #9ca3af, #64748b)',
      badgePhase: 'linear-gradient(to bottom right, #64748b, #6b7280)',
      badgeDefault: 'linear-gradient(to bottom right, #6b7280, #64748b)',
      yearText: '#4b5563',
      currentStateBg: 'linear-gradient(to bottom right, #f9fafb, #f1f5f9)',
      currentStateIcon: 'linear-gradient(to bottom right, #6b7280, #64748b)',
      trustNumberColor: '#4b5563',
      borderColor: '#e5e7eb',
      founderAvatar: 'linear-gradient(to bottom right, #9ca3af, #64748b)'
    }
  };
  return colorMap[theme];
};

// Smart badge display logic for different time period formats
const getBadgeDisplay = (period: string): string => {
  if (!period) return '??';

  // Check for quarters (Q1 2024, Q2 2024)
  if (period.match(/^Q\d/i)) {
    return period.substring(0, 2).toUpperCase(); // Shows "Q1", "Q2", etc.
  }

  // Check for months (Jan 2024, February 2024)
  const monthMatch = period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (monthMatch) {
    return monthMatch[1].substring(0, 3).toUpperCase(); // Shows "JAN", "FEB", etc.
  }

  // Check for phases (Phase 1, Stage 2)
  const phaseMatch = period.match(/^(Phase|Stage)\s+(\d+)/i);
  if (phaseMatch) {
    return `P${phaseMatch[2]}`; // Shows "P1", "P2", etc.
  }

  // Check for year only (2024)
  if (period.match(/^\d{4}$/)) {
    return period; // Show full year for clarity
  }

  // Check for year in format "2024" within longer string
  const yearMatch = period.match(/\d{4}/);
  if (yearMatch) {
    return yearMatch[0]; // Show full year
  }

  // Default: show first 3 characters
  return period.substring(0, 3).trim().toUpperCase();
};

// Get badge background color based on period type (theme-aware)
const getBadgeColor = (period: string, themeColors: ReturnType<typeof getThemeColors>): string => {
  if (!period) return themeColors.badgeDefault;

  // Quarters - theme-specific
  if (period.match(/^Q\d/i)) {
    return themeColors.badgeQuarter;
  }

  // Months - theme-specific
  if (period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
    return themeColors.badgeMonth;
  }

  // Phases - theme-specific
  if (period.match(/^(Phase|Stage)/i)) {
    return themeColors.badgePhase;
  }

  // Default (years) - theme-specific
  return themeColors.badgeDefault;
};

// Timeline Item Component (server-safe)
const TimelineItemPublished = ({
  year,
  icon,
  title,
  description,
  stats,
  isLast,
  themeColors
}: {
  year: string;
  icon: string;
  title: string;
  description: string;
  stats?: string;
  isLast: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
}) => (
  <div className="relative flex items-start space-x-6 pb-8">
    {/* Timeline line */}
    {!isLast && (
      <div
        className="absolute left-7 top-16 w-0.5 h-full"
        style={{ background: themeColors.timelineLine }}
      ></div>
    )}

    {/* Period badge with dynamic color */}
    <div
      className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
      style={{ background: getBadgeColor(year, themeColors) }}
    >
      {getBadgeDisplay(year)}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 bg-white rounded-lg shadow-md border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="text-sm font-medium" style={{ color: themeColors.yearText }}>
              {year}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-3">{description}</p>

      {stats && (
        <div className="bg-gray-50 rounded-md px-3 py-2">
          <p className="text-sm font-medium text-gray-600">{stats}</p>
        </div>
      )}
    </div>
  </div>
);

export default function TimelineToTodayPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Detect theme from props
  const uiBlockTheme: UIBlockTheme = (props.manualThemeOverride as UIBlockTheme) || 'neutral';
  const themeColors = getThemeColors(uiBlockTheme);

  // Extract content from props
  const headline = props.headline || 'Our Journey: From Idea to Impact';
  const intro_text = props.intro_text || 'What started as a simple frustration in my garage has grown into a platform...';
  const timeline_items = props.timeline_items || '';
  const current_milestone = props.current_milestone || 'Today, we\'re proud to serve over 10,000 businesses...';
  const cta_text = props.cta_text || 'Join Our Story';
  const founder_name = props.founder_name || 'Sarah Chen';
  const company_name = props.company_name || 'YourCompany';
  const current_state_heading = props.current_state_heading || 'Where We Are Today';
  const current_state_icon = props.current_state_icon || '🎯';

  // Get trust items
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter(item => item && item !== '___REMOVED___' && item.trim() !== '');

  // Parse timeline items (format: "Year|Icon|Title|Description|Stats|Year|Icon|Title|Description|Stats...")
  const parseTimelineItems = () => {
    if (!timeline_items) return [];

    const parts = timeline_items.split('|');
    const items = [];

    for (let i = 0; i < parts.length; i += 4) {
      if (parts[i] && parts[i + 1] && parts[i + 2]) {
        items.push({
          year: parts[i].trim(),
          icon: parts[i + 1].trim(),
          title: parts[i + 2].trim(),
          description: parts[i + 3] ? parts[i + 3].trim() : ''
        });
      }
    }

    return items;
  };

  const timelineItems = parseTimelineItems();

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              ...h2Typography,
              marginBottom: '1rem',
              color: textColors.heading
            }}
          />

          <TextPublished
            value={intro_text}
            style={{
              ...bodyLgTypography,
              color: textColors.body
            }}
            className="max-w-3xl mx-auto"
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="space-y-0">
            {timelineItems.map((item, index) => (
              <TimelineItemPublished
                key={index}
                year={item.year}
                icon={item.icon}
                title={item.title}
                description={item.description}
                isLast={index === timelineItems.length - 1}
                themeColors={themeColors}
              />
            ))}
          </div>
        </div>

        {/* Current State */}
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: themeColors.currentStateBg }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg"
              style={{ background: themeColors.currentStateIcon }}
            >
              {current_state_icon}
            </div>

            <HeadlinePublished
              value={current_state_heading}
              level="h3"
              style={{
                ...h3Typography,
                marginBottom: '1rem',
                color: '#111827'
              }}
            />

            <TextPublished
              value={current_milestone}
              style={{
                color: '#374151',
                lineHeight: '1.625',
                marginBottom: '1.5rem'
              }}
            />

            {/* Stats Grid */}
            {trustItems.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trustItems.map((item, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="text-2xl font-bold mb-1"
                        style={{ color: themeColors.trustNumberColor }}
                      >
                        {item.split(' ')[0]}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <CTAButtonPublished
              text={cta_text}
              backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
              textColor="#FFFFFF"
              className="shadow-xl mb-6 px-8 py-4 text-lg"
            />

            {/* Founder Attribution */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: themeColors.borderColor }}>
              <div className="flex items-center justify-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: themeColors.founderAvatar }}
                >
                  {founder_name.charAt(0) || 'F'}
                </div>
                <div className="text-left">
                  <TextPublished
                    value={founder_name}
                    style={{
                      fontWeight: 600,
                      color: '#111827'
                    }}
                  />
                  <TextPublished
                    value={`Founder, ${company_name}`}
                    style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
