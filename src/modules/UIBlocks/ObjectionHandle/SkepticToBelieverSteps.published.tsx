/**
 * SkepticToBelieverSteps - Published Version
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

// Step structure
interface ConversionStep {
  title: string;
  thought: string;
  description: string;
  icon: string;
}

// Parse conversion steps from props
const parseConversionSteps = (props: any): ConversionStep[] => {
  const steps: ConversionStep[] = [];

  // Process individual fields
  const individualSteps = [
    { name: props.step_name_1, quote: props.step_quote_1, result: props.step_result_1, icon: props.step_icon_1 },
    { name: props.step_name_2, quote: props.step_quote_2, result: props.step_result_2, icon: props.step_icon_2 },
    { name: props.step_name_3, quote: props.step_quote_3, result: props.step_result_3, icon: props.step_icon_3 },
    { name: props.step_name_4, quote: props.step_quote_4, result: props.step_result_4, icon: props.step_icon_4 },
    { name: props.step_name_5, quote: props.step_quote_5, result: props.step_result_5, icon: props.step_icon_5 }
  ];

  const defaultIcons = ['👩‍💼', '👨‍💻', '👩‍🚀', '👨‍💼', '👩‍🎓'];

  individualSteps.forEach((step, index) => {
    if (step.name && step.name.trim() && step.name !== '___REMOVED___' &&
        step.quote && step.quote.trim() && step.quote !== '___REMOVED___') {
      steps.push({
        title: step.name.trim(),
        thought: step.quote.trim().replace(/"/g, ''),
        description: step.result?.trim() || '',
        icon: step.icon || defaultIcons[index] || '👤'
      });
    }
  });

  return steps;
};

// Get theme colors based on theme prop
const getStepColors = (theme: 'warm' | 'cool' | 'neutral') => {
  const colorMap = {
    warm: {
      avatarBg: '#ffedd5', // orange-100
      avatarBorder: '#fdba74', // orange-300
      cardBorder: '#fed7aa', // orange-200
      quoteBg: '#fff7ed', // orange-50
      quoteBorder: '#fed7aa', // orange-200
      quoteText: '#7c2d12', // orange-900
      connectionLine: '#fed7aa', // orange-200
      summaryBg: '#fff7ed', // orange-50
      summaryText: '#7c2d12' // orange-900
    },
    cool: {
      avatarBg: '#dbeafe', // blue-100
      avatarBorder: '#93c5fd', // blue-300
      cardBorder: '#bfdbfe', // blue-200
      quoteBg: '#eff6ff', // blue-50
      quoteBorder: '#bfdbfe', // blue-200
      quoteText: '#1e3a8a', // blue-900
      connectionLine: '#bfdbfe', // blue-200
      summaryBg: '#eff6ff', // blue-50
      summaryText: '#1e3a8a' // blue-900
    },
    neutral: {
      avatarBg: '#f3f4f6', // gray-100
      avatarBorder: '#d1d5db', // gray-300
      cardBorder: '#e5e7eb', // gray-200
      quoteBg: '#f9fafb', // gray-50
      quoteBorder: '#e5e7eb', // gray-200
      quoteText: '#111827', // gray-900
      connectionLine: '#e5e7eb', // gray-200
      summaryBg: '#f9fafb', // gray-50
      summaryText: '#111827' // gray-900
    }
  };
  return colorMap[theme];
};

export default function SkepticToBelieverStepsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'From "This Won\'t Work" to "How Did We Live Without This?"';
  const subheadline = props.subheadline || '';
  const objections_summary = props.objections_summary || '';

  // Parse conversion steps
  const conversionSteps = parseConversionSteps(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getStepColors(uiBlockTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
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
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Customer Success Stories */}
        <div className="relative">
          {/* Connection Line */}
          <div
            className="absolute left-8 top-16 bottom-16 w-px rounded-full hidden lg:block"
            style={{
              backgroundColor: colors.connectionLine
            }}
          ></div>

          <div className="space-y-12">
            {conversionSteps.map((step: ConversionStep, index: number) => (
              <div key={index} className="relative">
                {/* Step Container */}
                <div className="flex items-start space-x-8">
                  {/* Profile Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg"
                      style={{
                        backgroundColor: colors.avatarBg,
                        borderColor: colors.avatarBorder
                      }}
                    >
                      <IconPublished icon={step.icon} size={32} />
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <div className="flex-1 pb-8 relative">
                    <div
                      className="bg-white border rounded-xl p-8 shadow-sm"
                      style={{
                        borderColor: colors.cardBorder
                      }}
                    >
                      {/* Customer Name/Title */}
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {step.title}
                      </h3>

                      {/* Quote */}
                      {step.thought && (
                        <div
                          className="border-l-4 p-4 mb-4"
                          style={{
                            backgroundColor: colors.quoteBg,
                            borderColor: colors.quoteBorder
                          }}
                        >
                          <p
                            className="italic text-lg font-medium"
                            style={{
                              color: colors.quoteText
                            }}
                          >
                            {step.thought}
                          </p>
                        </div>
                      )}

                      {/* Result/Outcome */}
                      <p className="text-gray-700 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Objections Summary */}
        {objections_summary && (
          <div className="mt-16 text-center">
            <div
              className="max-w-3xl mx-auto p-6"
              style={{
                backgroundColor: colors.summaryBg
              }}
            >
              <p
                className="text-2xl font-medium underline"
                style={{
                  color: colors.summaryText
                }}
              >
                {objections_summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
