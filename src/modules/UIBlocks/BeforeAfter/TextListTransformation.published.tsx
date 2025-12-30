/**
 * TextListTransformation - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Before/After list comparison with 3-column layout
 * - Theme-based colors (warm/cool/neutral)
 * - Transformation icon in center column
 * - Highlight box with dots
 * - Optional CTA and trust indicators
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

export default function TextListTransformationPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Daily Challenges';
  const subheadline = props.subheadline || '';
  const before_label = props.before_label || 'Current Problems';
  const after_label = props.after_label || 'Your New Reality';
  const before_list = props.before_list || '';
  const after_list = props.after_list || '';
  const transformation_text = props.transformation_text || 'Our solution bridges the gap between where you are and where you want to be.';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';

  // Extract icons
  const before_icon = props.before_icon || '❌';
  const after_icon = props.after_icon || '✅';
  const transformation_icon = props.transformation_icon || '➡️';

  // Parse lists
  const beforeItems = before_list.split('|').map(item => item.trim()).filter(Boolean);
  const afterItems = after_list.split('|').map(item => item.trim()).filter(Boolean);

  // Parse trust indicators
  const trustItemsList = (props.trust_items || '')
    .split('|')
    .map(item => item.trim())
    .filter(item => item && item !== '___REMOVED___');

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based color system for before/after lists
  const getListTransformationColors = (themeType: UIBlockTheme) => ({
    warm: {
      before: {
        iconBgColor: '#ffedd5',    // orange-100
        labelDotColor: '#f97316',   // orange-500
        labelRingColor: '#ffedd5',  // orange-100
        labelColor: '#f97316',      // orange-500
        iconColor: '#ea580c'        // orange-600
      },
      after: {
        iconBgColor: '#fef3c7',    // amber-100
        labelDotColor: '#f59e0b',   // amber-500
        labelRingColor: '#fef3c7',  // amber-100
        labelColor: '#f59e0b',      // amber-500
        iconColor: '#d97706'        // amber-600
      }
    },
    cool: {
      before: {
        iconBgColor: '#dbeafe',    // blue-100
        labelDotColor: '#3b82f6',   // blue-500
        labelRingColor: '#dbeafe',  // blue-100
        labelColor: '#3b82f6',      // blue-500
        iconColor: '#2563eb'        // blue-600
      },
      after: {
        iconBgColor: '#dcfce7',    // green-100
        labelDotColor: '#10b981',   // green-500
        labelRingColor: '#dcfce7',  // green-100
        labelColor: '#10b981',      // green-500
        iconColor: '#16a34a'        // green-600
      }
    },
    neutral: {
      before: {
        iconBgColor: '#fee2e2',    // red-100
        labelDotColor: '#ef4444',   // red-500
        labelRingColor: '#fee2e2',  // red-100
        labelColor: '#ef4444',      // red-500
        iconColor: '#dc2626'        // red-600
      },
      after: {
        iconBgColor: '#dcfce7',    // green-100
        labelDotColor: '#10b981',   // green-500
        labelRingColor: '#dcfce7',  // green-100
        labelColor: '#10b981',      // green-500
        iconColor: '#16a34a'        // green-600
      }
    }
  }[themeType]);

  const themeColors = getListTransformationColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // ListItem component - inline for server rendering
  const ListItemPublished = ({ text, colors, icon }: { text: string; colors: any; icon: string }) => (
    <div className="flex items-start space-x-3">
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: colors.iconBgColor }}
      >
        <IconPublished
          value={icon}
          size="sm"
          style={{ color: colors.iconColor, fontSize: '0.875rem' }}
        />
      </div>
      <TextPublished
        value={text}
        element="p"
        style={{
          color: '#374151',
          lineHeight: '1.75rem'
        }}
      />
    </div>
  );

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

        {/* 3-Column Grid: Before | Transformation | After */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          {/* Before Column */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{
                    backgroundColor: themeColors.before.labelDotColor,
                    boxShadow: `0 0 0 4px ${themeColors.before.labelRingColor}`
                  }}
                />
                <TextPublished
                  value={before_label}
                  element="span"
                  style={{
                    ...h3Typography,
                    fontWeight: 600,
                    color: themeColors.before.labelColor
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {beforeItems.map((item, index) => (
                <ListItemPublished
                  key={index}
                  text={item}
                  colors={themeColors.before}
                  icon={before_icon}
                />
              ))}
            </div>
          </div>

          {/* Transformation Column (Center) */}
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: theme?.colors?.accentColor || '#3b82f6' }}
              >
                <IconPublished
                  value={transformation_icon}
                  size="lg"
                  style={{
                    color: '#ffffff',
                    fontSize: '1.875rem'
                  }}
                />
              </div>

              <TextPublished
                value={transformation_text}
                element="p"
                style={{
                  color: textColors.muted,
                  textAlign: 'center',
                  maxWidth: '20rem'
                }}
              />
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{
                    backgroundColor: themeColors.after.labelDotColor,
                    boxShadow: `0 0 0 4px ${themeColors.after.labelRingColor}`
                  }}
                />
                <TextPublished
                  value={after_label}
                  element="span"
                  style={{
                    ...h3Typography,
                    fontWeight: 600,
                    color: themeColors.after.labelColor
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {afterItems.map((item, index) => (
                <ListItemPublished
                  key={index}
                  text={item}
                  colors={themeColors.after}
                  icon={after_icon}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Transformation Highlight Box */}
        <div
          className="rounded-2xl p-8 border mb-12"
          style={{
            background: 'linear-gradient(to right, #f9fafb, #ffffff)',
            borderColor: '#e5e7eb'
          }}
        >
          <div className="text-center space-y-6">
            {/* Dots indicator */}
            <div className="flex justify-center space-x-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: i === 2 ? (theme?.colors?.accentColor || '#3b82f6') : '#d1d5db'
                  }}
                />
              ))}
            </div>

            <TextPublished
              value={transformation_text}
              element="p"
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontWeight: 500,
                maxWidth: '32rem',
                margin: '0 auto'
              }}
            />
          </div>
        </div>

        {/* Footer: Supporting Text + CTA + Trust Indicators */}
        {(supporting_text || cta_text || trustItemsList.length > 0) && (
          <div className="text-center space-y-6">
            {/* Optional Supporting Text */}
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                element="p"
                style={{
                  color: textColors.body,
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
                    backgroundColor={theme?.colors?.accentColor || '#3b82f6'}
                    textColor="#ffffff"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  />
                )}

                {/* Trust Indicators - Inline SVG */}
                {trustItemsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    {trustItemsList.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: themeColors.after.labelDotColor }}
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
