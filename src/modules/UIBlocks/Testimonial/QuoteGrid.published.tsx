/**
 * QuoteGrid - Published Version
 *
 * Server-safe testimonial quote grid with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';

// Parse pipe-separated data
const parsePipeData = (data: string | undefined): string[] => {
  if (!data) return [];
  return data.split('|').map((item: string) => item.trim()).filter((item: string) => item !== '' && item !== '___REMOVED___');
};

// Parse rating for star rendering
const parseRating = (rating: string | undefined): number => {
  if (!rating) return 0;
  const match = rating.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};

// Testimonial structure
interface Testimonial {
  quote: string;
  customerName: string;
  customerTitle?: string;
  customerCompany?: string;
  icon: string;
}

// Parse testimonial data from props
const parseTestimonials = (props: any): Testimonial[] => {
  const quotes = parsePipeData(props.testimonial_quotes);
  const names = parsePipeData(props.customer_names);
  const titles = parsePipeData(props.customer_titles);
  const companies = parsePipeData(props.customer_companies);

  // Get testimonial icons
  const icons = [
    props.testimonial_icon_1,
    props.testimonial_icon_2,
    props.testimonial_icon_3,
    props.testimonial_icon_4,
    props.testimonial_icon_5,
    props.testimonial_icon_6
  ].filter(icon => icon && icon !== '___REMOVED___');

  // Limit to 6 testimonials
  return quotes.slice(0, 6).map((quote: string, index: number) => ({
    quote,
    customerName: names[index] || 'Anonymous',
    customerTitle: titles[index] || undefined,
    customerCompany: companies[index] || undefined,
    icon: icons[index] || '💬'
  }));
};

// Star Rating SVG Component
const StarIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? color : '#D1D5DB'}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Render star rating
const renderStars = (rating: string | undefined) => {
  const ratingNum = parseRating(rating);
  const stars = [];

  for (let i = 0; i < 5; i++) {
    stars.push(
      <StarIcon
        key={i}
        filled={i < Math.floor(ratingNum)}
        color="#FBBF24"
      />
    );
  }

  return <div className="flex items-center space-x-1">{stars}</div>;
};

// Get theme colors based on theme type (passed from base component or inferred)
const getThemeColors = (theme: 'warm' | 'cool' | 'neutral' | undefined) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      border: '#fed7aa',
      iconColor: '#f97316',
      buttonBg: '#fff7ed',
      buttonBorder: '#fed7aa'
    },
    cool: {
      border: '#bfdbfe',
      iconColor: '#3b82f6',
      buttonBg: '#eff6ff',
      buttonBorder: '#bfdbfe'
    },
    neutral: {
      border: '#e5e7eb',
      iconColor: '#6b7280',
      buttonBg: '#f9fafb',
      buttonBorder: '#e5e7eb'
    }
  };

  return themes[selectedTheme];
};

export default function QuoteGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'What Our Customers Are Saying';
  const verification_message = props.verification_message || 'All testimonials from verified customers';
  const verification_icon = props.verification_icon || '✅';
  const quote_mark_icon = props.quote_mark_icon || '"';
  const rating_value = props.rating_value || '5/5';

  // Parse testimonials
  const testimonials = parseTestimonials(props);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Get typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Get theme colors for borders/icons
  const themeColors = getThemeColors(props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined);

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
        </div>

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${
          testimonials.length === 1 ? 'max-w-2xl mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          testimonials.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 xl:max-w-5xl xl:mx-auto'
        }`}>
          {testimonials.map((testimonial: Testimonial, index: number) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative"
              style={{ borderWidth: '1px', borderColor: themeColors.border }}
            >
              {/* Quote Mark */}
              <div className="absolute top-6 right-6 opacity-20 text-4xl" style={{ color: themeColors.iconColor }}>
                {quote_mark_icon}
              </div>

              {/* Testimonial Icon */}
              <div className="mb-4">
                <IconPublished
                  icon={testimonial.icon}
                  size={32} color={themeColors.iconColor}
                />
              </div>

              {/* Testimonial Quote */}
              <blockquote className="mb-6 leading-relaxed italic" style={{ color: textColors.body }}>
                "{testimonial.quote}"
              </blockquote>

              {/* Customer Attribution */}
              <div className="flex items-center space-x-4">
                {/* Customer Avatar */}
                <AvatarPublished
                  name={testimonial.customerName}
                  size={48}
                />

                {/* Customer Details */}
                <div className="flex-1">
                  {/* Customer Name */}
                  <div className="font-semibold mb-1" style={{ color: textColors.heading }}>
                    {testimonial.customerName}
                  </div>

                  {/* Customer Title */}
                  {testimonial.customerTitle && (
                    <div className="text-sm mb-1" style={{ color: textColors.muted }}>
                      {testimonial.customerTitle}
                    </div>
                  )}

                  {/* Customer Company */}
                  {testimonial.customerCompany && (
                    <div className="text-sm font-medium" style={{ color: theme?.colors?.accentColor || '#3b82f6' }}>
                      {testimonial.customerCompany}
                    </div>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div className="mt-4 flex items-center space-x-2">
                {renderStars(rating_value)}
                <span className="text-sm font-medium" style={{ color: textColors.body }}>
                  {rating_value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Reinforcement */}
        {verification_message && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 rounded-full"
              style={{
                backgroundColor: '#f0fdf4',
                borderWidth: '1px',
                borderColor: '#bbf7d0',
                color: '#166534'
              }}
            >
              <span className="mr-2 text-xl">{verification_icon}</span>
              <span className="font-medium">{verification_message}</span>
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
