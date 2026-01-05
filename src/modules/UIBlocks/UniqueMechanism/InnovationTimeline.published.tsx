/**
 * InnovationTimeline - Published Version
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

// Timeline item structure
interface TimelineItem {
  date: string;
  event: string;
  description: string;
  icon: string;
}

// Parse timeline data from pipe-separated strings
const parseTimelineData = (
  dates: string,
  events: string,
  descriptions: string,
  icons: string[]
): TimelineItem[] => {
  const dateList = dates.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const eventList = events.split('|').map(e => e.trim());
  const descriptionList = descriptions.split('|').map(d => d.trim());

  return dateList.map((date, index) => ({
    date,
    event: eventList[index] || 'Event not provided',
    description: descriptionList[index] || 'Description not provided.',
    icon: icons[index] || '📅'
  }));
};

export default function InnovationTimelinePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'Innovation Timeline';
  const timeline_subtitle = props.timeline_subtitle || '';
  const timeline_dates = props.timeline_dates || '';
  const timeline_events = props.timeline_events || '';
  const timeline_descriptions = props.timeline_descriptions || '';

  // Extract icons (up to 7)
  const icons = [
    props.timeline_icon_1 || '🔬',
    props.timeline_icon_2 || '🔧',
    props.timeline_icon_3 || '🧪',
    props.timeline_icon_4 || '🚀',
    props.timeline_icon_5 || '🤖',
    props.timeline_icon_6 || '🌍',
    props.timeline_icon_7 || '💡'
  ];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Parse timeline items
  const timelineItems = parseTimelineData(
    timeline_dates,
    timeline_events,
    timeline_descriptions,
    icons
  );

  // Get theme colors (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        timelineLine: '#fb923c',           // orange-400
        iconBgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // orange-500 to orange-600
        dateBadgeBg: '#ffedd5',            // orange-100
        dateBadgeText: '#9a3412',          // orange-800
        cardBorder: '#e5e7eb',             // gray-200
        cardBorderHover: '#fdba74'         // orange-300
      },
      cool: {
        timelineLine: '#60a5fa',           // blue-400
        iconBgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // blue-500 to blue-600
        dateBadgeBg: '#dbeafe',            // blue-100
        dateBadgeText: '#1e40af',          // blue-800
        cardBorder: '#e5e7eb',             // gray-200
        cardBorderHover: '#93c5fd'         // blue-300
      },
      neutral: {
        timelineLine: '#9ca3af',           // gray-400
        iconBgGradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', // gray-500 to gray-600
        dateBadgeBg: '#f3f4f6',            // gray-100
        dateBadgeText: '#1f2937',          // gray-800
        cardBorder: '#e5e7eb',             // gray-200
        cardBorderHover: '#d1d5db'         // gray-400
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors for headline/subtitle
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);

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
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: timeline_subtitle ? '1rem' : '0'
            }}
          />

          {timeline_subtitle && (
            <TextPublished
              value={timeline_subtitle}
              style={{
                color: textColors.body,
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Timeline Items */}
        <div className="space-y-8">
          {timelineItems.map((item, index) => {
            const [isHovered, setIsHovered] = React.useState(false);

            return (
              <div key={`timeline-${index}`} className="relative flex items-start space-x-6">
                {/* Timeline connecting line */}
                {index < timelineItems.length - 1 && (
                  <div
                    className="absolute left-6 top-16 w-0.5 h-20"
                    style={{
                      background: `linear-gradient(to bottom, ${themeColors.timelineLine}, transparent)`
                    }}
                  />
                )}

                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg z-10"
                  style={{
                    background: themeColors.iconBgGradient
                  }}
                >
                  <IconPublished
                    value={item.icon}
                    size="sm"
                    className="text-white"
                  />
                </div>

                {/* Timeline card */}
                <div
                  className="bg-white p-6 rounded-lg border hover:shadow-lg transition-all duration-300 flex-1"
                  style={{
                    borderColor: isHovered ? themeColors.cardBorderHover : themeColors.cardBorder
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Date badge */}
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className="px-3 py-1 rounded-full font-semibold text-sm"
                      style={{
                        backgroundColor: themeColors.dateBadgeBg,
                        color: themeColors.dateBadgeText
                      }}
                    >
                      {item.date}
                    </div>
                  </div>

                  {/* Event title */}
                  <TextPublished
                    value={item.event}
                    style={{
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}
                  />

                  {/* Description */}
                  <TextPublished
                    value={item.description}
                    style={{
                      color: '#4b5563',
                      lineHeight: '1.5'
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
