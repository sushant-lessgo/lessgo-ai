/**
 * ProcessFlowDiagram - Published Version
 * V2 Schema: Uses steps[] and benefits[] arrays instead of pipe-separated strings
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

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
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme-based extras (non-card elements)
  const themeExtras = {
    warm: {
      circleBg: '#f97316', // orange-500
      benefitsBg: '#fff7ed', // orange-50
      benefitsBorder: '#fed7aa', // orange-200
      benefitsTextPrimary: '#7c2d12', // orange-900
      benefitsTextSecondary: '#c2410c', // orange-700
      benefitIconBg: '#f97316', // orange-500
      connectorColor: '#fdba74', // orange-300
    },
    cool: {
      circleBg: '#2563eb', // blue-600
      benefitsBg: '#eff6ff', // blue-50
      benefitsBorder: '#bfdbfe', // blue-200
      benefitsTextPrimary: '#1e3a8a', // blue-900
      benefitsTextSecondary: '#1d4ed8', // blue-700
      benefitIconBg: '#2563eb', // blue-600
      connectorColor: '#93c5fd', // blue-300
    },
    neutral: {
      circleBg: '#4b5563', // gray-600
      benefitsBg: '#f9fafb', // gray-50
      benefitsBorder: '#e5e7eb', // gray-200
      benefitsTextPrimary: '#111827', // gray-900
      benefitsTextSecondary: '#374151', // gray-700
      benefitIconBg: '#4b5563', // gray-600
      connectorColor: '#cbd5e1', // slate-300
    }
  }[uiTheme];

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
                className="relative flex flex-col items-center px-4 pt-10 pb-6 rounded-3xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: cardStyles.bg,
                  backdropFilter: cardStyles.backdropFilter,
                  WebkitBackdropFilter: cardStyles.backdropFilter,
                  borderColor: cardStyles.borderColor,
                  borderWidth: cardStyles.borderWidth,
                  borderStyle: cardStyles.borderStyle,
                  boxShadow: cardStyles.boxShadow
                }}
              >
                {/* Connector line to next step */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-1/2 -right-6 w-12 border-t-2 border-dashed"
                    style={{ borderColor: themeExtras.connectorColor }}
                  />
                )}

                {/* Step Circle - Flat design */}
                <div className="relative mb-5">
                  <div
                    style={{
                      backgroundColor: themeExtras.circleBg,
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
                      color: cardStyles.textHeading,
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
                        color: cardStyles.textBody,
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
              backgroundColor: themeExtras.benefitsBg,
              borderColor: themeExtras.benefitsBorder
            }}
            className="mt-16 rounded-2xl p-8 border"
          >
            {benefits_title && (
              <HeadlinePublished
                value={benefits_title}
                level="h3"
                style={{
                  color: themeExtras.benefitsTextPrimary,
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
                      backgroundColor: themeExtras.benefitIconBg,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <IconPublished
                      icon={benefit.icon || 'Sparkles'}
                      color={'#ffffff'}
                    />
                  </div>
                  <TextPublished
                    value={benefit.title}
                    style={{
                      color: themeExtras.benefitsTextPrimary,
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  {benefit.description && (
                    <TextPublished
                      value={benefit.description}
                      style={{
                        color: themeExtras.benefitsTextSecondary,
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
