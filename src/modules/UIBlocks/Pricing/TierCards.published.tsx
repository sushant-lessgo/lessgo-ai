/**
 * TierCards - Published Version
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pricing tier structure
interface PricingTier {
  name: string;
  price: string;
  description: string;
  ctaText: string;
  features: string[];
  isPopular: boolean;
  icon: string;
}

// Helper to get tier features from individual fields
const getTierFeatures = (tierIndex: number, props: any): string[] => {
  const features = [];

  for (let i = 1; i <= 8; i++) {
    const feature = props[`tier_${tierIndex + 1}_feature_${i}`];
    if (feature && feature.trim() !== '' && feature !== '___REMOVED___') {
      features.push(feature.trim());
    }
  }

  return features;
};

// Parse pricing data from pipe-separated props
const parsePricingData = (props: any): PricingTier[] => {
  const names = (props.tier_names || '').split('|').map((n: string) => n.trim()).filter((n: string) => n);
  const prices = (props.tier_prices || '').split('|').map((p: string) => p.trim()).filter((p: string) => p);
  const descriptions = (props.tier_descriptions || '').split('|').map((d: string) => d.trim()).filter((d: string) => d);
  const ctaTexts = (props.cta_texts || '').split('|').map((c: string) => c.trim()).filter((c: string) => c);
  const popularLabels = props.popular_labels ? props.popular_labels.split('|').map((p: string) => p.trim().toLowerCase() === 'true') : [];

  const tierCount = parseInt(props.tier_count || '3') || 3;

  return names.slice(0, tierCount).map((name, index) => {
    const icon = props[`tier_icon_${index + 1}`] || ['🚀', '⭐', '💎'][index] || '🎯';

    return {
      name,
      price: prices[index] || 'Contact Us',
      description: descriptions[index] || 'Tier description not provided.',
      ctaText: ctaTexts[index] || 'Get Started',
      features: getTierFeatures(index, props),
      isPopular: popularLabels[index] || (index === 1),
      icon
    };
  });
};

// Get theme colors (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      popularBadgeBg: '#ea580c', // orange-600
      popularBadgeText: '#ffffff',
      cardBorderPopular: '#f97316', // orange-500
      cardBorderNeutral: '#e5e7eb', // gray-200
      cardShadowPopular: '0 10px 15px -3px rgba(249, 115, 22, 0.1)',
      checkmark: '#f97316' // orange-500
    },
    cool: {
      popularBadgeBg: '#2563eb', // blue-600
      popularBadgeText: '#ffffff',
      cardBorderPopular: '#3b82f6', // blue-500
      cardBorderNeutral: '#e5e7eb', // gray-200
      cardShadowPopular: '0 10px 15px -3px rgba(59, 130, 246, 0.1)',
      checkmark: '#3b82f6' // blue-500
    },
    neutral: {
      popularBadgeBg: '#374151', // gray-700
      popularBadgeText: '#ffffff',
      cardBorderPopular: '#6b7280', // gray-500
      cardBorderNeutral: '#e5e7eb', // gray-200
      cardShadowPopular: '0 10px 15px -3px rgba(107, 114, 128, 0.1)',
      checkmark: '#10b981' // green-500 (universal positive)
    }
  }[theme];
};

export default function TierCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Choose Your Plan';
  const tierCount = parseInt(props.tier_count || '3') || 3;

  // Parse tiers
  const pricingTiers = parsePricingData(props);

  // Trust indicators
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3
  ].filter((item): item is string =>
    Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
  );

  const showTrustFooter = props.show_trust_footer !== false && trustItems.length > 0;

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

  // Grid classes based on tier count
  const gridClass = tierCount === 1 ? 'max-w-md mx-auto' :
                    tierCount === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
                    'md:grid-cols-3 max-w-6xl mx-auto';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${gridClass}`}>
          {pricingTiers.map((tier, index) => (
            <div
              key={`tier-${index}`}
              className={`relative ${tier.isPopular ? 'transform scale-105 z-10' : ''}`}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span
                    style={{
                      background: colors.popularBadgeBg,
                      color: colors.popularBadgeText
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Most Popular
                  </span>
                </div>
              )}

              {/* Card */}
              <div
                className="relative h-full p-8 bg-white rounded-2xl border-2 transition-all duration-300"
                style={{
                  borderColor: tier.isPopular ? colors.cardBorderPopular : colors.cardBorderNeutral,
                  boxShadow: tier.isPopular ? colors.cardShadowPopular : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Icon */}
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: theme?.colors?.accentColor || '#3b82f6',
                      color: '#ffffff'
                    }}
                  >
                    <IconPublished
                      value={tier.icon}
                      size="lg"
                      className="text-2xl"
                    />
                  </div>
                </div>

                {/* Tier Name */}
                <div className="text-center mb-6">
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

                {/* Price */}
                <div className="text-center mb-6">
                  <div
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 'bold',
                      color: textColors.heading
                    }}
                  >
                    {tier.price}
                  </div>
                </div>

                {/* Description */}
                <div className="text-center mb-8">
                  <TextPublished
                    value={tier.description}
                    style={{
                      color: textColors.muted,
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <svg
                          className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: colors.checkmark }}
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span style={{ ...bodyTypography, color: textColors.body }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  <CTAButtonPublished
                    text={tier.ctaText}
                    backgroundColor={tier.isPopular ? (theme?.colors?.accentColor || '#3b82f6') : '#ffffff'}
                    textColor={tier.isPopular ? '#ffffff' : (theme?.colors?.accentColor || '#3b82f6')}
                    className="w-full shadow-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        {showTrustFooter && (
          <div className="mt-24 text-center">
            <div className="flex flex-wrap justify-center items-center gap-20 text-sm">
              {trustItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: colors.checkmark }}
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span style={{ color: textColors.muted }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
