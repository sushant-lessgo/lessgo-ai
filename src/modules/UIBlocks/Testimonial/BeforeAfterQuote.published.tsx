/**
 * BeforeAfterQuote - Published Version
 *
 * Server-safe before/after transformation testimonials with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';

// Helper: Parse pipe-separated data
const parsePipeData = (data: string | undefined): string[] => {
  if (!data) return [];
  return data.split('|').map(item => item.trim()).filter(item => item !== '' && item !== '___REMOVED___');
};

// Helper: Parse JSON avatar URLs
const parseAvatarUrls = (avatarUrlsJson: string | undefined): Record<string, string> => {
  if (!avatarUrlsJson) return {};
  try {
    return JSON.parse(avatarUrlsJson);
  } catch {
    return {};
  }
};

// Helper: Theme colors (server-safe inline styles)
const getBeforeAfterColors = (theme: 'warm' | 'cool' | 'neutral' | undefined) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      before: {
        bg: '#fff7ed', // orange-50
        icon: '#f97316' // orange-500
      },
      after: {
        bg: '#fef3c7', // amber-50
        icon: '#f59e0b' // amber-500
      }
    },
    cool: {
      before: {
        bg: '#eff6ff', // blue-50
        icon: '#3b82f6' // blue-500
      },
      after: {
        bg: '#ecfeff', // cyan-50
        icon: '#06b6d4' // cyan-500
      }
    },
    neutral: {
      before: {
        bg: '#f9fafb', // gray-50
        icon: '#6b7280' // gray-500
      },
      after: {
        bg: '#f8fafc', // slate-50
        icon: '#64748b' // slate-500
      }
    }
  };

  return themes[selectedTheme];
};

export default function BeforeAfterQuotePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Real Customer Transformations';
  const subheadline = props.subheadline || '';
  const cta_text = props.cta_text || '';

  // Parse transformations
  const beforeSituations = parsePipeData(props.before_situations);
  const afterOutcomes = parsePipeData(props.after_outcomes);
  const quotes = parsePipeData(props.testimonial_quotes);
  const names = parsePipeData(props.customer_names);
  const titles = parsePipeData(props.customer_titles);

  // Parse avatar URLs
  const avatarUrls = parseAvatarUrls(props.avatar_urls);

  // Get icons
  const beforeIcons = [
    props.before_icon_1,
    props.before_icon_2,
    props.before_icon_3,
    props.before_icon_4
  ].filter(i => i && i !== '___REMOVED___');

  const afterIcons = [
    props.after_icon_1,
    props.after_icon_2,
    props.after_icon_3,
    props.after_icon_4
  ].filter(i => i && i !== '___REMOVED___');

  // Build transformations (limit 4)
  const transformations = beforeSituations.slice(0, 4).map((before, index) => ({
    before,
    after: afterOutcomes[index] || '',
    quote: quotes[index] || '',
    name: names[index] || 'Anonymous',
    title: titles[index] || '',
    avatar: avatarUrls[names[index]] || '',
    beforeIcon: beforeIcons[index] || props.before_icon || '❌',
    afterIcon: afterIcons[index] || props.after_icon || '✅'
  }));

  // Get text colors and typography
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Get theme colors
  const colors = getBeforeAfterColors(props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Transformations Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {transformations.map((transformation, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            >
              {/* Before/After Comparison */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Before Section */}
                <div className="p-6" style={{ backgroundColor: colors.before.bg }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: colors.before.icon }}
                    >
                      <span>{transformation.beforeIcon}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">BEFORE</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-sm">{transformation.before}</p>
                </div>

                {/* After Section */}
                <div className="p-6" style={{ backgroundColor: colors.after.bg }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: colors.after.icon }}
                    >
                      <span>{transformation.afterIcon}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">AFTER</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-sm">{transformation.after}</p>
                </div>
              </div>

              {/* Testimonial Section */}
              <div className="p-6 bg-gray-50">
                <p className="text-gray-700 italic mb-4 leading-relaxed">"{transformation.quote}"</p>

                <div className="flex items-center space-x-3">
                  <AvatarPublished
                    name={transformation.name}
                    imageUrl={transformation.avatar}
                    size={40}
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{transformation.name}</div>
                    <div className="text-sm text-gray-600">{transformation.title}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        {cta_text && (
          <div className="text-center">
            <CTAButtonPublished
              text={cta_text}
              backgroundColor={theme?.colors?.accentColor || '#3b82f6'}
              textColor="#FFFFFF"
              className="shadow-xl hover:shadow-2xl"
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
