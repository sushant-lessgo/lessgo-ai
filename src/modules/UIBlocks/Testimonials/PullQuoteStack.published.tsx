/**
 * PullQuoteStack - Published Version (V2)
 *
 * Server-safe B2C testimonial grid with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { getDynamicCardLayout } from '@/utils/dynamicCardLayout';

// V2: Testimonial interface
interface Testimonial {
  id: string;
  quote: string;
  customer_name: string;
  customer_title: string;
  customer_location?: string;
  avatar_url?: string;
}

// Helper: Theme colors (server-safe inline styles)
const getThemeColors = (theme: 'warm' | 'cool' | 'neutral' | undefined, index: number) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      gradients: [
        'linear-gradient(to bottom right, #fff7ed, #fee2e2)',
        'linear-gradient(to bottom right, #fef3c7, #fef9c3)',
        'linear-gradient(to bottom right, #fce7f3, #ffe4e6)'
      ],
      borders: ['#fed7aa', '#fde68a', '#fbcfe8'],
      accents: ['#ea580c', '#f59e0b', '#ec4899']
    },
    cool: {
      gradients: [
        'linear-gradient(to bottom right, #eff6ff, #e0f2fe)',
        'linear-gradient(to bottom right, #ecfeff, #cffafe)',
        'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)'
      ],
      borders: ['#bfdbfe', '#a5f3fc', '#bae6fd'],
      accents: ['#2563eb', '#06b6d4', '#0284c7']
    },
    neutral: {
      gradients: [
        'linear-gradient(to bottom right, #f9fafb, #f8fafc)',
        'linear-gradient(to bottom right, #fafafa, #f4f4f5)',
        'linear-gradient(to bottom right, #fafaf9, #f5f5f4)'
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

  // Extract content
  const headline = props.headline || 'Real People, Real Results';
  const subheadline = props.subheadline || '';

  // V2: Parse testimonials array
  let testimonials: Testimonial[] = [];
  if (props.testimonials) {
    if (typeof props.testimonials === 'string') {
      try {
        testimonials = JSON.parse(props.testimonials);
      } catch {
        testimonials = [];
      }
    } else if (Array.isArray(props.testimonials)) {
      testimonials = props.testimonials;
    }
  }

  // Get text colors and typography
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Dynamic card layout for container width
  const layout = getDynamicCardLayout(testimonials.length);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className={layout.containerClass}>
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

        {/* Testimonial Grid - Masonry Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const colors = getThemeColors(
              props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined,
              index
            );
            const isLarge = index % 3 === 0;

            return (
              <div key={testimonial.id || index} className={isLarge ? 'md:col-span-2' : ''}>
                <div
                  className="rounded-2xl p-6 border-2 hover:shadow-xl transition-all duration-300 h-full"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border
                  }}
                >
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
                      name={testimonial.customer_name}
                      imageUrl={testimonial.avatar_url}
                      size={48}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {testimonial.customer_name}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {testimonial.customer_title}
                      </div>
                      {testimonial.customer_location && (
                        <div
                          className="text-sm font-medium"
                          style={{ color: colors.accent }}
                        >
                          {testimonial.customer_location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
