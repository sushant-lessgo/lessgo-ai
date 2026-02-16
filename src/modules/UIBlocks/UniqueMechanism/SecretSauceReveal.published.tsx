/**
 * SecretSauceReveal - Published Version (V2)
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
import { getDynamicCardLayout } from '@/utils/dynamicCardLayout';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// V2 Schema: Array-based secrets
interface SecretItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function SecretSauceRevealPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // V2: Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Our Secret Sauce Revealed';
  const subheadline = props.subheadline || '';

  // V2: Get secrets array directly (no pipe-string parsing)
  const secrets: SecretItem[] = props.secrets || [];

  // Theme detection (no useMemo - direct evaluation)
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme-specific accent bars (component-specific brand elements)
  const accentBars = {
    warm: 'linear-gradient(90deg, #fb923c 0%, #ef4444 100%)',
    cool: 'linear-gradient(90deg, #60a5fa 0%, #6366f1 100%)',
    neutral: 'linear-gradient(90deg, #c084fc 0%, #6366f1 100%)'
  };
  const accentBar = accentBars[uiTheme];

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Dynamic card layout based on count
  const layout = getDynamicCardLayout(secrets.length);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className={layout.containerClass}>
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: subheadline ? '1rem' : '0',
              fontWeight: '700'
            }}
            className="text-center"
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Secret Cards Grid */}
        <div className={layout.gridClass}>
          {secrets.map((secret: SecretItem) => {
            // V2: Get icon - use stored value or derive from title/description
            const displayIcon = secret.icon || inferIconFromText(secret.title, secret.description);

            return (
              <div key={secret.id} className="group relative">
                <div
                  className={`rounded-2xl text-center relative overflow-hidden h-full transition-all duration-300 hover:-translate-y-1 ${layout.cardClass}`}
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
                  {/* Accent Bar */}
                  <div
                    style={{ background: accentBar }}
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                  />

                  {/* Icon */}
                  <div className="relative z-10">
                    <div
                      style={{ backgroundColor: cardStyles.iconBg }}
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <IconPublished
                        icon={displayIcon}
                        color={cardStyles.iconColor}
                      />
                    </div>

                    {/* Title */}
                    <h3
                      style={{ color: cardStyles.textHeading }}
                      className="font-bold text-xl mb-3"
                    >
                      {secret.title}
                    </h3>

                    {/* Description */}
                    {secret.description && (
                      <TextPublished
                        value={secret.description}
                        style={{
                          color: cardStyles.textBody,
                          fontSize: '1rem',
                          lineHeight: '1.625'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
