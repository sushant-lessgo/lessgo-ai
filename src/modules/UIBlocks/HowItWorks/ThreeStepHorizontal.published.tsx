/**
 * ThreeStepHorizontal - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Step structure
interface StepItem {
  title: string;
  description: string;
  id: string;
}

// Parse step data from pipe-separated strings (server-safe, no hooks)
const parseStepData = (titles: string, descriptions: string): StepItem[] => {
  const titleList = titles.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const descriptionList = descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');

  return titleList.map((title: string, index: number) => ({
    id: `step-${index}`,
    title,
    description: descriptionList[index] || 'Step description not provided.'
  }));
};

// Helper function to get step icon from props
const getStepIcon = (index: number, props: LayoutComponentProps): string => {
  const iconFields = [
    props.step_icon_1,
    props.step_icon_2,
    props.step_icon_3,
    props.step_icon_4,
    props.step_icon_5,
    props.step_icon_6
  ];
  // Fallback to step-specific defaults
  return iconFields[index] || ['👤', '⚙️', '📊', '🎯', '✨', '🚀'][index] || '⭐';
};

// Theme color mapping (inline styles instead of Tailwind classes)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      stepCircleBg: '#ea580c',
      stepCircleShadow: 'rgba(251, 146, 60, 0.4)',
      stepCircleRing: '#ffedd5',
      stepIconGradient: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      iconShadow: 'rgba(254, 215, 170, 0.5)',
      connectorColor: '#fb923c',
      connectorLineColor: '#fed7aa',
      subtleBackgroundGradient: 'linear-gradient(to bottom, rgba(255, 237, 213, 0.3), transparent)'
    },
    cool: {
      stepCircleBg: '#2563eb',
      stepCircleShadow: 'rgba(96, 165, 250, 0.4)',
      stepCircleRing: '#dbeafe',
      stepIconGradient: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      iconShadow: 'rgba(191, 219, 254, 0.5)',
      connectorColor: '#60a5fa',
      connectorLineColor: '#bfdbfe',
      subtleBackgroundGradient: 'linear-gradient(to bottom, rgba(219, 234, 254, 0.3), transparent)'
    },
    neutral: {
      stepCircleBg: '#475569',
      stepCircleShadow: 'rgba(148, 163, 184, 0.4)',
      stepCircleRing: '#f1f5f9',
      stepIconGradient: 'linear-gradient(to bottom right, #64748b, #475569)',
      iconShadow: 'rgba(226, 232, 240, 0.5)',
      connectorColor: '#94a3b8',
      connectorLineColor: '#cbd5e1',
      subtleBackgroundGradient: 'linear-gradient(to bottom, rgba(241, 245, 249, 0.3), transparent)'
    }
  };
  return colorMap[theme];
};

// Individual Step Card (server-safe)
const StepCard = ({
  item,
  sectionId,
  index,
  isLast,
  icon,
  themeColors,
  textColors,
  theme
}: {
  item: StepItem;
  sectionId: string;
  index: number;
  isLast: boolean;
  icon: string;
  themeColors: ReturnType<typeof getThemeColors>;
  textColors: { heading: string; body: string; muted: string };
  theme: any;
}) => {
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <div className="relative flex-1">
      {/* Container with gradient background */}
      <div
        className="relative p-6 rounded-xl text-center"
        style={{
          background: themeColors.subtleBackgroundGradient
        }}
      >
        {/* Step Number Circle with ring and shadow */}
        <div className="relative mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto shadow-lg"
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

          {/* Step Icon with gradient background and colored shadow */}
          <div className="mt-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mx-auto"
              style={{
                background: themeColors.stepIconGradient,
                boxShadow: `0 10px 15px -3px ${themeColors.iconShadow}`
              }}
            >
              <IconPublished
                icon={icon}
                size={32}
                color="#ffffff"
                className="text-2xl"
              />
            </div>
          </div>
        </div>

        {/* Step Title */}
        <div className="mb-4">
          <h3
            style={{
              color: textColors.heading,
              ...h3Typography,
              fontWeight: 600
            }}
          >
            {item.title}
          </h3>
        </div>

        {/* Step Description */}
        <p
          style={{
            color: textColors.muted,
            ...bodyTypography,
            lineHeight: '1.75rem'
          }}
        >
          {item.description}
        </p>
      </div>

      {/* Desktop Connecting Arrow - hidden on mobile, visible on lg+ screens */}
      {!isLast && (
        <div className="hidden lg:block absolute top-20 -right-8 w-16 h-8 flex items-center justify-center">
          <svg
            className="w-8 h-8 drop-shadow-md"
            fill="none"
            stroke={themeColors.connectorColor}
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}

      {/* Mobile Connecting Line - visible on mobile, hidden on lg+ screens */}
      {!isLast && (
        <div className="lg:hidden flex justify-center mt-8 mb-8">
          <div
            className="w-1 h-12 rounded-full"
            style={{
              backgroundColor: themeColors.connectorLineColor
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function ThreeStepHorizontalPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'How It Works';
  const subheadline = props.subheadline || '';
  const step_titles = props.step_titles || 'Sign Up & Connect|Customize Your Setup|Get Results';
  const step_descriptions = props.step_descriptions || 'Create your account and connect your existing tools in just a few clicks.|Tailor the platform to your specific needs with our intuitive configuration wizard.|Watch as your automated workflows start delivering results immediately.';
  const conclusion_text = props.conclusion_text || '';

  // Parse step data
  const stepItems = parseStepData(step_titles, step_descriptions);

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const themeColors = getThemeColors(uiTheme);

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

        {/* Steps Container - Responsive: vertical on mobile, horizontal on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-12 lg:space-y-0 lg:space-x-8 relative">
          {stepItems.map((item: StepItem, index: number) => (
            <StepCard
              key={item.id}
              item={item}
              sectionId={sectionId}
              index={index}
              isLast={index === stepItems.length - 1}
              icon={getStepIcon(index, props)}
              themeColors={themeColors}
              textColors={textColors}
              theme={theme}
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
