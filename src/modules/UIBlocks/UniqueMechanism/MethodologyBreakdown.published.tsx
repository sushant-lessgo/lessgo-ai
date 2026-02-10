/**
 * MethodologyBreakdown - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Uses clean array-based data structure
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
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

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

// Theme-based extras (non-card elements: headers, results)
const getThemeExtras = (theme: UIBlockTheme) => ({
  warm: {
    headerGradient: 'linear-gradient(to right, #ea580c, #dc2626)',
    headerSubtext: '#ffedd5',
    resultMetricColor: '#ea580c',
    resultsBg: '#fff7ed',
  },
  cool: {
    headerGradient: 'linear-gradient(to right, #2563eb, #4338ca)',
    headerSubtext: '#dbeafe',
    resultMetricColor: '#2563eb',
    resultsBg: '#eff6ff',
  },
  neutral: {
    headerGradient: 'linear-gradient(to right, #374151, #1f2937)',
    headerSubtext: '#e5e7eb',
    resultMetricColor: '#374151',
    resultsBg: '#f9fafb',
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

  const themeExtras = getThemeExtras(uiTheme);

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get text colors for headline
  const textColors = getPublishedTextColors(
    backgroundType || 'secondary',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);

  // Dynamic card layout
  const layout = getDynamicCardLayout(principles.length);

  // Helper to render principle card
  const renderPrincipleCard = (principle: Principle, cardClass: string) => {
    const displayIcon = principle.icon || inferIconFromText(principle.name, principle.description);
    return (
      <div
        key={principle.id}
        className={`relative rounded-2xl transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
        style={{
          backgroundColor: cardStyles.bg,
          backdropFilter: cardStyles.backdropFilter,
          WebkitBackdropFilter: cardStyles.backdropFilter,
          borderColor: cardStyles.borderColor,
          borderWidth: cardStyles.borderWidth,
          borderStyle: cardStyles.borderStyle,
          boxShadow: cardStyles.boxShadow,
        }}
      >
        {/* Principle icon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: cardStyles.iconBg }}
        >
          <IconPublished icon={displayIcon} size={24} color={cardStyles.iconColor} />
        </div>

        {/* Principle name */}
        <TextPublished
          value={principle.name}
          style={{
            fontWeight: 700,
            fontSize: '1.25rem',
            color: cardStyles.textHeading,
            marginBottom: '0.75rem'
          }}
        />

        {/* Principle description */}
        <TextPublished
          value={principle.description}
          style={{
            color: cardStyles.textBody,
            lineHeight: '1.5'
          }}
        />
      </div>
    );
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
          style={{ background: themeExtras.headerGradient }}
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
                color: themeExtras.headerSubtext,
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
          isSplitLayout(principles.length) && layout.splitLayout ? (
            <div className={`mb-12 ${layout.containerClass}`}>
              <div className={layout.splitLayout.firstRowGrid}>
                {principles.slice(0, layout.splitLayout.firstRowCount).map((principle: Principle) =>
                  renderPrincipleCard(principle, layout.splitLayout!.firstRowCard)
                )}
              </div>
              <div className={layout.splitLayout.secondRowGrid}>
                {principles.slice(layout.splitLayout.firstRowCount).map((principle: Principle) =>
                  renderPrincipleCard(principle, layout.splitLayout!.secondRowCard)
                )}
              </div>
            </div>
          ) : (
            <div className={`mb-12 ${layout.containerClass}`}>
              <div className={layout.gridClass}>
                {principles.map((principle: Principle) =>
                  renderPrincipleCard(principle, layout.cardClass)
                )}
              </div>
            </div>
          )
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div
            className="mt-16 rounded-2xl p-8"
            style={{ backgroundColor: themeExtras.resultsBg }}
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
                      color: themeExtras.resultMetricColor,
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
