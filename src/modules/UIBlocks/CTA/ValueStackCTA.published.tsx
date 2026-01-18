/**
 * ValueStackCTA - Published Version
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { FormMarkupPublished } from '@/components/published/FormMarkupPublished';
import { InlineFormMarkupPublished } from '@/components/published/InlineFormMarkupPublished';
import { determineFormPlacement } from '@/utils/formPlacement';

// Theme colors helper (hex values for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      iconBg: '#fed7aa', // orange-200
      cardBorder: '#e5e7eb', // gray-200 (neutral)
      gradientFrom: '#ea580c', // orange-600
      gradientTo: '#b91c1c', // red-700
      ctaLightText: '#fed7aa', // orange-100
      ctaButtonText: '#ea580c' // orange-600
    },
    cool: {
      iconBg: '#bfdbfe', // blue-200
      cardBorder: '#e5e7eb', // gray-200
      gradientFrom: '#2563eb', // blue-600
      gradientTo: '#4338ca', // indigo-700
      ctaLightText: '#dbeafe', // blue-100
      ctaButtonText: '#2563eb' // blue-600
    },
    neutral: {
      iconBg: '#e5e7eb', // gray-200
      cardBorder: '#e5e7eb', // gray-200
      gradientFrom: '#4b5563', // gray-600
      gradientTo: '#1f2937', // gray-800
      ctaLightText: '#e5e7eb', // gray-100
      ctaButtonText: '#4b5563' // gray-600
    }
  }[theme];
};

// Checkmark color (universal green)
const checkmarkColor = '#10b981'; // green-500

// Parse value propositions from props
const parseValueProps = (props: any) => {
  const titles = (props.value_propositions || '').split('|').filter((t: string) => t.trim());
  const descriptions = (props.value_descriptions || '').split('|').filter((d: string) => d.trim());

  return titles.map((title: string, i: number) => ({
    title: title.trim(),
    description: descriptions[i]?.trim() || '',
    icon: props[`value_icon_${i + 1}`] || ['⚡', '📈', '🤖', '📊', '🎯', '🔗'][i] || '✨'
  }));
};

export default function ValueStackCTAPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Everything You Need to Succeed';
  const subheadline = props.subheadline;
  const cta_text = props.cta_text || 'Start Your Transformation';
  const secondary_cta_text = props.secondary_cta_text;
  const final_cta_headline = props.final_cta_headline || 'Ready to Get Started?';
  const final_cta_description = props.final_cta_description || 'Join thousands of businesses already transforming their operations with our platform.';
  const guarantee_text = props.guarantee_text;

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
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Parse value props
  const valueProps = parseValueProps(props);

  // Extract button metadata for form detection
  const sectionData = props.content?.[sectionId];
  const ctaElement = sectionData?.elements?.cta_text;
  const buttonConfig = ctaElement?.metadata?.buttonConfig;

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

        {/* Value Propositions Grid */}
        <div className="grid gap-6 mb-12">
          {valueProps.map((valueProp: { title: string; description: string; icon: string }, index: number) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-6 bg-white rounded-xl"
              style={{ border: `1px solid ${colors.cardBorder}` }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ backgroundColor: colors.iconBg }}
              >
                {valueProp.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div
                  style={{ color: textColors.heading, ...bodyTypography }}
                  className="font-bold mb-2"
                >
                  {valueProp.title}
                </div>
                <div
                  style={{ color: textColors.muted, ...bodyTypography }}
                  className="leading-relaxed"
                >
                  {valueProp.description}
                </div>
              </div>

              {/* Checkmark */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: checkmarkColor }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
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
              // Check if button is form-connected
              if (!buttonConfig || buttonConfig.type !== 'form') {
                return (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor="#ffffff"
                    textColor={colors.ctaButtonText}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                  />
                );
              }

              // Get form from content
              const form = props.content?.forms?.[buttonConfig.formId];
              if (!form) {
                console.warn(`Form not found: ${buttonConfig.formId}`);
                return (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor="#ffffff"
                    textColor={colors.ctaButtonText}
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
                      bg: '#ffffff',
                      text: colors.ctaButtonText
                    }}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                  />
                );
              }

              // Multi-field: render button with scroll anchor
              return (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor="#ffffff"
                  textColor={colors.ctaButtonText}
                  href={buttonConfig.behavior === 'scrollTo' ? '#form-section' : undefined}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
                />
              );
            })()}

            {/* Secondary CTA */}
            {secondary_cta_text && secondary_cta_text.trim() !== '' && secondary_cta_text !== '___REMOVED___' && (
              <CTAButtonPublished
                text={secondary_cta_text}
                backgroundColor="transparent"
                textColor="#ffffff"
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg border-2"
              />
            )}

            {/* Guarantee text */}
            {guarantee_text && guarantee_text.trim() !== '' && (
              <div className="flex items-center space-x-2" style={{ color: colors.ctaLightText }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{guarantee_text}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </SectionWrapperPublished>
  );
}
