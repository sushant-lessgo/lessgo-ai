/**
 * ZigzagImageSteps - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Step structure
interface Step {
  title: string;
  description: string;
  visual?: string;
}

export default function ZigzagImageStepsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Your Creative Journey, Step by Step';
  const subheadline = props.subheadline || '';
  const step_titles = props.step_titles || 'Discover & Inspire|Design & Create|Refine & Perfect|Share & Collaborate';
  const step_descriptions = props.step_descriptions || '';
  const supporting_text = props.supporting_text || '';
  const show_flow_summary = props.show_flow_summary !== false;
  const flow_summary_heading = props.flow_summary_heading || 'Unleash Your Creative Potential';
  const flow_feature_1_icon = props.flow_feature_1_icon || '💖';
  const flow_feature_1_text = props.flow_feature_1_text || 'Creative freedom';
  const flow_feature_2_icon = props.flow_feature_2_icon || '⚡';
  const flow_feature_2_text = props.flow_feature_2_text || 'Professional quality';
  const flow_feature_3_icon = props.flow_feature_3_icon || '👥';
  const flow_feature_3_text = props.flow_feature_3_text || 'Community driven';
  const flow_summary_description = props.flow_summary_description || '';

  // Get individual step visuals
  const step_visual_0 = props.step_visual_0 || '';
  const step_visual_1 = props.step_visual_1 || '';
  const step_visual_2 = props.step_visual_2 || '';
  const step_visual_3 = props.step_visual_3 || '';
  const step_visual_4 = props.step_visual_4 || '';
  const step_visual_5 = props.step_visual_5 || '';

  // Parse steps
  const titleList = step_titles.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const descriptionList = step_descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const visualList = [step_visual_0, step_visual_1, step_visual_2, step_visual_3, step_visual_4, step_visual_5];

  const steps: Step[] = titleList.map((title: string, index: number) => ({
    title,
    description: descriptionList[index] || '',
    visual: visualList[index] || ''
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors - inline style values
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        stepBadgeGradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
        placeholderGradient: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)',
        flowSummaryBg: 'linear-gradient(to right, #fff7ed, #fffbeb, #fef2f2)',
        flowSummaryBorder: '#fed7aa',
        featureIcon1Color: '#ea580c',
        featureIcon2Color: '#dc2626',
        featureIcon3Color: '#f59e0b',
        dividerColor: '#fdba74'
      },
      cool: {
        stepBadgeGradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        placeholderGradient: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
        flowSummaryBg: 'linear-gradient(to right, #eff6ff, #eef2ff, #f5f3ff)',
        flowSummaryBorder: '#bfdbfe',
        featureIcon1Color: '#2563eb',
        featureIcon2Color: '#6366f1',
        featureIcon3Color: '#8b5cf6',
        dividerColor: '#93c5fd'
      },
      neutral: {
        stepBadgeGradient: 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)',
        placeholderGradient: 'linear-gradient(135deg, #f9fafb 0%, #f8fafc 100%)',
        flowSummaryBg: 'linear-gradient(to right, #f9fafb, #f8fafc, #fafafa)',
        flowSummaryBorder: '#e5e7eb',
        featureIcon1Color: '#4b5563',
        featureIcon2Color: '#64748b',
        featureIcon3Color: '#71717a',
        dividerColor: '#d1d5db'
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
      <div className="max-w-6xl mx-auto">
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

        {/* Zigzag Steps */}
        <div className="space-y-24">
          {steps.map((step: Step, index: number) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={`step-${index}`}
                className={`grid gap-12 items-center ${isEven ? 'lg:grid-cols-[1fr,1.5fr]' : 'lg:grid-cols-[1.5fr,1fr]'}`}
              >
                {/* Content */}
                <div className={`space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-start space-x-4">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        background: themeColors.stepBadgeGradient
                      }}
                    >
                      <span className="text-white font-bold text-lg drop-shadow-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      {/* Step Title */}
                      <h3
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#111827',
                          marginBottom: '1rem'
                        }}
                      >
                        {step.title}
                      </h3>

                      {/* Step Description */}
                      {step.description && (
                        <p
                          style={{
                            color: '#4b5563',
                            lineHeight: '1.75rem',
                            fontSize: '1.125rem'
                          }}
                        >
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual */}
                <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                  {step.visual ? (
                    <ImagePublished
                      src={step.visual}
                      alt={step.title}
                      className="w-full h-80 object-cover rounded-2xl shadow-lg"
                    />
                  ) : (
                    <div
                      className="relative w-full h-80 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{
                        background: themeColors.placeholderGradient
                      }}
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                              background: themeColors.stepBadgeGradient
                            }}
                          >
                            <span className="text-white font-bold text-xl">{index + 1}</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Step {index + 1} Visual
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Creative Flow Summary */}
        {show_flow_summary && (
          <div
            className="mt-16 rounded-2xl p-8"
            style={{
              background: themeColors.flowSummaryBg,
              border: `1px solid ${themeColors.flowSummaryBorder}`
            }}
          >
            <div className="text-center">
              {flow_summary_heading && (
                <TextPublished
                  value={flow_summary_heading}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '1.5rem'
                  }}
                />
              )}

              <div className="flex justify-center items-center space-x-6 mb-4">
                {flow_feature_1_text && flow_feature_1_text !== '___REMOVED___' && (
                  <div className="flex items-center space-x-2">
                    <IconPublished
                      icon={flow_feature_1_icon}
                      size={20}
                      color={themeColors.featureIcon1Color}
                      className="text-xl"
                    />
                    <span
                      style={{
                        color: '#374151',
                        fontWeight: 500
                      }}
                    >
                      {flow_feature_1_text}
                    </span>
                  </div>
                )}

                {flow_feature_1_text && flow_feature_1_text !== '___REMOVED___' &&
                 flow_feature_2_text && flow_feature_2_text !== '___REMOVED___' && (
                  <div
                    className="w-px h-6"
                    style={{
                      backgroundColor: themeColors.dividerColor
                    }}
                  />
                )}

                {flow_feature_2_text && flow_feature_2_text !== '___REMOVED___' && (
                  <div className="flex items-center space-x-2">
                    <IconPublished
                      icon={flow_feature_2_icon}
                      size={20}
                      color={themeColors.featureIcon2Color}
                      className="text-xl"
                    />
                    <span
                      style={{
                        color: '#374151',
                        fontWeight: 500
                      }}
                    >
                      {flow_feature_2_text}
                    </span>
                  </div>
                )}

                {flow_feature_2_text && flow_feature_2_text !== '___REMOVED___' &&
                 flow_feature_3_text && flow_feature_3_text !== '___REMOVED___' && (
                  <div
                    className="w-px h-6"
                    style={{
                      backgroundColor: themeColors.dividerColor
                    }}
                  />
                )}

                {flow_feature_3_text && flow_feature_3_text !== '___REMOVED___' && (
                  <div className="flex items-center space-x-2">
                    <IconPublished
                      icon={flow_feature_3_icon}
                      size={20}
                      color={themeColors.featureIcon3Color}
                      className="text-xl"
                    />
                    <span
                      style={{
                        color: '#374151',
                        fontWeight: 500
                      }}
                    >
                      {flow_feature_3_text}
                    </span>
                  </div>
                )}
              </div>

              {flow_summary_description && (
                <TextPublished
                  value={flow_summary_description}
                  style={{
                    color: textColors.body,
                    ...bodyTypography,
                    marginTop: '0.5rem'
                  }}
                />
              )}
            </div>
          </div>
        )}

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
