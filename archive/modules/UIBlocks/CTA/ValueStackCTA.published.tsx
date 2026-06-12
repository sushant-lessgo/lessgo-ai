/**
 * ValueStackCTA - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Simplified checkmark + one-liner format
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { InlineFormMarkupPublished } from '@/components/published/InlineFormMarkupPublished';
import { determineFormPlacement } from '@/utils/formPlacement';

// Theme colors (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      gradientFrom: '#ea580c', // orange-600
      gradientTo: '#b91c1c', // red-700
      ctaLightText: '#fed7aa', // orange-100
      ctaButtonText: '#ea580c' // orange-600
    },
    cool: {
      gradientFrom: '#2563eb', // blue-600
      gradientTo: '#4338ca', // indigo-700
      ctaLightText: '#dbeafe', // blue-100
      ctaButtonText: '#2563eb' // blue-600
    },
    neutral: {
      gradientFrom: '#4b5563', // gray-600
      gradientTo: '#1f2937', // gray-800
      ctaLightText: '#e5e7eb', // gray-100
      ctaButtonText: '#4b5563' // gray-600
    }
  }[theme];
};

// Green checkmark color
const checkmarkColor = '#10b981'; // green-500

export default function ValueStackCTAPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Everything You Get With Your Account';
  const subheadline = props.subheadline;
  const cta_text = props.cta_text || 'Start Free Trial';
  const secondary_cta_text = props.secondary_cta_text;
  const final_cta_headline = props.final_cta_headline || 'Ready to Transform Your Workflow?';
  const final_cta_description = props.final_cta_description || 'Join 10,000+ teams already saving time every day';
  const guarantee_text = props.guarantee_text;

  // V2: Get value_items array directly
  const valueItems: Array<{ id: string; text: string }> = Array.isArray(props.value_items)
    ? props.value_items
    : [
        { id: 'v1', text: 'Save 20+ hours per week on repetitive tasks' },
        { id: 'v2', text: 'Increase team productivity by 40%' },
        { id: 'v3', text: 'Real-time analytics and reporting' },
        { id: 'v4', text: 'Unlimited team members included' },
        { id: 'v5', text: 'Priority 24/7 customer support' },
      ];

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

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
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // V2: Extract button metadata from elementMetadata (not element.metadata)
  const sectionData = props.content?.[sectionId];
  const buttonConfig = sectionData?.elementMetadata?.cta_text?.buttonConfig || props.elementMetadata?.cta_text?.buttonConfig;

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="cta"
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
              textAlign: 'center'
            }}
            className="mb-4"
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                textAlign: 'center'
              }}
              className="max-w-3xl mx-auto"
            />
          )}
        </div>

        {/* Value Items - Simple checkmark list */}
        <div className="space-y-4 mb-12 max-w-3xl mx-auto">
          {valueItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              {/* Green checkmark */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: checkmarkColor }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Text */}
              <div
                style={{ color: textColors.body, ...bodyLgTypography }}
                className="flex-1"
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div
          className="rounded-2xl p-12 text-center text-white"
          style={{
            background: `linear-gradient(to right, ${colors.gradientFrom}, ${colors.gradientTo})`
          }}
        >
          <HeadlinePublished
            value={final_cta_headline}
            level="h3"
            style={{
              color: '#ffffff',
              ...h3Typography,
              textAlign: 'center'
            }}
            className="mb-4"
          />

          <TextPublished
            value={final_cta_description}
            style={{
              color: colors.ctaLightText,
              ...bodyLgTypography,
              textAlign: 'center'
            }}
            className="mb-8 max-w-2xl mx-auto"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Primary CTA */}
            {(() => {
              const accentColor = theme?.colors?.accentColor || '#3B82F6';

              // Check if button is form-connected
              if (!buttonConfig || buttonConfig.type !== 'form') {
                return (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={accentColor}
                    textColor="#ffffff"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                  />
                );
              }

              // Get form from content
              const form = props.content?.forms?.[buttonConfig.formId];
              if (!form) {
                return (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={accentColor}
                    textColor="#ffffff"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                  />
                );
              }

              // Determine placement
              const placement = determineFormPlacement(
                form,
                buttonConfig.ctaType || 'primary',
                'cta',
                props.sections || []
              );

              // Render inline form (single-field)
              if (placement.placement === 'inline') {
                return (
                  <InlineFormMarkupPublished
                    form={form}
                    publishedPageId={props.publishedPageId || ''}
                    pageOwnerId={props.pageOwnerId || ''}
                    size="large"
                    variant="primary"
                    colorTokens={{
                      bg: accentColor,
                      text: '#ffffff'
                    }}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                  />
                );
              }

              // Multi-field: render button with scroll anchor
              return (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor={accentColor}
                  textColor="#ffffff"
                  href={buttonConfig.behavior === 'scrollTo' ? '#form-section' : undefined}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                />
              );
            })()}

            {/* Secondary CTA */}
            {secondary_cta_text && secondary_cta_text.trim() !== '' && (
              <CTAButtonPublished
                text={secondary_cta_text}
                backgroundColor="transparent"
                textColor={theme?.colors?.accentColor || '#3B82F6'}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg border-2"
              />
            )}

            {/* Guarantee text */}
            {guarantee_text && guarantee_text.trim() !== '' && (
              <div className="flex items-center space-x-2" style={{ color: colors.ctaLightText }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-base font-medium">{guarantee_text}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </SectionWrapperPublished>
  );
}
