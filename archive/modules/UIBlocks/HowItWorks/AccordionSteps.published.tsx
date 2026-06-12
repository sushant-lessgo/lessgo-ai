/**
 * AccordionSteps - Published Version (V2 Array Format)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// Step structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  details: string;
}

// Default steps fallback
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'API Integration & Setup', description: 'Seamlessly integrate with your existing systems using our comprehensive API documentation and SDKs.', details: 'Our API supports RESTful endpoints, GraphQL, and real-time webhooks. Authentication uses OAuth 2.0 with optional SAML integration.' },
  { id: 's2', title: 'Data Migration & Validation', description: 'Migrate your data securely with automated validation and rollback capabilities.', details: 'Data migration includes schema mapping, incremental sync, and conflict resolution. All transfers use AES-256 encryption.' },
  { id: 's3', title: 'Custom Configuration', description: 'Configure custom workflows, permissions, and business rules to match your requirements.', details: 'Custom configuration includes role-based access control, workflow automation rules, and integration mappings.' },
  { id: 's4', title: 'Testing & Deployment', description: 'Run comprehensive testing and deploy to production with zero downtime.', details: 'Deployment uses blue-green deployment with automatic rollback on failure. We provide monitoring for all critical metrics.' }
];

export default function AccordionStepsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Technical Implementation Process';
  const subheadline = props.subheadline || '';
  const conclusion_text = props.conclusion_text || '';

  // Get steps array (with fallback to default)
  const steps: StepItem[] = Array.isArray(props.steps) && props.steps.length > 0
    ? props.steps
    : DEFAULT_STEPS;

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles based on luminance and theme
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Accordion-specific accent colors (not part of card styling)
  const getAccordionAccents = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        contentBorder: '#ffedd5',
        detailsBg: '#fff7ed',
        detailsBorder: '#f97316',
        stepIndicator: '#f97316'
      },
      cool: {
        contentBorder: '#dbeafe',
        detailsBg: '#eff6ff',
        detailsBorder: '#3b82f6',
        stepIndicator: '#3b82f6'
      },
      neutral: {
        contentBorder: '#fef3c7',
        detailsBg: '#fffbeb',
        detailsBorder: '#f59e0b',
        stepIndicator: '#64748b'
      }
    };
    return colorMap[theme];
  };

  const accordionAccents = getAccordionAccents(uiTheme);

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
          {steps.map((step: StepItem, index: number) => (
            <div
              key={step.id}
              className="rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
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
              {/* Step Header */}
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ring-4 ring-white/30"
                    style={{
                      backgroundColor: accordionAccents.stepIndicator
                    }}
                  >
                    {index + 1}
                  </div>
                  <h3
                    style={{
                      ...h3Typography,
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: cardStyles.textHeading
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Step Content */}
              <div
                className="p-6 border-t"
                style={{
                  borderTopColor: accordionAccents.contentBorder
                }}
              >
                <div className="space-y-4">
                  <p
                    style={{
                      color: cardStyles.textBody,
                      lineHeight: '1.75rem',
                      fontSize: '1.125rem'
                    }}
                  >
                    {step.description}
                  </p>

                  {/* Technical Details */}
                  {step.details && (
                    <div
                      className="mt-2 rounded-lg p-4"
                      style={{
                        backgroundColor: accordionAccents.detailsBg,
                        borderLeft: `4px solid ${accordionAccents.detailsBorder}`
                      }}
                    >
                      <p
                        style={{
                          color: cardStyles.textMuted,
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

        {/* Conclusion Text */}
        {conclusion_text && (
          <div className="text-center mt-12">
            <TextPublished
              value={conclusion_text}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
