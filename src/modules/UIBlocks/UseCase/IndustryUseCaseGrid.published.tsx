/**
 * IndustryUseCaseGrid - Published Version
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

interface IndustryCard {
  industry: string;
  useCase: string;
  icon: string;
}

export default function IndustryUseCaseGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Trusted Across Industries';

  // Extract individual fields
  const individualIndustries = [
    props.industry_1,
    props.industry_2,
    props.industry_3,
    props.industry_4,
    props.industry_5,
    props.industry_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  const individualUseCases = [
    props.use_case_1,
    props.use_case_2,
    props.use_case_3,
    props.use_case_4,
    props.use_case_5,
    props.use_case_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  // Extract icons with defaults
  const icons = [
    props.industry_icon_1 || '🏥',
    props.industry_icon_2 || '🏦',
    props.industry_icon_3 || '🏭',
    props.industry_icon_4 || '🛍️',
    props.industry_icon_5 || '🎓',
    props.industry_icon_6 || '💻'
  ];

  // Build industry cards array
  const industryCards: IndustryCard[] = individualIndustries.map((industry: string, index: number) => ({
    industry,
    useCase: individualUseCases[index] || 'Industry-specific use case',
    icon: icons[index] || '🏢'
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme color mapping (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',                                    // orange-200
        cardHoverShadow: '0 10px 15px -3px rgba(251, 146, 60, 0.1), 0 4px 6px -2px rgba(251, 146, 60, 0.05)',
        iconBg: '#fff7ed',                                        // orange-50
        iconText: '#ea580c'                                       // orange-600
      },
      cool: {
        cardBorder: '#bfdbfe',                                    // blue-200
        cardHoverShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
        iconBg: '#eff6ff',                                        // blue-50
        iconText: '#2563eb'                                       // blue-600
      },
      neutral: {
        cardBorder: '#e5e7eb',                                    // gray-200
        cardHoverShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        iconBg: '#f9fafb',                                        // gray-50
        iconText: '#4b5563'                                       // gray-600
      }
    }[theme];
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
  const industryTypography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: '4rem'
          }}
        />

        {/* Industry Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industryCards.map((card: IndustryCard, index: number) => (
            <div
              key={`industry-${index}`}
              className="bg-white p-8 rounded-xl transition-all duration-300"
              style={{
                border: `1px solid ${themeColors.cardBorder}`,
                boxShadow: themeColors.cardHoverShadow
              }}
            >
              {/* Icon Container - Circular with theme background */}
              <div
                className="w-32 h-32 mx-auto flex items-center justify-center mb-6 rounded-full"
                style={{
                  backgroundColor: themeColors.iconBg
                }}
              >
                <IconPublished
                  icon={card.icon}
                  color={themeColors.iconText}
                  size={60}
                />
              </div>

              {/* Industry Name */}
              <div className="mb-4 text-center">
                <TextPublished
                  value={card.industry}
                  style={{
                    fontWeight: 700,
                    color: '#111827',
                    ...industryTypography
                  }}
                />
              </div>

              {/* Use Case Description */}
              <div className="text-center">
                <TextPublished
                  value={card.useCase}
                  style={{
                    color: '#6b7280',
                    ...bodyTypography
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
