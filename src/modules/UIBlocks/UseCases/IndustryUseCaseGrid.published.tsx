/**
 * IndustryUseCaseGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of numbered fields
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// V2: Industry structure - clean array item
interface Industry {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function IndustryUseCaseGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Trusted Across Industries';
  const subheadline = props.subheadline || '';

  // V2: Direct array access - no numbered fields or pipe parsing needed
  const industries: Industry[] = props.industries || [];

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  // Dynamic card layout based on industry count
  const layout = getDynamicCardLayout(industries.length);

  // Helper to render a single industry card
  const renderIndustryCard = (industry: Industry, cardClass: string) => {
    const displayIcon = industry.icon || inferIconFromText(industry.name, industry.description);
    return (
      <div
        key={industry.id}
        className={`rounded-xl transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
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
        {/* Icon Container - Circular with theme background */}
        <div
          className="w-32 h-32 mx-auto flex items-center justify-center mb-6 rounded-full"
          style={{
            backgroundColor: cardStyles.iconBg
          }}
        >
          <IconPublished
            icon={displayIcon}
            color={cardStyles.iconColor}
            size={60}
          />
        </div>

        {/* Industry Name */}
        <div className="mb-4 text-center">
          <h3
            style={{
              ...h3Typography,
              fontWeight: 700,
              color: cardStyles.textHeading,
              textAlign: 'center'
            }}
          >
            {industry.name}
          </h3>
        </div>

        {/* Use Case Description */}
        <div className="text-center">
          <TextPublished
            value={industry.description}
            style={{
              color: cardStyles.textBody,
              ...bodyTypography,
              textAlign: 'center'
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className={layout.containerClass}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {/* Headline */}
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              textAlign: 'center',
              marginBottom: subheadline ? '1rem' : '0'
            }}
          />

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center',
                opacity: 0.8
              }}
            />
          )}
        </div>

        {/* Industry Cards Grid */}
        {isSplitLayout(industries.length) && layout.splitLayout ? (
          <>
            <div className={layout.splitLayout.firstRowGrid}>
              {industries.slice(0, layout.splitLayout.firstRowCount).map((industry: Industry) =>
                renderIndustryCard(industry, layout.splitLayout!.firstRowCard)
              )}
            </div>
            <div className={layout.splitLayout.secondRowGrid}>
              {industries.slice(layout.splitLayout.firstRowCount).map((industry: Industry) =>
                renderIndustryCard(industry, layout.splitLayout!.secondRowCard)
              )}
            </div>
          </>
        ) : (
          <div className={layout.gridClass}>
            {industries.map((industry: Industry) => renderIndustryCard(industry, layout.cardClass))}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
