/**
 * VerticalTimeline - Published Version
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

// Step structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon?: string;
}

// Default steps for fallback
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'Create Your Account', description: 'Sign up with your email in under a minute.', duration: '1 min' },
  { id: 's2', title: 'Connect Your Tools', description: 'Link your existing apps with our integrations.', duration: '5 min' },
  { id: 's3', title: 'Configure Workflows', description: 'Set up automated workflows using our visual builder.', duration: '10 min' },
  { id: 's4', title: 'Go Live', description: 'Launch your workflows and start seeing results.', duration: 'Instant' },
];

export default function VerticalTimelinePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'How It Works';
  const subheadline = props.subheadline || '';
  const process_summary_text = props.process_summary_text || '';

  // Get steps array directly (V2 format)
  const steps: StepItem[] = Array.isArray(props.steps) && props.steps.length > 0
    ? props.steps
    : DEFAULT_STEPS;

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors - inline style values
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        stepGradients: [
          'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
          'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
          'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
        ],
        timelineLine: 'linear-gradient(to bottom, #fdba74, #fed7aa)',
        cardBorder: '#fed7aa',
        cardBg: '#ffffff',
        durationBg: '#ffedd5',
        durationText: '#c2410c',
        processSummaryBg: 'linear-gradient(to right, #fff7ed, #fffbeb, #fef2f2)',
        processSummaryBorder: '#fed7aa'
      },
      cool: {
        stepGradients: [
          'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
          'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
        ],
        timelineLine: 'linear-gradient(to bottom, #93c5fd, #bfdbfe)',
        cardBorder: '#bfdbfe',
        cardBg: '#ffffff',
        durationBg: '#dbeafe',
        durationText: '#1d4ed8',
        processSummaryBg: 'linear-gradient(to right, #eff6ff, #eef2ff, #f5f3ff)',
        processSummaryBorder: '#bfdbfe'
      },
      neutral: {
        stepGradients: [
          'linear-gradient(135deg, #64748B 0%, #475569 100%)',
          'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          'linear-gradient(135deg, #71717A 0%, #52525B 100%)',
          'linear-gradient(135deg, #78716C 0%, #57534E 100%)',
          'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
          'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
        ],
        timelineLine: 'linear-gradient(to bottom, #d1d5db, #e5e7eb)',
        cardBorder: '#f3f4f6',
        cardBg: '#ffffff',
        durationBg: '#f3f4f6',
        durationText: '#374151',
        processSummaryBg: 'linear-gradient(to right, #f8fafc, #f9fafb, #fafafa)',
        processSummaryBorder: '#e5e7eb'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto mt-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                marginTop: '1.5rem',
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Timeline Steps */}
        <div className="space-y-0 relative">
          {/* Continuous Timeline Line - runs behind all step circles */}
          {steps.length > 1 && (
            <div
              className="absolute left-6 top-6 w-0.5 -translate-x-1/2"
              style={{
                height: `calc(100% - 3rem)`,
                background: themeColors.timelineLine
              }}
            />
          )}
          {steps.map((step: StepItem, index: number) => {
            const isLast = index === steps.length - 1;
            const stepGradient = themeColors.stepGradients[index % themeColors.stepGradients.length];

            return (
              <div key={step.id} className="relative flex items-start">
                {/* Step Content */}
                <div className="flex items-start space-x-6 w-full">
                  {/* Step Number */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10 relative"
                      style={{
                        background: stepGradient
                      }}
                    >
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    {!isLast && (
                      <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="flex-1 pb-6">
                    <div
                      className="rounded-xl px-6 py-4 shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: themeColors.cardBg,
                        border: `1px solid ${themeColors.cardBorder}`
                      }}
                    >
                      <div className="flex items-start justify-between">
                        {/* Step Title */}
                        <h3
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: textColors.heading,
                            flex: 1
                          }}
                        >
                          {step.title}
                        </h3>

                        {/* Duration */}
                        {step.duration && (
                          <span
                            className="text-sm font-semibold px-3 py-1 rounded-full ml-4 flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: themeColors.durationBg,
                              color: themeColors.durationText,
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}
                          >
                            {step.duration}
                          </span>
                        )}
                      </div>

                      {/* Step Description */}
                      {step.description && (
                        <p
                          style={{
                            color: textColors.body,
                            lineHeight: '1.75rem',
                            marginTop: '0.5rem'
                          }}
                        >
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process Summary */}
        {process_summary_text && (
          <div
            className="mt-6 rounded-2xl px-8 py-2"
            style={{
              background: themeColors.processSummaryBg,
              border: `1px solid ${themeColors.processSummaryBorder}`
            }}
          >
            <div className="text-center">
              <TextPublished
                value={process_summary_text}
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: textColors.heading,
                  textDecoration: 'underline'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
