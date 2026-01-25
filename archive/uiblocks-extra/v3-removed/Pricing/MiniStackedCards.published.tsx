/**
 * MiniStackedCards - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Pricing tier structure
interface PricingTier {
  name: string;
  price: string;
  description: string;
  ctaText: string;
  features: string[];
  billingCycle: string;
  savingsLabel: string;
  highlight: string;
  isPopular: boolean;
}

// Parse pricing data from pipe-separated props
const parsePricingData = (props: any): PricingTier[] => {
  const names = (props.tier_names || '').split('|').map((n: string) => n.trim()).filter((n: string) => n && n !== '___REMOVED___');
  const prices = (props.tier_prices || '').split('|').map((p: string) => p.trim()).filter((p: string) => p && p !== '___REMOVED___');
  const descriptions = (props.tier_descriptions || '').split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const ctaTexts = (props.cta_texts || '').split('|').map((c: string) => c.trim()).filter((c: string) => c && c !== '___REMOVED___');
  const keyFeatures = (props.key_features || '').split('|').map((kf: string) =>
    kf.split(',').map((f: string) => f.trim()).filter((f: string) => f && f !== '___REMOVED___')
  );
  const billingCycles = props.billing_cycles ? props.billing_cycles.split('|').map((b: string) => b.trim()) : [];
  const savingsLabels = props.savings_labels ? props.savings_labels.split('|').map((s: string) => s.trim()) : [];
  const featureHighlights = props.feature_highlights ? props.feature_highlights.split('|').map((fh: string) => fh.trim()) : [];
  const popularTiers = props.popular_tiers ? props.popular_tiers.split('|').map((p: string) => p.trim().toLowerCase() === 'true') : [];

  return names.map((name: string, index: number) => ({
    name,
    price: prices[index] || '$0',
    description: descriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    features: keyFeatures[index] || [],
    billingCycle: billingCycles[index] || '/month',
    savingsLabel: savingsLabels[index] || '',
    highlight: featureHighlights[index] || '',
    isPopular: popularTiers[index] || false
  }));
};

// Get theme colors (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      border: '#fed7aa', // orange-200
      cardBg: '#ffffff',
      popularBadgeBg: 'linear-gradient(to right, #f97316, #dc2626)', // orange-500 to red-600
      popularBadgeText: '#ffffff',
      savingsBadgeBg: '#f97316', // orange-500
      badgeBg: '#fff7ed', // orange-50
      badgeText: '#ea580c', // orange-600
      iconBg: '#ffedd5', // orange-100
      iconText: '#ea580c', // orange-600
      checkmark: '#f97316', // orange-500
      sectionBg: '#fff7ed', // orange-50
      sectionBorder: '#fed7aa', // orange-200
      highlightText: '#ea580c' // orange-600
    },
    cool: {
      border: '#bfdbfe', // blue-200
      cardBg: '#ffffff',
      popularBadgeBg: 'linear-gradient(to right, #3b82f6, #6366f1)', // blue-500 to indigo-500
      popularBadgeText: '#ffffff',
      savingsBadgeBg: '#3b82f6', // blue-500
      badgeBg: '#eff6ff', // blue-50
      badgeText: '#2563eb', // blue-600
      iconBg: '#dbeafe', // blue-100
      iconText: '#2563eb', // blue-600
      checkmark: '#3b82f6', // blue-500
      sectionBg: '#eff6ff', // blue-50
      sectionBorder: '#bfdbfe', // blue-200
      highlightText: '#2563eb' // blue-600
    },
    neutral: {
      border: '#e5e7eb', // gray-200
      cardBg: '#ffffff',
      popularBadgeBg: 'linear-gradient(to right, #374151, #111827)', // gray-700 to gray-900
      popularBadgeText: '#ffffff',
      savingsBadgeBg: '#6b7280', // gray-500
      badgeBg: '#f9fafb', // gray-50
      badgeText: '#4b5563', // gray-600
      iconBg: '#f3f4f6', // gray-100
      iconText: '#4b5563', // gray-600
      checkmark: '#6b7280', // gray-500
      sectionBg: '#f9fafb', // gray-50
      sectionBorder: '#f3f4f6', // gray-100
      highlightText: '#4b5563' // gray-600
    }
  }[theme];
};

export default function MiniStackedCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Simple, Transparent Pricing';
  const subheadline = props.subheadline || '';
  const supportingText = props.supporting_text || '';

  // Parse tiers
  const pricingTiers = parsePricingData(props);

  // Plans features (always show per user decision)
  const plansFeatures = [
    {
      icon: props.plans_feature_1_icon || '🔒',
      title: props.plans_feature_1_title || '',
      description: props.plans_feature_1_desc || ''
    },
    {
      icon: props.plans_feature_2_icon || '💬',
      title: props.plans_feature_2_title || '',
      description: props.plans_feature_2_desc || ''
    },
    {
      icon: props.plans_feature_3_icon || '⚡',
      title: props.plans_feature_3_title || '',
      description: props.plans_feature_3_desc || ''
    }
  ].filter((f) => f.title && f.title !== '___REMOVED___' && f.description && f.description !== '___REMOVED___');

  // FAQ items (always show per user decision)
  const faqItems = [
    { question: props.faq_question_1 || '', answer: props.faq_answer_1 || '' },
    { question: props.faq_question_2 || '', answer: props.faq_answer_2 || '' },
    { question: props.faq_question_3 || '', answer: props.faq_answer_3 || '' },
    { question: props.faq_question_4 || '', answer: props.faq_answer_4 || '' }
  ].filter(faq => faq.question && faq.question !== '___REMOVED___' && faq.answer && faq.answer !== '___REMOVED___');

  // Trust items (always show per user decision)
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4
  ].filter((item): item is string =>
    Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
  );

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
  const h4Typography = getPublishedTypographyStyles('h4', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: subheadline ? '1rem' : '0'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                marginBottom: '2rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Mini Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pricingTiers.map((tier: PricingTier, index: number) => (
            <div
              key={index}
              className="relative bg-white rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                borderColor: tier.isPopular ? colors.border : colors.border,
                boxShadow: tier.isPopular ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : undefined
              }}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div
                  className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: colors.popularBadgeBg,
                    color: colors.popularBadgeText
                  }}
                >
                  Popular
                </div>
              )}

              {/* Savings Badge */}
              {tier.savingsLabel && (
                <div
                  className="absolute -top-2 -left-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: colors.savingsBadgeBg,
                    color: '#ffffff'
                  }}
                >
                  {tier.savingsLabel}
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-4">
                <h3
                  style={{
                    ...h3Typography,
                    color: textColors.heading,
                    fontWeight: 'bold',
                    marginBottom: '0.25rem'
                  }}
                >
                  {tier.name}
                </h3>

                <p
                  className="text-xs mb-3"
                  style={{ color: textColors.muted }}
                >
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-3">
                  <span
                    style={{
                      ...h2Typography,
                      color: textColors.heading,
                      fontWeight: 'bold'
                    }}
                  >
                    {tier.price.includes('$') ? tier.price : `$${tier.price}`}
                  </span>
                  {tier.billingCycle && !tier.price.toLowerCase().includes('contact') && (
                    <span className="text-sm" style={{ color: textColors.muted }}>
                      {tier.billingCycle}
                    </span>
                  )}
                </div>

                {/* Highlight */}
                {tier.highlight && (
                  <div
                    className="text-xs font-medium mb-3"
                    style={{
                      color: tier.isPopular ? theme?.colors?.accentColor || colors.highlightText : colors.highlightText
                    }}
                  >
                    {tier.highlight}
                  </div>
                )}
              </div>

              {/* Key Features */}
              <div className="space-y-2 mb-4">
                {tier.features.slice(0, 3).map((feature: string, featureIndex: number) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      <CheckmarkIconPublished color={colors.checkmark} size={16} />
                    </div>
                    <span className="text-sm" style={{ color: textColors.body }}>
                      {feature}
                    </span>
                  </div>
                ))}

                {tier.features.length > 3 && (
                  <div className="text-xs italic" style={{ color: textColors.muted }}>
                    +{tier.features.length - 3} more features
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <CTAButtonPublished
                text={tier.ctaText}
                backgroundColor={tier.isPopular ? (theme?.colors?.accentColor || '#3B82F6') : '#6B7280'}
                textColor="#FFFFFF"
                className="w-full text-sm py-2"
              />
            </div>
          ))}
        </div>

        {/* All Plans Include Section - always show per user decision */}
        {plansFeatures.length > 0 && (
          <div
            className="rounded-xl border p-8 mb-12"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border
            }}
          >
            <h3
              style={{
                ...h3Typography,
                color: textColors.heading,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: '2rem'
              }}
            >
              All plans include
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              {plansFeatures.map((feature: { icon: string; title: string; description: string }, index: number) => (
                <div key={index} className="text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: colors.iconBg }}
                  >
                    {feature.icon}
                  </div>

                  <h4
                    style={{
                      ...h4Typography,
                      color: textColors.heading,
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {feature.title}
                  </h4>

                  <p className="text-sm" style={{ color: textColors.muted }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section - always show per user decision */}
        {faqItems.length > 0 && (
          <div
            className="rounded-xl p-8 border mb-12"
            style={{
              backgroundColor: colors.sectionBg,
              borderColor: colors.sectionBorder
            }}
          >
            <h3
              style={{
                ...h3Typography,
                color: textColors.heading,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: '2rem'
              }}
            >
              Frequently Asked Questions
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {faqItems.map((faq: { question: string; answer: string }, index: number) => (
                <div key={index}>
                  <h4
                    style={{
                      ...h4Typography,
                      color: textColors.heading,
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {faq.question}
                  </h4>

                  <p className="text-sm" style={{ color: textColors.muted }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Indicators - always show per user decision */}
        {trustItems.length > 0 && (
          <div
            className="text-center rounded-xl p-6 border"
            style={{
              backgroundColor: colors.sectionBg,
              borderColor: colors.sectionBorder
            }}
          >
            <div className="flex flex-wrap justify-center items-center gap-4">
              {trustItems.map((item: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-5 h-5 flex-shrink-0">
                    <CheckmarkIconPublished color={colors.checkmark} size={20} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: textColors.body }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Text */}
        {supportingText && (
          <div className="text-center mt-12">
            <TextPublished
              value={supportingText}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
