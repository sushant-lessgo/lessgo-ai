/**
 * VisualObjectionTiles - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// Objection item structure (V2 format)
interface Objection {
  id: string;
  question: string;
  response: string;
  label?: string;
  icon?: string;
}


// Helper to get container classes based on count
const getContainerClasses = (count: number) => {
  if (count === 4) {
    // 2x2 grid for 4 items
    return 'grid grid-cols-1 md:grid-cols-2 gap-8';
  }
  // 3, 5, 6: use flex with centering for partial rows
  return 'flex flex-wrap justify-center gap-8';
};

// Helper to get card width classes for flex layout
const getCardWidthClasses = (count: number) => {
  if (count === 4) return ''; // grid handles sizing
  // For flex: ~31% width on lg (3 cols), ~48% on md (2 cols)
  return 'w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.4rem)]';
};

// Theme extras - accent elements (icons, gradients) that stay themed
const getThemeExtras = (theme: UIBlockTheme) => ({
  warm: {
    iconBg: { from: '#fff7ed', to: '#ffedd5' }, // orange-50 to orange-100
    accent: { from: '#fb923c', to: '#f97316' } // orange-400 to orange-500
  },
  cool: {
    iconBg: { from: '#eff6ff', to: '#e0e7ff' }, // blue-50 to indigo-100
    accent: { from: '#60a5fa', to: '#6366f1' } // blue-400 to indigo-500
  },
  neutral: {
    iconBg: { from: '#f9fafb', to: '#f3f4f6' }, // gray-50 to gray-100
    accent: { from: '#9ca3af', to: '#6b7280' } // gray-400 to gray-500
  }
}[theme]);

export default function VisualObjectionTilesPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Common Concerns? We\'ve Got You Covered';
  const subheadline = props.subheadline || '';

  // Get objections array from props (V2 format)
  const objections: Objection[] = props.objections || [];

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme extras for accent elements
  const themeExtras = getThemeExtras(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Objection Tiles Grid */}
        <div className={getContainerClasses(objections.length)}>
          {objections.map((objection: Objection) => (
            <div
              key={objection.id}
              className={`rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${getCardWidthClasses(objections.length)}`}
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
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl"
                  style={{
                    background: `linear-gradient(to bottom right, ${themeExtras.iconBg.from}, ${themeExtras.iconBg.to})`
                  }}
                >
                  <IconPublished icon={objection.icon || inferIconFromText(objection.question, objection.response)} size={32} />
                </div>
              </div>

              {/* Question (Objection) */}
              <div className="mb-4">
                <h3
                  className="text-lg font-bold text-center"
                  style={{ ...bodyTypography, color: cardStyles.textHeading }}
                >
                  {objection.question}
                </h3>
              </div>

              {/* Response (Answer) */}
              <div className="text-center">
                <p
                  className="leading-relaxed"
                  style={{ ...bodyTypography, color: cardStyles.textBody }}
                >
                  {objection.response}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <div
                    className="w-8 h-1 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${themeExtras.accent.from}, ${themeExtras.accent.to})`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
