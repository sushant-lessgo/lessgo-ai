/**
 * SplitCard - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Features:
 * - Premium before/after card comparison
 * - After card uses theme accent color
 * - Optional summary text below cards
 * - Upgrade indicators (mobile + desktop)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Premium Card Component (server-safe)
function PremiumCardPublished({
  type,
  label,
  description,
  visual,
  placeholderIcon,
  themeColors,
  textColors,
  bodyTypography,
  accentColor,
  paletteMode,
  paletteTemperature,
  cardStyles
}: {
  type: 'before' | 'after';
  label: string;
  description: string;
  visual?: string;
  placeholderIcon: string;
  themeColors: {
    beforeBorder: string;
    beforeLabel: string;
    beforePlaceholderBg: string;
    beforePlaceholderIcon: string;
    afterPlaceholderBg: string;
    afterPlaceholderIcon: string;
  };
  textColors: { heading: string; body: string; muted: string };
  bodyTypography: React.CSSProperties;
  accentColor: string;
  paletteMode?: 'dark' | 'light';
  paletteTemperature?: 'cool' | 'neutral' | 'warm';
  cardStyles: ReturnType<typeof getPublishedCardStyles>;
}) {

  // Visual Placeholder Component
  const VisualPlaceholderPublished = () => (
    <div
      className="relative w-full h-64 rounded-t-xl overflow-hidden"
      style={{
        background: type === 'before'
          ? themeColors.beforePlaceholderBg
          : themeColors.afterPlaceholderBg
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: type === 'before'
              ? themeColors.beforePlaceholderIcon
              : themeColors.afterPlaceholderIcon
          }}
        >
          <IconPublished
            icon={placeholderIcon}
            size={48}
            className="text-4xl"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`group relative rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        type === 'after' ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: cardStyles.bg,
        backdropFilter: cardStyles.backdropFilter,
        borderColor: type === 'before' ? themeColors.beforeBorder : `${accentColor}40`,
        borderWidth: cardStyles.borderWidth,
        borderStyle: cardStyles.borderStyle,
        boxShadow: type === 'after' ? `0 0 0 2px ${accentColor}20` : cardStyles.boxShadow
      }}
    >

      {/* Visual or Placeholder */}
      <div className="overflow-hidden rounded-t-xl">
        {visual && visual !== '' ? (
          <ImagePublished
            src={visual}
            alt={type === 'before' ? 'Current challenge visualization' : 'Premium solution result'}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            paletteMode={paletteMode}
            paletteTemperature={paletteTemperature}
          />
        ) : (
          <VisualPlaceholderPublished />
        )}
      </div>

      {/* Card Content */}
      <div className="p-8">
        {/* Label */}
        <div className="flex items-center mb-4">
          <TextPublished
            value={label}
            element="span"
            style={{
              ...bodyTypography,
              color: type === 'before' ? themeColors.beforeLabel : accentColor
            }}
          />
        </div>

        {/* Description */}
        <TextPublished
          value={description}
          element="p"
          style={{
            color: cardStyles.textBody,
            lineHeight: '1.75rem'
          }}
        />
      </div>
    </div>
  );
}

