/**
 * StackedHighlights - Published Version
 * V2 Schema: Uses highlights[] array instead of pipe-separated strings
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

interface Highlight {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function StackedHighlightsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Our Proprietary SmartFlow System™';
  const subheadline = props.subheadline || '';
  const mechanism_name = props.mechanism_name || '';
  const footer_text = props.footer_text || '';

  // Parse highlights array
  const highlights: Highlight[] = Array.isArray(props.highlights) ? props.highlights : [];

  // Theme detection (no useMemo - direct evaluation)
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme-based extras (non-card elements)
  const themeExtras = {
    warm: {
      connectionLine: '#fed7aa',
      iconBgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      mechanismBg: '#ffedd5',
      mechanismBorder: '#fdba74',
      mechanismIcon: '#ea580c',
      mechanismText: '#9a3412',
      footerBg: 'linear-gradient(90deg, #fff7ed 0%, #fef2f2 100%)',
      footerBorder: '#fed7aa',
      footerIcon: '#ea580c',
      footerText: '#9a3412',
    },
    cool: {
      connectionLine: '#bfdbfe',
      iconBgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      mechanismBg: '#dbeafe',
      mechanismBorder: '#93c5fd',
      mechanismIcon: '#2563eb',
      mechanismText: '#1e40af',
      footerBg: 'linear-gradient(90deg, #eff6ff 0%, #f5f3ff 100%)',
      footerBorder: '#bfdbfe',
      footerIcon: '#2563eb',
      footerText: '#1e40af',
    },
    neutral: {
      connectionLine: '#e5e7eb',
      iconBgGradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      mechanismBg: '#f3f4f6',
      mechanismBorder: '#d1d5db',
      mechanismIcon: '#4b5563',
      mechanismText: '#1f2937',
      footerBg: 'linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%)',
      footerBorder: '#e5e7eb',
      footerIcon: '#4b5563',
      footerText: '#1f2937',
    }
  }[uiTheme];

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                marginBottom: '1.5rem'
              }}
            />
          )}

          {/* Optional Mechanism Name */}
          {mechanism_name && (
            <div
              className="inline-flex items-center px-4 py-2 rounded-full border"
              style={{
                backgroundColor: themeExtras.mechanismBg,
                borderColor: themeExtras.mechanismBorder
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                style={{ color: themeExtras.mechanismIcon }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <TextPublished
                value={mechanism_name}
                style={{
                  fontWeight: 600,
                  color: themeExtras.mechanismText
                }}
              />
            </div>
          )}
        </div>

        {/* Stacked Highlights */}
        <div className="space-y-0">
          {highlights.map((highlight: Highlight, index: number) => (
            <div key={highlight.id} className="group relative">
              {/* Connection Line (except for last item) */}
              {index < highlights.length - 1 && (
                <div
                  className="absolute left-8 top-20 w-0.5 h-full hidden lg:block"
                  style={{
                    background: `linear-gradient(to bottom, ${themeExtras.connectionLine}, transparent)`
                  }}
                />
              )}

              {/* Highlight Card */}
              <div
                className="relative flex items-start space-x-6 p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 mb-6"
                style={{
                  backgroundColor: cardStyles.bg,
                  backdropFilter: cardStyles.backdropFilter,
                  WebkitBackdropFilter: cardStyles.backdropFilter,
                  borderColor: cardStyles.borderColor,
                  borderWidth: cardStyles.borderWidth,
                  borderStyle: cardStyles.borderStyle,
                  boxShadow: cardStyles.boxShadow
                }}
              >
                {/* Icon Circle - gradient preserved as brand element */}
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: themeExtras.iconBgGradient
                  }}
                >
                  <IconPublished
                    icon={highlight.icon || inferIconFromText(highlight.title, highlight.description)}
                    size={32}
                    className="text-2xl text-white"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Highlight Title */}
                  <div className="mb-4">
                    <TextPublished
                      value={highlight.title}
                      style={{
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: cardStyles.textHeading,
                        lineHeight: '1.75rem'
                      }}
                    />
                  </div>

                  {/* Highlight Description */}
                  {highlight.description && (
                    <TextPublished
                      value={highlight.description}
                      style={{
                        color: cardStyles.textBody,
                        fontSize: '1rem',
                        lineHeight: '1.75rem'
                      }}
                    />
                  )}
                </div>

                {/* Unique Badge */}
                <div className="absolute top-4 right-4 opacity-60">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    }}
                  >
                    <svg className="w-4 h-4" style={{ color: '#78350f' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Unique Value Proposition */}
        {footer_text && (
          <div className="mt-16 text-center mb-8">
            <div
              className="inline-flex items-center px-6 py-3 rounded-full border"
              style={{
                background: themeExtras.footerBg,
                borderColor: themeExtras.footerBorder
              }}
            >
              <svg
                className="w-5 h-5 mr-2"
                style={{ color: themeExtras.footerIcon }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <TextPublished
                value={footer_text}
                style={{
                  fontWeight: 500,
                  color: themeExtras.footerText
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
