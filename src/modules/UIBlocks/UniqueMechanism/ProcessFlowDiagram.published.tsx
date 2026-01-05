/**
 * ProcessFlowDiagram - Published Version
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

export default function ProcessFlowDiagramPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'How Our Unique Process Works';
  const subheadline = props.subheadline || '';
  const process_steps = props.process_steps || '';
  const step_descriptions = props.step_descriptions || '';
  const benefits_title = props.benefits_title || '';
  const benefit_titles = props.benefit_titles || '';
  const benefit_descriptions = props.benefit_descriptions || '';
  const benefit_icon_1 = props.benefit_icon_1 || '⚡';
  const benefit_icon_2 = props.benefit_icon_2 || '🎯';
  const benefit_icon_3 = props.benefit_icon_3 || '🔧';

  // Parse pipe-delimited strings
  const steps = process_steps.split('|').map(s => s.trim()).filter(s => s && s !== '___REMOVED___');
  const descriptions = step_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const benefitTitles = benefit_titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const benefitDescs = benefit_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const benefitIcons = [benefit_icon_1, benefit_icon_2, benefit_icon_3];

  // Theme detection (no useMemo - direct evaluation)
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getProcessColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        gradientBg: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)', // orange-600 to red-600
        glowBg: 'rgba(234, 88, 12, 0.4)', // orange-400/40
        benefitsBg: '#fff7ed', // orange-50
        benefitsBorder: '#fed7aa', // orange-200
        benefitsTextPrimary: '#7c2d12', // orange-900
        benefitsTextSecondary: '#c2410c', // orange-700
        benefitIconBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // orange-500 to orange-600
      },
      cool: {
        gradientBg: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', // blue-600 to indigo-700
        glowBg: 'rgba(96, 165, 250, 0.4)', // blue-400/40
        benefitsBg: '#eff6ff', // blue-50
        benefitsBorder: '#bfdbfe', // blue-200
        benefitsTextPrimary: '#1e3a8a', // blue-900
        benefitsTextSecondary: '#1d4ed8', // blue-700
        benefitIconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // blue-500 to blue-600
      },
      neutral: {
        gradientBg: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)', // gray-600 to gray-700
        glowBg: 'rgba(156, 163, 175, 0.4)', // gray-400/40
        benefitsBg: '#f9fafb', // gray-50
        benefitsBorder: '#e5e7eb', // gray-200
        benefitsTextPrimary: '#111827', // gray-900
        benefitsTextSecondary: '#374151', // gray-700
        benefitIconBg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', // gray-500 to gray-600
      }
    };
    return colorMap[theme];
  };

  const processColors = getProcessColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Helper function to get appropriate grid class based on step count
  const getGridCols = (stepCount: number) => {
    switch (stepCount) {
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      case 5: return 'lg:grid-cols-5';
      case 6: return 'lg:grid-cols-6';
      default: return 'lg:grid-cols-6';
    }
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1.5rem',
              marginTop: '4rem',
              fontWeight: '800'
            }}
            className="text-center"
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Process Flow */}
        <div className="relative">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols(steps.length)} gap-12`}>
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center px-4 pt-10 pb-6 rounded-3xl bg-white/80 ring-1 ring-slate-100/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.18)]"
              >
                {/* Step Circle */}
                <div className="relative mb-5">
                  <div
                    style={{
                      background: processColors.gradientBg,
                      boxShadow: '0 0 30px rgba(59,130,246,0.55), 0 10px 25px rgba(15,23,42,0.35)'
                    }}
                    className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-xl ring-1 ring-white/25"
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Step Content */}
                <div className="text-center max-w-xs mx-auto">
                  <TextPublished
                    value={step}
                    style={{
                      color: '#0f172a', // slate-900
                      fontSize: '17px',
                      fontWeight: '600',
                      lineHeight: '1.375',
                      letterSpacing: '-0.025em',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  {descriptions[index] && (
                    <TextPublished
                      value={descriptions[index]}
                      style={{
                        color: '#64748b', // slate-600
                        fontSize: '14px',
                        lineHeight: '1.625',
                        textAlign: 'center'
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Benefits */}
        {(benefits_title || benefitTitles.length > 0) && (
          <div
            style={{
              backgroundColor: processColors.benefitsBg,
              borderColor: processColors.benefitsBorder
            }}
            className="mt-16 rounded-2xl p-8 border"
          >
            {benefits_title && (
              <HeadlinePublished
                value={benefits_title}
                level="h3"
                style={{
                  color: processColors.benefitsTextPrimary,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}
              />
            )}
            <div className="grid md:grid-cols-3 gap-6">
              {benefitTitles.map((title, index) => (
                <div key={index} className="text-center">
                  <div
                    style={{
                      background: processColors.benefitIconBg,
                      boxShadow: '0 4px 18px rgba(59,130,246,0.35), 0 6px 14px rgba(15,23,42,0.2)'
                    }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-white/20 backdrop-blur-sm"
                  >
                    <IconPublished
                      value={benefitIcons[index] || '✨'}
                      style={{
                        color: '#ffffff',
                        fontSize: '1.5rem'
                      }}
                    />
                  </div>
                  <TextPublished
                    value={title}
                    style={{
                      color: processColors.benefitsTextPrimary,
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  {benefitDescs[index] && (
                    <TextPublished
                      value={benefitDescs[index]}
                      style={{
                        color: processColors.benefitsTextSecondary,
                        fontSize: '0.875rem',
                        textAlign: 'center'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
