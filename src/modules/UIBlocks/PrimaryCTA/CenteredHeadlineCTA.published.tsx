/**
 * CenteredHeadlineCTA - Published Version
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

// Theme colors helper (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      urgencyBadgeBg: '#fed7aa', // orange-200
      urgencyBadgeText: '#9a3412', // orange-800
      urgencyBadgeBorder: '#fdba74' // orange-300
    },
    cool: {
      urgencyBadgeBg: '#bfdbfe', // blue-200
      urgencyBadgeText: '#1e3a8a', // blue-800
      urgencyBadgeBorder: '#93c5fd' // blue-300
    },
    neutral: {
      urgencyBadgeBg: '#e5e7eb', // gray-200
      urgencyBadgeText: '#1f2937', // gray-800
      urgencyBadgeBorder: '#d1d5db' // gray-300
    }
  }[theme];
};

// Trust checkmark color (universal green)
const trustCheckmarkColor = '#10b981'; // green-500

export default function CenteredHeadlineCTAPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Ready to Transform Your Business?';
  const subheadline = props.subheadline;
  const cta_text = props.cta_text || 'Start Your Free Trial Today';
  const secondary_cta_text = props.secondary_cta_text;
  const urgency_text = props.urgency_text;
  const customer_count = props.customer_count;
  const customer_label = props.customer_label;
  const rating_stat = props.rating_stat;
  const uptime_stat = props.uptime_stat;
  const uptime_label = props.uptime_label;

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
  const h1Typography = getPublishedTypographyStyles('h1', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Trust items
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter((item): item is string =>
    Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
  );

  // Show social proof row if any stat exists
  const showSocialProof = (customer_count && customer_count !== '___REMOVED___') ||
    (rating_stat && rating_stat !== '___REMOVED___') ||
    (uptime_stat && uptime_stat !== '___REMOVED___');

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto text-center">

        {/* Optional Urgency Badge */}
        {urgency_text && urgency_text.trim() !== '' && (
          <div className="mb-8">
            <span
              style={{
                backgroundColor: colors.urgencyBadgeBg,
                color: colors.urgencyBadgeText,
                borderColor: colors.urgencyBadgeBorder
              }}
              className="inline-block px-4 py-2 rounded-full text-sm font-semibold border animate-pulse"
            >
              {urgency_text}
            </span>
          </div>
        )}

        {/* Main Headline */}
        <HeadlinePublished
          value={headline}
          level="h1"
          style={{
            color: textColors.heading,
            ...h1Typography,
            textAlign: 'center'
          }}
          className="leading-tight mb-6"
        />

        {/* Subheadline */}
        {subheadline && subheadline.trim() !== '' && (
          <TextPublished
            value={subheadline}
            style={{
              color: textColors.body,
              ...bodyLgTypography,
              textAlign: 'center'
            }}
            className="max-w-3xl mx-auto leading-relaxed mb-8"
          />
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {/* Primary CTA */}
          <CTAButtonPublished
            text={cta_text}
            backgroundColor={theme.colors?.accentColor || '#3B82F6'}
            textColor="#FFFFFF"
            className="text-xl px-12 py-6 shadow-2xl hover:shadow-3xl"
          />

          {/* Secondary CTA */}
          {secondary_cta_text && secondary_cta_text.trim() !== '' && secondary_cta_text !== '___REMOVED___' && (
            <CTAButtonPublished
              text={secondary_cta_text}
              backgroundColor="transparent"
              textColor={theme.colors?.accentColor || '#3B82F6'}
              className="text-xl px-12 py-6 shadow-2xl hover:shadow-3xl border-2"
            />
          )}
        </div>

        {/* Trust Indicators */}
        {trustItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-8">
            {trustItems.map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${trustCheckmarkColor}15`,
                    border: `1px solid ${trustCheckmarkColor}25`
                  }}
                >
                  <CheckmarkIconPublished color={trustCheckmarkColor} size={14} />
                </div>
                <span style={{ color: textColors.muted }} className="text-sm">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Social Proof Row */}
        {showSocialProof && (
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 pt-8"
            style={{ borderTop: '1px solid #e5e7eb' }}
          >
            {/* Customer Count */}
            {customer_count && customer_count !== '___REMOVED___' && (
              <div className="text-center">
                <div style={{ color: textColors.heading, ...bodyTypography }} className="text-3xl font-bold">
                  {customer_count}
                </div>
                {customer_label && (
                  <div style={{ color: textColors.muted }} className="text-sm mt-1">
                    {customer_label}
                  </div>
                )}
              </div>
            )}

            {/* Rating Stat */}
            {rating_stat && rating_stat !== '___REMOVED___' && (
              <div className="flex items-center space-x-1">
                {/* 5 Star Rating */}
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4 fill-current" style={{ color: '#fbbf24' }} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span style={{ color: textColors.muted }} className="text-sm ml-2">
                  {rating_stat}
                </span>
              </div>
            )}

            {/* Uptime Stat */}
            {uptime_stat && uptime_stat !== '___REMOVED___' && (
              <div className="text-center">
                <div style={{ color: textColors.heading, ...bodyTypography }} className="text-3xl font-bold">
                  {uptime_stat}
                </div>
                {uptime_label && (
                  <div style={{ color: textColors.muted }} className="text-sm mt-1">
                    {uptime_label}
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
