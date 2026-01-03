/**
 * AvatarCarousel - Published Version
 *
 * Server-safe testimonial carousel with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Shows first testimonial in static layout (no carousel rotation)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';

// Parse pipe-separated data
const parsePipeData = (data: string | undefined): string[] => {
  if (!data) return [];
  return data.split('|').map(item => item.trim()).filter(item => item !== '' && item !== '___REMOVED___');
};

// Parse rating value
const parseRating = (rating: string | undefined): number => {
  if (!rating) return 5;
  const parsed = parseInt(rating);
  return isNaN(parsed) ? 5 : parsed;
};

// Star Rating Component
const StarIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <svg className="w-6 h-6" viewBox="0 0 20 20" fill={filled ? color : '#D1D5DB'}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Render star rating
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(<StarIcon key={i} filled={i < rating} color="#FBBF24" />);
  }
  return <div className="flex items-center justify-center space-x-1">{stars}</div>;
};

// Get avatar URL for customer
const getAvatarUrl = (avatarUrls: string | undefined, customerName: string, legacyAvatars: string[], index: number): string => {
  // Try dynamic avatar_urls system
  try {
    if (avatarUrls) {
      const parsed = JSON.parse(avatarUrls);
      if (parsed[customerName]) return parsed[customerName];
    }
  } catch (e) {
    // Failed to parse, continue
  }

  // Fallback to legacy customer_avatars
  return legacyAvatars[index] || '';
};

// Get theme colors
const getThemeColors = (theme: 'warm' | 'cool' | 'neutral' | undefined) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      cardGradient: 'linear-gradient(to right, #fff7ed, #fee2e2, #fef3c7)',
      cardBorder: '#fed7aa',
      companyText: '#ea580c',
      statsGradient: 'linear-gradient(to right, #fff7ed, #fef3c7, #fef9c3)',
      statsBorder: '#fed7aa',
      stat1: '#ea580c',
      stat2: '#dc2626',
      stat3: '#d97706'
    },
    cool: {
      cardGradient: 'linear-gradient(to right, #eff6ff, #e0f2fe, #f0f9ff)',
      cardBorder: '#bfdbfe',
      companyText: '#2563eb',
      statsGradient: 'linear-gradient(to right, #e0f2fe, #eff6ff, #eef2ff)',
      statsBorder: '#bfdbfe',
      stat1: '#2563eb',
      stat2: '#0891b2',
      stat3: '#4f46e5'
    },
    neutral: {
      cardGradient: 'linear-gradient(to right, #f9fafb, #f8fafc, #fafafa)',
      cardBorder: '#e5e7eb',
      companyText: '#4b5563',
      statsGradient: 'linear-gradient(to right, #f8fafc, #f9fafb, #fafafa)',
      statsBorder: '#e5e7eb',
      stat1: '#4b5563',
      stat2: '#64748b',
      stat3: '#71717a'
    }
  };

  return themes[selectedTheme];
};

export default function AvatarCarouselPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Loved by Creators Worldwide';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const community_title = props.community_title || 'Join the Creator Community';
  const active_creators_count = props.active_creators_count || '50K+';
  const active_creators_label = props.active_creators_label || 'Active creators';
  const average_rating_display = props.average_rating_display || '4.9★';
  const average_rating_label = props.average_rating_label || 'Average rating';
  const creations_count = props.creations_count || '1M+';
  const creations_label = props.creations_label || 'Creations made';

  // Parse testimonial data
  const quotes = parsePipeData(props.testimonial_quotes);
  const names = parsePipeData(props.customer_names);
  const titles = parsePipeData(props.customer_titles);
  const companies = parsePipeData(props.customer_companies);
  const legacyAvatars = parsePipeData(props.customer_avatars);
  const ratings = parsePipeData(props.ratings).map(r => parseRating(r));
  const trustItems = parsePipeData(props.trust_items);

  // Get first testimonial (static display)
  const firstTestimonial = quotes.length > 0 ? {
    quote: quotes[0],
    name: names[0] || 'Anonymous',
    title: titles[0] || '',
    company: companies[0] || '',
    avatar: getAvatarUrl(props.avatar_urls, names[0], legacyAvatars, 0),
    rating: ratings[0] || 5
  } : null;

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Get typography styles
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Get theme colors
  const themeColors = getThemeColors(props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
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
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* First Testimonial (Static) */}
        {firstTestimonial && (
          <div
            className="rounded-2xl p-8 mb-12"
            style={{
              background: themeColors.cardGradient,
              borderWidth: '1px',
              borderColor: themeColors.cardBorder
            }}
          >
            <div className="text-center">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <AvatarPublished
                  name={firstTestimonial.name}
                  imageUrl={firstTestimonial.avatar}
                  size="lg"
                />
              </div>

              {/* Star Rating */}
              <div className="flex justify-center mb-4">
                {renderStars(firstTestimonial.rating)}
              </div>

              {/* Quote */}
              <blockquote
                className="leading-relaxed mb-6 max-w-3xl mx-auto"
                style={{
                  color: textColors.body,
                  ...h3Typography
                }}
              >
                "{firstTestimonial.quote}"
              </blockquote>

              {/* Customer Attribution */}
              <div className="flex items-center justify-center space-x-3">
                <div className="text-center">
                  <div className="font-semibold mb-1" style={{ color: textColors.heading }}>
                    {firstTestimonial.name}
                  </div>

                  {firstTestimonial.title && (
                    <div className="text-sm mb-1" style={{ color: textColors.muted }}>
                      {firstTestimonial.title}
                    </div>
                  )}

                  {firstTestimonial.company && (
                    <div className="text-sm font-medium" style={{ color: themeColors.companyText }}>
                      {firstTestimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Stats */}
        <div
          className="rounded-2xl p-8 mb-12"
          style={{
            background: themeColors.statsGradient,
            borderWidth: '1px',
            borderColor: themeColors.statsBorder
          }}
        >
          <div className="text-center">
            {community_title && (
              <div
                className="font-semibold mb-6"
                style={{
                  color: textColors.heading,
                  ...h3Typography
                }}
              >
                {community_title}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: themeColors.stat1 }}>
                  {active_creators_count}
                </div>
                <div className="text-sm" style={{ color: textColors.muted }}>
                  {active_creators_label}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: themeColors.stat2 }}>
                  {average_rating_display}
                </div>
                <div className="text-sm" style={{ color: textColors.muted }}>
                  {average_rating_label}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: themeColors.stat3 }}>
                  {creations_count}
                </div>
                <div className="text-sm" style={{ color: textColors.muted }}>
                  {creations_label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA and Trust Indicators */}
        {(cta_text || trustItems.length > 0 || supporting_text) && (
          <div className="text-center space-y-6">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  maxWidth: '48rem',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '2rem'
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {cta_text && (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor={theme?.colors?.accentColor || '#3b82f6'}
                  textColor="#FFFFFF"
                  className="shadow-xl hover:shadow-2xl"
                />
              )}

              {trustItems.length > 0 && (
                <div className="flex items-center space-x-4">
                  {trustItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckmarkIconPublished color="#10b981" size={16} />
                      <span className="text-sm" style={{ color: textColors.muted }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
