/**
 * ThreeStepHorizontal - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { getPublishedCardStyles, PublishedCardStyles } from '@/lib/publishedTextColors';

// Step structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// Default steps for fallback
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'Sign Up & Connect', description: 'Create your account and connect your existing tools in just a few clicks.' },
  { id: 's2', title: 'Customize Your Setup', description: 'Tailor the platform to your specific needs with our intuitive configuration wizard.' },
  { id: 's3', title: 'Get Results', description: 'Watch as your automated workflows start delivering results immediately.' }
];

// Theme color mapping (inline styles instead of Tailwind classes)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      stepCircleBg: '#ea580c',
      stepCircleShadow: 'rgba(251, 146, 60, 0.4)',
      stepCircleRing: '#ffedd5',
      connectorColor: '#fb923c',
      connectorLineColor: '#fed7aa',
      cardBg: '#fff7ed', // orange-50
      cardBorder: '#fed7aa'
    },
    cool: {
      stepCircleBg: '#2563eb',
      stepCircleShadow: 'rgba(96, 165, 250, 0.4)',
      stepCircleRing: '#dbeafe',
      connectorColor: '#60a5fa',
      connectorLineColor: '#bfdbfe',
      cardBg: '#eff6ff', // blue-50
      cardBorder: '#bfdbfe'
    },
    neutral: {
      stepCircleBg: '#475569',
      stepCircleShadow: 'rgba(148, 163, 184, 0.4)',
      stepCircleRing: '#f1f5f9',
      connectorColor: '#94a3b8',
      connectorLineColor: '#cbd5e1',
      cardBg: '#f8fafc', // slate-50
      cardBorder: '#e2e8f0'
    }
  };
  return colorMap[theme];
};

// Individual Step Card (server-safe)
const StepCard = ({
  step,
  index,
  isLast,
  themeColors,
  textColors,
  theme,
  cardStyles
}: {
  step: StepItem;
  index: number;
  isLast: boolean;
  themeColors: ReturnType<typeof getThemeColors>;
  textColors: { heading: string; body: string; muted: string };
  theme: any;
  cardStyles: PublishedCardStyles;
}) => {
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <div className="relative flex-1 flex flex-col transition-all duration-300 hover:-translate-y-1">
      {/* Card with adaptive background and border */}
      <div
        className="relative p-6 rounded-xl flex-1"
        style={{
          backgroundColor: cardStyles.bg,
          backdropFilter: cardStyles.backdropFilter,
          WebkitBackdropFilter: cardStyles.backdropFilter,
          borderWidth: cardStyles.borderWidth,
          borderStyle: cardStyles.borderStyle,
          borderColor: cardStyles.borderColor,
          boxShadow: cardStyles.boxShadow
        }}
      >
        {/* Step Number Circle - Larger (64px) with ring and shadow */}
        <div className="relative mb-6 flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{
              backgroundColor: themeColors.stepCircleBg,
              boxShadow: `0 10px 15px -3px ${themeColors.stepCircleShadow}`,
              borderColor: themeColors.stepCircleRing,
              borderWidth: '4px',
              borderStyle: 'solid'
            }}
          >
            {index + 1}
          </div>
        </div>

        {/* Step Title - Centered */}
        <div className="mb-4 text-center">
          <h3
            style={{
              color: cardStyles.textHeading,
              ...h3Typography,
              fontWeight: 600
            }}
          >
            {step.title}
          </h3>
        </div>

        {/* Step Description - Left aligned for readability */}
        <p
          style={{
            color: cardStyles.textBody,
            ...bodyTypography,
            lineHeight: '1.75rem',
            textAlign: 'left'
          }}
        >
          {step.description}
        </p>
      </div>

    </div>
  );
};

export default function ThreeStepHorizontalPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'How It Works';
  const subheadline = props.subheadline || '';
  const conclusion_text = props.conclusion_text || '';

  // Get steps array (V2 format)
  const steps: StepItem[] = Array.isArray(props.steps) && props.steps.length > 0
    ? props.steps
    : DEFAULT_STEPS;

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors (for step circles and accents)
  const themeColors = getThemeColors(uiTheme);

  // Adaptive card styles based on section background luminance
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const subheadlineTypography = getPublishedTypographyStyles('body-lg', theme);
  const conclusionTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...subheadlineTypography,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Steps Container - Horizontal layout */}
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 relative">
          {steps.map((step: StepItem, index: number) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
              themeColors={themeColors}
              textColors={textColors}
              theme={theme}
              cardStyles={cardStyles}
            />
          ))}
        </div>

        {/* Optional Conclusion Text */}
        {conclusion_text && conclusion_text.trim() !== '' && (
          <div className="mt-16 text-center">
            <TextPublished
              value={conclusion_text}
              style={{
                color: textColors.muted,
                ...conclusionTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
