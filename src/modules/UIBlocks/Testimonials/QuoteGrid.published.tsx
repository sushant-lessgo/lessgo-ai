/**
 * QuoteGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of pipe-separated strings
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Testimonial structure - clean array item
interface Testimonial {
  id: string;
  quote: string;
  customer_name: string;
  customer_title?: string;
  customer_company?: string;
  rating_value?: string;
}

// Parse rating for star rendering
const parseRating = (rating: string | undefined): number => {
  if (!rating) return 5;
  const match = rating.match(/([\d.]+)/);
  return match ? Math.min(5, Math.max(0, parseFloat(match[1]))) : 5;
};

// Star Rating SVG Component
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? '#FBBF24' : '#D1D5DB'}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Render star rating
const renderStars = (rating: string | undefined) => {
  const ratingNum = parseRating(rating);
  const stars = [];

  for (let i = 0; i < 5; i++) {
    stars.push(<StarIcon key={i} filled={i < Math.floor(ratingNum)} />);
  }

  return <div className="flex items-center space-x-1">{stars}</div>;
};

export default function QuoteGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'What Our Customers Are Saying';
  const subheadline = props.subheadline || '';
  const verification_message = props.verification_message || '';

  // V2: Direct array access - no pipe parsing needed
  const testimonials: Testimonial[] = (() => {
    const raw = props.testimonials;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return raw;
  })();

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        border: '#fed7aa',
        quoteColor: '#fdba74'
      },
      cool: {
        border: '#bfdbfe',
        quoteColor: '#93c5fd'
      },
      neutral: {
        border: '#e5e7eb',
        quoteColor: '#d1d5db'
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
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

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

          {/* Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${
          testimonials.length === 1 ? 'max-w-2xl mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          testimonials.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 xl:max-w-5xl xl:mx-auto'
        }`}>
          {testimonials.map((testimonial: Testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative"
              style={{ borderWidth: '1px', borderColor: themeColors.border }}
            >
              {/* Quote Mark */}
              <div
                className="absolute top-6 right-6 opacity-20 text-5xl font-serif"
                style={{ color: themeColors.quoteColor }}
              >
                "
              </div>

              {/* Testimonial Quote */}
              <blockquote
                className="mb-6 leading-relaxed italic text-lg"
                style={{ color: textColors.body }}
              >
                "{testimonial.quote}"
              </blockquote>

              {/* Customer Attribution */}
              <div className="flex items-center space-x-4">
                {/* Customer Avatar */}
                <AvatarPublished
                  name={testimonial.customer_name}
                  size={48}
                  theme={uiTheme}
                />

                {/* Customer Details */}
                <div className="flex-1">
                  {/* Customer Name */}
                  <div
                    className="font-semibold mb-1"
                    style={{ color: textColors.heading }}
                  >
                    {testimonial.customer_name}
                  </div>

                  {/* Customer Title */}
                  {testimonial.customer_title && (
                    <div
                      className="text-sm mb-1"
                      style={{ color: textColors.muted }}
                    >
                      {testimonial.customer_title}
                    </div>
                  )}

                  {/* Customer Company */}
                  {testimonial.customer_company && (
                    <div
                      className="text-sm font-medium"
                      style={{ color: theme?.colors?.accentColor || '#3b82f6' }}
                    >
                      {testimonial.customer_company}
                    </div>
                  )}
                </div>
              </div>

              {/* Star Rating - only show number when < 5 */}
              <div className="mt-4 flex items-center space-x-2">
                {renderStars(testimonial.rating_value)}
                {parseRating(testimonial.rating_value) < 5 && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: textColors.body }}
                  >
                    {testimonial.rating_value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Reinforcement - simple line */}
        {verification_message && (
          <div className="mt-12 text-center">
            <span
              className="text-sm"
              style={{ color: textColors.body }}
            >
              {verification_message}
            </span>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
