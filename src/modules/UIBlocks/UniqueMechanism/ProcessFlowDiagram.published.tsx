/**
 * ProcessFlowDiagram - Published Version
 * V2 Schema: Uses steps[] and benefits[] arrays instead of pipe-separated strings
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

interface Step {
  id: string;
  title: string;
  description: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function ProcessFlowDiagramPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'How Our Unique Process Works';
  const subheadline = props.subheadline || '';
  const benefits_title = props.benefits_title || '';

  // Parse steps and benefits arrays
  const steps: Step[] = Array.isArray(props.steps) ? props.steps : [];
  const benefits: Benefit[] = Array.isArray(props.benefits) ? props.benefits : [];

  // Theme detection (no useMemo - direct evaluation)
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors (flat design)
  const getProcessColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        circleBg: '#f97316', // orange-500
        benefitsBg: '#fff7ed', // orange-50
        benefitsBorder: '#fed7aa', // orange-200
        benefitsTextPrimary: '#7c2d12', // orange-900
        benefitsTextSecondary: '#c2410c', // orange-700
        benefitIconBg: '#f97316', // orange-500
        connectorColor: '#fdba74', // orange-300
        cardShadow: '0 4px 20px rgba(249,115,22,0.15)',
        cardHoverShadow: '0 8px 30px rgba(249,115,22,0.25)',
      },
      cool: {
        circleBg: '#2563eb', // blue-600
        benefitsBg: '#eff6ff', // blue-50
        benefitsBorder: '#bfdbfe', // blue-200
        benefitsTextPrimary: '#1e3a8a', // blue-900
        benefitsTextSecondary: '#1d4ed8', // blue-700
        benefitIconBg: '#2563eb', // blue-600
        connectorColor: '#93c5fd', // blue-300
        cardShadow: '0 4px 20px rgba(37,99,235,0.15)',
        cardHoverShadow: '0 8px 30px rgba(37,99,235,0.25)',
      },
      neutral: {
        circleBg: '#4b5563', // gray-600
        benefitsBg: '#f9fafb', // gray-50
        benefitsBorder: '#e5e7eb', // gray-200
        benefitsTextPrimary: '#111827', // gray-900
        benefitsTextSecondary: '#374151', // gray-700
        benefitIconBg: '#4b5563', // gray-600
        connectorColor: '#cbd5e1', // slate-300
        cardShadow: '0 4px 20px rgba(100,116,139,0.15)',
        cardHoverShadow: '0 8px 30px rgba(100,116,139,0.25)',
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
      default: return 'lg:grid-cols-3';
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
            {steps.map((step: Step, index: number) => (
              <div
                key={step.id}
                className="relative flex flex-col items-center px-4 pt-10 pb-6 rounded-3xl bg-white/80 ring-1 ring-slate-200 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: processColors.cardShadow }}
              >
                {/* Connector line to next step */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-1/2 -right-6 w-12 border-t-2 border-dashed"
                    style={{ borderColor: processColors.connectorColor }}
                  />
                )}

                {/* Step Circle - Flat design */}
                <div className="relative mb-5">
                  <div
                    style={{
                      backgroundColor: processColors.circleBg,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Step Content */}
                <div className="text-center max-w-xs mx-auto">
                  <TextPublished
                    value={step.title}
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
                  {step.description && (
                    <TextPublished
                      value={step.description}
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
        {(benefits_title || benefits.length > 0) && (
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
              {benefits.map((benefit: Benefit) => (
                <div key={benefit.id} className="text-center">
                  <div
                    style={{
                      backgroundColor: processColors.benefitIconBg,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <IconPublished
                      icon={benefit.icon || '✨'}
                      color={'#ffffff'}
                    />
                  </div>
                  <TextPublished
                    value={benefit.title}
                    style={{
                      color: processColors.benefitsTextPrimary,
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  {benefit.description && (
                    <TextPublished
                      value={benefit.description}
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
