/**
 * AlgorithmExplainer - Published Version
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

// Step item structure
interface StepItem {
  step: string;
  description: string;
}

export default function AlgorithmExplainerPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Our Proprietary Algorithm';
  const algorithm_name = props.algorithm_name || 'SmartOptimize AI™';
  const algorithm_description = props.algorithm_description || '';
  const algorithm_steps = props.algorithm_steps || '';
  const step_descriptions = props.step_descriptions || '';

  // Parse data
  const stepList = algorithm_steps.split('|').map((s: string) => s.trim()).filter((s: string) => s && s !== '___REMOVED___');
  const descriptionList = step_descriptions.split('|').map((d: string) => d.trim());

  const algorithmSteps: StepItem[] = stepList.map((step: string, index: number) => ({
    step,
    description: descriptionList[index] || ''
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        algorithmName: '#ea580c',         // orange-600
        algorithmDesc: '#4b5563',         // gray-600
        gradientBg: 'linear-gradient(90deg, #ea580c 0%, #dc2626 100%)', // orange-600 to red-600
        stepBadgeBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff'
      },
      cool: {
        algorithmName: '#2563eb',         // blue-600
        algorithmDesc: '#4b5563',         // gray-600
        gradientBg: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)', // blue-600 to indigo-700
        stepBadgeBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff'
      },
      neutral: {
        algorithmName: '#4b5563',         // gray-600
        algorithmDesc: '#4b5563',         // gray-600
        gradientBg: 'linear-gradient(90deg, #4b5563 0%, #374151 100%)', // gray-600 to gray-700
        stepBadgeBg: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
          <TextPublished
            value={algorithm_name}
            style={{
              color: themeColors.algorithmName,
              fontWeight: 700,
              fontSize: '1.125rem',
              marginBottom: '0.5rem'
            }}
          />
          {algorithm_description && (
            <TextPublished
              value={algorithm_description}
              style={{
                color: themeColors.algorithmDesc,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Gradient container with steps */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: themeColors.gradientBg,
            color: themeColors.textColor
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {algorithmSteps.map((stepData: StepItem, index: number) => (
              <div key={`step-${index}`} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg"
                  style={{ background: themeColors.stepBadgeBg }}
                >
                  {index + 1}
                </div>
                <h3 className="font-semibold mb-2">{stepData.step}</h3>
                {stepData.description && (
                  <p className="text-sm opacity-90">{stepData.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
