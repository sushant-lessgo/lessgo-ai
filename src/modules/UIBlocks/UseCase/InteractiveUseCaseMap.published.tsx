/**
 * InteractiveUseCaseMap - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Displays all categories in a grid (no interactive selection)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface CategoryCard {
  category: string;
  useCase: string;
  icon: string;
}

export default function InteractiveUseCaseMapPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract headline
  const headline = props.headline || 'Explore Use Cases by Category';

  // Extract categories - filter out empty and removed
  const categories = [
    props.category_1,
    props.category_2,
    props.category_3,
    props.category_4,
    props.category_5,
    props.category_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  // Extract use cases
  const useCases = [
    props.use_case_1,
    props.use_case_2,
    props.use_case_3,
    props.use_case_4,
    props.use_case_5,
    props.use_case_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  // Extract icons with defaults
  const icons = [
    props.category_icon_1 || '🎯',
    props.category_icon_2 || '🎯',
    props.category_icon_3 || '🎯',
    props.category_icon_4 || '🎯',
    props.category_icon_5 || '🎯',
    props.category_icon_6 || '🎯'
  ];

  // Build category cards
  const categoryCards: CategoryCard[] = categories.map((category, index) => ({
    category,
    useCase: useCases[index] || 'Use case details for this category',
    icon: icons[index] || '🎯'
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',          // orange-200
        iconBg: '#fff7ed',              // orange-50
        iconColor: '#ea580c',           // orange-600
        categoryTextColor: '#111827'    // gray-900
      },
      cool: {
        cardBorder: '#bfdbfe',          // blue-200
        iconBg: '#eff6ff',              // blue-50
        iconColor: '#2563eb',           // blue-600
        categoryTextColor: '#111827'    // gray-900
      },
      neutral: {
        cardBorder: '#e5e7eb',          // gray-200
        iconBg: '#f9fafb',              // gray-50
        iconColor: '#4b5563',           // gray-600
        categoryTextColor: '#111827'    // gray-900
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'neutral', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const categoryTypography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
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

        {/* Category Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryCards.map((card, index) => (
            <div
              key={`category-${index}`}
              className="bg-white rounded-xl shadow-sm p-6"
              style={{ border: `1px solid ${themeColors.cardBorder}` }}
            >
              {/* Icon + Category Name */}
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: themeColors.iconBg }}
                >
                  <IconPublished
                    icon={card.icon}
                    color={themeColors.iconColor}
                    size={24}
                  />
                </div>
                <TextPublished
                  value={card.category}
                  style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: themeColors.categoryTextColor
                  }}
                />
              </div>

              {/* Use Case Description */}
              <TextPublished
                value={card.useCase}
                style={{
                  color: '#6b7280',  // gray-500
                  lineHeight: '1.75rem',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
