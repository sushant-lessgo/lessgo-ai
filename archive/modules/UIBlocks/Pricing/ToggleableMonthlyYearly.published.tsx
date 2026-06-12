'use client';

/**
 * ToggleableMonthlyYearly - Published Version
 *
 * Server-safe component with useState for billing toggle
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React, { useState } from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// Tier structure
interface Tier {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  description: string;
  features: string[];
  cta_text: string;
  is_popular: boolean;
}

// Theme-specific accents (badge and checkmark - not card styling)
const getPricingAccents = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      badgeBg: '#ea580c', // orange-600
      checkmark: '#f97316', // orange-500
    },
    cool: {
      badgeBg: '#2563eb', // blue-600
      checkmark: '#3b82f6', // blue-500
    },
    neutral: {
      badgeBg: '#374151', // gray-700
      checkmark: '#10b981', // green-500
    },
  };
  return colorMap[theme];
};

// Calculate savings percentage
const calculateSavings = (monthlyPrice: string, yearlyPrice: string): number => {
  const monthly = parseFloat(monthlyPrice.replace(/[^0-9.]/g, ''));
  const yearly = parseFloat(yearlyPrice.replace(/[^0-9.]/g, ''));

  if (monthly && yearly) {
    const monthlyCost = monthly * 12;
    const savings = Math.round(((monthlyCost - yearly) / monthlyCost) * 100);
    return savings > 0 ? savings : 0;
  }
  return 0;
};

// Default tiers (fallback)
const DEFAULT_TIERS: Tier[] = [
  {
    id: 'tier-1',
    name: 'Starter',
    monthly_price: '$29',
    yearly_price: '$290',
    description: 'Perfect for small teams getting started',
    features: ['Up to 5 team members', '10GB storage', 'Basic integrations', 'Email support'],
    cta_text: 'Start Free Trial',
    is_popular: false,
  },
  {
    id: 'tier-2',
    name: 'Professional',
    monthly_price: '$79',
    yearly_price: '$790',
    description: 'For growing businesses that need more power',
    features: ['Up to 25 team members', '100GB storage', 'Advanced integrations', 'Priority support', 'Custom branding'],
    cta_text: 'Start Free Trial',
    is_popular: true,
  },
  {
    id: 'tier-3',
    name: 'Enterprise',
    monthly_price: '$199',
    yearly_price: '$1990',
    description: 'Custom solutions for large organizations',
    features: ['Unlimited team members', 'Unlimited storage', 'Enterprise integrations', 'Dedicated support', 'Advanced security'],
    cta_text: 'Contact Sales',
    is_popular: false,
  },
];

export default function ToggleableMonthlyYearlyPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Local state for billing toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Extract content
  const headline = props.headline || 'Choose the Perfect Plan for Your Business';
  const subheadline = props.subheadline || '';
  const annual_discount_label = props.annual_discount_label || 'Save 17% with annual billing';
  const billing_note = props.billing_note || '';
  const tiers: Tier[] = props.tiers || DEFAULT_TIERS;

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get theme-specific accents (badge, checkmark)
  const pricingAccents = getPricingAccents(uiBlockTheme);

  // Base card styles for toggle area (non-highlighted)
  const baseCardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Text colors
  const textColors = getPublishedTextColors(backgroundType || 'neutral', theme, sectionBackgroundCSS);

  // Typography
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Grid classes based on tier count
  const gridClass =
    tiers.length === 1
      ? 'max-w-md mx-auto'
      : tiers.length === 2
        ? 'md:grid-cols-2 max-w-4xl mx-auto'
        : tiers.length === 3
          ? 'md:grid-cols-3 max-w-6xl mx-auto'
          : 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto';

  return (
    <SectionWrapperPublished sectionId={sectionId} background={sectionBackgroundCSS} padding="normal">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem',
            }}
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.muted,
                fontSize: '1.125rem',
                marginBottom: '2rem',
              }}
            />
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div style={{ backgroundColor: baseCardStyles.bg, backdropFilter: baseCardStyles.backdropFilter, WebkitBackdropFilter: baseCardStyles.backdropFilter, borderRadius: '9999px', padding: '4px', display: 'flex' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  backgroundColor: billingCycle === 'monthly' ? baseCardStyles.bg : 'transparent',
                  color: billingCycle === 'monthly' ? baseCardStyles.textHeading : baseCardStyles.textMuted,
                  boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  backgroundColor: billingCycle === 'yearly' ? baseCardStyles.bg : 'transparent',
                  color: billingCycle === 'yearly' ? baseCardStyles.textHeading : baseCardStyles.textMuted,
                  boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Yearly
              </button>
            </div>

            {annual_discount_label && billingCycle === 'yearly' && (
              <span
                style={{
                  marginLeft: '16px',
                  backgroundColor: `${theme?.colors?.accentColor || '#3b82f6'}20`,
                  color: theme?.colors?.accentColor || '#3b82f6',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {annual_discount_label}
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${gridClass}`}>
          {tiers.map((tier: Tier) => {
            // Get adaptive card styles for this tier
            const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme, tier.is_popular);
            const currentPrice = billingCycle === 'monthly' ? tier.monthly_price : tier.yearly_price;
            const savingsPercent = calculateSavings(tier.monthly_price, tier.yearly_price);

            return (
              <div key={tier.id} className={`relative h-full ${tier.is_popular ? 'transform scale-105 z-10' : ''}`}>
                {/* Popular Badge */}
                {tier.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span
                      style={{
                        background: pricingAccents.badgeBg,
                        color: '#ffffff',
                      }}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Annual Savings Badge */}
                {billingCycle === 'yearly' && savingsPercent > 0 && (
                  <div
                    className="absolute -top-3 right-4 z-20"
                    style={{
                      backgroundColor: theme?.colors?.accentColor || '#3b82f6',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    Save {savingsPercent}%
                  </div>
                )}

                {/* Card */}
                <div
                  className="relative h-full flex flex-col p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: cardStyles.bg,
                    borderColor: cardStyles.borderColor,
                    borderWidth: cardStyles.borderWidth,
                    borderStyle: cardStyles.borderStyle,
                    backdropFilter: cardStyles.backdropFilter,
                    WebkitBackdropFilter: cardStyles.backdropFilter,
                    boxShadow: cardStyles.boxShadow,
                  }}
                >
                  {/* Tier Name */}
                  <div className="text-center mb-4">
                    <h3
                      style={{
                        ...h3Typography,
                        fontWeight: 'bold',
                        color: cardStyles.textHeading,
                      }}
                    >
                      {tier.name}
                    </h3>
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center">
                      <span
                        style={{
                          fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                          fontWeight: 'bold',
                          color: cardStyles.textHeading,
                        }}
                      >
                        {currentPrice}
                      </span>
                      {!currentPrice.toLowerCase().includes('contact') && (
                        <span style={{ color: cardStyles.textMuted, marginLeft: '4px' }}>
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && !currentPrice.toLowerCase().includes('contact') && (
                      <div style={{ fontSize: '0.875rem', color: cardStyles.textMuted, marginTop: '4px' }}>
                        ${Math.round(parseFloat(currentPrice.replace(/[^0-9.]/g, '')) / 12)}/month billed annually
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-center mb-8">
                    <TextPublished
                      value={tier.description}
                      style={{
                        color: cardStyles.textMuted,
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <ul className="space-y-3">
                      {tier.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style={{ color: pricingAccents.checkmark }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span style={{ ...bodyTypography, color: cardStyles.textBody }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <CTAButtonPublished
                      text={tier.cta_text}
                      backgroundColor={tier.is_popular ? theme?.colors?.accentColor || '#3b82f6' : '#ffffff'}
                      textColor={tier.is_popular ? '#ffffff' : theme?.colors?.accentColor || '#3b82f6'}
                      className="w-full shadow-lg"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Billing Note */}
        {billing_note && (
          <div className="mt-8 text-center">
            <p style={{ fontSize: '0.875rem', color: textColors.muted }}>{billing_note}</p>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
