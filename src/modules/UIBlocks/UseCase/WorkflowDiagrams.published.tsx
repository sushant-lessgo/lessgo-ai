/**
 * WorkflowDiagrams - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface WorkflowStep {
  text: string;
  icon: string;
}

export default function WorkflowDiagramsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract headline
  const headline = props.headline || 'Streamlined Workflow Process';

  // Extract workflow steps - filter out empty and removed
  const stepFields = [
    props.workflow_step_1,
    props.workflow_step_2,
    props.workflow_step_3,
    props.workflow_step_4,
    props.workflow_step_5,
    props.workflow_step_6
  ].filter((step): step is string => Boolean(step && step.trim() !== '' && step !== '___REMOVED___'));

  // Extract icons with defaults
  const iconFields = [
    props.step_icon_1 || '📝',
    props.step_icon_2 || '⚙️',
    props.step_icon_3 || '🔍',
    props.step_icon_4 || '🚀',
    props.step_icon_5 || '📤',
    props.step_icon_6 || '📊'
  ];

  // Build steps array
  const steps: WorkflowStep[] = stepFields.map((step: string, idx: number) => ({
    text: step,
    icon: iconFields[idx] || '📋'
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        stepBg: '#ea580c',      // orange-600
        stepText: '#ffffff',    // white
        arrowColor: '#ea580c'   // orange-600
      },
      cool: {
        stepBg: '#2563eb',      // blue-600
        stepText: '#ffffff',    // white
        arrowColor: '#2563eb'   // blue-600
      },
      neutral: {
        stepBg: '#4b5563',      // gray-600
        stepText: '#ffffff',    // white
        arrowColor: '#4b5563'   // gray-600
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'neutral', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: '4rem'
          }}
        />

        {/* Workflow Steps Container */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {steps.map((step: WorkflowStep, index: number) => (
            <React.Fragment key={index}>
              {/* Step Card */}
              <div
                className="px-6 py-4 rounded-lg font-semibold flex items-center space-x-2"
                style={{
                  backgroundColor: themeColors.stepBg,
                  color: themeColors.stepText
                }}
              >
                <IconPublished
                  icon={step.icon}
                  color={themeColors.stepText}
                  size={20}
                />
                <span>{step.text}</span>
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="text-2xl" style={{ color: themeColors.arrowColor }}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
