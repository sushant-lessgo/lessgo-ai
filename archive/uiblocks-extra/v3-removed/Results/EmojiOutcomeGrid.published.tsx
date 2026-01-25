/**
 * EmojiOutcomeGrid - Published Version
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

// Outcome structure
interface Outcome {
  emoji: string;
  outcome: string;
  description: string;
}

export default function EmojiOutcomeGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'What You\'ll Achieve with Our Solution';
  const subheadline = props.subheadline || '';
  const footer_text = props.footer_text || '';

  // Extract pipe-separated fields
  const emojis = props.emojis || '';
  const outcomes = props.outcomes || '';
  const descriptions = props.descriptions || '';

  // Parse all arrays
  const emojiList = emojis.split('|').map((e: string) => e.trim()).filter((e: string) => e && e !== '___REMOVED___');
  const outcomeList = outcomes.split('|').map((o: string) => o.trim()).filter((o: string) => o && o !== '___REMOVED___');
  const descriptionList = descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');

  // Build outcomes array
  const outcomeData: Outcome[] = emojiList.map((emoji: string, index: number) => ({
    emoji,
    outcome: outcomeList[index] || 'Great Result',
    description: descriptionList[index] || 'Amazing outcomes await you'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors with hex values
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        cardBorder: '#fed7aa',
        cardBorderHover: '#fdba74',
        iconBg: '#ffedd5',
        sparkleColor: '#fb923c'
      },
      cool: {
        cardBorder: '#bfdbfe',
        cardBorderHover: '#93c5fd',
        iconBg: '#dbeafe',
        sparkleColor: '#60a5fa'
      },
      neutral: {
        cardBorder: '#e2e8f0',
        cardBorderHover: '#cbd5e1',
        iconBg: '#f1f5f9',
        sparkleColor: '#94a3b8'
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

  // Calculate grid columns based on count
  const getGridClass = (count: number): string => {
    if (count <= 3) return 'md:grid-cols-3 max-w-4xl mx-auto';
    if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    return 'md:grid-cols-2 lg:grid-cols-3';
  };

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
              marginBottom: '1rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Outcomes Grid */}
        <div className={`grid gap-8 ${getGridClass(outcomeData.length)}`}>
          {outcomeData.map((outcome: Outcome, index: number) => (
            <div
              key={`outcome-${index}`}
              className="relative text-center p-6 bg-white rounded-2xl border transition-all duration-300"
              style={{
                borderColor: themeColors.cardBorder
              }}
            >
              {/* Emoji Icon */}
              <div className="mb-4">
                <div className="text-5xl mx-auto w-20 h-20 flex items-center justify-center">
                  <IconPublished
                    icon={outcome.emoji}
                    size={48}
                    className="text-5xl"
                  />
                </div>
              </div>

              {/* Outcome Title */}
              <div className="mb-4">
                <TextPublished
                  value={outcome.outcome}
                  style={{
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <TextPublished
                  value={outcome.description}
                  style={{
                    color: '#6b7280',
                    lineHeight: '1.75'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Success Animation Element */}
        <div className="relative mt-16">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 text-yellow-400">
            ⭐
          </div>
        </div>

        {/* Footer Section */}
        {footer_text && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 border rounded-full"
              style={{
                background: 'linear-gradient(to right, #faf5ff, #fce7f3)',
                borderColor: '#e9d5ff',
                color: '#7e22ce'
              }}
            >
              <span className="text-xl mr-2">🎯</span>
              <TextPublished
                value={footer_text}
                style={{
                  fontWeight: 500
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
