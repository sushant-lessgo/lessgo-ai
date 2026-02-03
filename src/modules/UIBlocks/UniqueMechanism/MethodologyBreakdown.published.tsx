/**
 * MethodologyBreakdown - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Uses clean array-based data structure
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';

// V2: Principle item structure
interface Principle {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// V2: Result item structure
interface Result {
  id: string;
  metric: string;
  label: string;
}

// Theme-based inline styles (SSR safe)
const getThemeStyles = (theme: UIBlockTheme) => ({
  warm: {
    headerGradient: 'linear-gradient(to right, #ea580c, #dc2626)',
    headerSubtext: '#ffedd5',
    iconGradient: 'linear-gradient(135deg, #ea580c, #b91c1c)', // Fix: increased saturation
    cardBorder: '#fdba74', // Fix: stronger border (was #fed7aa)
    cardBorderHover: '#fb923c',
    resultMetricColor: '#ea580c',
    resultsBg: '#fff7ed', // Fix: results section background
    cardShadow: '0 4px 20px rgba(249,115,22,0.15)',
    cardShadowHover: '0 8px 30px rgba(249,115,22,0.25)',
  },
  cool: {
    headerGradient: 'linear-gradient(to right, #2563eb, #4338ca)',
    headerSubtext: '#dbeafe',
    iconGradient: 'linear-gradient(135deg, #2563eb, #4338ca)', // Fix: increased saturation
    cardBorder: '#93c5fd', // Fix: stronger border (was #bfdbfe)
    cardBorderHover: '#60a5fa',
    resultMetricColor: '#2563eb',
    resultsBg: '#eff6ff', // Fix: results section background
    cardShadow: '0 4px 20px rgba(37,99,235,0.15)',
    cardShadowHover: '0 8px 30px rgba(37,99,235,0.25)',
  },
  neutral: {
    headerGradient: 'linear-gradient(to right, #374151, #1f2937)',
    headerSubtext: '#e5e7eb',
    iconGradient: 'linear-gradient(135deg, #4b5563, #1f2937)', // Fix: increased saturation
    cardBorder: '#d1d5db', // Fix: stronger border (was #e5e7eb)
    cardBorderHover: '#9ca3af',
    resultMetricColor: '#374151',
    resultsBg: '#f9fafb', // Fix: results section background
    cardShadow: '0 4px 20px rgba(100,116,139,0.15)',
    cardShadowHover: '0 8px 30px rgba(100,116,139,0.25)',
  },
})[theme];

export default function MethodologyBreakdownPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content - V2 array format
  const headline = props.headline || 'The Science Behind Our Success';
  const methodology_name = props.methodology_name || 'Adaptive Intelligence Framework™';
  const methodology_description = props.methodology_description || '';
  const methodology_icon = props.methodology_icon || 'Brain';
  const subheadline = props.subheadline || '';
  const results_title = props.results_title || '';

  // V2: Extract arrays directly
  const principles: Principle[] = Array.isArray(props.principles) ? props.principles : [];
  const results: Result[] = Array.isArray(props.results) ? props.results : [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  const themeStyles = getThemeStyles(uiTheme);

  // Get text colors for headline
  const textColors = getPublishedTextColors(
    backgroundType || 'secondary',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);

  // Determine grid layout based on principle count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: subheadline ? '1rem' : '1.5rem'
            }}
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                maxWidth: '42rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Methodology Header */}
        <div
          className="rounded-2xl p-12 text-white text-center mb-12"
          style={{ background: themeStyles.headerGradient }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <IconPublished
              icon={methodology_icon}
              size={48}
              className="text-white"
            />
          </div>

          <HeadlinePublished
            value={methodology_name}
            level="h2"
            style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontSize: '1.875rem',
              fontWeight: 700
            }}
          />

          {methodology_description && (
            <TextPublished
              value={methodology_description}
              style={{
                color: themeStyles.headerSubtext,
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Principles Grid */}
        {principles.length > 0 && (
          <div className={`grid gap-6 lg:gap-8 mb-12 ${getGridClass(principles.length)}`}>
            {principles.map((principle) => {
              const displayIcon = principle.icon || inferIconFromText(principle.name, principle.description);

              return (
                <div
                  key={principle.id}
                  className="relative bg-white rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    border: `1px solid ${themeStyles.cardBorder}`,
                    boxShadow: themeStyles.cardShadow,
                  }}
                >
                  {/* Principle icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4"
                    style={{ background: themeStyles.iconGradient }}
                  >
                    <IconPublished icon={displayIcon} size={24} />
                  </div>

                  {/* Principle name */}
                  <TextPublished
                    value={principle.name}
                    style={{
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      color: textColors.heading,
                      marginBottom: '0.75rem'
                    }}
                  />

                  {/* Principle description */}
                  <TextPublished
                    value={principle.description}
                    style={{
                      color: textColors.muted,
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div
            className="mt-16 rounded-2xl p-8"
            style={{ backgroundColor: themeStyles.resultsBg }}
          >
            {results_title && (
              <HeadlinePublished
                value={results_title}
                level="h3"
                style={{
                  color: textColors.heading,
                  textAlign: 'center',
                  marginBottom: '2rem',
                  fontSize: '1.875rem',
                  fontWeight: 700
                }}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {results.map((result) => (
                <div key={result.id} className="text-center">
                  <TextPublished
                    value={result.metric}
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 700,
                      color: themeStyles.resultMetricColor,
                      marginBottom: '0.5rem'
                    }}
                  />
                  <TextPublished
                    value={result.label}
                    style={{
                      color: textColors.muted,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
