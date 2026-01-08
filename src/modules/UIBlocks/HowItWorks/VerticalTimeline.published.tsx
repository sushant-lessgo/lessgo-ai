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
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Step structure
interface Step {
  title: string;
  description: string;
  duration: string;
  icon?: string;
}

export default function VerticalTimelinePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'How Our Process Works';
  const subheadline = props.subheadline || '';
  const step_titles = props.step_titles || 'Initial Setup|Data Import|Automation Rules|Go Live';
  const step_descriptions = props.step_descriptions || '';
  const step_durations = props.step_durations || '5 minutes|10 minutes|15 minutes|Instant';
  const supporting_text = props.supporting_text || '';
  const process_summary_text = props.process_summary_text || 'Our streamlined process gets you results faster than you thought possible';
  const use_step_icons = props.use_step_icons || false;

  // Parse steps
  const titleList = step_titles.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const descriptionList = step_descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const durationList = step_durations.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');

  const steps: Step[] = titleList.map((title: string, index: number) => ({
    title,
    description: descriptionList[index] || '',
    duration: durationList[index] || '',
    icon: use_step_icons ? (props[`step_icon_${index + 1}` as keyof typeof props] as string) : undefined
  }));

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
        <div className="space-y-0">
          {steps.map((step: Step, index: number) => {
            const isLast = index === steps.length - 1;
            const stepGradient = themeColors.stepGradients[index % themeColors.stepGradients.length];

            return (
              <div key={`step-${index}`} className="relative flex items-start">
                {/* Timeline Line */}
                {!isLast && (
                  <div
                    className="absolute left-6 top-16 bottom-0 w-0.5"
                    style={{
                      background: themeColors.timelineLine
                    }}
                  />
                )}

                {/* Step Content */}
                <div className="flex items-start space-x-6 w-full">
                  {/* Step Number/Icon */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10 relative"
                      style={{
                        background: stepGradient
                      }}
                    >
                      {use_step_icons && step.icon ? (
                        <IconPublished
                          icon={step.icon}
                          size={20}
                          color="#ffffff"
                          className="text-xl"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      )}
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
                            color: '#111827',
                            flex: 1
                          }}
                        >
                          {step.title}
                        </h3>

                        {/* Duration */}
                        {step.duration && (
                          <span
                            className="text-sm font-medium px-3 py-1 rounded-full ml-4 flex-shrink-0"
                            style={{
                              backgroundColor: themeColors.durationBg,
                              color: themeColors.durationText
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
                            color: '#4b5563',
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
                color: '#111827',
                textDecoration: 'underline'
              }}
            />
          </div>
        </div>

        {/* Supporting Text */}
        {supporting_text && (
          <div className="text-center mt-16">
            <TextPublished
              value={supporting_text}
              style={{
                color: textColors.body,
                ...bodyTypography,
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
