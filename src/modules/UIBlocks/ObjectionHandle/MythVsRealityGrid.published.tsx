/**
 * MythVsRealityGrid - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { X, Check } from 'lucide-react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// Pair structure (V2 format)
interface MythRealityPair {
  id: string;
  myth: string;
  reality: string;
}

// Default pairs for fallback
const DEFAULT_PAIRS: MythRealityPair[] = [
  { id: 'p1', myth: 'This is too complex for small teams', reality: 'Our platform is designed for teams of any size, with setup taking less than 5 minutes' },
  { id: 'p2', myth: 'AI tools replace human creativity', reality: 'Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy' },
  { id: 'p3', myth: 'Implementation takes months', reality: 'Most customers see results within the first week' },
  { id: 'p4', myth: 'It won\'t integrate with existing tools', reality: 'We connect seamlessly with 500+ popular business tools and platforms' },
];

// Theme-based colors for Myth cards (hex values for SSR)
const getMythColors = (uiBlockTheme: 'warm' | 'cool' | 'neutral') => ({
  warm: {
    bg: '#fff7ed',      // orange-50
    border: '#fed7aa',  // orange-200
    iconBg: '#ffedd5',  // orange-100
    iconColor: '#ea580c', // orange-600
    badgeBg: '#334155'  // slate-700
  },
  cool: {
    bg: '#eff6ff',      // blue-50
    border: '#bfdbfe',  // blue-200
    iconBg: '#dbeafe',  // blue-100
    iconColor: '#2563eb', // blue-600
    badgeBg: '#334155'  // slate-700
  },
  neutral: {
    bg: '#f9fafb',      // gray-50
    border: '#e5e7eb',  // gray-200
    iconBg: '#f3f4f6',  // gray-100
    iconColor: '#4b5563', // gray-600
    badgeBg: '#334155'  // slate-700
  }
}[uiBlockTheme]);

export default function MythVsRealityGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Separating Myth from Reality';
  const subheadline = props.subheadline || '';

  // Get pairs from props (V2 format) with fallback
  const pairs: MythRealityPair[] = props.pairs || DEFAULT_PAIRS;

  // Theme for Myth cards
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const mythColors = getMythColors(uiBlockTheme);

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Accent color for Reality cards
  const accentColor = props.theme?.colors?.accentColor || '#3b82f6';

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
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Myth vs Reality Grid */}
        <div className="space-y-8">
          {pairs.map((pair: MythRealityPair) => (
            <div key={pair.id} className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Myth Card - Theme-based colors */}
              <div
                style={{
                  backgroundColor: mythColors.bg,
                  borderColor: mythColors.border
                }}
                className="border rounded-xl p-6 relative"
              >
                <div className="absolute -top-3 left-6">
                  <span
                    style={{
                      backgroundColor: mythColors.badgeBg,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    className="text-white px-3 py-1 rounded-full"
                  >
                    Myth
                  </span>
                </div>
                <div className="pt-4">
                  <div className="flex items-start space-x-3">
                    <X
                      className="w-5 h-5 flex-shrink-0 mt-1"
                      style={{ color: '#ef4444' }}
                      strokeWidth={2.5}
                    />
                    <p
                      style={{
                        color: cardStyles.textHeading,
                        ...bodyTypography
                      }}
                      className="leading-relaxed flex-1"
                    >
                      {pair.myth}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reality Card - Accent color based */}
              <div
                style={{
                  backgroundColor: `${accentColor}0A`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `${accentColor}30`
                }}
                className="rounded-xl p-6 relative"
              >
                <div className="absolute -top-3 left-6">
                  <span
                    style={{
                      backgroundColor: accentColor,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    className="text-white px-3 py-1 rounded-full"
                  >
                    Reality
                  </span>
                </div>
                <div className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Check
                      className="w-5 h-5 flex-shrink-0 mt-1"
                      style={{ color: '#22c55e' }}
                      strokeWidth={2.5}
                    />
                    <p
                      style={{
                        color: cardStyles.textHeading,
                        ...bodyTypography
                      }}
                      className="leading-relaxed flex-1"
                    >
                      {pair.reality}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
