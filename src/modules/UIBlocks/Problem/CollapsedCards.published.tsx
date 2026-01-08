/**
 * CollapsedCards - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Note: All cards rendered expanded (no interactivity)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface ProblemCard {
  title: string;
  description: string;
  impact: string;
  solutionHint: string;
  icon: string;
}

export default function CollapsedCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'What Business Challenges Are Keeping You Up at Night?';
  const subheadline = props.subheadline || '';
  const intro_text = props.intro_text || '';
  const supporting_text = props.supporting_text || '';
  const trust_items = props.trust_items || '';

  // Extract pipe-separated fields
  const problem_titles = props.problem_titles || '';
  const problem_descriptions = props.problem_descriptions || '';
  const problem_impacts = props.problem_impacts || '';
  const solution_hints = props.solution_hints || '';

  // Extract icons
  const icons = [
    props.problem_icon_1 || '⚙️',
    props.problem_icon_2 || '⚙️',
    props.problem_icon_3 || '⚙️',
    props.problem_icon_4 || '⚙️',
    props.problem_icon_5 || '⚙️',
    props.problem_icon_6 || '⚙️',
  ];

  // Parse all arrays
  const titleList = problem_titles.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const descriptionList = problem_descriptions.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const impactList = problem_impacts ? problem_impacts.split('|').map((i: string) => i.trim()) : [];
  const solutionList = solution_hints ? solution_hints.split('|').map((s: string) => s.trim()) : [];

  // Build problem cards array
  const problemCards: ProblemCard[] = titleList.map((title: string, index: number) => ({
    title,
    description: descriptionList[index] || '',
    impact: impactList[index] || '',
    solutionHint: solutionList[index] || '',
    icon: icons[index] || '⚙️'
  }));

  // Parse trust items
  const trustItemsList = trust_items
    ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean)
    : [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Color mapping - solution colors are theme-based
  const getSolutionColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        bg: '#fff7ed',
        border: '#fed7aa',
        iconColor: '#f97316',
        textPrimary: '#7c2d12',
        textSecondary: '#9a3412',
        cardBorder: '#fdba74',
        iconBg: '#f97316'
      },
      cool: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        iconColor: '#3b82f6',
        textPrimary: '#1e3a8a',
        textSecondary: '#1e40af',
        cardBorder: '#93c5fd',
        iconBg: '#3b82f6'
      },
      neutral: {
        bg: '#f9fafb',
        border: '#e5e7eb',
        iconColor: '#6b7280',
        textPrimary: '#111827',
        textSecondary: '#374151',
        cardBorder: '#d1d5db',
        iconBg: '#6b7280'
      }
    };
    return colorMap[theme];
  };

  const solutionColors = getSolutionColors(uiTheme);

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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                marginBottom: '2rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}

          {intro_text && (
            <div className="max-w-3xl mx-auto mb-8">
              <TextPublished
                value={intro_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  fontSize: '1.125rem',
                  lineHeight: '1.75'
                }}
              />
            </div>
          )}
        </div>

        {/* Problem Cards - All Expanded */}
        <div className="space-y-4 mb-8">
          {problemCards.map((problem: ProblemCard, index: number) => (
            <div
              key={`problem-${index}`}
              className="group bg-white rounded-xl border-2 shadow-xl overflow-hidden"
              style={{
                borderColor: solutionColors.cardBorder
              }}
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: solutionColors.iconBg,
                      color: '#ffffff'
                    }}
                  >
                    <IconPublished
                      icon={problem.icon}
                      size={32}
                      className="text-2xl"
                    />
                  </div>

                  {/* Title */}
                  <div className="flex-1">
                    <TextPublished
                      value={problem.title}
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <div className="px-6 pb-6 border-t border-gray-100">
                {/* Problem Description */}
                <div className="mb-6">
                  <TextPublished
                    value={problem.description}
                    style={{
                      color: '#374151',
                      lineHeight: '1.75'
                    }}
                  />
                </div>

                {/* Impact Section - Always Red (problem indicator) */}
                {problem.impact && (
                  <div
                    className="mb-6 rounded-lg p-4 border"
                    style={{
                      backgroundColor: '#fef2f2',
                      borderColor: '#fecaca'
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: '#ef4444' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div>
                        <h4
                          style={{
                            fontWeight: 600,
                            color: '#7f1d1d',
                            marginBottom: '0.5rem'
                          }}
                        >
                          The Real Impact:
                        </h4>
                        <TextPublished
                          value={problem.impact}
                          style={{
                            color: '#991b1b',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Solution Hint - Theme-based colors */}
                {problem.solutionHint && (
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: solutionColors.bg,
                      borderColor: solutionColors.border
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: solutionColors.iconColor }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4
                          style={{
                            fontWeight: 600,
                            color: solutionColors.textPrimary,
                            marginBottom: '0.5rem'
                          }}
                        >
                          There's a Solution:
                        </h4>
                        <TextPublished
                          value={problem.solutionHint}
                          style={{
                            color: solutionColors.textSecondary,
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Supporting Text and Trust Items */}
        {(supporting_text || trustItemsList.length > 0) && (
          <div className="text-center space-y-6 mt-12">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            {trustItemsList.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {trustItemsList.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: solutionColors.iconColor }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span style={{ color: textColors.muted }}>{item}</span>
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
