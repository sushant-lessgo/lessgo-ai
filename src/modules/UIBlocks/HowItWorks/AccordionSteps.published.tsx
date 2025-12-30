/**
 * AccordionSteps - Published Version
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

// Step structure
interface Step {
  title: string;
  description: string;
  details: string;
}

export default function AccordionStepsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Technical Implementation Process';
  const subheadline = props.subheadline || '';
  const step_titles = props.step_titles || '';
  const step_descriptions = props.step_descriptions || '';
  const step_details = props.step_details || '';
  const supporting_text = props.supporting_text || '';

  // Tech specs
  const show_tech_specs = props.show_tech_specs !== false;
  const tech_specs_heading = props.tech_specs_heading || 'Enterprise-Grade Implementation';
  const tech_spec_1_value = props.tech_spec_1_value || '99.9%';
  const tech_spec_1_label = props.tech_spec_1_label || 'Uptime SLA';
  const tech_spec_2_value = props.tech_spec_2_value || 'API-First';
  const tech_spec_2_label = props.tech_spec_2_label || 'Architecture';
  const tech_spec_3_value = props.tech_spec_3_value || 'SOC 2';
  const tech_spec_3_label = props.tech_spec_3_label || 'Compliant';
  const tech_specs_description = props.tech_specs_description || 'Built for enterprise requirements with comprehensive security, scalability, and integration capabilities';

  // Parse steps
  const titleList = step_titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const descriptionList = step_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const detailsList = step_details.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');

  const steps: Step[] = titleList.map((title, index) => ({
    title,
    description: descriptionList[index] || '',
    details: detailsList[index] || ''
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        border: '#fed7aa',
        contentBorder: '#ffedd5',
        techDetailsBg: '#fff7ed',
        techDetailsBorder: '#f97316',
        techSpecGradient: 'linear-gradient(to right, #431407, #78350f)',
        spec1Color: '#fb923c',
        spec2Color: '#fbbf24',
        spec3Color: '#facc15',
        stepIndicator: '#f97316'
      },
      cool: {
        border: '#bfdbfe',
        contentBorder: '#dbeafe',
        techDetailsBg: '#eff6ff',
        techDetailsBorder: '#3b82f6',
        techSpecGradient: 'linear-gradient(to right, #172554, #1e3a8a)',
        spec1Color: '#60a5fa',
        spec2Color: '#22d3ee',
        spec3Color: '#818cf8',
        stepIndicator: '#3b82f6'
      },
      neutral: {
        border: '#fde68a',
        contentBorder: '#fef3c7',
        techDetailsBg: '#fffbeb',
        techDetailsBorder: '#f59e0b',
        techSpecGradient: 'linear-gradient(to right, #0f172a, #1e293b)',
        spec1Color: '#fbbf24',
        spec2Color: '#94a3b8',
        spec3Color: '#a8a29e',
        stepIndicator: '#64748b'
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
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
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

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Steps - All Expanded */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={`step-${index}`}
              className="border rounded-lg overflow-hidden shadow-md"
              style={{
                borderColor: themeColors.border
              }}
            >
              {/* Step Header */}
              <div className="p-6 bg-white">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{
                      backgroundColor: themeColors.stepIndicator
                    }}
                  >
                    {index + 1}
                  </div>
                  <h3
                    style={{
                      ...h3Typography,
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Step Content */}
              <div
                className="p-6 bg-white border-t"
                style={{
                  borderTopColor: themeColors.contentBorder
                }}
              >
                <div className="space-y-4">
                  <p
                    style={{
                      color: '#374151',
                      lineHeight: '1.75rem',
                      fontSize: '1.125rem'
                    }}
                  >
                    {step.description}
                  </p>

                  {/* Technical Details */}
                  {step.details && (
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: themeColors.techDetailsBg,
                        borderLeft: `4px solid ${themeColors.techDetailsBorder}`
                      }}
                    >
                      <p
                        style={{
                          color: '#4b5563',
                          fontSize: '0.875rem',
                          lineHeight: '1.75rem'
                        }}
                      >
                        {step.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Specs Summary */}
        {show_tech_specs && (
          <div
            className="rounded-2xl p-8 text-white mt-8"
            style={{
              background: themeColors.techSpecGradient
            }}
          >
            <div className="text-center">
              {tech_specs_heading && (
                <TextPublished
                  value={tech_specs_heading}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                    color: '#ffffff'
                  }}
                />
              )}

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      color: themeColors.spec1Color,
                      marginBottom: '0.5rem'
                    }}
                  >
                    {tech_spec_1_value}
                  </div>
                  <div
                    style={{
                      color: '#d1d5db',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tech_spec_1_label}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      color: themeColors.spec2Color,
                      marginBottom: '0.5rem'
                    }}
                  >
                    {tech_spec_2_value}
                  </div>
                  <div
                    style={{
                      color: '#d1d5db',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tech_spec_2_label}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      color: themeColors.spec3Color,
                      marginBottom: '0.5rem'
                    }}
                  >
                    {tech_spec_3_value}
                  </div>
                  <div
                    style={{
                      color: '#d1d5db',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tech_spec_3_label}
                  </div>
                </div>
              </div>

              {tech_specs_description && (
                <TextPublished
                  value={tech_specs_description}
                  style={{
                    marginTop: '1.5rem',
                    color: '#d1d5db',
                    maxWidth: '42rem',
                    margin: '1.5rem auto 0'
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Supporting Text */}
        {supporting_text && (
          <div className="text-center mt-8">
            <TextPublished
              value={supporting_text}
              style={{
                color: textColors.muted,
                fontSize: '0.875rem',
                opacity: 0.8
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
