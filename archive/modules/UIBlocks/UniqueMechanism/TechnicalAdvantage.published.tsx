/**
 * TechnicalAdvantage - Published Version (V2: Array-based)
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
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// V2: Advantage item structure
interface Advantage {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function TechnicalAdvantagePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Technical Advantages That Set Us Apart';
  const subheadline = props.subheadline || '';

  // V2: Direct array access (no more pipe parsing)
  const advantages: Advantage[] = props.advantages || [];

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme-based icon gradients (component-specific brand element)
  const iconGradients = {
    warm: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    cool: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
    neutral: 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)',
  };
  const iconGradient = iconGradients[uiTheme];

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);

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
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Advantage Cards Grid */}
        {(() => {
          const layout = getDynamicCardLayout(advantages.length);
          const renderCard = (advantage: Advantage, cardClass: string) => {
            const displayIcon = advantage.icon || inferIconFromText(advantage.title, advantage.description);
            return (
              <div
                key={advantage.id}
                className={`rounded-xl transition-all duration-300 hover:-translate-y-1 h-full ${cardClass}`}
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
                <div className="flex items-start space-x-4">
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center shadow-md"
                    style={{ background: iconGradient }}
                  >
                    <IconPublished icon={displayIcon} size={32} className="text-2xl text-white" />
                  </div>
                  <div className="flex-1">
                    <TextPublished
                      value={advantage.title}
                      style={{ fontWeight: 700, fontSize: '1.125rem', color: cardStyles.textHeading, marginBottom: '0.5rem' }}
                    />
                    {advantage.description && (
                      <TextPublished
                        value={advantage.description}
                        style={{ color: cardStyles.textBody, fontSize: '0.875rem', lineHeight: '1.25rem' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          };
          return isSplitLayout(advantages.length) && layout.splitLayout ? (
            <div className={layout.containerClass}>
              <div className={layout.splitLayout.firstRowGrid}>
                {advantages.slice(0, layout.splitLayout.firstRowCount).map((advantage: Advantage) =>
                  renderCard(advantage, layout.splitLayout!.firstRowCard)
                )}
              </div>
              <div className={layout.splitLayout.secondRowGrid}>
                {advantages.slice(layout.splitLayout.firstRowCount).map((advantage: Advantage) =>
                  renderCard(advantage, layout.splitLayout!.secondRowCard)
                )}
              </div>
            </div>
          ) : (
            <div className={layout.containerClass}>
              <div className={layout.gridClass}>
                {advantages.map((advantage: Advantage) => renderCard(advantage, layout.cardClass))}
              </div>
            </div>
          );
        })()}
      </div>
    </SectionWrapperPublished>
  );
}
