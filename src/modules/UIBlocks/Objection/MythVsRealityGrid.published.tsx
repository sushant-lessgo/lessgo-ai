/**
 * MythVsRealityGrid - Published Version
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

// Myth/Reality pair structure
interface MythRealityPair {
  myth: string;
  reality: string;
}

// Parse myth/reality pairs from props
const parseMythRealityPairs = (props: any): MythRealityPair[] => {
  const pairs: MythRealityPair[] = [];

  // Process individual fields
  for (let i = 1; i <= 6; i++) {
    const myth = props[`myth_${i}`];
    const reality = props[`reality_${i}`];

    if (myth && myth.trim() && myth !== '___REMOVED___') {
      pairs.push({
        myth: myth.trim(),
        reality: reality?.trim() || 'Reality explanation pending.'
      });
    }
  }

  return pairs;
};

// Get theme colors (hex values for inline styles)
const getMythRealityColors = (theme: 'warm' | 'cool' | 'neutral') => {
  return {
    warm: {
      mythBg: '#fff7ed', // orange-50
      mythBorder: '#fed7aa', // orange-200
      mythBadgeBg: '#f97316', // orange-500
      mythIconBg: '#f97316', // orange-500
      mythTextColor: '#7c2d12', // orange-900
      realityBg: '#ffedd5', // orange-100
      realityBorder: '#fdba74', // orange-300
      realityBadgeBg: '#ea580c', // orange-600
      realityIconBg: '#ea580c', // orange-600
      realityTextColor: '#7c2d12' // orange-900
    },
    cool: {
      mythBg: '#eff6ff', // blue-50
      mythBorder: '#bfdbfe', // blue-200
      mythBadgeBg: '#3b82f6', // blue-500
      mythIconBg: '#3b82f6', // blue-500
      mythTextColor: '#1e3a8a', // blue-900
      realityBg: '#dbeafe', // blue-100
      realityBorder: '#93c5fd', // blue-300
      realityBadgeBg: '#2563eb', // blue-600
      realityIconBg: '#2563eb', // blue-600
      realityTextColor: '#1e3a8a' // blue-900
    },
    neutral: {
      mythBg: '#f9fafb', // gray-50
      mythBorder: '#e5e7eb', // gray-200
      mythBadgeBg: '#6b7280', // gray-500
      mythIconBg: '#6b7280', // gray-500
      mythTextColor: '#111827', // gray-900
      realityBg: '#f3f4f6', // gray-100
      realityBorder: '#d1d5db', // gray-300
      realityBadgeBg: '#4b5563', // gray-600
      realityIconBg: '#4b5563', // gray-600
      realityTextColor: '#111827' // gray-900
    }
  }[theme];
};

export default function MythVsRealityGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Separating Myth from Reality';
  const subheadline = props.subheadline || '';
  const myth_icon = props.myth_icon || '❌';
  const reality_icon = props.reality_icon || '✅';

  // Parse myth/reality pairs
  const mythRealityPairs = parseMythRealityPairs(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getMythRealityColors(uiBlockTheme);

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
          {mythRealityPairs.map((pair, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Myth Card */}
              <div
                style={{
                  background: colors.mythBg,
                  borderColor: colors.mythBorder
                }}
                className="border rounded-xl p-6 relative"
              >
                <div className="absolute -top-3 left-6">
                  <span
                    style={{
                      background: colors.mythBadgeBg,
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
                    <div
                      style={{ background: colors.mythIconBg }}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
                    >
                      <IconPublished value={myth_icon} className="text-base text-white" />
                    </div>
                    <p
                      style={{
                        color: colors.mythTextColor,
                        ...bodyTypography
                      }}
                      className="leading-relaxed flex-1"
                    >
                      {pair.myth}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reality Card */}
              <div
                style={{
                  background: colors.realityBg,
                  borderColor: colors.realityBorder
                }}
                className="border rounded-xl p-6 relative"
              >
                <div className="absolute -top-3 left-6">
                  <span
                    style={{
                      background: colors.realityBadgeBg,
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
                    <div
                      style={{ background: colors.realityIconBg }}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
                    >
                      <IconPublished value={reality_icon} className="text-base text-white" />
                    </div>
                    <p
                      style={{
                        color: colors.realityTextColor,
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
