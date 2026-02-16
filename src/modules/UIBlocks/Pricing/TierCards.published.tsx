/**
 * TierCards - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
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
  price: string;
  period: string;
  description: string;
  features: string[];
  cta_text: string;
  highlighted: boolean;
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

// Default tiers (fallback)
const DEFAULT_TIERS: Tier[] = [
  {
    id: 'tier-1',
    name: 'Starter',
    price: '$9',
    period: '/month',
    description: 'Perfect for individuals getting started',
    features: ['5 projects', '10GB storage', 'Email support'],
    cta_text: 'Get Started',
    highlighted: false,
  },
  {
    id: 'tier-2',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams that need more power',
    features: ['Unlimited projects', '100GB storage', 'Priority support', 'API access'],
    cta_text: 'Go Pro',
    highlighted: true,
  },
  {
    id: 'tier-3',
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'Custom solutions for large organizations',
    features: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'White-label'],
    cta_text: 'Contact Sales',
    highlighted: false,
  },
];

export default function TierCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Choose Your Plan';
  const subheadline = props.subheadline || '';
  const badge_text = props.badge_text || '';
  const billing_note = props.billing_note || '';
  const guarantee_text = props.guarantee_text || '';
  const highlighted_label = props.highlighted_label || 'Most Popular';
  const tiers: Tier[] = props.tiers || DEFAULT_TIERS;

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get theme-specific accents (badge, checkmark)
  const pricingAccents = getPricingAccents(uiBlockTheme);

  // Text colors
  const textColors = getPublishedTextColors(backgroundType || 'primary', theme, sectionBackgroundCSS);

  // Accent color for badge
  const accentColor = theme?.colors?.accentColor || '#3b82f6';

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
        <div className="text-center mb-20">
          {badge_text && badge_text.trim() !== '' && (
            <div className="mb-4">
              <span
                className="inline-block px-4 py-2 rounded-full font-medium"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}15`,
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em'
                }}
              >
                {badge_text}
              </span>
            </div>
          )}
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
              }}
            />
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${gridClass}`}>
          {tiers.map((tier: Tier) => {
            // Get adaptive card styles for this tier
            const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme, tier.highlighted);

            return (
              <div key={tier.id} className={`relative h-full ${tier.highlighted ? 'transform scale-105 z-10' : ''}`}>
                {/* Highlighted Badge */}
                {tier.highlighted && (
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
                      {highlighted_label}
                    </span>
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

                  {/* Price + Period */}
                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center">
                      <span
                        style={{
                          fontSize: '2.25rem',
                          fontWeight: 'bold',
                          color: cardStyles.textHeading,
                        }}
                      >
                        {tier.price}
                      </span>
                      <span style={{ color: cardStyles.textMuted, marginLeft: '4px' }}>{tier.period}</span>
                    </div>
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
                      backgroundColor={tier.highlighted ? theme?.colors?.accentColor || '#3b82f6' : '#ffffff'}
                      textColor={tier.highlighted ? '#ffffff' : theme?.colors?.accentColor || '#3b82f6'}
                      className="w-full shadow-lg"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Billing Note & Guarantee */}
        {(billing_note || guarantee_text) && (
          <div className="mt-12 text-center space-y-2">
            {billing_note && (
              <p style={{ fontSize: '0.875rem', color: textColors.muted }}>{billing_note}</p>
            )}
            {guarantee_text && (
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: textColors.muted }}>{guarantee_text}</p>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
