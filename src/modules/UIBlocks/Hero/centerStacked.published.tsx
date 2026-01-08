/**
 * CenterStacked Hero - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Centered vertical layout with stacked content
 * - Badge, headline, subheadline, supporting text
 * - Primary and secondary CTA buttons
 * - Trust indicators (up to 5 items)
 * - Social proof: customer avatars, star ratings
 * - Hero image with theme-aware placeholder
 * - 24 configurable content fields
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';

// ============================================================================
// Helper Functions (server-safe, no hooks)
// ============================================================================

/**
 * Parse customer avatar data from pipe-separated names and JSON URL mapping
 */
function parseCustomerAvatarData(names: string, urls: string): Array<{ name: string; avatarUrl: string }> {
  const nameArray = names.split('|').map((n: string) => n.trim()).filter(Boolean);
  let urlMap: Record<string, string> = {};

  try {
    urlMap = JSON.parse(urls);
  } catch {
    // Invalid JSON, use empty map
  }

  return nameArray.map(name => ({
    name,
    avatarUrl: urlMap[name] || ''
  }));
}

/**
 * Render star rating SVGs (server-safe)
 * Supports full, half, and empty stars
 */
function renderStars(rating: string) {
  const ratingNum = parseFloat(rating.match(/([\d.]+)/)?.[1] || '0');
  const fullStars = Math.floor(ratingNum);
  const hasHalfStar = (ratingNum % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <>
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}

      {/* Half star with gradient */}
      {hasHalfStar && (
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-star-gradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </>
  );
}

/**
 * Hero Image Placeholder - Server-safe static component
 * Theme-aware gradient background with decorative elements
 */
function HeroImagePlaceholder({ theme = 'neutral' }: { theme?: 'warm' | 'cool' | 'neutral' }) {
  const gradients = {
    warm: 'from-orange-50 via-amber-50 to-rose-100',
    cool: 'from-blue-50 via-indigo-50 to-purple-100',
    neutral: 'from-slate-50 via-gray-50 to-zinc-100'
  };

  const accentGradients = {
    warm: 'from-orange-500 to-amber-600',
    cool: 'from-blue-500 to-indigo-600',
    neutral: 'from-slate-500 to-gray-600'
  };

  const iconBg = {
    warm: 'bg-orange-500/10',
    cool: 'bg-blue-500/10',
    neutral: 'bg-slate-500/10'
  };

  return (
    <div className="relative w-[70%] lg:w-[80%] aspect-[16/9] mx-auto">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[theme]} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Centered content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            {/* Main visual element */}
            <div className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${accentGradients[theme]} flex items-center justify-center shadow-xl`}>
              <span className="text-white text-6xl">📱</span>
            </div>

            {/* Feature indicators */}
            <div className="flex justify-center gap-4">
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">✨</span>
              </div>
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">⚡</span>
              </div>
              <div className={`w-20 h-20 rounded-2xl ${iconBg[theme]} backdrop-blur-sm flex items-center justify-center`}>
                <span className="text-3xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner accents */}
        <div className={`absolute top-8 right-8 w-16 h-16 bg-gradient-to-br ${accentGradients[theme]} rounded-2xl shadow-lg opacity-60`}></div>
        <div className={`absolute bottom-8 left-8 w-12 h-12 bg-gradient-to-br ${accentGradients[theme]} rounded-xl shadow-lg opacity-60`}></div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CenterStackedPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Business with Smart Automation';
  const subheadline = props.subheadline || 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent automation platform.';
  const supporting_text = props.supporting_text || 'Save 20+ hours per week with automated workflows that just work.';
  const badge_text = props.badge_text || '';
  const cta_text = props.cta_text || 'Start Free Trial';
  const secondary_cta_text = props.secondary_cta_text || 'Watch Demo';
  const center_hero_image = props.center_hero_image || '/hero-placeholder.jpg';
  const customer_count = props.customer_count || '500+ happy customers';
  const rating_value = props.rating_value || '4.9/5';
  const rating_count = props.rating_count || 'from 127 reviews';
  const show_social_proof = props.show_social_proof !== false;
  const show_customer_avatars = props.show_customer_avatars !== false;
  const customer_names = props.customer_names || 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel';
  const avatar_urls = props.avatar_urls || '{}';

  // Build trust items array (filter ___REMOVED___)
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter((item: string) => item && item !== '___REMOVED___' && item.trim() !== '');

  // Parse customer avatar data
  const customerAvatars = parseCustomerAvatarData(customer_names, avatar_urls);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Get typography styles
  const h1Typography = getPublishedTypographyStyles('h1', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Accent color for badge and buttons
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  // Image validation
  const imageValue = center_hero_image || '';
  const isValidImagePath = imageValue.startsWith('/') ||
                          imageValue.startsWith('http://') ||
                          imageValue.startsWith('https://') ||
                          imageValue.startsWith('blob:') ||
                          imageValue.startsWith('data:');
  const imageSrc = isValidImagePath && imageValue !== '' ? imageValue : '/hero-placeholder.jpg';

  // Detect theme for placeholder (simplified - default to neutral)
  const placeholderTheme: 'warm' | 'cool' | 'neutral' = 'neutral';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="flex flex-col items-center space-y-8 min-h-[600px] justify-start">
        <div className="max-w-5xl mx-auto text-center w-full flex flex-col items-center">

          {/* Badge */}
          {badge_text && badge_text !== '___REMOVED___' && badge_text.trim() !== '' && (
            <div className="mb-4">
              <span
                style={{
                  color: accentColor,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  backgroundColor: `${accentColor}15`
                }}
                className="inline-block px-4 py-2 rounded-full font-medium"
              >
                {badge_text}
              </span>
            </div>
          )}

          {/* Headline */}
          <HeadlinePublished
            value={headline}
            level="h1"
            className="text-center leading-[1.1] max-w-5xl mx-auto mb-6"
            style={{
              color: textColors.heading,
              ...h1Typography,
              textAlign: 'center'
            }}
          />

          {/* Subheadline */}
          {subheadline && subheadline !== '___REMOVED___' && (
            <TextPublished
              value={subheadline}
              element="p"
              className="leading-relaxed max-w-7xl mb-6"
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                textAlign: 'center'
              }}
            />
          )}

          {/* Supporting Text */}
          {supporting_text && supporting_text !== '___REMOVED___' && (
            <TextPublished
              value={supporting_text}
              element="p"
              className="leading-relaxed max-w-7xl mb-8"
              style={{
                color: textColors.body,
                textAlign: 'center'
              }}
            />
          )}

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <CTAButtonPublished
              text={cta_text}
              backgroundColor={accentColor}
              textColor="#FFFFFF"
              className="px-12 py-6 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            />

            {/* Secondary CTA */}
            {secondary_cta_text && secondary_cta_text !== '___REMOVED___' && (
              <CTAButtonPublished
                text={secondary_cta_text}
                backgroundColor="transparent"
                textColor={textColors.body}
                className="px-12 py-6 font-semibold rounded-xl border-2 hover:bg-opacity-5 transition-all"
              />
            )}

            {/* Trust Indicators */}
            {trustItems.length > 0 && (
              <div className="flex items-center space-x-4 text-sm flex-wrap justify-center mt-2">
                {trustItems.map((item: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckmarkIconPublished color="#10b981" size={16} />
                    <span style={{ color: textColors.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Proof Section */}
          {show_social_proof && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
              {/* Customer Count with Avatars */}
              {customer_count && customer_count !== '___REMOVED___' && (
                <div className="flex items-center space-x-2">
                  {show_customer_avatars && customerAvatars.length > 0 && (
                    <div className="flex -space-x-2">
                      {customerAvatars.map((customer: { name: string; avatarUrl: string }, i: number) => (
                        <AvatarPublished
                          key={customer.name}
                          imageUrl={customer.avatarUrl}
                          name={customer.name}
                          size={40}
                        />
                      ))}
                    </div>
                  )}
                  <TextPublished
                    value={customer_count}
                    element="span"
                    className="text-sm"
                    style={{
                      color: textColors.body,
                      textAlign: 'center'
                    }}
                  />
                </div>
              )}

              {/* Rating Section */}
              {rating_value && rating_value !== '___REMOVED___' && (
                <div className="flex items-center space-x-1">
                  {renderStars(rating_value)}
                  <div className="flex items-center space-x-1 ml-2">
                    <TextPublished
                      value={rating_value}
                      element="span"
                      className="text-sm"
                      style={{
                        color: textColors.body,
                        textAlign: 'center'
                      }}
                    />
                    {rating_count && rating_count !== '___REMOVED___' && (
                      <TextPublished
                        value={rating_count}
                        element="span"
                        className="text-sm"
                        style={{
                          color: textColors.muted,
                          textAlign: 'center'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hero Image */}
        <div className="w-full">
          {imageSrc && imageSrc !== '' ? (
            <div className="relative w-[70%] lg:w-[80%] aspect-video mx-auto">
              <img
                src={imageSrc}
                alt="Hero"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
            </div>
          ) : (
            <HeroImagePlaceholder theme={placeholderTheme} />
          )}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
