/**
 * IconCircleSteps - Published Version
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
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Parse step data from pipe-separated strings
const parseStepData = (titles: string, descriptions: string) => {
  const titleList = titles.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const descriptionList = descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');

  return titleList.map((title: string, index: number) => ({
    title,
    description: descriptionList[index] || '',
    id: `step-${index}`
  }));
};

// Get step icon from props
const getStepIcon = (index: number, props: LayoutComponentProps): string => {
  const iconFields = [
    props.step_icon_1,
    props.step_icon_2,
    props.step_icon_3,
    props.step_icon_4,
    props.step_icon_5,
    props.step_icon_6
  ];
  const defaultIcons = ['👤', '🔗', '🚀', '✅', '⚙️', '⭐'];
  return iconFields[index] || defaultIcons[index] || '⭐';
};

// Theme color mapping (inline styles instead of Tailwind classes)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      stepGradients: [
        'linear-gradient(to bottom right, #f97316, #ea580c)',
        'linear-gradient(to bottom right, #f59e0b, #d97706)',
        'linear-gradient(to bottom right, #ef4444, #dc2626)',
        'linear-gradient(to bottom right, #ea580c, #c2410c)',
        'linear-gradient(to bottom right, #f43f5e, #be123c)',
        'linear-gradient(to bottom right, #d97706, #a16207)'
      ],
      cardBg: 'linear-gradient(to right, #fff7ed, #fffbeb, #fef2f2)',
      cardBorder: '#fed7aa',
      stat1Color: '#ea580c',
      stat2Color: '#d97706',
      stat3Color: '#dc2626',
      flowDotBg: '#ea580c'
    },
    cool: {
      stepGradients: [
        'linear-gradient(to bottom right, #3b82f6, #2563eb)',
        'linear-gradient(to bottom right, #06b6d4, #0891b2)',
        'linear-gradient(to bottom right, #6366f1, #4f46e5)',
        'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
        'linear-gradient(to bottom right, #0ea5e9, #0284c7)',
        'linear-gradient(to bottom right, #4f46e5, #4338ca)'
      ],
      cardBg: 'linear-gradient(to right, #eff6ff, #ecfeff, #eef2ff)',
      cardBorder: '#bfdbfe',
      stat1Color: '#2563eb',
      stat2Color: '#0891b2',
      stat3Color: '#4f46e5',
      flowDotBg: '#2563eb'
    },
    neutral: {
      stepGradients: [
        'linear-gradient(to bottom right, #64748b, #475569)',
        'linear-gradient(to bottom right, #6b7280, #4b5563)',
        'linear-gradient(to bottom right, #71717a, #52525b)',
        'linear-gradient(to bottom right, #475569, #334155)',
        'linear-gradient(to bottom right, #78716c, #57534e)',
        'linear-gradient(to bottom right, #4b5563, #374151)'
      ],
      cardBg: 'linear-gradient(to right, #f8fafc, #f9fafb, #fafafa)',
      cardBorder: '#e2e8f0',
      stat1Color: '#475569',
      stat2Color: '#4b5563',
      stat3Color: '#52525b',
      flowDotBg: '#475569'
    }
  };
  return colorMap[theme];
};

// Individual Circle Step (server-safe)
const CircleStep = ({
  title,
  description,
  index,
  icon,
  themeColors,
  textColors,
  theme
}: {
  title: string;
  description: string;
  index: number;
  icon: string;
  themeColors: ReturnType<typeof getThemeColors>;
  textColors: { heading: string; body: string; muted: string };
  theme: any;
}) => {
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  const gradientColor = themeColors.stepGradients[index % themeColors.stepGradients.length];

  return (
    <div className="text-center">
      {/* Circle Icon */}
      <div className="relative mb-6">
        <div
          className="w-24 h-24 mx-auto rounded-full shadow-xl flex items-center justify-center"
          style={{
            background: gradientColor
          }}
        >
          <IconPublished
            icon={icon}
            size={48}
            color="#ffffff"
            className="text-3xl"
          />
        </div>

        {/* Step Number Badge */}
        <div
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
          style={{
            border: '4px solid #f3f4f6'
          }}
        >
          <span className="text-gray-700 font-bold text-sm">{index + 1}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Step Title */}
        <h3
          style={{
            color: textColors.heading,
            ...h3Typography,
            fontSize: '1.25rem',
            fontWeight: 700
          }}
        >
          {title}
        </h3>

        {/* Step Description */}
        <p
          style={{
            color: textColors.muted,
            ...bodyTypography,
            lineHeight: '1.75rem'
          }}
        >
          {description}
        </p>

        {/* Decorative Bar */}
        <div className="flex justify-center">
          <div
            className="w-12 h-1 rounded-full"
            style={{
              background: gradientColor,
              opacity: 0.6
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function IconCircleStepsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'Getting Started is Simple';
  const subheadline = props.subheadline || '';
  const step_titles = props.step_titles || 'Sign Up|Connect|Launch';
  const step_descriptions = props.step_descriptions || 'Create your free account in seconds with just your email address.|Connect your existing tools and data sources with one-click integrations.|Launch your optimized workflows and start seeing results immediately.';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // Summary card fields
  const show_summary_card = props.show_summary_card !== false;
  const summary_card_heading = props.summary_card_heading || '';
  const summary_card_description = props.summary_card_description || '';
  const summary_stat_1_text = props.summary_stat_1_text || '';
  const summary_stat_2_text = props.summary_stat_2_text || '';
  const summary_stat_3_text = props.summary_stat_3_text || '';

  // Parse step data
  const steps = parseStepData(step_titles, step_descriptions);

  // Parse trust items
  const trustItemsList = trust_items
    ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean)
    : [];

  // Detect theme
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
  const bodyTypography = getPublishedTypographyStyles('body', theme);

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
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                margin: '0 auto 1.5rem'
              }}
            />
          )}
        </div>

        {/* Steps Grid */}
        <div className={`grid ${steps.length === 3 ? 'md:grid-cols-3' : steps.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-12 mb-16`}>
          {steps.map((step: { title: string; description: string; id: string }, index: number) => (
            <CircleStep
              key={step.id}
              title={step.title}
              description={step.description}
              index={index}
              icon={getStepIcon(index, props)}
              themeColors={themeColors}
              textColors={textColors}
              theme={theme}
            />
          ))}
        </div>

        {/* Process Flow Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          {steps.map((_: { title: string; description: string; id: string }, index: number) => (
            <React.Fragment key={index}>
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: themeColors.flowDotBg
                }}
              />
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-300 max-w-16" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Summary Card */}
        {show_summary_card && (summary_card_heading || summary_card_description || summary_stat_1_text || summary_stat_2_text || summary_stat_3_text) && (
          <div
            className="rounded-2xl p-8 mb-12"
            style={{
              background: themeColors.cardBg,
              border: `1px solid ${themeColors.cardBorder}`
            }}
          >
            <div className="text-center">
              {/* Stats Row */}
              {(summary_stat_1_text || summary_stat_2_text || summary_stat_3_text) && (
                <div className="flex justify-center items-center space-x-6 mb-4">
                  {summary_stat_1_text && summary_stat_1_text !== '___REMOVED___' && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke={themeColors.stat1Color}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span
                        style={{
                          color: '#374151',
                          fontWeight: 500
                        }}
                      >
                        {summary_stat_1_text}
                      </span>
                    </div>
                  )}

                  {summary_stat_1_text && summary_stat_1_text !== '___REMOVED___' &&
                   summary_stat_2_text && summary_stat_2_text !== '___REMOVED___' && (
                    <div className="w-px h-6 bg-gray-300" />
                  )}

                  {summary_stat_2_text && summary_stat_2_text !== '___REMOVED___' && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke={themeColors.stat2Color}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span
                        style={{
                          color: '#374151',
                          fontWeight: 500
                        }}
                      >
                        {summary_stat_2_text}
                      </span>
                    </div>
                  )}

                  {summary_stat_2_text && summary_stat_2_text !== '___REMOVED___' &&
                   summary_stat_3_text && summary_stat_3_text !== '___REMOVED___' && (
                    <div className="w-px h-6 bg-gray-300" />
                  )}

                  {summary_stat_3_text && summary_stat_3_text !== '___REMOVED___' && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke={themeColors.stat3Color}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span
                        style={{
                          color: '#374151',
                          fontWeight: 500
                        }}
                      >
                        {summary_stat_3_text}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Heading */}
              {summary_card_heading && summary_card_heading !== '___REMOVED___' && (
                <TextPublished
                  value={summary_card_heading}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}
                />
              )}

              {/* Summary Description */}
              {summary_card_description && summary_card_description !== '___REMOVED___' && (
                <TextPublished
                  value={summary_card_description}
                  style={{
                    color: textColors.muted,
                    ...bodyTypography,
                    maxWidth: '42rem',
                    margin: '0 auto'
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Supporting Text + CTA */}
        {(supporting_text || cta_text || trustItemsList.length > 0) && (
          <div className="text-center space-y-6">
            {supporting_text && supporting_text.trim() !== '' && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            {(cta_text || trustItemsList.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {cta_text && cta_text.trim() !== '' && (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={theme?.colors?.accentColor || '#3b82f6'}
                    textColor="#ffffff"
                    className="shadow-xl"
                  />
                )}

                {trustItemsList.length > 0 && (
                  <div className="flex items-center space-x-4">
                    {trustItemsList.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span
                          style={{
                            color: textColors.muted,
                            fontSize: '0.875rem'
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
