/**
 * PullQuoteStack - Published Version
 *
 * Server-safe emotional testimonial grid with ZERO hook imports
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
  return data.split('|').map((item: string) => item.trim()).filter((item: string) => item !== '' && item !== '___REMOVED___');
};

// Helper: Theme colors (server-safe inline styles)
const getThemeColors = (theme: 'warm' | 'cool' | 'neutral' | undefined, index: number) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      gradients: [
        'linear-gradient(to br, #fff7ed, #fee2e2)',
        'linear-gradient(to br, #fef3c7, #fef9c3)',
        'linear-gradient(to br, #fce7f3, #ffe4e6)'
      ],
      borders: ['#fed7aa', '#fde68a', '#fbcfe8'],
      accents: ['#ea580c', '#f59e0b', '#ec4899']
    },
    cool: {
      gradients: [
        'linear-gradient(to br, #eff6ff, #e0f2fe)',
        'linear-gradient(to br, #ecfeff, #cffafe)',
        'linear-gradient(to br, #f0f9ff, #e0f2fe)'
      ],
      borders: ['#bfdbfe', '#a5f3fc', '#bae6fd'],
      accents: ['#2563eb', '#06b6d4', '#0284c7']
    },
    neutral: {
      gradients: [
        'linear-gradient(to br, #f9fafb, #f8fafc)',
        'linear-gradient(to br, #fafafa, #f4f4f5)',
        'linear-gradient(to br, #fafaf9, #f5f5f4)'
      ],
      borders: ['#e5e7eb', '#e4e4e7', '#e7e5e4'],
      accents: ['#4b5563', '#71717a', '#78716c']
    }
  };

  const themeData = themes[selectedTheme];
  const colorIndex = index % 3;

  return {
    bg: themeData.gradients[colorIndex],
    border: themeData.borders[colorIndex],
    accent: themeData.accents[colorIndex]
  };
};

export default function PullQuoteStackPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content (flattened by renderer)
  const headline = props.headline || 'Real Stories from People Just Like You';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';

  // Parse testimonials
  const quotes = parsePipeData(props.testimonial_quotes);
  const names = parsePipeData(props.customer_names);
  const titles = parsePipeData(props.customer_titles);
  const companies = parsePipeData(props.customer_companies);
  const contexts = parsePipeData(props.problem_contexts);
  const emotionalHooks = parsePipeData(props.emotional_hooks);

  // Get avatars and icons (static)
  const avatars = [
    props.avatar_1,
    props.avatar_2,
    props.avatar_3,
    props.avatar_4,
    props.avatar_5,
    props.avatar_6
  ].filter((a: string) => a && a !== '___REMOVED___');

  const contextIcons = [
    props.context_icon_1,
    props.context_icon_2,
    props.context_icon_3,
    props.context_icon_4,
    props.context_icon_5,
    props.context_icon_6
  ].filter((i: string) => i && i !== '___REMOVED___');

  // Build testimonials (limit 6)
  const testimonials = quotes.slice(0, 6).map((quote: string, index: number) => ({
    quote,
    name: names[index] || 'Anonymous',
    title: titles[index] || '',
    company: companies[index] || '',
    context: contexts[index] || '',
    emotion: emotionalHooks[index] || '',
    avatar: avatars[index] || '',
    icon: contextIcons[index] || '💬'
  }));

  // Get text colors and typography
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

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
                ...bodyLgTypography,
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial: { quote: string; name: string; title: string; company: string; context: string; emotion: string; avatar: string; icon: string }, index: number) => {
            const colors = getThemeColors(
              props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined,
              index
            );
            const isLarge = index % 3 === 0;

            return (
              <div key={index} className={isLarge ? 'md:col-span-2' : ''}>
                <div
                  className="rounded-2xl p-6 border-2 hover:shadow-xl transition-all duration-300 h-full"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border
                  }}
                >
                  {/* Emotional Context */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-lg">{testimonial.icon}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.accent }}
                    >
                      {testimonial.emotion}
                    </span>
                  </div>

                  {/* Problem Context */}
                  <div
                    className="text-xs italic mb-4"
                    style={{ color: textColors.muted }}
                  >
                    {testimonial.context}
                  </div>

                  {/* Quote */}
                  <blockquote className="leading-relaxed mb-6 font-medium relative">
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                    </svg>
                    <div
                      className="text-gray-800"
                      style={isLarge ? h3Typography : bodyLgTypography}
                    >
                      {testimonial.quote}
                    </div>
                  </blockquote>

                  {/* Attribution */}
                  <div className="flex items-center space-x-3">
                    <AvatarPublished
                      name={testimonial.name}
                      imageUrl={testimonial.avatar}
                      size={48}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {testimonial.title}
                      </div>
                      {testimonial.company && (
                        <div
                          className="text-sm font-medium"
                          style={{ color: colors.accent }}
                        >
                          {testimonial.company}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        {(supporting_text || cta_text) && (
          <div className="text-center space-y-6 mt-12">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  maxWidth: '48rem',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              />
            )}

            {cta_text && (
              <CTAButtonPublished
                text={cta_text}
                backgroundColor={theme?.colors?.accentColor || '#3b82f6'}
                textColor="#FFFFFF"
                className="shadow-xl hover:shadow-2xl"
              />
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
