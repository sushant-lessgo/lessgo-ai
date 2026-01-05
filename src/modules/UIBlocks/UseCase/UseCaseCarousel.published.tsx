/**
 * UseCaseCarousel - Published Version
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

interface UseCase {
  title: string;
  icon: string;
}

export default function UseCaseCarouselPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract headline
  const headline = props.headline || 'Endless Possibilities';

  // Extract shared description
  const useCaseDescription = props.use_case_description || 'Optimize and automate this critical business process.';

  // Extract use cases from individual fields
  const useCaseFields = [
    { title: props.use_case_1, icon: props.usecase_icon_1 || '🎧' },
    { title: props.use_case_2, icon: props.usecase_icon_2 || '📊' },
    { title: props.use_case_3, icon: props.usecase_icon_3 || '📈' },
    { title: props.use_case_4, icon: props.usecase_icon_4 || '📋' },
    { title: props.use_case_5, icon: props.usecase_icon_5 || '👥' },
    { title: props.use_case_6, icon: props.usecase_icon_6 || '📦' }
  ];

  // Build use cases array - filter out empty/removed
  const useCases: UseCase[] = useCaseFields
    .map(field => ({
      title: field.title || '',
      icon: field.icon
    }))
    .filter(useCase => useCase.title && useCase.title.trim() !== '' && useCase.title !== '___REMOVED___');

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        iconBg: '#ffedd5',    // orange-100
      },
      cool: {
        iconBg: '#dbeafe',    // blue-100
      },
      neutral: {
        iconBg: '#f3f4f6',    // gray-100
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'secondary', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);

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

        {/* Horizontal Scrolling Carousel */}
        <div className="flex overflow-x-auto space-x-6 pb-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 min-w-[300px] flex-shrink-0"
            >
              {/* Icon Background */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: themeColors.iconBg }}
              >
                <IconPublished
                  icon={useCase.icon}
                  color={textColors.heading}
                  size={24}
                />
              </div>

              {/* Use Case Title */}
              <div className="mb-2">
                <TextPublished
                  value={useCase.title}
                  style={{
                    color: textColors.heading,
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    lineHeight: '1.75rem'
                  }}
                />
              </div>

              {/* Use Case Description */}
              <TextPublished
                value={useCaseDescription}
                style={{
                  color: textColors.muted,
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
