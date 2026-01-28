/**
 * StackedPainBullets - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Uses array-based pain_items instead of pipe-separated strings
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pain item structure (V2)
interface PainItem {
  id: string;
  point: string;
  description?: string;
  icon?: string;
}

// Derive icon from pain point text
const getPainIconFromText = (point: string, description?: string): string => {
  const text = `${point} ${description || ''}`.toLowerCase();

  if (text.includes('time') || text.includes('hour') || text.includes('slow') || text.includes('wait')) {
    return 'Clock';
  }
  if (text.includes('disconnect') || text.includes('integration') || text.includes('sync') || text.includes('talk to each other')) {
    return 'Unlink';
  }
  if (text.includes('deadline') || text.includes('miss') || text.includes('late') || text.includes('urgent')) {
    return 'AlertTriangle';
  }
  if (text.includes('burn') || text.includes('exhaust') || text.includes('tired') || text.includes('overwhelm')) {
    return 'Battery';
  }
  if (text.includes('losing') || text.includes('lost') || text.includes('decline') || text.includes('drop')) {
    return 'TrendingDown';
  }
  if (text.includes('chaos') || text.includes('mess') || text.includes('scattered') || text.includes('disorganiz')) {
    return 'Shuffle';
  }
  if (text.includes('manual') || text.includes('repetitive') || text.includes('tedious')) {
    return 'Hand';
  }
  if (text.includes('customer') || text.includes('client') || text.includes('response')) {
    return 'Users';
  }
  return 'AlertCircle';
};

export default function StackedPainBulletsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Are You Struggling With These Daily Frustrations?';
  const subheadline = props.subheadline || '';
  const conclusion_text = props.conclusion_text || 'Sound familiar? You\'re not alone.';

  // Get pain items (V2 array format)
  const painItems: PainItem[] = Array.isArray(props.pain_items)
    ? props.pain_items
    : [
        { id: 'p1', point: 'Spending hours on manual data entry', description: '' },
        { id: 'p2', point: 'Juggling multiple disconnected tools', description: '' },
        { id: 'p3', point: 'Missing important deadlines', description: '' },
      ];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        border: '#fed7aa',
        borderHover: '#fdba74',
        iconBg: '#ffedd5',
        iconText: '#ea580c',
        conclusionBg: '#fff7ed',
        conclusionBorder: '#fed7aa',
        conclusionText: '#9a3412',
        dotColor: '#fb923c'
      },
      cool: {
        border: '#bfdbfe',
        borderHover: '#93c5fd',
        iconBg: '#dbeafe',
        iconText: '#2563eb',
        conclusionBg: '#eff6ff',
        conclusionBorder: '#bfdbfe',
        conclusionText: '#1e40af',
        dotColor: '#60a5fa'
      },
      neutral: {
        border: '#fde68a',
        borderHover: '#fcd34d',
        iconBg: '#fef3c7',
        iconText: '#d97706',
        conclusionBg: '#fffbeb',
        conclusionBorder: '#fde68a',
        conclusionText: '#92400e',
        dotColor: '#fbbf24'
      }
    };
    return colorMap[theme];
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

  // Render icon component
  const renderIcon = (item: PainItem) => {
    const iconName = item.icon || getPainIconFromText(item.point, item.description);
    const IconComponent = (LucideIcons as any)[iconName] ?? LucideIcons.AlertCircle;
    return <IconComponent size={24} strokeWidth={2} />;
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Pain Points List */}
        <div className="space-y-6">
          {painItems.map((painItem: PainItem) => (
            <div
              key={painItem.id}
              className="group flex items-start space-x-4 p-6 bg-white rounded-lg border hover:shadow-md transition-all duration-300"
              style={{
                borderColor: themeColors.border
              }}
            >
              {/* Pain Icon */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: themeColors.iconBg,
                  color: themeColors.iconText
                }}
              >
                {renderIcon(painItem)}
              </div>

              {/* Pain Content */}
              <div className="flex-1">
                {/* Pain Point */}
                <div className="mb-2">
                  <TextPublished
                    value={painItem.point}
                    style={{
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      color: textColors.heading || '#111827',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>

                {/* Optional Description */}
                {painItem.description && (
                  <TextPublished
                    value={painItem.description}
                    style={{
                      color: textColors.body || '#4b5563',
                      fontSize: '1rem',
                      lineHeight: '1.75rem'
                    }}
                  />
                )}
              </div>

              {/* Emphasis Indicator */}
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: themeColors.dotColor
                }}
              />
            </div>
          ))}
        </div>

        {/* Emotional Conclusion */}
        <div className="mt-16 text-center mb-8">
          <div
            className="inline-flex items-center px-6 py-3 rounded-full border"
            style={{
              backgroundColor: themeColors.conclusionBg,
              borderColor: themeColors.conclusionBorder,
              color: themeColors.conclusionText
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              style={{ color: themeColors.iconText }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <TextPublished
              value={conclusion_text}
              style={{
                fontWeight: 600
              }}
            />
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
