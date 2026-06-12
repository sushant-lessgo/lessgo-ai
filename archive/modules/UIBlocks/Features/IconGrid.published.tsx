/**
 * IconGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of pipe-separated strings
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// V2: Feature structure - clean array item
interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function IconGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Powerful Features Built for You';
  const subheadline = props.subheadline || '';
  const badge_text = props.badge_text || '';
  const supporting_text = props.supporting_text || '';

  // V2: Direct array access - no pipe parsing needed
  const features: Feature[] = props.features || [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles based on luminance and theme
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

  // Dynamic card layout based on feature count
  const layout = getDynamicCardLayout(features.length);

  // Helper to render a single feature card
  const renderFeatureCard = (feature: Feature, cardClass: string) => {
    const displayIcon = feature.icon || inferIconFromText(feature.title, feature.description);
    return (
      <div
        key={feature.id}
        className={`group rounded-xl transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
        style={{
          backgroundColor: cardStyles.bg,
          borderColor: cardStyles.borderColor,
          borderWidth: cardStyles.borderWidth,
          borderStyle: cardStyles.borderStyle,
          backdropFilter: cardStyles.backdropFilter,
          WebkitBackdropFilter: cardStyles.backdropFilter,
          boxShadow: cardStyles.boxShadow
        }}
      >
        {/* Icon */}
        <div className="mb-4">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-lg group-hover:scale-110 transition-all duration-300"
            style={{
              backgroundColor: cardStyles.iconBg
            }}
          >
            <IconPublished
              icon={displayIcon}
              size={24}
              className="text-2xl"
              color={cardStyles.iconColor}
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <h3
            style={{
              ...h3Typography,
              fontWeight: 600,
              color: cardStyles.textHeading
            }}
          >
            {feature.title}
          </h3>
        </div>

        {/* Description */}
        <div>
          <p
            style={{
              color: cardStyles.textBody,
              lineHeight: '1.75rem'
            }}
          >
            {feature.description}
          </p>
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
        <div className="text-center mb-12">
          {/* Badge Text */}
          {badge_text && (
            <div style={{ marginBottom: '1rem' }}>
              <span
                style={{
                  color: cardStyles.iconColor,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.8
                }}
              >
                {badge_text}
              </span>
            </div>
          )}

          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem',
              textAlign: 'center'
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
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Features Grid */}
        {isSplitLayout(features.length) && layout.splitLayout ? (
          <>
            <div className={layout.splitLayout.firstRowGrid}>
              {features.slice(0, layout.splitLayout.firstRowCount).map((feature: Feature) =>
                renderFeatureCard(feature, layout.splitLayout!.firstRowCard)
              )}
            </div>
            <div className={layout.splitLayout.secondRowGrid}>
              {features.slice(layout.splitLayout.firstRowCount).map((feature: Feature) =>
                renderFeatureCard(feature, layout.splitLayout!.secondRowCard)
              )}
            </div>
          </>
        ) : (
          <div className={layout.gridClass}>
            {features.map((feature: Feature) => renderFeatureCard(feature, layout.cardClass))}
          </div>
        )}

        {/* Supporting Text */}
        {supporting_text && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <TextPublished
              value={supporting_text}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '42rem',
                margin: '0 auto',
                opacity: 0.9
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
