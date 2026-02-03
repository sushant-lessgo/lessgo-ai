/**
 * TechnicalAdvantage - Published Version (V2: Array-based)
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
import { inferIconFromText } from '@/lib/iconCategoryMap';

// V2: Advantage item structure
interface Advantage {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function TechnicalAdvantagePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Technical Advantages That Set Us Apart';
  const subheadline = props.subheadline || '';

  // V2: Direct array access (no more pipe parsing)
  const advantages: Advantage[] = props.advantages || [];

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme colors (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBg: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)', // orange-50 to red-50
        iconBg: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)', // orange-500 to red-600
        cardBorder: '#fed7aa', // orange-200
        shadow: 'rgba(251, 146, 60, 0.1)'
      },
      cool: {
        cardBg: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', // blue-50 to indigo-50
        iconBg: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)', // blue-500 to indigo-600
        cardBorder: '#bfdbfe', // blue-200
        shadow: 'rgba(96, 165, 250, 0.1)'
      },
      neutral: {
        cardBg: 'linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%)', // gray-50 to slate-50
        iconBg: 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)', // gray-500 to slate-600
        cardBorder: '#e5e7eb', // gray-200
        shadow: 'rgba(107, 114, 128, 0.1)'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
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
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Advantage Cards Grid */}
        <div className={`grid gap-6 ${
          advantages.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          advantages.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          advantages.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
          advantages.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {advantages.map((advantage: Advantage) => {
            // Icon derivation: stored value → smart default
            const displayIcon = advantage.icon || inferIconFromText(advantage.title, advantage.description);

            return (
              <div
                key={advantage.id}
                className="rounded-xl p-6 hover:shadow-lg transition-all duration-300 h-full"
                style={{
                  background: themeColors.cardBg,
                  border: `1px solid ${themeColors.cardBorder}`
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon Background */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center shadow-md"
                    style={{
                      background: themeColors.iconBg
                    }}
                  >
                    <IconPublished
                      icon={displayIcon}
                      size={32}
                      className="text-2xl text-white"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <TextPublished
                      value={advantage.title}
                      style={{
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: '#111827',
                        marginBottom: '0.5rem'
                      }}
                    />

                    {advantage.description && (
                      <TextPublished
                        value={advantage.description}
                        style={{
                          color: '#4b5563',
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
