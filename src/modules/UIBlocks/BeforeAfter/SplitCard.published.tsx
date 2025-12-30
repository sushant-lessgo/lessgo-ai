/**
 * SplitCard - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Premium before/after card comparison
 * - Theme-aware colors (warm/cool/neutral)
 * - Premium badge on after card
 * - Upgrade indicators (mobile + desktop)
 * - Optional images with placeholders
 * - Optional CTA and trust indicators
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Theme-based color system (same as editable version)
const getCardColors = (theme: UIBlockTheme) => ({
  warm: {
    beforeBorder: '#fed7aa',
    beforeLabel: '#c2410c',
    beforeDot: '#f97316',
    beforeDotRing: '#ffedd5',
    afterBorder: '#fed7aa',
    afterRing: '#ffedd5',
    afterLabel: '#c2410c',
    afterDot: '#f97316',
    afterDotRing: '#ffedd5',
    afterBorderTop: '#ffedd5',
    badgeGradient: 'linear-gradient(to right, #f97316, #ea580c)',
    beforePlaceholderBg: 'linear-gradient(to bottom right, #ffedd5, #fed7aa)',
    beforePlaceholderIcon: '#fdba74',
    afterPlaceholderBg: 'linear-gradient(to bottom right, #fff7ed, #ffedd5)',
    afterPlaceholderIcon: '#fed7aa',
    featureText: '#ea580c',
    ctaBg: '#f97316',
    trustIconColor: '#f97316'
  },
  cool: {
    beforeBorder: '#bfdbfe',
    beforeLabel: '#1e40af',
    beforeDot: '#3b82f6',
    beforeDotRing: '#dbeafe',
    afterBorder: '#bfdbfe',
    afterRing: '#dbeafe',
    afterLabel: '#1e40af',
    afterDot: '#3b82f6',
    afterDotRing: '#dbeafe',
    afterBorderTop: '#dbeafe',
    badgeGradient: 'linear-gradient(to right, #3b82f6, #2563eb)',
    beforePlaceholderBg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
    beforePlaceholderIcon: '#93c5fd',
    afterPlaceholderBg: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
    afterPlaceholderIcon: '#bfdbfe',
    featureText: '#2563eb',
    ctaBg: '#3b82f6',
    trustIconColor: '#3b82f6'
  },
  neutral: {
    beforeBorder: '#e5e7eb',
    beforeLabel: '#374151',
    beforeDot: '#6b7280',
    beforeDotRing: '#f3f4f6',
    afterBorder: '#e5e7eb',
    afterRing: '#f3f4f6',
    afterLabel: '#374151',
    afterDot: '#6b7280',
    afterDotRing: '#f3f4f6',
    afterBorderTop: '#f3f4f6',
    badgeGradient: 'linear-gradient(to right, #374151, #1f2937)',
    beforePlaceholderBg: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
    beforePlaceholderIcon: '#d1d5db',
    afterPlaceholderBg: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
    afterPlaceholderIcon: '#e5e7eb',
    featureText: '#4b5563',
    ctaBg: '#374151',
    trustIconColor: '#6b7280'
  }
}[theme]);

// Premium Card Component (server-safe, no memo needed)
function PremiumCardPublished({
  type,
  label,
  description,
  visual,
  placeholderIcon,
  premiumFeaturesText,
  premiumBadgeText,
  premiumFeatureIcon,
  themeColors,
  textColors,
  bodyTypography
}: {
  type: 'before' | 'after';
  label: string;
  description: string;
  visual?: string;
  placeholderIcon: string;
  premiumFeaturesText?: string;
  premiumBadgeText?: string;
  premiumFeatureIcon?: string;
  themeColors: ReturnType<typeof getCardColors>;
  textColors: { heading: string; body: string; muted: string };
  bodyTypography: React.CSSProperties;
}) {

  // Visual Placeholder Component
  const VisualPlaceholderPublished = () => (
    <div
      className="relative w-full h-64 rounded-t-xl overflow-hidden"
      style={{
        background: type === 'before'
          ? themeColors.beforePlaceholderBg
          : themeColors.afterPlaceholderBg
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: type === 'before'
              ? themeColors.beforePlaceholderIcon
              : themeColors.afterPlaceholderIcon
          }}
        >
          <IconPublished
            value={placeholderIcon}
            size="xl"
            className="text-4xl"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        type === 'after' ? 'ring-2' : ''
      }`}
      style={{
        borderColor: type === 'before' ? themeColors.beforeBorder : themeColors.afterBorder,
        ...(type === 'after' && {
          boxShadow: `0 0 0 2px ${themeColors.afterRing}`
        })
      }}
    >

      {/* Premium Badge (after card only) */}
      {type === 'after' && premiumBadgeText && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className="text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg"
            style={{ background: themeColors.badgeGradient }}
          >
            {premiumBadgeText}
          </div>
        </div>
      )}

      {/* Visual or Placeholder */}
      <div className="overflow-hidden rounded-t-xl">
        {visual && visual !== '' ? (
          <ImagePublished
            src={visual}
            alt={type === 'before' ? 'Current challenge visualization' : 'Premium solution result'}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <VisualPlaceholderPublished />
        )}
      </div>

      {/* Card Content */}
      <div className="p-8">
        {/* Label with Dot */}
        <div className="flex items-center mb-4">
          <div
            className="w-3 h-3 rounded-full mr-3"
            style={{
              backgroundColor: type === 'before' ? themeColors.beforeDot : themeColors.afterDot,
              boxShadow: `0 0 0 4px ${type === 'before' ? themeColors.beforeDotRing : themeColors.afterDotRing}`
            }}
          />
          <TextPublished
            value={label}
            element="span"
            style={{
              ...bodyTypography,
              color: type === 'before' ? themeColors.beforeLabel : themeColors.afterLabel
            }}
          />
        </div>

        {/* Description */}
        <TextPublished
          value={description}
          element="p"
          style={{
            color: textColors.body,
            lineHeight: '1.75rem'
          }}
        />

        {/* Premium Features (after card only) */}
        {type === 'after' && premiumFeaturesText && (
          <div
            className="mt-6 pt-4 border-t"
            style={{ borderColor: themeColors.afterBorderTop }}
          >
            <div className="flex items-center">
              {premiumFeatureIcon && (
                <div className="mr-2">
                  <IconPublished
                    value={premiumFeatureIcon}
                    size="sm"
                    className="text-sm"
                  />
                </div>
              )}
              <TextPublished
                value={premiumFeaturesText}
                element="span"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: themeColors.featureText
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SplitCardPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Premium Transformation Experience';
  const subheadline = props.subheadline || '';
  const before_label = props.before_label || 'Current Challenge';
  const after_label = props.after_label || 'Premium Solution';
  const before_description = props.before_description || 'Complex manual processes requiring expertise, time, and significant resources to execute properly.';
  const after_description = props.after_description || 'Expertly crafted automation that delivers exceptional results with minimal effort and maximum efficiency.';
  const before_visual = props.before_visual || '';
  const after_visual = props.after_visual || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const premium_features_text = props.premium_features_text || 'Premium Features Included';
  const upgrade_text = props.upgrade_text || 'Upgrade';
  const premium_badge_text = props.premium_badge_text || 'Premium';

  // Extract icons
  const before_icon = props.before_icon || '⚠️';
  const after_icon = props.after_icon || '⭐';
  const upgrade_icon = props.upgrade_icon || '➡️';
  const premium_feature_icon = props.premium_feature_icon || '✅';

  // Parse trust indicators from pipe-separated string
  const trustItemsList = (props.trust_items || '')
    .split('|')
    .map(item => item.trim())
    .filter(item => item && item !== '___REMOVED___');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  const themeColors = getCardColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-12">
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
              element="p"
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Side by Side Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">

          {/* Before Card with Mobile Upgrade Indicator */}
          <div className="space-y-6">
            <PremiumCardPublished
              type="before"
              label={before_label}
              description={before_description}
              visual={before_visual}
              placeholderIcon={before_icon}
              themeColors={themeColors}
              textColors={textColors}
              bodyTypography={bodyTypography}
            />

            {/* Upgrade Indicator (Mobile) */}
            <div className="text-center lg:hidden">
              <div className="inline-flex items-center space-x-2 bg-white rounded-full shadow-lg px-6 py-3">
                <IconPublished
                  value={upgrade_icon}
                  size="sm"
                  className="text-lg text-gray-400"
                />
                <TextPublished
                  value={upgrade_text}
                  element="span"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: textColors.muted
                  }}
                />
              </div>
            </div>
          </div>

          {/* After Card with Desktop Upgrade Indicator */}
          <div className="relative">
            {/* Upgrade Indicator (Desktop) */}
            <div className="hidden lg:block absolute -left-8 top-1/2 transform -translate-y-1/2">
              <div className="flex flex-col items-center space-y-2 bg-white rounded-full shadow-lg px-4 py-6">
                <IconPublished
                  value={upgrade_icon}
                  size="md"
                  className="text-xl text-gray-400"
                />
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted, writingMode: 'vertical-rl' }}
                >
                  {upgrade_text}
                </div>
              </div>
            </div>

            <PremiumCardPublished
              type="after"
              label={after_label}
              description={after_description}
              visual={after_visual}
              placeholderIcon={after_icon}
              premiumFeaturesText={premium_features_text}
              premiumBadgeText={premium_badge_text}
              premiumFeatureIcon={premium_feature_icon}
              themeColors={themeColors}
              textColors={textColors}
              bodyTypography={bodyTypography}
            />
          </div>
        </div>

        {/* Optional CTA and Trust Section */}
        {(cta_text || trustItemsList.length > 0 || supporting_text) && (
          <div className="text-center space-y-6">
            {/* Optional Supporting Text */}
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                element="p"
                style={{
                  color: textColors.body,
                  ...bodyLgTypography,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            {/* CTA Button and Trust Indicators */}
            {(cta_text || trustItemsList.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {cta_text && (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={themeColors.ctaBg}
                    textColor="#ffffff"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  />
                )}

                {/* Trust Indicators - Inline SVG Implementation */}
                {trustItemsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    {trustItemsList.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: themeColors.trustIconColor }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span style={{ color: textColors.muted }}>{item}</span>
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
