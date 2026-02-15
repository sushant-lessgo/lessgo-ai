/**
 * BeforeAfterQuote - Published Version (V2 Schema)
 *
 * Server-safe before/after transformation testimonials with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean transformation arrays instead of pipe-separated strings
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Transformation type
interface Transformation {
  id: string;
  before_situation: string;
  after_outcome: string;
  testimonial_quote: string;
  customer_name: string;
  customer_title: string;
  customer_company: string;
  before_icon: string;
  after_icon: string;
  avatar_url: string;
}

// Helper: Theme colors (server-safe inline styles) per uiBlockTheme.md
const getBeforeAfterColors = (theme: 'warm' | 'cool' | 'neutral' | undefined) => {
  const selectedTheme = theme || 'neutral';

  const themes = {
    warm: {
      before: {
        bg: '#fff7ed', // orange-50
        icon: '#ffedd5', // orange-100
        iconText: '#ea580c' // orange-600
      },
      after: {
        bg: '#fef3c7', // amber-50
        icon: '#ffedd5', // orange-100
        iconText: '#ea580c' // orange-600
      },
      avatar: '#ffedd5' // orange-100
    },
    cool: {
      before: {
        bg: '#eff6ff', // blue-50
        icon: '#dbeafe', // blue-100
        iconText: '#2563eb' // blue-600
      },
      after: {
        bg: '#ecfeff', // cyan-50
        icon: '#dbeafe', // blue-100
        iconText: '#2563eb' // blue-600
      },
      avatar: '#dbeafe' // blue-100
    },
    neutral: {
      before: {
        bg: '#f9fafb', // gray-50
        icon: '#f3f4f6', // gray-100
        iconText: '#4b5563' // gray-600
      },
      after: {
        bg: '#f8fafc', // slate-50
        icon: '#f3f4f6', // gray-100
        iconText: '#4b5563' // gray-600
      },
      avatar: '#f3f4f6' // gray-100
    }
  };

  return themes[selectedTheme];
};

export default function BeforeAfterQuotePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Real Customer Transformations';
  const subheadline = props.subheadline || '';
  const globalBeforeIcon = props.before_icon || 'XCircle';
  const globalAfterIcon = props.after_icon || 'CheckCircle';

  // V2: Direct array access for transformations
  const transformations: Transformation[] = (props as any).transformations || [];

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get text colors and typography
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Get theme colors
  const colors = getBeforeAfterColors(props.manualThemeOverride as 'warm' | 'cool' | 'neutral' | undefined);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Transformations Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {transformations.map((t: Transformation) => (
            <div
              key={t.id}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                borderColor: cardStyles.borderColor,
                boxShadow: cardStyles.boxShadow
              }}
            >
              {/* Before/After Comparison */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Before Section */}
                <div className="p-6" style={{ backgroundColor: colors.before.bg }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: colors.before.icon, color: colors.before.iconText }}
                    >
                      <span>{t.before_icon || globalBeforeIcon}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: cardStyles.textBody }}>BEFORE</span>
                  </div>
                  <p className="leading-relaxed text-sm" style={{ color: cardStyles.textHeading }}>{t.before_situation}</p>
                </div>

                {/* After Section */}
                <div className="p-6" style={{ backgroundColor: colors.after.bg }}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: colors.after.icon, color: colors.after.iconText }}
                    >
                      <span>{t.after_icon || globalAfterIcon}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: cardStyles.textBody }}>AFTER</span>
                  </div>
                  <p className="leading-relaxed text-sm" style={{ color: cardStyles.textHeading }}>{t.after_outcome}</p>
                </div>
              </div>

              {/* Testimonial Section */}
              <div className="p-6">
                <p className="italic mb-4 leading-relaxed" style={{ color: cardStyles.textBody }}>"{t.testimonial_quote}"</p>

                <div className="flex items-center space-x-3">
                  <div className="rounded-full p-0.5" style={{ backgroundColor: colors.avatar }}>
                    <AvatarPublished
                      name={t.customer_name}
                      imageUrl={t.avatar_url}
                      size={40}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: cardStyles.textHeading }}>{t.customer_name}</div>
                    <div className="text-sm" style={{ color: cardStyles.textBody }}>
                      {t.customer_title}
                      {t.customer_company && ` at ${t.customer_company}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </SectionWrapperPublished>
  );
}
