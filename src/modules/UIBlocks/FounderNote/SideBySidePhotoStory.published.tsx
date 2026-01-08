/**
 * SideBySidePhotoStory - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { IconPublished } from '@/components/published/IconPublished';

// Theme-based color mapping with CSS gradients (NOT Tailwind classes)
const getThemeStyles = (theme: UIBlockTheme) => {
  const maps = {
    warm: {
      badge: { background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' },
      quoteBorder: '#f97316',
      avatarGradient: 'linear-gradient(to bottom right, #fb923c, #dc2626)',
      statsBarGradient: 'linear-gradient(to right, #fff7ed, #fee2e2)',
      statsTextColor: '#ea580c'
    },
    cool: {
      badge: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' },
      quoteBorder: '#3b82f6',
      avatarGradient: 'linear-gradient(to bottom right, #60a5fa, #4f46e5)',
      statsBarGradient: 'linear-gradient(to right, #eff6ff, #eef2ff)',
      statsTextColor: '#2563eb'
    },
    neutral: {
      badge: { background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' },
      quoteBorder: '#6b7280',
      avatarGradient: 'linear-gradient(to bottom right, #9ca3af, #4b5563)',
      statsBarGradient: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
      statsTextColor: '#4b5563'
    }
  };
  return maps[theme];
};

export default function SideBySidePhotoStoryPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Detect theme from props (server-safe)
  const uiBlockTheme: UIBlockTheme = (props.manualThemeOverride as UIBlockTheme) || 'neutral';
  const themeStyles = getThemeStyles(uiBlockTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const story_headline = props.story_headline || 'From Struggling Creator to Building the Tool I Wished Existed';
  const story_text = props.story_text || '';
  const story_quote = props.story_quote || '';
  const founder_name = props.founder_name || '';
  const cta_text = props.cta_text || 'Learn More';
  const story_image = props.story_image || '';
  const secondary_image = props.secondary_image || '';
  const badge_text = props.badge_text || '';
  const badge_icon = props.badge_icon || '';

  // Stats
  const stats = [
    { value: props.story_stat_1 },
    { value: props.story_stat_2 },
    { value: props.story_stat_3 },
    { value: props.story_stat_4 }
  ].filter((s) => s && s.value && s.value !== '___REMOVED___' && s.value.trim() !== '');

  // Trust items
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter((t: string) => t && t !== '___REMOVED___' && t.trim() !== '');

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          {/* Badge */}
          {badge_text && (
            <div className="mb-6 flex justify-center">
              <div
                className="inline-flex items-center px-4 py-2 rounded-full border"
                style={{
                  background: themeStyles.badge.background,
                  borderColor: themeStyles.badge.borderColor,
                  color: themeStyles.badge.color
                }}
              >
                {badge_icon && <span className="mr-2">{badge_icon}</span>}
                <span className="text-sm font-medium">{badge_text}</span>
              </div>
            </div>
          )}

          {/* Headline */}
          <HeadlinePublished
            value={story_headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
            className="leading-tight max-w-4xl mx-auto"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">

          {/* Left Column - Story Content */}
          <div className="space-y-6">

            {/* Story Text */}
            {story_text && (
              <TextPublished
                value={story_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  lineHeight: '1.625',
                  whiteSpace: 'pre-line'
                }}
              />
            )}

            {/* Quote */}
            {story_quote && (
              <div
                className="bg-gray-50 border-l-4 rounded-r-lg p-6"
                style={{ borderColor: themeStyles.quoteBorder }}
              >
                <TextPublished
                  value={story_quote}
                  style={{
                    fontSize: '1.125rem',
                    fontStyle: 'italic',
                    color: '#374151',
                    lineHeight: '1.625'
                  }}
                />

                {/* Founder Attribution */}
                {founder_name && (
                  <div className="mt-4 flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: themeStyles.avatarGradient }}
                    >
                      {founder_name.charAt(0)}
                    </div>
                    <TextPublished
                      value={founder_name}
                      style={{ fontWeight: '600', color: '#111827' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            {cta_text && (
              <CTAButtonPublished
                text={cta_text}
                backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
                textColor="#FFFFFF"
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              />
            )}

            {/* Trust Indicators */}
            {trustItems.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                {trustItems.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center text-sm">
                    <IconPublished icon="✓" size={16} className="mr-1 text-green-500" />
                    <TextPublished
                      value={item}
                      style={{ color: textColors.muted }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Photo Story */}
          <div className="space-y-6">

            {/* Main Story Image */}
            {story_image && (
              <div className="relative">
                <ImagePublished
                  src={story_image}
                  alt={story_headline}
                  className="w-full h-96 object-cover rounded-2xl shadow-lg"
                />
              </div>
            )}

            {/* Secondary Image */}
            {secondary_image && (
              <div className="w-full">
                <ImagePublished
                  src={secondary_image}
                  alt="Secondary story"
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        {stats.length > 0 && (
          <div
            className="rounded-xl p-8"
            style={{ background: themeStyles.statsBarGradient }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((stat: { value: string }, index: number) => {
                const parts = stat.value.split(' ');
                const number = parts[0];
                const label = parts.slice(1).join(' ');

                return (
                  <div key={index}>
                    <div
                      className="text-2xl lg:text-3xl font-bold mb-1"
                      style={{ color: themeStyles.statsTextColor }}
                    >
                      {number}
                    </div>
                    {label && (
                      <div className="text-sm text-gray-600">
                        {label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
