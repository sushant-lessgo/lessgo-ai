/**
 * ProblemToReframeBlocks - Published Version
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

// Problem/Reframe pair structure
interface ProblemReframePair {
  problem: string;
  reframe: string;
}

// Benefit structure
interface Benefit {
  icon: string;
  label: string;
}

// Parse problem/reframe pairs from props
const parseProblemReframePairs = (props: any): ProblemReframePair[] => {
  const pairs: ProblemReframePair[] = [];

  // Process individual fields (1-6)
  for (let i = 1; i <= 6; i++) {
    const problem = props[`problem_${i}`];
    const reframe = props[`reframe_${i}`];

    if (problem && problem.trim() && problem !== '___REMOVED___') {
      pairs.push({
        problem: problem.trim(),
        reframe: reframe?.trim() || 'Reframe this as an opportunity or benefit'
      });
    }
  }

  return pairs;
};

// Parse benefits from props
const parseBenefits = (props: any): Benefit[] => {
  const benefits: Benefit[] = [];

  for (let i = 1; i <= 3; i++) {
    const icon = props[`benefit_icon_${i}`];
    const label = props[`benefit_label_${i}`];

    if (label && label.trim() && label !== '___REMOVED___') {
      benefits.push({
        icon: icon || '✅',
        label: label.trim()
      });
    }
  }

  return benefits;
};

// Get theme colors (hex values for inline styles)
const getProblemReframeColors = (theme: 'warm' | 'cool' | 'neutral') => {
  return {
    warm: {
      problemBg: '#fff7ed',      // orange-50
      problemBorder: '#fed7aa',  // orange-200
      problemBadgeBg: '#f97316', // orange-500
      problemIconBg: '#ffedd5',  // orange-100
      problemTextPrimary: '#7c2d12',   // orange-900
      problemTextSecondary: '#c2410c', // orange-700
      reframeBg: '#ffedd5',      // orange-100
      reframeBgGradient: 'linear-gradient(to bottom right, #ffedd5, #fff7ed)',
      reframeBorder: '#fdba74',  // orange-300
      reframeBadgeBg: '#ea580c', // orange-600
      reframeIconBg: '#fed7aa',  // orange-200
      reframeIconText: '#c2410c',     // orange-700
      reframeTextPrimary: '#7c2d12',  // orange-900
      reframeTextSecondary: '#9a3412', // orange-800
      arrowBg: '#f97316'         // orange-500
    },
    cool: {
      problemBg: '#eff6ff',
      problemBorder: '#bfdbfe',
      problemBadgeBg: '#3b82f6',
      problemIconBg: '#dbeafe',
      problemTextPrimary: '#1e3a8a',
      problemTextSecondary: '#1d4ed8',
      reframeBg: '#dbeafe',
      reframeBgGradient: 'linear-gradient(to bottom right, #dbeafe, #eff6ff)',
      reframeBorder: '#93c5fd',
      reframeBadgeBg: '#2563eb',
      reframeIconBg: '#bfdbfe',
      reframeIconText: '#1d4ed8',
      reframeTextPrimary: '#1e3a8a',
      reframeTextSecondary: '#1e40af',
      arrowBg: '#3b82f6'
    },
    neutral: {
      problemBg: '#f9fafb',
      problemBorder: '#e5e7eb',
      problemBadgeBg: '#6b7280',
      problemIconBg: '#f3f4f6',
      problemTextPrimary: '#111827',
      problemTextSecondary: '#374151',
      reframeBg: '#f3f4f6',
      reframeBgGradient: 'linear-gradient(to bottom right, #f3f4f6, #f9fafb)',
      reframeBorder: '#d1d5db',
      reframeBadgeBg: '#4b5563',
      reframeIconBg: '#e5e7eb',
      reframeIconText: '#374151',
      reframeTextPrimary: '#111827',
      reframeTextSecondary: '#1f2937',
      arrowBg: '#6b7280'
    }
  }[theme];
};

export default function ProblemToReframeBlocksPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Let\'s Reframe How You Think About This';
  const subheadline = props.subheadline || '';
  const problem_icon = props.problem_icon || '⚠️';
  const reframe_icon = props.reframe_icon || '💡';
  const arrow_icon = props.arrow_icon || '➡️';
  const bottom_headline = props.bottom_headline || '';
  const bottom_description = props.bottom_description || '';

  // Parse problem/reframe pairs
  const problemReframePairs = parseProblemReframePairs(props);

  // Parse benefits
  const benefits = parseBenefits(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getProblemReframeColors(uiBlockTheme);

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
      <div className="max-w-7xl mx-auto">
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

        {/* Problem/Reframe Blocks Grid */}
        <div className="space-y-8">
          {problemReframePairs.map((pair, index) => (
            <div key={index} className="relative grid lg:grid-cols-2 gap-8 items-center">
              {/* Problem Side */}
              <div
                style={{
                  background: colors.problemBg,
                  borderColor: colors.problemBorder
                }}
                className="border rounded-2xl p-8 relative"
              >
                <div className="absolute -top-3 left-8">
                  <span
                    style={{
                      background: colors.problemBadgeBg,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    className="text-white px-3 py-1 rounded-full"
                  >
                    Old Thinking
                  </span>
                </div>

                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div
                      style={{ background: colors.problemIconBg }}
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mt-1"
                    >
                      <IconPublished value={problem_icon} className="text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3
                        style={{
                          color: colors.problemTextPrimary,
                          ...bodyTypography,
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem'
                        }}
                      >
                        "{pair.problem}"
                      </h3>
                      <p
                        style={{
                          color: colors.problemTextSecondary,
                          fontSize: '0.875rem'
                        }}
                      >
                        This mindset might be limiting your potential
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow/Transform Indicator - Mobile */}
              <div className="lg:hidden flex justify-center">
                <div
                  style={{ background: colors.arrowBg }}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                >
                  <IconPublished value="⬇️" className="text-2xl text-white" />
                </div>
              </div>

              {/* Arrow/Transform Indicator - Desktop */}
              <div className="hidden lg:flex justify-center">
                <div
                  style={{ background: colors.arrowBg }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                >
                  <IconPublished value={arrow_icon} className="text-3xl text-white" />
                </div>
              </div>

              {/* Reframe Side */}
              <div
                style={{
                  background: colors.reframeBgGradient,
                  borderColor: colors.reframeBorder
                }}
                className="lg:order-last border rounded-2xl p-8 relative"
              >
                <div className="absolute -top-3 left-8">
                  <span
                    style={{
                      background: colors.reframeBadgeBg,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    className="text-white px-3 py-1 rounded-full"
                  >
                    New Perspective
                  </span>
                </div>

                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div
                      style={{ background: colors.reframeIconBg }}
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mt-1"
                    >
                      <IconPublished
                        value={reframe_icon}
                        style={{ color: colors.reframeIconText }}
                        className="text-2xl"
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        style={{
                          color: colors.reframeTextPrimary,
                          ...bodyTypography,
                          fontSize: '1.125rem',
                          fontWeight: '500',
                          lineHeight: '1.625'
                        }}
                      >
                        {pair.reframe}
                      </p>
                      <p
                        style={{
                          color: colors.reframeTextSecondary,
                          fontSize: '0.875rem',
                          marginTop: '0.5rem'
                        }}
                      >
                        A shift in perspective opens new possibilities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Insight Section */}
        {(bottom_headline || bottom_description || benefits.length > 0) && (
          <div
            style={{
              background: colors.reframeBgGradient,
              borderColor: colors.reframeBorder
            }}
            className="mt-16 border rounded-2xl p-8"
          >
            {bottom_headline && (
              <HeadlinePublished
                value={bottom_headline}
                level="h3"
                style={{
                  color: colors.reframeTextPrimary,
                  ...headlineTypography,
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}
              />
            )}

            {bottom_description && (
              <TextPublished
                value={bottom_description}
                style={{
                  color: colors.reframeTextSecondary,
                  ...bodyTypography,
                  marginBottom: benefits.length > 0 ? '1.5rem' : '0',
                  textAlign: 'center'
                }}
              />
            )}

            {benefits.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <IconPublished
                      value={benefit.icon}
                      style={{ color: colors.reframeIconText }}
                      className="text-base"
                    />
                    <span style={{ color: textColors.body }}>{benefit.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
