/**
 * BoldGuaranteePanel - Published Version
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

// Guarantee structure
interface Guarantee {
  title: string;
  description: string;
}

// Parse guarantee data from props
const parseGuaranteeData = (props: any): Guarantee[] => {
  const guarantees: Guarantee[] = [];

  // Process individual fields
  for (let i = 1; i <= 3; i++) {
    const title = props[`guarantee_title_${i}`];
    const description = props[`guarantee_description_${i}`];

    if (title && title.trim() && title !== '___REMOVED___') {
      guarantees.push({
        title: title.trim(),
        description: description?.trim() || 'Description pending.'
      });
    }
  }

  return guarantees;
};

// Get theme colors (hex values for inline styles)
const getGuaranteeColors = (theme: 'warm' | 'cool' | 'neutral') => {
  return {
    warm: {
      mainPanelBg: '#f97316', // orange-500
      mainPanelText: '#ffffff',
      mainPanelMuted: '#ffedd5', // orange-50
      checkmarkBg: '#ffedd5', // orange-100
      checkmarkIcon: '#ea580c', // orange-600
      ctaBg: '#ffffff',
      ctaText: '#ea580c' // orange-600
    },
    cool: {
      mainPanelBg: '#3b82f6', // blue-500
      mainPanelText: '#ffffff',
      mainPanelMuted: '#dbeafe', // blue-50
      checkmarkBg: '#dbeafe', // blue-100
      checkmarkIcon: '#2563eb', // blue-600
      ctaBg: '#ffffff',
      ctaText: '#2563eb' // blue-600
    },
    neutral: {
      mainPanelBg: '#374151', // gray-700
      mainPanelText: '#ffffff',
      mainPanelMuted: '#f9fafb', // gray-50
      checkmarkBg: '#f3f4f6', // gray-100
      checkmarkIcon: '#4b5563', // gray-600
      ctaBg: '#ffffff',
      ctaText: '#374151' // gray-700
    }
  }[theme];
};

export default function BoldGuaranteePanelPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Our Iron-Clad Guarantee to You';
  const subheadline = props.subheadline || '';
  const main_guarantee = props.main_guarantee || '30-Day Money-Back Guarantee';
  const guarantee_details = props.guarantee_details || 'If you don\'t see measurable results within 30 days, we\'ll refund every penny.';
  const cta_text = props.cta_text || 'Start Risk-Free Today';
  const trust_indicators = props.trust_indicators || 'SSL Secured • 100% Protected • Instant Access';

  // Parse guarantee data
  const guarantees = parseGuaranteeData(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getGuaranteeColors(uiBlockTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const h1Typography = getPublishedTypographyStyles('h1', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '32rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Main Guarantee Panel */}
        <div
          style={{
            background: colors.mainPanelBg,
            borderRadius: '1rem',
            padding: '2.5rem',
            textAlign: 'center',
            color: colors.mainPanelText,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2.5rem'
          }}
        >
          <TextPublished
            value={main_guarantee}
            style={{
              ...h1Typography,
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 'bold',
              color: colors.mainPanelText,
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          />

          <TextPublished
            value={guarantee_details}
            style={{
              ...bodyLgTypography,
              color: colors.mainPanelMuted,
              lineHeight: '1.75',
              maxWidth: '32rem',
              margin: '0 auto 2rem',
              textAlign: 'center'
            }}
          />

          <CTAButtonPublished
            text={cta_text}
            backgroundColor={colors.ctaBg}
            textColor={colors.ctaText}
            className="px-8 py-3 text-lg font-semibold shadow-lg"
          />
        </div>

        {/* Key Guarantees Cards */}
        {guarantees.length > 0 && (
          <div
            className="grid md:grid-cols-3 gap-6"
            style={{ marginBottom: '2rem' }}
          >
            {guarantees.map((guarantee: Guarantee, index: number) => (
              <div
                key={index}
                className="text-center p-6"
              >
                {/* Checkmark Icon */}
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    background: colors.checkmarkBg,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: colors.checkmarkIcon,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✓
                </div>

                {/* Guarantee Title */}
                <TextPublished
                  value={guarantee.title}
                  style={{
                    ...h3Typography,
                    fontWeight: '600',
                    color: textColors.heading,
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}
                />

                {/* Guarantee Description */}
                <TextPublished
                  value={guarantee.description}
                  style={{
                    ...bodyTypography,
                    fontSize: '0.875rem',
                    lineHeight: '1.75',
                    color: textColors.body,
                    textAlign: 'center'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        {trust_indicators && (
          <div className="text-center">
            <TextPublished
              value={trust_indicators}
              style={{
                ...bodyTypography,
                fontSize: '0.875rem',
                color: '#6b7280', // gray-600
                textAlign: 'center'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
