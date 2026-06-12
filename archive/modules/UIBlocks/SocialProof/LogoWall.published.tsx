/**
 * LogoWall - Published Version (V2 Tiered Hierarchy)
 * PRIMARY (logos) > SECONDARY (press) > TERTIARY (certs + stats)
 *
 * Server-safe component with ZERO hook imports
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { LogoPublished } from '@/components/published/LogoPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { Check } from 'lucide-react';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// V2 Type definitions
interface Company {
  id: string;
  name: string;
  logo_url: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
}

interface MediaMention {
  id: string;
  name: string;
  quote?: string;
}

interface Certification {
  id: string;
  code: string;
  label: string;
}

export default function LogoWallPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Trusted by Leading Companies Worldwide';
  const subheadline = props.subheadline || '';

  // Tier toggles
  const show_press = props.show_press !== false;
  const show_badges = props.show_badges !== false;

  // Collections with fallbacks
  const companies: Company[] = props.companies || [];
  const stats: Stat[] = props.stats || [];
  const media_mentions: MediaMention[] = props.media_mentions || [];
  const certifications: Certification[] = props.certifications || [];

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Theme detection
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Visibility
  const showSecondary = show_press && media_mentions.length > 0;
  const showTertiary = show_badges && (certifications.length > 0 || stats.length > 0);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '0.75rem'
            }}
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '32rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* PRIMARY: Logo Grid - Flexbox centered */}
        {companies.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {companies.map((company) => (
              <div
                key={company.id}
                className="w-32 h-20 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: cardStyles.bg,
                  borderColor: cardStyles.borderColor,
                  borderWidth: cardStyles.borderWidth,
                  borderStyle: cardStyles.borderStyle,
                  backdropFilter: cardStyles.backdropFilter,
                  WebkitBackdropFilter: cardStyles.backdropFilter,
                }}
              >
                <LogoPublished
                  logoUrl={company.logo_url}
                  companyName={company.name}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* SECONDARY: Press Mentions - Subtle Pills */}
        {showSecondary && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className="text-sm mr-2" style={{ color: cardStyles.textMuted }}>Featured in</span>
            {media_mentions.map((mention) => (
              <span
                key={mention.id}
                className="px-3 py-1 text-sm rounded-full"
                style={{ color: cardStyles.textBody, backgroundColor: cardStyles.bg }}
              >
                {mention.name}
              </span>
            ))}
          </div>
        )}

        {/* TERTIARY: Certs + Stats - Inline Row */}
        {showTertiary && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: cardStyles.textMuted }}>
            {/* Certifications */}
            {certifications.map((cert, idx) => (
              <React.Fragment key={cert.id}>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  {cert.label}
                </span>
                {(idx < certifications.length - 1 || stats.length > 0) && (
                  <span style={{ color: cardStyles.textMuted, opacity: 0.5 }}>•</span>
                )}
              </React.Fragment>
            ))}

            {/* Stats */}
            {stats.map((stat, idx) => (
              <React.Fragment key={stat.id}>
                <span>
                  <strong>{stat.value}</strong> {stat.label}
                </span>
                {idx < stats.length - 1 && (
                  <span style={{ color: cardStyles.textMuted, opacity: 0.5 }}>•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