export default function SplitCardPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Premium Transformation Experience';
  const subheadline = props.subheadline || '';
  const before_label = props.before_label || 'Current Challenge';
  const after_label = props.after_label || 'Premium Solution';
  const before_description = props.before_description || 'Complex manual processes requiring expertise, time, and significant resources to execute properly.';
  const after_description = props.after_description || 'Expertly crafted automation that delivers exceptional results with minimal effort and maximum efficiency.';
  const before_visual = props.before_visual || '';
  const after_visual = props.after_visual || '';
  const summary_text = (props as any).summary_text || '';
  const upgrade_text = props.upgrade_text || 'Upgrade';

  // Extract icons
  const before_icon = props.before_icon || 'AlertTriangle';
  const after_icon = props.after_icon || 'Star';
  const upgrade_icon = props.upgrade_icon || 'ArrowRight';

  // Detect UIBlock theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get accent color from theme
  const accentColor = theme?.colors?.accentColor || '#3b82f6';

  // Get adaptive card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme colors (Before uses theme, After uses accent)
  const getCardColors = (themeType: UIBlockTheme) => ({
    warm: {
      beforeBorder: '#fed7aa',
      beforeLabel: '#c2410c',
      beforePlaceholderBg: 'linear-gradient(to bottom right, #ffedd5, #fed7aa)',
      beforePlaceholderIcon: '#fdba74',
      afterPlaceholderBg: `linear-gradient(to bottom right, ${accentColor}10, ${accentColor}20)`,
      afterPlaceholderIcon: `${accentColor}40`
    },
    cool: {
      beforeBorder: '#bfdbfe',
      beforeLabel: '#1e40af',
      beforePlaceholderBg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
      beforePlaceholderIcon: '#93c5fd',
      afterPlaceholderBg: `linear-gradient(to bottom right, ${accentColor}10, ${accentColor}20)`,
      afterPlaceholderIcon: `${accentColor}40`
    },
    neutral: {
      beforeBorder: '#e5e7eb',
      beforeLabel: '#374151',
      beforePlaceholderBg: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
      beforePlaceholderIcon: '#d1d5db',
      afterPlaceholderBg: `linear-gradient(to bottom right, ${accentColor}10, ${accentColor}20)`,
      afterPlaceholderIcon: `${accentColor}40`
    }
  }[themeType]);

  const themeColors = getCardColors(uiTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

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
              element="p"
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Side by Side Cards */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Before Card with Mobile Upgrade Indicator */}
          <div className="space-y-6">
            <PremiumCardPublished
              type="before"
              label={before_label}
              description={before_description}
              visual={before_visual}
              placeholderIcon={before_icon}
              themeColors={themeColors}
              textColors={textColors}
              bodyTypography={bodyTypography}
              accentColor={accentColor}
              paletteMode={theme?.colors?.paletteMode}
              paletteTemperature={theme?.colors?.paletteTemperature}
              cardStyles={cardStyles}
            />

            {/* Upgrade Indicator (Mobile) */}
            <div className="text-center lg:hidden">
              <div className="inline-flex items-center space-x-2 rounded-full px-6 py-3" style={{ backgroundColor: cardStyles.bg, backdropFilter: cardStyles.backdropFilter, boxShadow: cardStyles.boxShadow }}>
                <IconPublished
                  icon={upgrade_icon}
                  size={16}
                  color={cardStyles.textMuted}
                />
                <TextPublished
                  value={upgrade_text}
                  element="span"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: textColors.muted
                  }}
                />
              </div>
            </div>
          </div>

          {/* After Card with Desktop Upgrade Indicator */}
          <div className="relative">
            {/* Upgrade Indicator (Desktop) */}
            <div className="hidden lg:block absolute -left-8 top-1/2 transform -translate-y-1/2">
              <div className="flex flex-col items-center space-y-2 rounded-full px-4 py-6" style={{ backgroundColor: cardStyles.bg, backdropFilter: cardStyles.backdropFilter, boxShadow: cardStyles.boxShadow }}>
                <IconPublished
                  icon={upgrade_icon}
                  size={24}
                  color={cardStyles.textMuted}
                />
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted, writingMode: 'vertical-rl' }}
                >
                  {upgrade_text}
                </div>
              </div>
            </div>

            <PremiumCardPublished
              type="after"
              label={after_label}
              description={after_description}
              visual={after_visual}
              placeholderIcon={after_icon}
              themeColors={themeColors}
              textColors={textColors}
              bodyTypography={bodyTypography}
              accentColor={accentColor}
              paletteMode={theme?.colors?.paletteMode}
              paletteTemperature={theme?.colors?.paletteTemperature}
              cardStyles={cardStyles}
            />
          </div>
        </div>

        {/* Summary Text - Optional transition copy below cards */}
        {summary_text && (
          <div className="text-center mt-12">
            <TextPublished
              value={summary_text}
              element="p"
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
