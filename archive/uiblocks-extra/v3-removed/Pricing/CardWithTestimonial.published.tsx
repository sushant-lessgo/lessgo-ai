/**
 * CardWithTestimonial - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pricing tier structure with testimonial
interface PricingTier {
  name: string;
  price: string;
  description: string;
  ctaText: string;
  features: string[];
  testimonial: {
    quote: string;
    name: string;
    company: string;
    rating: number;
    image?: string;
  };
  isPopular: boolean;
  icon: string;
}

// Social metric structure
interface SocialMetric {
  value: string;
  label: string;
  icon: string;
}

// Helper to get tier features from comma-separated list
const getTierFeatures = (tierIndex: number, props: any): string[] => {
  const featureLists = (props.feature_lists || '').split('|');
  const tierFeatures = featureLists[tierIndex] || '';

  return tierFeatures
    .split(',')
    .map((f: string) => f.trim())
    .filter((f: string) => f && f !== '___REMOVED___');
};

// Helper to get avatar placeholder from name
const getAvatarPlaceholder = (name: string): string => {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
};

// Helper to get tier icon
const getTierIcon = (tierIndex: number, props: any): string => {
  const iconField = `tier_icon_${tierIndex + 1}`;
  return props[iconField] || ['🚀', '⭐', '💎', '🏆'][tierIndex] || '🎯';
};

// Helper to get social icon
const getSocialIcon = (metricIndex: number, props: any): string => {
  const iconField = `social_icon_${metricIndex + 1}`;
  return props[iconField] || ['👥', '⚡', '⭐', '🛡️'][metricIndex] || '📊';
};

// Parse pricing data from pipe-separated props
const parsePricingData = (props: any): PricingTier[] => {
  const names = (props.tier_names || '').split('|').map((n: string) => n.trim()).filter((n: string) => n);
  const prices = (props.tier_prices || '').split('|').map((p: string) => p.trim()).filter((p: string) => p);
  const descriptions = (props.tier_descriptions || '').split('|').map((d: string) => d.trim()).filter((d: string) => d);
  const ctaTexts = (props.cta_texts || '').split('|').map((c: string) => c.trim()).filter((c: string) => c);

  const testimonialQuotes = (props.testimonial_quotes || '').split('|').map((q: string) => q.trim());
  const testimonialNames = (props.testimonial_names || '').split('|').map((n: string) => n.trim());
  const testimonialCompanies = (props.testimonial_companies || '').split('|').map((c: string) => c.trim());
  const testimonialRatings = (props.testimonial_ratings || '5|5|5').split('|').map((r: string) => parseInt(r.trim()) || 5);
  const testimonialImages = (props.testimonial_images || '').split('|').map((i: string) => i.trim());

  const popularTiers = (props.popular_tiers || '').split('|').map((p: string) => p.trim().toLowerCase() === 'true');

  const tierCount = parseInt(props.tier_count || '3') || 3;

  return names.slice(0, tierCount).map((name: string, index: number) => ({
    name,
    price: prices[index] || 'Contact Us',
    description: descriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    features: getTierFeatures(index, props),
    testimonial: {
      quote: testimonialQuotes[index] || '',
      name: testimonialNames[index] || '',
      company: testimonialCompanies[index] || '',
      rating: testimonialRatings[index] || 5,
      image: testimonialImages[index] || ''
    },
    isPopular: popularTiers[index] || (index === 1),
    icon: getTierIcon(index, props)
  }));
};

// Parse social metrics
const getSocialMetrics = (props: any): SocialMetric[] => {
  const metrics: SocialMetric[] = [];

  for (let i = 1; i <= 4; i++) {
    const value = props[`social_metric_${i}`];
    const label = props[`social_metric_${i}_label`];

    if (value && value !== '___REMOVED___' && value.trim() !== '' &&
        label && label !== '___REMOVED___' && label.trim() !== '') {
      metrics.push({
        value: value.trim(),
        label: label.trim(),
        icon: getSocialIcon(i - 1, props)
      });
    }
  }

  return metrics;
};

// Get theme colors (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      socialMetrics: ['#ea580c', '#f97316', '#c2410c', '#ea580c'],
      socialIconBg: '#fed7aa',
      socialIconText: '#ea580c',
      socialProofBg: 'linear-gradient(to right, #fff7ed, #fef2f2)',
      socialProofBorder: '#fed7aa',
      guaranteeBg: '#fff7ed',
      guaranteeBorder: '#fed7aa',
      guaranteeIcon: '#f97316',
      checkmark: '#f97316'
    },
    cool: {
      socialMetrics: ['#2563eb', '#3b82f6', '#1d4ed8', '#2563eb'],
      socialIconBg: '#dbeafe',
      socialIconText: '#2563eb',
      socialProofBg: 'linear-gradient(to right, #eff6ff, #eef2ff)',
      socialProofBorder: '#bfdbfe',
      guaranteeBg: '#eff6ff',
      guaranteeBorder: '#bfdbfe',
      guaranteeIcon: '#3b82f6',
      checkmark: '#3b82f6'
    },
    neutral: {
      socialMetrics: ['#374151', '#4b5563', '#374151', '#4b5563'],
      socialIconBg: '#f3f4f6',
      socialIconText: '#4b5563',
      socialProofBg: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
      socialProofBorder: '#e5e7eb',
      guaranteeBg: '#f0fdf4',
      guaranteeBorder: '#bbf7d0',
      guaranteeIcon: '#22c55e',
      checkmark: '#22c55e'
    }
  }[theme];
};

// Star rating component
const StarRating = ({ rating, color }: { rating: number; color: string }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg
        key={i}
        className="w-4 h-4"
        fill={i <= rating ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: i <= rating ? color : '#d1d5db' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    );
  }
  return <div className="flex items-center gap-1">{stars}</div>;
};

export default function CardWithTestimonialPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Pricing That Delivers Real Results';
  const subheadline = props.subheadline || '';
  const supportingText = props.supporting_text || '';
  const tierCount = parseInt(props.tier_count || '3') || 3;

  // Parse tiers
  const pricingTiers = parsePricingData(props);

  // Social metrics
  const socialMetrics = getSocialMetrics(props);
  const showSocialProof = props.show_social_proof !== false && socialMetrics.length > 0;
  const socialProofTitle = props.social_proof_title || 'Trusted by thousands of businesses';

  // Guarantee
  const showGuarantee = props.show_guarantee !== false &&
    (props.guarantee_title && props.guarantee_title !== '___REMOVED___') ||
    (props.guarantee_description && props.guarantee_description !== '___REMOVED___');
  const guaranteeTitle = props.guarantee_title || '30-Day Money-Back Guarantee';
  const guaranteeDescription = props.guarantee_description || "Try risk-free. If you're not completely satisfied, we'll refund every penny.";

  // Trust items
  const trustItems = (props.trust_items || '')
    .split('|')
    .map((item: string) => item.trim())
    .filter((item: string) => item && item !== '___REMOVED___');

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  const colors = getThemeColors(uiBlockTheme);

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Grid classes based on tier count
  const gridClass = tierCount === 1 ? 'max-w-md mx-auto' :
                    tierCount === 2 ? 'lg:grid-cols-2 max-w-5xl mx-auto' :
                    tierCount === 3 ? 'lg:grid-cols-3 max-w-7xl mx-auto' :
                    'lg:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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
                color: textColors.muted,
                ...bodyLgTypography,
                marginBottom: '2rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 mb-12 ${gridClass}`}>
          {pricingTiers.map((tier: PricingTier, index: number) => (
            <div key={`tier-${index}`} className="relative">
              {/* Card */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 h-full flex flex-col">
                {/* Tier Icon */}
                <div className="text-center mb-4">
                  <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center shadow-md"
                    style={{
                      background: theme?.colors?.accentColor || '#3b82f6',
                      color: '#ffffff'
                    }}
                  >
                    <IconPublished
                      icon={tier.icon}
                      size={24}
                      className="text-xl"
                    />
                  </div>
                </div>

                {/* Tier Name */}
                <div className="text-center mb-2">
                  <h3
                    style={{
                      ...h3Typography,
                      fontWeight: 'bold',
                      color: textColors.heading
                    }}
                  >
                    {tier.name}
                  </h3>
                </div>

                {/* Tier Description */}
                {tier.description && (
                  <div className="text-center mb-4">
                    <TextPublished
                      value={tier.description}
                      style={{
                        color: textColors.muted,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}

                {/* Price */}
                <div className="text-center mb-6">
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                      fontWeight: 'bold',
                      color: textColors.heading
                    }}
                  >
                    {tier.price}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 flex-grow">
                  {tier.features.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: colors.checkmark }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        style={{
                          ...bodyTypography,
                          color: textColors.body,
                          fontSize: '0.875rem'
                        }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="mb-6">
                  <CTAButtonPublished
                    text={tier.ctaText}
                    backgroundColor={tier.isPopular ? (theme?.colors?.accentColor || '#3b82f6') : '#ffffff'}
                    textColor={tier.isPopular ? '#ffffff' : (theme?.colors?.accentColor || '#3b82f6')}
                    className="w-full shadow-md"
                  />
                </div>

                {/* Testimonial */}
                {tier.testimonial && tier.testimonial.quote && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="space-y-3">
                      {/* Quote */}
                      <TextPublished
                        value={`"${tier.testimonial.quote}"`}
                        style={{
                          color: textColors.body,
                          fontSize: '0.875rem',
                          fontStyle: 'italic',
                          lineHeight: '1.5'
                        }}
                      />

                      {/* Author info */}
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        {tier.testimonial.image ? (
                          <AvatarPublished
                            imageUrl={tier.testimonial.image}
                            name={tier.testimonial.name}
                            size={40}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ background: theme?.colors?.accentColor || '#3b82f6' }}
                          >
                            {getAvatarPlaceholder(tier.testimonial.name)}
                          </div>
                        )}

                        <div className="flex-1">
                          <div
                            style={{
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              color: textColors.heading
                            }}
                          >
                            {tier.testimonial.name}
                          </div>
                          {tier.testimonial.company && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: textColors.muted
                              }}
                            >
                              {tier.testimonial.company}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {tier.testimonial.rating && (
                        <div className="flex justify-start">
                          <StarRating
                            rating={tier.testimonial.rating}
                            color={theme?.colors?.accentColor || '#3b82f6'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Section */}
        {showSocialProof && (
          <div
            className="rounded-2xl p-8 border mb-12"
            style={{
              background: colors.socialProofBg,
              borderColor: colors.socialProofBorder
            }}
          >
            <div className="text-center">
              {socialProofTitle && (
                <h3
                  style={{
                    ...h3Typography,
                    fontWeight: '600',
                    color: textColors.heading,
                    marginBottom: '1.5rem'
                  }}
                >
                  {socialProofTitle}
                </h3>
              )}

              <div className="grid md:grid-cols-4 gap-8">
                {socialMetrics.map((metric: SocialMetric, index: number) => (
                  <div key={index} className="text-center">
                    {/* Social Icon */}
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{
                        background: colors.socialIconBg,
                        color: colors.socialIconText
                      }}
                    >
                      <IconPublished
                        icon={metric.icon}
                        size={24}
                        className="text-xl"
                      />
                    </div>

                    {/* Metric Value */}
                    <div
                      style={{
                        fontSize: 'clamp(1.8rem, 3vw, 2rem)',
                        fontWeight: 'bold',
                        color: colors.socialMetrics[index] || colors.socialMetrics[0],
                        marginBottom: '0.5rem'
                      }}
                    >
                      {metric.value}
                    </div>

                    {/* Metric Label */}
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: textColors.muted
                      }}
                    >
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Money-back Guarantee */}
        {showGuarantee && (
          <div
            className="rounded-2xl p-8 border mb-12"
            style={{
              background: colors.guaranteeBg,
              borderColor: colors.guaranteeBorder
            }}
          >
            <div className="flex items-center justify-center space-x-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ background: colors.guaranteeIcon }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <div
                  style={{
                    ...bodyLgTypography,
                    fontWeight: '600',
                    color: textColors.heading
                  }}
                >
                  {guaranteeTitle}
                </div>
                {guaranteeDescription && (
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: textColors.muted,
                      marginTop: '0.25rem'
                    }}
                  >
                    {guaranteeDescription}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Supporting Text and Trust Indicators */}
        {(supportingText || trustItems.length > 0) && (
          <div className="text-center">
            {supportingText && (
              <TextPublished
                value={supportingText}
                style={{
                  color: textColors.muted,
                  maxWidth: '48rem',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '2rem'
                }}
              />
            )}

            {trustItems.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-8">
                {trustItems.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: colors.checkmark }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: textColors.muted
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
