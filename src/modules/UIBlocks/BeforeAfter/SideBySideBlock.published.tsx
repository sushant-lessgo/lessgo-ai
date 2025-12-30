/**
 * SideBySideBlock - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Before/After comparison with theme-aware colors
 * - Optional icons for both sides
 * - Optional CTA button and trust indicators
 * - Theme-based visual styling (warm/cool/neutral)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function SideBySideBlockPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Your Transformation Story';
  const subheadline = props.subheadline || '';
  const before_label = props.before_label || 'Before';
  const after_label = props.after_label || 'After';
  const before_description = props.before_description || 'Describe the current state or problem your audience faces.';
  const after_description = props.after_description || 'Describe the improved state or solution you provide.';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';

  // Extract icons (optional)
  const before_icon = props.before_icon || '';
  const after_icon = props.after_icon || '';

  // Parse trust indicators from pipe-separated string
  const trustItemsList = (props.trust_items || '')
    .split('|')
    .map(item => item.trim())
    .filter(item => item && item !== '___REMOVED___');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based color system for before/after visual indicators
  const getBeforeAfterColors = (themeType: UIBlockTheme) => ({
    warm: {
      labelColor: '#ea580c',        // orange-600
      iconRing: '#ffedd5',          // orange-100
      border: '#fed7aa'             // orange-200
    },
    cool: {
      labelColor: '#2563eb',        // blue-600
      iconRing: '#dbeafe',          // blue-100
      border: '#bfdbfe'             // blue-200
    },
    neutral: {
      labelColor: '#4b5563',        // gray-600
      iconRing: '#f3f4f6',          // gray-100
      border: '#e5e7eb'             // gray-200
    }
  }[themeType]);

  const themeColors = getBeforeAfterColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyStandardTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Main Headline */}
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              element="p"
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Side by Side Blocks */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Before Block */}
          <div className="group">
            <div
              className="rounded-lg shadow-lg p-8 border hover:shadow-xl transition-shadow duration-300 h-full"
              style={{
                backgroundColor: '#ffffff',
                borderColor: themeColors.border
              }}
            >
              <div className="flex items-center mb-6">
                {before_icon ? (
                  <div className="mr-3">
                    <IconPublished
                      value={before_icon}
                      size="lg"
                      className="text-xl"
                    />
                  </div>
                ) : (
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                      backgroundColor: themeColors.labelColor,
                      boxShadow: `0 0 0 4px ${themeColors.iconRing}`
                    }}
                  />
                )}

                <TextPublished
                  value={before_label}
                  element="span"
                  style={{
                    ...bodyStandardTypography,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: themeColors.labelColor
                  }}
                />
              </div>

              <TextPublished
                value={before_description}
                element="p"
                style={{
                  color: textColors.body,
                  lineHeight: '1.75rem'
                }}
              />
            </div>
          </div>

          {/* After Block */}
          <div className="group">
            <div
              className="rounded-lg shadow-lg p-8 border hover:shadow-xl transition-shadow duration-300 h-full"
              style={{
                backgroundColor: '#ffffff',
                borderColor: themeColors.border
              }}
            >
              <div className="flex items-center mb-6">
                {after_icon ? (
                  <div className="mr-3">
                    <IconPublished
                      value={after_icon}
                      size="lg"
                      className="text-xl"
                    />
                  </div>
                ) : (
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                      backgroundColor: themeColors.labelColor,
                      boxShadow: `0 0 0 4px ${themeColors.iconRing}`
                    }}
                  />
                )}

                <TextPublished
                  value={after_label}
                  element="span"
                  style={{
                    ...bodyStandardTypography,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: themeColors.labelColor
                  }}
                />
              </div>

              <TextPublished
                value={after_description}
                element="p"
                style={{
                  color: textColors.body,
                  lineHeight: '1.75rem'
                }}
              />
            </div>
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
                  ...bodyTypography,
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
                    backgroundColor={theme?.colors?.accentColor || themeColors.labelColor}
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
                          style={{ color: themeColors.labelColor }}
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
