/**
 * SegmentBasedPricing - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Strategy: Renders ALL segments stacked vertically (no interactive tabs)
 * Each segment shows: header + all pricing tiers
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

// Segment structure
interface Segment {
  name: string;
  description: string;
  useCase: string;
  icon: string;
  recommendedTier: number;
  tiers: PricingTier[];
}

// Pricing tier structure
interface PricingTier {
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  isRecommended: boolean;
}

// Parse segment-based data from props
const parseSegmentData = (props: any): Segment[] => {
  const segmentNames = (props.segment_names || '').split('|').map((n: string) => n.trim()).filter((n: string) => n && n !== '___REMOVED___');
  const segmentDescriptions = (props.segment_descriptions || '').split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const segmentUseCases = (props.segment_use_cases || '').split('|').map((u: string) => u.trim()).filter((u: string) => u && u !== '___REMOVED___');
  const segmentIcons = (props.segment_icons || '').split('|').map((i: string) => i.trim());
  const recommendedTiers = (props.recommended_tiers || '').split('|').map((r: string) => parseInt(r.trim()) || 0);

  // Parse tier data for each segment (semicolon-separated segments, pipe-separated tiers)
  const tierNamesBySegment = (props.tier_names || '').split(';').map((segment: string) =>
    segment.split('|').map((item: string) => item.trim()).filter((item: string) => item && item !== '___REMOVED___')
  );

  const tierPricesBySegment = (props.tier_prices || '').split(';').map((segment: string) =>
    segment.split('|').map((item: string) => item.trim()).filter((item: string) => item && item !== '___REMOVED___')
  );

  const tierFeaturesBySegment = (props.tier_features || '').split(';').map((segment: string) =>
    segment.split('|').map((item: string) =>
      item.split(',').map((feature: string) => feature.trim()).filter((feature: string) => feature && feature !== '___REMOVED___')
    )
  );

  const ctaTextsBySegment = (props.cta_texts || '').split(';').map((segment: string) =>
    segment.split('|').map((item: string) => item.trim()).filter((item: string) => item && item !== '___REMOVED___')
  );

  return segmentNames.map((name: string, segIdx: number) => {
    const tierNames = tierNamesBySegment[segIdx] || [];
    const tierPrices = tierPricesBySegment[segIdx] || [];
    const tierFeatures = tierFeaturesBySegment[segIdx] || [];
    const ctaTexts = ctaTextsBySegment[segIdx] || [];
    const recommendedTierIndex = recommendedTiers[segIdx] || 0;

    return {
      name,
      description: segmentDescriptions[segIdx] || '',
      useCase: segmentUseCases[segIdx] || '',
      icon: segmentIcons[segIdx] || '🏢',
      recommendedTier: recommendedTierIndex,
      tiers: tierNames.map((tierName: string, tierIdx: number) => ({
        name: tierName,
        price: tierPrices[tierIdx] || '$0',
        features: tierFeatures[tierIdx] || [],
        ctaText: ctaTexts[tierIdx] || 'Get Started',
        isRecommended: tierIdx === recommendedTierIndex
      }))
    };
  });
};

// Get theme colors (hex values for inline styles)
const getSegmentColors = (index: number, theme: UIBlockTheme) => {
  const colorSets = {
    warm: [
      {
        gradientBg: 'linear-gradient(to right, #f97316, #dc2626)', // orange-500 to red-600
        lightBg: '#fff7ed', // orange-50
        textColor: '#ea580c', // orange-600
        borderColor: '#fed7aa', // orange-200
        checkmarkColor: '#f97316' // orange-500
      },
      {
        gradientBg: 'linear-gradient(to right, #ea580c, #b91c1c)', // orange-600 to red-700
        lightBg: '#ffedd5', // orange-100
        textColor: '#c2410c', // orange-700
        borderColor: '#fdba74', // orange-300
        checkmarkColor: '#ea580c' // orange-600
      },
      {
        gradientBg: 'linear-gradient(to right, #ef4444, #f97316)', // red-500 to orange-600
        lightBg: '#fef2f2', // red-50
        textColor: '#dc2626', // red-600
        borderColor: '#fecaca', // red-200
        checkmarkColor: '#ef4444' // red-500
      },
      {
        gradientBg: 'linear-gradient(to right, #f59e0b, #f97316)', // amber-500 to orange-600
        lightBg: '#fffbeb', // amber-50
        textColor: '#d97706', // amber-600
        borderColor: '#fde68a', // amber-200
        checkmarkColor: '#f59e0b' // amber-500
      }
    ],
    cool: [
      {
        gradientBg: 'linear-gradient(to right, #3b82f6, #6366f1)', // blue-500 to indigo-600
        lightBg: '#eff6ff', // blue-50
        textColor: '#2563eb', // blue-600
        borderColor: '#bfdbfe', // blue-200
        checkmarkColor: '#3b82f6' // blue-500
      },
      {
        gradientBg: 'linear-gradient(to right, #2563eb, #06b6d4)', // blue-600 to cyan-600
        lightBg: '#dbeafe', // blue-100
        textColor: '#1d4ed8', // blue-700
        borderColor: '#93c5fd', // blue-300
        checkmarkColor: '#2563eb' // blue-600
      },
      {
        gradientBg: 'linear-gradient(to right, #6366f1, #3b82f6)', // indigo-500 to blue-600
        lightBg: '#eef2ff', // indigo-50
        textColor: '#4f46e5', // indigo-600
        borderColor: '#c7d2fe', // indigo-200
        checkmarkColor: '#6366f1' // indigo-500
      },
      {
        gradientBg: 'linear-gradient(to right, #06b6d4, #3b82f6)', // cyan-500 to blue-600
        lightBg: '#ecfeff', // cyan-50
        textColor: '#0891b2', // cyan-600
        borderColor: '#a5f3fc', // cyan-200
        checkmarkColor: '#06b6d4' // cyan-500
      }
    ],
    neutral: [
      {
        gradientBg: 'linear-gradient(to right, #4b5563, #1f2937)', // gray-600 to gray-800
        lightBg: '#f9fafb', // gray-50
        textColor: '#4b5563', // gray-600
        borderColor: '#e5e7eb', // gray-200
        checkmarkColor: '#6b7280' // gray-500
      },
      {
        gradientBg: 'linear-gradient(to right, #374151, #0f172a)', // gray-700 to slate-800
        lightBg: '#f3f4f6', // gray-100
        textColor: '#374151', // gray-700
        borderColor: '#d1d5db', // gray-300
        checkmarkColor: '#4b5563' // gray-600
      },
      {
        gradientBg: 'linear-gradient(to right, #475569, #1f2937)', // slate-600 to gray-800
        lightBg: '#f8fafc', // slate-50
        textColor: '#475569', // slate-600
        borderColor: '#e2e8f0', // slate-200
        checkmarkColor: '#64748b' // slate-500
      },
      {
        gradientBg: 'linear-gradient(to right, #52525b, #1f2937)', // zinc-600 to gray-800
        lightBg: '#fafafa', // zinc-50
        textColor: '#52525b', // zinc-600
        borderColor: '#e4e4e7', // zinc-200
        checkmarkColor: '#71717a' // zinc-500
      }
    ]
  };

  return colorSets[theme][index % colorSets[theme].length];
};

export default function SegmentBasedPricingPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Pricing Tailored to Your Business Type';
  const subheadline = props.subheadline || '';
  const supportingText = props.supporting_text || '';
  const showComparison = props.show_segment_comparison !== false;
  const comparisonTitle = props.segment_comparison_title || 'Why Segment-Specific Pricing?';
  const comparisonDesc = props.segment_comparison_desc || '';

  // Parse segments
  const segments = parseSegmentData(props);

  // Trust items
  const trustItems = (props.trust_items || '').split('|')
    .map((item: string) => item.trim())
    .filter((item: string) => Boolean(item && item !== '___REMOVED___'));

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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
                marginBottom: '0',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* All Segments - Stacked Vertically */}
        {segments.map((segment, segIdx) => {
          const segmentColors = getSegmentColors(segIdx, uiBlockTheme);

          return (
            <div key={segIdx} className="mb-20">
              {/* Segment Header */}
              <div
                className="mb-8 p-6 rounded-xl"
                style={{
                  backgroundColor: segmentColors.lightBg,
                  borderLeft: `4px solid ${segmentColors.textColor}`
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Segment Icon */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background: segmentColors.gradientBg
                    }}
                  >
                    <span className="text-white">{segment.icon}</span>
                  </div>

                  <div className="flex-1">
                    <h3
                      style={{
                        ...h3Typography,
                        color: textColors.heading,
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {segment.name}
                    </h3>

                    <p
                      className="mb-2"
                      style={{
                        color: textColors.body,
                        fontSize: '1rem'
                      }}
                    >
                      {segment.description}
                    </p>

                    {segment.useCase && (
                      <p
                        className="text-sm"
                        style={{
                          color: textColors.muted,
                          fontStyle: 'italic'
                        }}
                      >
                        Use cases: {segment.useCase}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Tiers for this Segment */}
              <div className="grid md:grid-cols-3 gap-6">
                {segment.tiers.map((tier, tierIdx) => (
                  <div
                    key={tierIdx}
                    className="relative bg-white rounded-xl border-2 p-8 transition-all"
                    style={{
                      borderColor: tier.isRecommended ? segmentColors.borderColor : '#e5e7eb',
                      boxShadow: tier.isRecommended ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : undefined
                    }}
                  >
                    {/* Recommended Badge */}
                    {tier.isRecommended && (
                      <div
                        className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: segmentColors.gradientBg,
                          color: '#ffffff'
                        }}
                      >
                        Recommended
                      </div>
                    )}

                    {/* Tier Name */}
                    <h4
                      style={{
                        ...h4Typography,
                        color: textColors.heading,
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {tier.name}
                    </h4>

                    {/* Price */}
                    <div className="mb-6">
                      <span
                        style={{
                          fontSize: '3rem',
                          fontWeight: 'bold',
                          color: textColors.heading
                        }}
                      >
                        {tier.price.split('/')[0]}
                      </span>
                      {tier.price.includes('/') && (
                        <span className="text-lg" style={{ color: textColors.muted }}>
                          /{tier.price.split('/')[1]}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {tier.features.map((feature, featureIdx) => (
                        <div key={featureIdx} className="flex items-start space-x-3">
                          <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                            <CheckmarkIconPublished color={segmentColors.checkmarkColor} size={20} />
                          </div>
                          <span style={{ color: textColors.body, fontSize: '0.875rem' }}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <CTAButtonPublished
                      text={tier.ctaText}
                      backgroundColor={tier.isRecommended ? (theme?.colors?.accentColor || segmentColors.textColor) : '#6B7280'}
                      textColor="#FFFFFF"
                      className="w-full py-3"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Segment Comparison Section */}
        {showComparison && segments.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 mb-16">
            <h3
              style={{
                ...h3Typography,
                color: textColors.heading,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: '1rem'
              }}
            >
              {comparisonTitle}
            </h3>

            {comparisonDesc && (
              <p
                className="text-center mb-12"
                style={{
                  color: textColors.body,
                  ...bodyTypography
                }}
              >
                {comparisonDesc}
              </p>
            )}

            <div className="grid md:grid-cols-4 gap-8">
              {segments.map((segment, index) => {
                const segmentColors = getSegmentColors(index, uiBlockTheme);
                return (
                  <div key={index} className="text-center">
                    <div
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        background: segmentColors.gradientBg
                      }}
                    >
                      <span className="text-white">{segment.icon}</span>
                    </div>

                    <h4
                      style={{
                        ...h4Typography,
                        color: textColors.heading,
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {segment.name}
                    </h4>

                    <p className="text-sm" style={{ color: textColors.muted }}>
                      {segment.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        {trustItems.length > 0 && (
          <div className="text-center">
            <div className="flex flex-wrap justify-center items-center gap-6">
              {trustItems.map((item: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-5 h-5">
                    <CheckmarkIconPublished color="#10b981" size={20} />
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
