/**
 * VisualObjectionTiles - Published Version
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

// Objection item structure (V2 format)
interface Objection {
  id: string;
  question: string;
  response: string;
  label?: string;
  icon?: string;
}

// Helper function to get default icon based on content
const getDefaultIcon = (question: string): string => {
  const lower = question.toLowerCase();
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price') || lower.includes('budget')) return 'lucide:dollar-sign';
  if (lower.includes('time') || lower.includes('setup') || lower.includes('install')) return 'lucide:clock';
  if (lower.includes('complex') || lower.includes('difficult') || lower.includes('hard') || lower.includes('adopt')) return 'lucide:users';
  if (lower.includes('integration') || lower.includes('connect') || lower.includes('tool')) return 'lucide:plug';
  if (lower.includes('security') || lower.includes('safe') || lower.includes('privacy') || lower.includes('risk')) return 'lucide:shield-check';
  if (lower.includes('slow') || lower.includes('speed') || lower.includes('performance')) return 'lucide:zap';
  return 'lucide:help-circle';
};

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

// Get theme colors based on theme prop
const getTileColors = (theme: 'warm' | 'cool' | 'neutral') => {
  const colorMap = {
    warm: {
      iconBg: { from: '#fff7ed', to: '#ffedd5' }, // orange-50 to orange-100
      border: '#fed7aa', // orange-200
      accent: { from: '#fb923c', to: '#f97316' } // orange-400 to orange-500
    },
    cool: {
      iconBg: { from: '#eff6ff', to: '#e0e7ff' }, // blue-50 to indigo-100
      border: '#bfdbfe', // blue-200
      accent: { from: '#60a5fa', to: '#6366f1' } // blue-400 to indigo-500
    },
    neutral: {
      iconBg: { from: '#f9fafb', to: '#f3f4f6' }, // gray-50 to gray-100
      border: '#e5e7eb', // gray-200
      accent: { from: '#9ca3af', to: '#6b7280' } // gray-400 to gray-500
    }
  };
  return colorMap[theme];
};

export default function VisualObjectionTilesPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Common Concerns? We\'ve Got You Covered';
  const subheadline = props.subheadline || '';

  // Get objections array from props (V2 format)
  const objections: Objection[] = props.objections || [];

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getTileColors(uiBlockTheme);

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
              className={`bg-white/90 backdrop-blur-sm border rounded-2xl p-8 shadow-lg ${getCardWidthClasses(objections.length)}`}
              style={{
                borderColor: colors.border
              }}
            >
              {/* Icon */}
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.iconBg.from}, ${colors.iconBg.to})`
                  }}
                >
                  <IconPublished icon={objection.icon || getDefaultIcon(objection.question)} size={32} />
                </div>
              </div>

              {/* Question (Objection) */}
              <div className="mb-4">
                <h3
                  className="text-lg font-bold text-gray-900 text-center"
                  style={bodyTypography}
                >
                  {objection.question}
                </h3>
              </div>

              {/* Response (Answer) */}
              <div className="text-center">
                <p
                  className="text-gray-700 leading-relaxed"
                  style={bodyTypography}
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
                      background: `linear-gradient(to right, ${colors.accent.from}, ${colors.accent.to})`
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
