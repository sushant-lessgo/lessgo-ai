/**
 * RatingCards - Published Version
 *
 * Server-safe rating-focused testimonial cards with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
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
  return data.split('|').map((item: string) => item.trim()).filter((item: string) => item !== '' && item !== '___REMOVED___');
};

// Parse rating value
const parseRating = (rating: string | undefined): number => {
  if (!rating) return 5;
  const parsed = parseInt(rating);
  return isNaN(parsed) ? 5 : Math.min(Math.max(parsed, 1), 5);
};

// Parse verified badge
const parseVerified = (verified: string | undefined): boolean => {
  if (!verified) return false;
  return verified.toLowerCase() === 'true';
};

// Platform icon mapping
const getPlatformIcon = (platform: string): string => {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('g2')) return '🗡️';
  if (platformLower.includes('capterra')) return '📈';
  if (platformLower.includes('trustpilot')) return '✅';
  if (platformLower.includes('product hunt')) return '🚀';
  if (platformLower.includes('google')) return '🔍';
  if (platformLower.includes('yelp')) return '⭐';
  return '📝';
};

// Review structure
interface Review {
  quote: string;
  customerName: string;
  customerTitle: string;
  rating: number;
  platform: string;
  date: string;
  verified: boolean;
  location: string;
}

// Parse reviews from props
const parseReviews = (props: any): Review[] => {
  const quotes = parsePipeData(props.testimonial_quotes);
  const names = parsePipeData(props.customer_names);
  const titles = parsePipeData(props.customer_titles);
  const ratings = parsePipeData(props.ratings);
  const platforms = parsePipeData(props.review_platforms);
  const dates = parsePipeData(props.review_dates);
  const verifiedBadges = parsePipeData(props.verified_badges);
  const locations = parsePipeData(props.customer_locations);

  return quotes.map((quote: string, index: number) => ({
    quote,
    customerName: names[index] || 'Anonymous',
    customerTitle: titles[index] || '',
    rating: parseRating(ratings[index]),
    platform: platforms[index] || 'Review',
    date: dates[index] || '',
    verified: parseVerified(verifiedBadges[index]),
    location: locations[index] || ''
  }));
};

// Star Rating Component (inline SVG)
const StarIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? color : '#D1D5DB'}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Render stars based on rating
const renderStars = (rating: number, starColor: string) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <StarIcon
        key={i}
        filled={i < Math.floor(rating)}
        color={starColor}
      />
    );
  }
  return <div className="flex items-center space-x-1">{stars}</div>;
};

// Get theme colors based on theme type
const getThemeColors = (theme: 'warm' | 'cool' | 'neutral' | undefined) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      border: '#fed7aa',
      shadow: 'shadow-orange-100/50 hover:shadow-orange-200/40',
      verifiedBg: '#fff7ed',
      verifiedBorder: '#fed7aa',
      verifiedText: '#c2410c',
      starColor: '#f97316'
    },
    cool: {
      border: '#bfdbfe',
      shadow: 'shadow-blue-100/50 hover:shadow-blue-200/40',
      verifiedBg: '#eff6ff',
      verifiedBorder: '#bfdbfe',
      verifiedText: '#1e40af',
      starColor: '#3b82f6'
    },
    neutral: {
      border: '#e5e7eb',
      shadow: 'hover:shadow-xl',
      verifiedBg: '#f0fdf4',
      verifiedBorder: '#d1fae5',
      verifiedText: '#15803d',
      starColor: '#eab308'
    }
  };

  return themes[selectedTheme];
};

export default function RatingCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'See Why Thousands of Users Love Our Platform';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // Parse reviews
  const reviews = parseReviews(props);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 5;

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Get typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Get theme colors for borders/icons
  const themeColors = getThemeColors(props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined);

  // Parse trust items
  const trustItemsList = trust_items
    ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean)
    : [];

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
              ...headlineTypography,
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

          {/* Average Rating Display */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating), themeColors.starColor)}
              <span className="text-2xl font-bold" style={{ color: textColors.heading }}>
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div className="text-sm" style={{ color: textColors.muted }}>
              Based on {reviews.length} reviews
            </div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reviews.map((review: Review, index: number) => (
            <div
              key={`review-${index}`}
              className={`bg-white rounded-xl shadow-lg border p-6 ${themeColors.shadow} transition-shadow duration-300`}
              style={{ borderColor: themeColors.border }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AvatarPublished
                    name={review.customerName}
                    size={48}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {review.customerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {review.customerTitle}
                    </div>
                    {review.location && (
                      <div className="text-xs text-gray-500">
                        {review.location}
                      </div>
                    )}
                  </div>
                </div>

                {review.verified && (
                  <div
                    className="flex items-center space-x-1 px-2 py-1 rounded-full border"
                    style={{
                      backgroundColor: themeColors.verifiedBg,
                      borderColor: themeColors.verifiedBorder
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: themeColors.verifiedText }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: themeColors.verifiedText }}>
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                {renderStars(review.rating, themeColors.starColor)}
                <span className="text-sm font-semibold text-gray-700">
                  {review.rating}/5
                </span>
              </div>

              {/* Review Text */}
              <blockquote className="text-gray-700 leading-relaxed mb-4 text-sm">
                "{review.quote}"
              </blockquote>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="text-base">{getPlatformIcon(review.platform)}</div>
                  <span className="text-sm font-medium text-gray-600">
                    {review.platform}
                  </span>
                </div>

                {review.date && (
                  <span className="text-xs text-gray-500">
                    {review.date}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA and Trust Indicators */}
        {(supporting_text || cta_text || trustItemsList.length > 0) && (
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

            {(cta_text || trustItemsList.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {cta_text && (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
                    textColor="#FFFFFF"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  />
                )}

                {trustItemsList.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {trustItemsList.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckmarkIconPublished color="#10b981" size={16} />
                        <span className="text-sm" style={{ color: textColors.muted }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
